import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims || claims.type !== 'district_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { district_admin_id } = await req.json();

    if (!district_admin_id) {
      return NextResponse.json(
        { error: 'District admin ID is required' },
        { status: 400 }
      );
    }

    // Check for expired permissions
    const expiredPermissions = await executeQuery(`
      SELECT permission_key
      FROM district_admin_permission_assignments
      WHERE district_admin_id = ?
      AND is_active = true
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
    `, [district_admin_id]);

    if (expiredPermissions.length > 0) {
      // Deactivate expired permissions
      const expiredKeys = expiredPermissions.map(p => p.permission_key);
      
      await executeQuery(`
        UPDATE district_admin_permission_assignments
        SET is_active = false
        WHERE district_admin_id = ?
        AND permission_key IN (${expiredKeys.map(() => '?').join(',')})
        AND expires_at < NOW()
      `, [district_admin_id, ...expiredKeys]);

      // Log the expiration in history
      for (const permission of expiredKeys) {
        await executeQuery(`
          INSERT INTO permission_assignment_history
          (district_admin_id, permission_key, action, granted_by, expires_at, notes)
          VALUES (?, ?, 'expired', 1, NOW(), 'Permission expired automatically')
        `, [district_admin_id, permission]);
      }

      return NextResponse.json({
        expired_permissions: expiredKeys,
        message: `${expiredKeys.length} permissions have expired and been deactivated`
      });
    }

    return NextResponse.json({
      expired_permissions: [],
      message: 'No expired permissions found'
    });
  } catch (error) {
    console.error('Error checking permission expiry:', error);
    return NextResponse.json(
      { error: 'Failed to check permission expiry' },
      { status: 500 }
    );
  }
}
