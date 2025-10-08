import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { buildSessionCookie, signAdminJwt } from '@/lib/auth-jwt';
import { verifyPassword } from '@/lib/password';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password required' }, { status: 400 });
    }

    // First check if user is a superadmin
    const superadminRows = await executeQuery(
      'SELECT id, email, password_hash, role, is_active FROM superadmin WHERE email = ? LIMIT 1',
      [email]
    ) as Array<{ id: number; email: string; password_hash: string; role: string; is_active: boolean }>;

    if (superadminRows.length > 0) {
      const user = superadminRows[0];
      if (!user.is_active) {
        return NextResponse.json({ success: false, message: 'Account disabled' }, { status: 403 });
      }

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
      }

      // Update last_login timestamp
      await executeQuery('UPDATE superadmin SET last_login = NOW() WHERE id = ?', [user.id]);

      // Log the login activity
      console.log('Logging superadmin login:', {
        userId: user.id,
        email: user.email,
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      });
      
      try {
        await executeQuery(
          `INSERT INTO activity_logs (user_id, user_type, action, details, ip_address)
           VALUES (?, 'superadmin', 'login', ?, ?)`,
          [
            user.id,
            `Superadmin login: ${user.email}`,
            req.headers.get('x-forwarded-for') || 'unknown'
          ]
        );
        console.log('✅ Superadmin login logged successfully');
      } catch (logError) {
        console.error('❌ Failed to log superadmin login:', logError);
        // Don't fail the login if logging fails
      }

      const token = await signAdminJwt({ 
        sub: String(user.id), 
        email: user.email, 
        role: 'superadmin',
        type: 'superadmin'
      });
      
      const res = NextResponse.json({ success: true, message: 'Logged in' });
      res.headers.append('Set-Cookie', buildSessionCookie(token));
      return res;
    }

    // If not superadmin, check if user is a district admin
    const districtAdminRows = await executeQuery(
      `SELECT 
        da.id, 
        da.email, 
        da.password_hash, 
        da.role, 
        da.district,
        da.is_active,
        da.expires_at
      FROM district_admins da
      WHERE da.email = ? LIMIT 1`,
      [email]
    ) as Array<{ id: number; email: string; password_hash: string; role: string; is_active: boolean; state: string; district: string; expires_at?: string }>;

    if (districtAdminRows.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const districtAdmin = districtAdminRows[0];
    
    // Check if admin account is active
    if (!districtAdmin.is_active) {
      return NextResponse.json({ success: false, message: 'Account disabled' }, { status: 403 });
    }
    
    // Check if admin account has expired
    if (districtAdmin.expires_at && new Date(districtAdmin.expires_at) < new Date()) {
      return NextResponse.json({ success: false, message: 'Account expired' }, { status: 403 });
    }

    // Verify password
    const valid = await verifyPassword(password, districtAdmin.password_hash);
    if (!valid) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // Update last_login timestamp
    await executeQuery('UPDATE district_admins SET last_login = NOW() WHERE id = ?', [districtAdmin.id]);
    
    // Get admin's permissions
    const permissionsRows = await executeQuery(
      `SELECT permission 
       FROM district_admin_permissions 
       WHERE district_admin_id = ? AND is_active = 1 
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [districtAdmin.id]
    ) as Array<{ permission: string }>;
    
    const permissions = permissionsRows.map(row => row.permission);

    // Sign JWT token with admin information
    const token = await signAdminJwt({ 
      sub: String(districtAdmin.id), 
      email: districtAdmin.email, 
      role: 'admin',
      type: 'district_admin',
      district: districtAdmin.district,
      permissions: permissions
    });
    
    // Log the login activity
    console.log('Logging district admin login:', {
      userId: districtAdmin.id,
      email: districtAdmin.email,
      district: districtAdmin.district,
      ip: req.headers.get('x-forwarded-for') || 'unknown'
    });
    
    try {
      await executeQuery(
        `INSERT INTO activity_logs (user_id, user_type, action, details, ip_address)
         VALUES (?, 'district_admin', 'login', ?, ?)`,
        [
          districtAdmin.id,
          `District admin login: ${districtAdmin.email} (${districtAdmin.district})`,
          req.headers.get('x-forwarded-for') || 'unknown'
        ]
      );
      console.log('✅ District admin login logged successfully');
    } catch (logError) {
      console.error('❌ Failed to log district admin login:', logError);
      // Don't fail the login if logging fails
    }
    
    const res = NextResponse.json({ success: true, message: 'Logged in' });
    res.headers.append('Set-Cookie', buildSessionCookie(token));
    return res;
  } catch (e) {
    console.error('admin login error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}