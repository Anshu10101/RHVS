import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyAdminJwt } from '@/lib/auth-jwt';

// Get permissions for a specific district admin
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin is authenticated and is a superadmin
    const token = req.cookies.get('admin_session')?.value;
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
    
    return NextResponse.json({ 
      success: true, 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      permissions: permissions.map((p: any) => p.permission)
    });
  } catch (error) {
    console.error('Error fetching district admin permissions:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Update permissions for a district admin
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin is authenticated and is a superadmin
    const token = req.cookies.get('admin_session')?.value;
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
    let expiresAt = null;
    if (expiryDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
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
    
    // Log the action
    const logQuery = `
      INSERT INTO activity_logs (user_id, user_type, action, details, ip_address)
      VALUES (?, 'superadmin', 'update_district_admin_permissions', ?, ?)
    `;
    
    await executeQuery(logQuery, [
      claims.sub,
      `Updated permissions for district admin ID ${adminId}: ${permissions.join(', ')}`,
      req.headers.get('x-forwarded-for') || 'unknown'
    ]);
    
    return NextResponse.json({ 
      success: true, 
      permissions
    });
  } catch (error) {
    console.error('Error updating district admin permissions:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
