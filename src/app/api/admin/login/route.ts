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

    const rows: any[] = await executeQuery(
      'SELECT id, email, password_hash, role, is_active FROM superadmin WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const user = rows[0];
    if (!user.is_active) {
      return NextResponse.json({ success: false, message: 'Account disabled' }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // Update last_login timestamp
    await executeQuery('UPDATE superadmin SET last_login = NOW() WHERE id = ?', [user.id]);

    const token = await signAdminJwt({ sub: String(user.id), email: user.email, role: 'superadmin' });
    const res = NextResponse.json({ success: true, message: 'Logged in' });
    res.headers.append('Set-Cookie', buildSessionCookie(token));
    return res;
  } catch (e) {
    console.error('admin login error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}


