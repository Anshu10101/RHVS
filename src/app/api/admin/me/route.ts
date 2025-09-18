import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value;
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });

  const claims = await verifyAdminJwt(token);
  if (!claims) return NextResponse.json({ authenticated: false }, { status: 401 });

  const rows: any[] = await executeQuery('SELECT id, email, role, is_active, created_at, updated_at FROM superadmin WHERE id = ? LIMIT 1', [claims.sub]);
  if (rows.length === 0) return NextResponse.json({ authenticated: false }, { status: 401 });

  const user = rows[0];
  return NextResponse.json({ authenticated: true, user });
}


