import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims || claims.type !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all permission assignments with admin details
    const assignments = await executeQuery(`
      SELECT 
        dapa.id,
        dapa.district_admin_id,
        da.email as admin_email,
        da.district as admin_district,
        m.name as admin_name,
        dapa.permission_key,
        ap.permission_name,
        dapa.granted_by,
        dapa.granted_at,
        dapa.expires_at,
        dapa.is_active,
        dapa.notes
      FROM district_admin_permission_assignments dapa
      JOIN district_admins da ON dapa.district_admin_id = da.id
      JOIN members m ON da.member_id = m.id
      JOIN available_permissions ap ON dapa.permission_key = ap.permission_key
      WHERE dapa.is_active = true
      ORDER BY dapa.granted_at DESC
    `);

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching permission assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permission assignments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims || claims.type !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { district_admin_id, permissions, expires_at, notes } = await req.json();

    if (!district_admin_id || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Verify district admin exists
    const adminExists = await executeQuery(
      'SELECT id FROM district_admins WHERE id = ? AND is_active = true',
      [district_admin_id]
    ) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (adminExists.length === 0) {
      return NextResponse.json(
        { error: 'District admin not found' },
        { status: 404 }
      );
    }

    // Get superadmin ID (assuming it's the first superadmin for now)
    const superadmin = await executeQuery(
      'SELECT id FROM district_admins WHERE role = "superadmin" LIMIT 1'
    ) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    const grantedBy = superadmin[0]?.id || 1;

    // Insert permission assignments
    const insertPromises = permissions.map(async (permission) => {
      // First, deactivate any existing assignment for this permission
      await executeQuery(
        'UPDATE district_admin_permission_assignments SET is_active = false WHERE district_admin_id = ? AND permission_key = ?',
        [district_admin_id, permission]
      );

      // Insert new assignment
      return executeQuery(`
        INSERT INTO district_admin_permission_assignments 
        (district_admin_id, permission_key, granted_by, expires_at, notes, is_active)
        VALUES (?, ?, ?, ?, ?, true)
      `, [district_admin_id, permission, grantedBy, expires_at, notes]);
    });

    await Promise.all(insertPromises);

    // Log the assignment in history
    const historyPromises = permissions.map(async (permission) => {
      return executeQuery(`
        INSERT INTO permission_assignment_history 
        (district_admin_id, permission_key, action, granted_by, expires_at, notes)
        VALUES (?, ?, 'granted', ?, ?, ?)
      `, [district_admin_id, permission, grantedBy, expires_at, notes]);
    });

    await Promise.all(historyPromises);

    return NextResponse.json({ 
      message: 'Permissions assigned successfully',
      assigned_permissions: permissions 
    });
  } catch (error) {
    console.error('Error assigning permissions:', error);
    return NextResponse.json(
      { error: 'Failed to assign permissions' },
      { status: 500 }
    );
  }
}
