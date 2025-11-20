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

  // Get token from Authorization header or cookie (for backward compatibility)
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : req.cookies.get('admin_session')?.value;
  
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
    '/admin/members/pending',
    '/admin/departments',
    '/admin/logs',
    '/admin/settings',
    '/admin/permissions'
  ];
  
  // Allow district admins to access token verification (they can only see their district's tokens)
  if (pathname === '/admin/members/tokens' && isDistrictAdmin) {
    return NextResponse.next();
  }

  // Allow district admins to access assign members page (they can only assign at district level)
  if (pathname === '/admin/departments/assign' && isDistrictAdmin) {
    return NextResponse.next();
  }

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


