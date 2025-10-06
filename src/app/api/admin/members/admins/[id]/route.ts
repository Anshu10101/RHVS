import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyAdminJwt } from '@/lib/auth-jwt';

// Update a district admin
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    const adminId = params.id;
    
    // Check if district admin exists
    const checkQuery = 'SELECT id FROM district_admins WHERE id = ?';
    const check = await executeQuery(checkQuery, [adminId]);
    
    if (!check.length) {
      return NextResponse.json(
        { success: false, message: 'District admin not found' },
        { status: 404 }
      );
    }
    
    // Get request body
    const { isActive, expiryDate } = await req.json();
    
    // Update district admin
    const updateQuery = `
      UPDATE district_admins 
      SET is_active = ?, expires_at = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    await executeQuery(updateQuery, [
      isActive !== undefined ? isActive : true,
      expiryDate || null,
      adminId
    ]);
    
    // Log the action
    const logQuery = `
      INSERT INTO activity_logs (user_id, user_type, action, details, ip_address)
      VALUES (?, 'superadmin', 'update_district_admin', ?, ?)
    `;
    
    await executeQuery(logQuery, [
      claims.sub,
      `Updated district admin ID ${adminId}`,
      req.headers.get('x-forwarded-for') || 'unknown'
    ]);
    
    // Get updated admin details
    const getUpdatedAdminQuery = `
      SELECT 
        da.id, 
        da.member_id AS memberId,
        m.name,
        da.email, 
        da.district, 
        da.is_active AS isActive, 
        da.appointed_at AS appointmentDate,
        da.expires_at AS expiryDate,
        da.last_login AS lastLogin
      FROM district_admins da
      JOIN members m ON da.member_id = m.id
      WHERE da.id = ?
    `;
    
    const updatedAdmin = await executeQuery(getUpdatedAdminQuery, [adminId]);
    
    if (!updatedAdmin.length) {
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve updated admin details' },
        { status: 500 }
      );
    }
    
    // Fetch permissions for the updated admin
    const permissionsQuery = `
      SELECT permission
      FROM district_admin_permissions
      WHERE district_admin_id = ? AND (expires_at IS NULL OR expires_at > NOW()) AND is_active = 1
    `;
    
    const permissions = await executeQuery(permissionsQuery, [adminId]);
    updatedAdmin[0].permissions = permissions.map((p: any) => p.permission);
    
    return NextResponse.json({ success: true, admin: updatedAdmin[0] });
  } catch (error) {
    console.error('Error updating district admin:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Delete a district admin
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    const adminId = params.id;
    
    // Check if district admin exists
    const checkQuery = 'SELECT id, email, district FROM district_admins WHERE id = ?';
    const check = await executeQuery(checkQuery, [adminId]);
    
    if (!check.length) {
      return NextResponse.json(
        { success: false, message: 'District admin not found' },
        { status: 404 }
      );
    }
    
    // Delete district admin permissions first (foreign key constraint)
    await executeQuery(
      'DELETE FROM district_admin_permissions WHERE district_admin_id = ?',
      [adminId]
    );
    
    // Delete district admin
    await executeQuery('DELETE FROM district_admins WHERE id = ?', [adminId]);
    
    // Log the action
    const logQuery = `
      INSERT INTO activity_logs (user_id, user_type, action, details, ip_address)
      VALUES (?, 'superadmin', 'delete_district_admin', ?, ?)
    `;
    
    await executeQuery(logQuery, [
      claims.sub,
      `Removed district admin ID ${adminId} (${check[0].email}) from ${check[0].district} district`,
      req.headers.get('x-forwarded-for') || 'unknown'
    ]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting district admin:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
