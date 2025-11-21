/**
 * Helper to add cache-busting timestamp to URLs
 * This ensures browsers always fetch fresh data, even if they ignore cache headers
 */
export function addCacheBust(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}`;
}

/**
 * Creates fetch options with cache prevention and Authorization header
 */
export function getAdminFetchOptions(token: string | null, additionalHeaders?: Record<string, string>): RequestInit {
  return {
    cache: 'no-store',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...additionalHeaders,
    },
  };
}

