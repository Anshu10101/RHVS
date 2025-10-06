import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value;
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });

  const claims = await verifyAdminJwt(token);
  if (!claims) return NextResponse.json({ authenticated: false }, { status: 401 });

  // Handle different user types
  const userType = claims.type || 'superadmin';
  
  if (userType === 'superadmin') {
    // Fetch superadmin details
    const rows: any[] = await executeQuery(
      'SELECT id, email, role, is_active, created_at, updated_at FROM superadmin WHERE id = ? LIMIT 1', 
      [claims.sub]
    );
    
    if (rows.length === 0) return NextResponse.json({ authenticated: false }, { status: 401 });
    
    const user = rows[0];
    return NextResponse.json({ 
      authenticated: true, 
      user: {
        ...user,
        type: 'superadmin',
        permissions: ['all']
      }
    });
  } 
  else if (userType === 'district_admin') {
    // Fetch district admin details
    const rows: any[] = await executeQuery(
      `SELECT 
        da.id, 
        da.member_id, 
        m.name,
        da.email, 
        da.district, 
        m.state,
        da.role, 
        da.is_active, 
        da.created_at, 
        da.updated_at
       FROM district_admins da
       JOIN members m ON da.member_id = m.id
       WHERE da.id = ? LIMIT 1`, 
      [claims.sub]
    );
    
    if (rows.length === 0) return NextResponse.json({ authenticated: false }, { status: 401 });
    
    // Check if account is active
    if (!rows[0].is_active) {
      return NextResponse.json({ authenticated: false, message: 'Account disabled' }, { status: 403 });
    }
    
    // Fetch admin permissions
    const permissionsRows: any[] = await executeQuery(
      `SELECT permission
       FROM district_admin_permissions
       WHERE district_admin_id = ? 
         AND is_active = 1
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [claims.sub]
    );
    
    // Fetch temporary permissions (permissions with expiry dates)
    const temporaryPermissionsRows: any[] = await executeQuery(
      `SELECT permission, expires_at
       FROM district_admin_permissions
       WHERE district_admin_id = ? 
         AND is_active = 1
         AND expires_at IS NOT NULL
         AND expires_at > NOW()`,
      [claims.sub]
    );
    
    const user = {
      ...rows[0],
      type: 'district_admin',
      permissions: permissionsRows.map(p => p.permission),
      temporaryPermissions: temporaryPermissionsRows.map(p => ({
        permission: p.permission,
        expiresAt: new Date(p.expires_at)
      }))
    };
    
    return NextResponse.json({ authenticated: true, user });
  }
  
  // Invalid user type
  return NextResponse.json({ authenticated: false }, { status: 401 });
}