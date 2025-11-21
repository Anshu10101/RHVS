import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth-jwt';

const PROTECTED_PREFIX = '/admin';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Redirect www to non-www (SSL certificate is for non-www domain)
  if (hostname.startsWith('www.')) {
    const nonWwwHost = hostname.replace(/^www\./, '');
    const url = req.nextUrl.clone();
    url.host = nonWwwHost;
    return NextResponse.redirect(url, 301); // Permanent redirect
  }

  // Create response
  const response = NextResponse.next();

  // Add security headers for all requests
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy - strict policy to prevent XSS and mixed content
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Next.js
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:", // Only HTTPS images, no HTTP
    "font-src 'self' data: https:", // Only HTTPS fonts, no HTTP
    "connect-src 'self' https:", // Only HTTPS connections, no HTTP
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests", // Force upgrade HTTP to HTTPS
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  if (!pathname.startsWith(PROTECTED_PREFIX)) {
    return response;
  }

  // Allow login pages and landing page - they handle auth client-side
  if (pathname === '/admin' || pathname === '/admin/login' || pathname === '/admin/superadmin/login' || pathname.startsWith('/admin/verify')) {
    return response;
  }

  // For API routes, check Authorization header
  if (pathname.startsWith('/api/admin')) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies.get('admin_session')?.value;
    
  if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const claims = await verifyAdminJwt(token);
  if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

    // Check route permissions for API routes
  const isSuperAdmin = claims.type === 'superadmin';
  const isDistrictAdmin = claims.type === 'district_admin';

  const superAdminOnlyRoutes = [
      '/api/admin/members/admins',
      '/api/admin/members/pending',
      '/api/admin/departments',
      '/api/admin/logs',
      '/api/admin/settings',
      '/api/admin/permissions'
    ];
    
  if (superAdminOnlyRoutes.some(route => pathname.startsWith(route)) && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

    return NextResponse.next();
  }

  // For page navigations (not API routes), allow through
  // Pages will check auth client-side using localStorage
  // This is necessary because middleware can't read localStorage
  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};


