import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { noCacheJsonResponse } from '@/lib/api-helpers';

// Get permissions for a specific district admin
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin is authenticated and is a superadmin
    const token = getAdminToken(req);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims || claims.role !== 'superadmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id: adminId } = await params;
    
    // Check if district admin exists
    const checkQuery = 'SELECT id FROM district_admins WHERE id = ?';
    const check = await executeQuery(checkQuery, [adminId]) as Array<{ id: number }>;
    
    if (!check.length) {
      return NextResponse.json(
        { success: false, message: 'District admin not found' },
        { status: 404 }
      );
    }
    
    // Get admin permissions
    const permissionsQuery = `
      SELECT 
        dap.id,
        dap.permission,
        dap.granted_at AS grantedAt,
        dap.expires_at AS expiresAt,
        dap.is_active AS isActive
      FROM district_admin_permissions dap
      WHERE dap.district_admin_id = ?
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const permissions = await executeQuery(permissionsQuery, [adminId]) as any[];
    
    return noCacheJsonResponse({ 
      success: true, 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      permissions: permissions.map((p: any) => p.permission)
    });
  } catch (error) {
    console.error('Error fetching district admin permissions:', error);
    return noCacheJsonResponse(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Update permissions for a district admin
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin is authenticated and is a superadmin
    const token = getAdminToken(req);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims || claims.role !== 'superadmin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id: adminId } = await params;
    
    // Check if district admin exists
    const checkQuery = 'SELECT id FROM district_admins WHERE id = ?';
    const check = await executeQuery(checkQuery, [adminId]) as Array<{ id: number }>;
    
    if (!check.length) {
      return NextResponse.json(
        { success: false, message: 'District admin not found' },
        { status: 404 }
      );
    }
    
    // Get request body
    const { permissions, expiryDays } = await req.json();
    
    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, message: 'Permissions must be an array' },
        { status: 400 }
      );
    }
    
    // Calculate expiry date if expiryDays is provided
    let expiresAt: string | null = null;
    if (expiryDays > 0) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      // Convert to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
      expiresAt = expiryDate.toISOString().slice(0, 19).replace('T', ' ');
    }
    
    // First, deactivate all existing permissions
    await executeQuery(
      'UPDATE district_admin_permissions SET is_active = 0 WHERE district_admin_id = ?',
      [adminId]
    );
    
    // Filter out seller permissions - they should NOT be stored in database
    // Seller permissions are automatically implied by add_products (handled in admin-scope.ts)
    const sellerPermissions = ['manage_sellers', 'add_sellers', 'edit_sellers', 'delete_sellers', 'view_sellers'];
    const allPermissions = permissions.filter(p => !sellerPermissions.includes(p));

    // Then, add or update permissions
    for (const permission of allPermissions) {
      // Check if permission already exists for this admin
      const checkPermQuery = `
        SELECT id FROM district_admin_permissions 
        WHERE district_admin_id = ? AND permission = ?
      `;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingPerm = await executeQuery(checkPermQuery, [adminId, permission]) as any[];
      
      if (existingPerm.length > 0) {
        // Update existing permission
        await executeQuery(
          `UPDATE district_admin_permissions 
           SET is_active = 1, granted_at = NOW(), expires_at = ?, granted_by = ?
           WHERE id = ?`,
          [expiresAt, claims.sub, existingPerm[0].id]
        );
      } else {
        // Create new permission
        await executeQuery(
          `INSERT INTO district_admin_permissions 
           (district_admin_id, permission, granted_by, expires_at) 
           VALUES (?, ?, ?, ?)`,
          [adminId, permission, claims.sub, expiresAt]
        );
      }
    }
    
    // Get superadmin name for logging
    const superadminRows = await executeQuery(
      'SELECT name, email FROM superadmin WHERE id = ? LIMIT 1',
      [claims.sub]
    ) as Array<{ name: string | null; email: string }>;
    const superadminName = superadminRows[0]?.name || superadminRows[0]?.email || 'Unknown';
    
    // Log the action
    const logQuery = `
      INSERT INTO activity_logs (user_id, user_type, user_name, action, details, ip_address)
      VALUES (?, 'superadmin', ?, 'update_district_admin_permissions', ?, ?)
    `;
    
    await executeQuery(logQuery, [
      claims.sub,
      superadminName,
      `Updated permissions for district admin ID ${adminId}: ${permissions.join(', ')}`,
      req.headers.get('x-forwarded-for') || 'unknown'
    ]);
    
    return noCacheJsonResponse({ 
      success: true, 
      permissions
    });
  } catch (error) {
    console.error('Error updating district admin permissions:', error);
    return noCacheJsonResponse(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
