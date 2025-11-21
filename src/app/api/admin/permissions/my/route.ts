import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';

export async function GET(req: NextRequest) {
  try {
    const token = getAdminToken(req);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Only district admins need to check permissions
    if (claims.type !== 'district_admin') {
      return NextResponse.json({ 
        success: true, 
        permissions: [],
        message: 'Superadmin has all permissions' 
      });
    }

    // Get active permissions for the district admin
    const query = `
      SELECT permission
      FROM district_admin_permissions
      WHERE district_admin_id = ? 
      AND is_active = 1
      AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY permission
    `;
    
    const result = await executeQuery(query, [claims.sub]) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    const permissions = result.map((row: { permission: string }) => row.permission);

    return NextResponse.json({ 
      success: true, 
      permissions,
      total: permissions.length
    });
  } catch (error) {
    console.error('Error fetching admin permissions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}
