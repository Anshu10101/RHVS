import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth-jwt';

const PROTECTED_PREFIX = '/admin';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith(PROTECTED_PREFIX)) {
    return NextResponse.next();
  }

  // Allow the login and verify pages under /admin/login and /admin/verify to be accessed without a session
  if (pathname === '/admin/login' || pathname.startsWith('/admin/verify')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('admin_session')?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const claims = await verifyAdminJwt(token);
  if (!claims || claims.role !== 'superadmin') {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/unauthorized';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};


