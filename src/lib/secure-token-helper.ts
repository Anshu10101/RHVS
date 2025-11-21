/**
 * Secure token helper - provides backward-compatible interface
 * Use this instead of directly accessing localStorage
 * 
 * This helper automatically uses secure storage with expiry checking
 */

import { getToken, clearToken, storeToken, hasValidToken } from './secure-storage';

/**
 * Get admin token (backward compatible with localStorage.getItem('admin_token'))
 * Automatically checks expiry and returns null if expired
 */
export function getAdminToken(): string | null {
  return getToken();
}

/**
 * Remove admin token (backward compatible with localStorage.removeItem('admin_token'))
 */
export function removeAdminToken(): void {
  clearToken();
}

/**
 * Store admin token securely (backward compatible)
 */
export function setAdminToken(token: string, expiresInSeconds?: number): void {
  storeToken(token, expiresInSeconds);
}

/**
 * Check if admin token exists and is valid
 */
export function hasAdminToken(): boolean {
  return hasValidToken();
}

// Re-export for convenience
export { getToken, clearToken, storeToken, hasValidToken } from './secure-storage';

