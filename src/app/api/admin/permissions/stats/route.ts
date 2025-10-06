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

    // Get various statistics
    const [
      totalAssignments,
      activeAssignments,
      expiringSoon,
      expiredAssignments,
      totalAdmins,
      totalPermissions
    ] = await Promise.all([
      // Total assignments
      executeQuery(`
        SELECT COUNT(*) as count 
        FROM district_admin_permission_assignments
      `),
      
      // Active assignments
      executeQuery(`
        SELECT COUNT(*) as count 
        FROM district_admin_permission_assignments 
        WHERE is_active = true
      `),
      
      // Expiring soon (next 7 days)
      executeQuery(`
        SELECT COUNT(*) as count 
        FROM district_admin_permission_assignments 
        WHERE is_active = true 
        AND expires_at IS NOT NULL 
        AND expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
      `),
      
      // Expired assignments
      executeQuery(`
        SELECT COUNT(*) as count 
        FROM district_admin_permission_assignments 
        WHERE is_active = true 
        AND expires_at IS NOT NULL 
        AND expires_at < NOW()
      `),
      
      // Total district admins
      executeQuery(`
        SELECT COUNT(*) as count 
        FROM district_admins 
        WHERE is_active = true
      `),
      
      // Total available permissions
      executeQuery(`
        SELECT COUNT(*) as count 
        FROM available_permissions
      `)
    ]);

    const stats = {
      total_assignments: totalAssignments[0]?.count || 0,
      active_assignments: activeAssignments[0]?.count || 0,
      expiring_soon: expiringSoon[0]?.count || 0,
      expired_assignments: expiredAssignments[0]?.count || 0,
      total_admins: totalAdmins[0]?.count || 0,
      total_permissions: totalPermissions[0]?.count || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching permission stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permission stats' },
      { status: 500 }
    );
  }
}
