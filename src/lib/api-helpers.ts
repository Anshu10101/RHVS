import { NextResponse } from 'next/server';

/**
 * Creates a JSON response with no-cache headers for admin API routes
 * This prevents browser caching of admin panel data
 * 
 * Why no-cache for admin panels?
 * - Data freshness: Admins need to see changes immediately
 * - Security: Prevents sensitive admin data from being cached
 * - Consistency: Avoids stale data issues
 * 
 * Trade-off: Slightly more server load, but acceptable for admin panels
 * (typically low traffic, high data-freshness requirements)
 */
export function noCacheJsonResponse(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...init?.headers,
    },
  });
}

/**
 * Alternative: Short-lived cache (30 seconds) for read-heavy admin endpoints
 * Use this if you want to reduce server load while maintaining reasonable freshness
 * 
 * Example: For stats/dashboard endpoints that don't change frequently
 */
export function shortCacheJsonResponse(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: {
      'Cache-Control': 'private, max-age=30, must-revalidate',
      ...init?.headers,
    },
  });
}

