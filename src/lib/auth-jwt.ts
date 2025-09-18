import { SignJWT, jwtVerify, JWTPayload } from 'jose';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-admin-secret-change-me';
const ADMIN_JWT_ISSUER = 'rhvs-admin';
const ADMIN_JWT_AUDIENCE = 'rhvs-admin-app';

function getJwtKey(): Uint8Array {
  return new TextEncoder().encode(ADMIN_JWT_SECRET);
}

export interface AdminJwtClaims extends JWTPayload {
  sub: string;
  email: string;
  role: string;
}

export async function signAdminJwt(claims: Omit<AdminJwtClaims, 'iss' | 'aud' | 'iat' | 'exp'>, ttlSeconds: number = 60 * 60 * 8): Promise<string> {
  const key = getJwtKey();
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setIssuer(ADMIN_JWT_ISSUER)
    .setAudience(ADMIN_JWT_AUDIENCE)
    .setExpirationTime(now + ttlSeconds)
    .sign(key);
}

export async function verifyAdminJwt(token: string): Promise<AdminJwtClaims | null> {
  try {
    const key = getJwtKey();
    const { payload } = await jwtVerify(token, key, { issuer: ADMIN_JWT_ISSUER, audience: ADMIN_JWT_AUDIENCE });
    return payload as AdminJwtClaims;
  } catch {
    return null;
  }
}

export function buildSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  const attrs = [
    `admin_session=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    isProd ? 'Secure' : '',
    `Max-Age=${60 * 60 * 8}`,
  ].filter(Boolean);
  return attrs.join('; ');
}

export function clearSessionCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const attrs = [
    'admin_session=;',
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    isProd ? 'Secure' : '',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ].filter(Boolean);
  return attrs.join('; ');
}

export async function signPasswordResetJwt(email: string, superadminId: number, ttlSeconds: number = 15 * 60): Promise<string> {
  const key = getJwtKey();
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ purpose: 'admin_password_reset', email, sub: String(superadminId) })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setIssuer(ADMIN_JWT_ISSUER)
    .setAudience(ADMIN_JWT_AUDIENCE)
    .setExpirationTime(now + ttlSeconds)
    .sign(key);
}

export async function verifyPasswordResetJwt(token: string): Promise<{ email: string; superadminId: number } | null> {
  try {
    const key = getJwtKey();
    const { payload } = await jwtVerify(token, key, { issuer: ADMIN_JWT_ISSUER, audience: ADMIN_JWT_AUDIENCE });
    if ((payload as any).purpose !== 'admin_password_reset') return null;
    return { email: String((payload as any).email || ''), superadminId: Number(payload.sub) };
  } catch {
    return null;
  }
}


