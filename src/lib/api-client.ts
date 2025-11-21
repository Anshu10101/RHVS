/**
 * Helper function to create fetch options with authentication header
 * Uses secure storage to get token
 */
export function getAuthHeaders(): HeadersInit {
  const { getToken } = require('@/lib/secure-storage');
  const token = typeof window !== 'undefined' ? getToken() : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Helper function to get just the Authorization header (for use with existing headers)
 * Uses secure storage to get token
 */
export function getAuthHeader(): Record<string, string> {
  const { getToken } = require('@/lib/secure-storage');
  const token = typeof window !== 'undefined' ? getToken() : null;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Helper function to make authenticated fetch requests
 * Uses secure storage and includes automatic token refresh
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { getToken, shouldRefreshToken } = require('@/lib/secure-storage');
  let token = typeof window !== 'undefined' ? getToken() : null;
  
  // Try to refresh token if needed
  if (token && shouldRefreshToken()) {
    try {
      const refreshRes = await fetch('/api/admin/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.token) {
          const { storeToken } = require('@/lib/secure-storage');
          storeToken(refreshData.token, refreshData.expiresIn || 8 * 60 * 60);
          token = refreshData.token;
        }
      }
    } catch (refreshError) {
      console.warn('Token refresh failed:', refreshError);
    }
  }
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers: headers as HeadersInit,
  });
}

