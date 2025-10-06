import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth-jwt';

const PROTECTED_PREFIX = '/admin';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith(PROTECTED_PREFIX)) {
    return NextResponse.next();
  }

  // Allow the login pages to be accessed without a session
  if (pathname === '/admin/login' || pathname === '/admin/superadmin/login' || pathname.startsWith('/admin/verify')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('admin_session')?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  const claims = await verifyAdminJwt(token);
  if (!claims) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  // Check if user has access to the requested path
  const isSuperAdmin = claims.type === 'superadmin';
  const isDistrictAdmin = claims.type === 'district_admin';

  // Superadmin-only routes
  const superAdminOnlyRoutes = [
    '/admin/members/admins',
    '/admin/members/tokens',
    '/admin/members/pending',
    '/admin/departments',
    '/admin/logs',
    '/admin/settings',
    '/admin/permissions'
  ];

  // Check if trying to access superadmin-only route
  if (superAdminOnlyRoutes.some(route => pathname.startsWith(route)) && !isSuperAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/unauthorized';
    return NextResponse.redirect(url);
  }

  // District admins: let page/API enforce fine-grained permissions (no hard block here)
  if (isDistrictAdmin) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};


