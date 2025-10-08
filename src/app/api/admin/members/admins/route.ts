import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyAdminJwt } from '@/lib/auth-jwt';
import { hashPassword } from '@/lib/password';

// Get all district admins
export async function GET(req: NextRequest) {
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

    // Fetch all district admins with their details
    const query = `
      SELECT 
        da.id, 
        da.member_id AS memberId,
        COALESCE(m.name, 'N/A') as name,
        da.email, 
        da.district,
        da.state,
        da.is_active AS isActive, 
        da.appointed_at AS appointmentDate,
        da.expires_at AS expiryDate,
        da.last_login AS lastLogin,
        da.created_at
      FROM district_admins da
      LEFT JOIN members m ON da.member_id = m.id
      ORDER BY da.created_at DESC
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admins = await executeQuery(query, []) as any[];
    
     
    for (const admin of admins) {
      const permissionsQuery = `
        SELECT permission
        FROM district_admin_permissions
        WHERE district_admin_id = ? AND (expires_at IS NULL OR expires_at > NOW()) AND is_active = 1
      `;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const permissions = await executeQuery(permissionsQuery, [admin.id]) as any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      admin.permissions = permissions.map((p: any) => p.permission);
    }

    // Map the admins to ensure consistent property names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedAdmins = admins.map((admin: any) => ({
      id: admin.id,
      memberId: admin.memberId,
      name: admin.name || 'N/A',
      email: admin.email,
      district: admin.district || 'N/A',
      state: admin.state || 'N/A',
      isActive: admin.isActive,
      appointmentDate: admin.appointmentDate,
      expiryDate: admin.expiryDate,
      lastLogin: admin.lastLogin,
      permissions: admin.permissions || []
    }));
    
    return NextResponse.json({ success: true, admins: mappedAdmins });
  } catch (error) {
    console.error('Error fetching district admins:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Create a new district admin
export async function POST(req: NextRequest) {
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

    // Get request body
    const { memberId, state, district, password, expiryDate, permissions } = await req.json();
    
    // Validate inputs
    if (!memberId || !state || !district || !password) {
      return NextResponse.json(
        { success: false, message: 'Member ID, state, district, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if member exists
    const memberCheckQuery = 'SELECT id, email FROM members WHERE id = ?';
    const memberCheck = await executeQuery(memberCheckQuery, [memberId]) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (!memberCheck.length) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { status: 404 }
      );
    }
    
    // Check if member is already an admin
    const adminCheckQuery = 'SELECT id FROM district_admins WHERE member_id = ?';
    const adminCheck = await executeQuery(adminCheckQuery, [memberId]) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    if (adminCheck.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Member is already a district admin' },
        { status: 409 }
      );
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Insert district admin
    const insertQuery = `
      INSERT INTO district_admins (
        member_id, email, district, state, password_hash, role, is_active, 
        appointed_by, appointed_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, 'admin', 1, ?, NOW(), ?)
    `;
    
    const result = await executeQuery(insertQuery, [
      memberId,
      memberCheck[0].email,
      district,
      state,
      passwordHash,
      claims.sub,
      expiryDate || null
    ]) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    const adminId = result.insertId;
    
    // Add permissions if provided
    if (permissions && permissions.length > 0) {
      for (const permission of permissions) {
        await executeQuery(
          'INSERT INTO district_admin_permissions (district_admin_id, permission, granted_by) VALUES (?, ?, ?)',
          [adminId, permission, claims.sub]
        );
      }
    }
    
    // Log the action
    const logQuery = `
      INSERT INTO activity_logs (user_id, user_type, action, details, ip_address)
      VALUES (?, 'superadmin', 'create_district_admin', ?, ?)
    `;
    
    await executeQuery(logQuery, [
      claims.sub,
      `Appointed member ID ${memberId} as admin for ${district} district`,
      req.headers.get('x-forwarded-for') || 'unknown'
    ]);
    
    // Return the newly created admin
    const newAdmin = {
      id: adminId,
      memberId,
      name: memberCheck[0].name,
      email: memberCheck[0].email,
      district,
      isActive: true,
      appointmentDate: new Date().toISOString(),
      expiryDate: expiryDate || null,
      lastLogin: null,
      permissions: permissions || []
    };
    
    return NextResponse.json({ success: true, admin: newAdmin });
  } catch (error) {
    console.error('Error creating district admin:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
