/**
 * Secure URL utilities to prevent mixed content issues
 * Converts HTTP URLs to HTTPS to ensure all resources are loaded securely
 */

/**
 * Convert HTTP URL to HTTPS
 * Prevents mixed content warnings on HTTPS sites
 */
export function ensureHttps(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  
  const trimmed = url.trim();
  if (!trimmed) return null;
  
  // If it's already HTTPS, return as is
  if (trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Convert HTTP to HTTPS
  if (trimmed.startsWith('http://')) {
    return trimmed.replace('http://', 'https://');
  }
  
  // If it's a relative path or API route, return as is
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
    return trimmed;
  }
  
  // If it doesn't start with a protocol, assume it's a relative path
  if (!trimmed.match(/^[a-zA-Z][a-zA-Z\d+\-.]*:/)) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
  
  return trimmed;
}

/**
 * Check if URL is secure (HTTPS or relative)
 */
export function isSecureUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return true; // Consider null/undefined as secure (no URL)
  
  const trimmed = url.trim();
  if (!trimmed) return true;
  
  // Relative paths are secure
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
    return true;
  }
  
  // HTTPS is secure
  if (trimmed.startsWith('https://')) {
    return true;
  }
  
  // HTTP is not secure
  if (trimmed.startsWith('http://')) {
    return false;
  }
  
  // API routes are secure
  if (trimmed.startsWith('/api/')) {
    return true;
  }
  
  // No protocol means relative path, which is secure
  return true;
}

/**
 * Filter out insecure URLs from an array
 */
export function filterSecureUrls<T extends { [key: string]: unknown }>(
  items: T[],
  urlKey: string
): T[] {
  return items.filter(item => {
    const url = item[urlKey];
    return isSecureUrl(url as string | null | undefined);
  });
}

