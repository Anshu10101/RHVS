import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { signAdminJwt } from '@/lib/auth-jwt';
import { verifyPassword } from '@/lib/password';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password required' }, { status: 400 });
    }

    // First check if user is a superadmin
    const superadminRows = await executeQuery(
      'SELECT id, email, name, password_hash, role, is_active FROM superadmin WHERE email = ? LIMIT 1',
      [email]
    ) as Array<{ id: number; email: string; name: string | null; password_hash: string; role: string; is_active: boolean }>;

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

      // Log the login activity (silently, only log errors)
      try {
        await executeQuery(
          `INSERT INTO activity_logs (user_id, user_type, user_name, action, details, ip_address)
           VALUES (?, 'superadmin', ?, 'login', ?, ?)`,
          [
            String(user.id),
            user.name || user.email,
            `Superadmin login: ${user.email}`,
            req.headers.get('x-forwarded-for') || 'unknown'
          ]
        );
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
      
      // Return token in response - client will store in localStorage
      console.log('✅ Superadmin login successful, returning token:', {
        userId: user.id,
        email: user.email,
        hasToken: !!token,
        tokenLength: token?.length
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Logged in',
        token // Send token in response
      });
    }

    // If not superadmin, check if user is a district admin
    // Use LOWER() for case-insensitive email matching
    const districtAdminRows = await executeQuery(
      `SELECT 
        da.id, 
        da.email, 
        da.password_hash, 
        da.role, 
        da.district,
        da.state,
        da.is_active,
        da.expires_at,
        m.name as member_name
      FROM district_admins da
      LEFT JOIN members m ON da.member_id = m.id
      WHERE LOWER(da.email) = LOWER(?) LIMIT 1`,
      [email]
    ) as Array<{ id: number; email: string; password_hash: string; role: string; is_active: boolean; state: string; district: string; expires_at?: string; member_name: string | null }>;

    if (districtAdminRows.length === 0) {
      console.log('❌ District admin login failed: No admin found with email:', email);
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const districtAdmin = districtAdminRows[0];
    
    console.log('🔍 District admin found:', {
      id: districtAdmin.id,
      email: districtAdmin.email,
      is_active: districtAdmin.is_active,
      expires_at: districtAdmin.expires_at,
      has_password_hash: !!districtAdmin.password_hash
    });
    
    // Check if admin account is active
    if (!districtAdmin.is_active) {
      console.log('❌ District admin login failed: Account disabled for email:', email);
      return NextResponse.json({ success: false, message: 'Account disabled' }, { status: 403 });
    }
    
    // Check if admin account has expired
    if (districtAdmin.expires_at && new Date(districtAdmin.expires_at) < new Date()) {
      console.log('❌ District admin login failed: Account expired for email:', email);
      return NextResponse.json({ success: false, message: 'Account expired' }, { status: 403 });
    }

    // Check if password hash exists
    if (!districtAdmin.password_hash) {
      console.log('❌ District admin login failed: No password hash found for email:', email);
      return NextResponse.json({ success: false, message: 'Account configuration error. Please contact administrator.' }, { status: 500 });
    }

    // Verify password
    const valid = await verifyPassword(password, districtAdmin.password_hash);
    if (!valid) {
      console.log('❌ District admin login failed: Invalid password for email:', email);
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }
    
    console.log('✅ District admin password verified successfully for email:', email);

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
    
    // Log the login activity (silently, only log errors)
    try {
      await executeQuery(
        `INSERT INTO activity_logs (user_id, user_type, user_name, action, details, ip_address)
         VALUES (?, 'district_admin', ?, 'login', ?, ?)`,
        [
          String(districtAdmin.id),
          (districtAdmin as any).member_name || districtAdmin.email,
          `District admin login: ${districtAdmin.email} (${districtAdmin.district})`,
          req.headers.get('x-forwarded-for') || 'unknown'
        ]
      );
    } catch (logError) {
      console.error('❌ Failed to log district admin login:', logError);
      // Don't fail the login if logging fails
    }
    
    // Return token in response - client will store in localStorage
    console.log('✅ District admin login successful, returning token:', {
      userId: districtAdmin.id,
      email: districtAdmin.email,
      hasToken: !!token,
      tokenLength: token?.length
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Logged in',
      token, // Send token in response
      expiresIn: 8 * 60 * 60 // 8 hours in seconds
    });
  } catch (e) {
    console.error('admin login error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}