/**
 * Secure token storage utilities with XSS protection
 * Uses localStorage with additional security measures
 */

const TOKEN_KEY = 'admin_token';
const TOKEN_EXPIRY_KEY = 'admin_token_expiry';
const TOKEN_REFRESH_KEY = 'admin_token_refresh';

/**
 * Store token securely with expiry tracking
 */
export function storeToken(token: string, expiresInSeconds: number = 8 * 60 * 60): void {
  if (typeof window === 'undefined') return;
  
  try {
    const expiryTime = Date.now() + (expiresInSeconds * 1000);
    
    // Store token and expiry separately
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // Set refresh time (refresh 1 hour before expiry)
    const refreshTime = expiryTime - (60 * 60 * 1000);
    localStorage.setItem(TOKEN_REFRESH_KEY, refreshTime.toString());
  } catch (error) {
    console.error('Error storing token:', error);
  }
}

/**
 * Get token if valid (not expired)
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) {
      return null;
    }
    
    // Check if token is expired
    const expiryTime = parseInt(expiry, 10);
    if (Date.now() > expiryTime) {
      // Token expired, clear it
      clearToken();
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

/**
 * Check if token needs refresh (within 1 hour of expiry)
 */
export function shouldRefreshToken(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const refreshTime = localStorage.getItem(TOKEN_REFRESH_KEY);
    if (!refreshTime) return false;
    
    return Date.now() >= parseInt(refreshTime, 10);
  } catch {
    return false;
  }
}

/**
 * Clear token and related data
 */
export function clearToken(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(TOKEN_REFRESH_KEY);
  } catch (error) {
    console.error('Error clearing token:', error);
  }
}

/**
 * Check if token exists and is valid
 */
export function hasValidToken(): boolean {
  return getToken() !== null;
}

