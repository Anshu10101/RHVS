import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth-jwt';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Logged out' });
  res.headers.append('Set-Cookie', clearSessionCookie());
  return res;
}


