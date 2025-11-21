import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt, signAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';

/**
 * Refresh admin JWT token
 * Returns a new token if the current one is valid but close to expiry
 */
export async function POST(req: NextRequest) {
  try {
    const token = getAdminToken(req);
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify current token
    const claims = await verifyAdminJwt(token);
    
    if (!claims) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user still exists and is active
    if (claims.type === 'superadmin') {
      const superadminRows = await executeQuery(
        'SELECT id, email, is_active FROM superadmin WHERE id = ? LIMIT 1',
        [claims.sub]
      ) as Array<{ id: number; email: string; is_active: number }>;
      
      if (!superadminRows.length || superadminRows[0].is_active !== 1) {
        return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
      }
    } else if (claims.type === 'district_admin') {
      const districtAdminRows = await executeQuery(
        'SELECT id, email, is_active FROM district_admins WHERE id = ? LIMIT 1',
        [claims.sub]
      ) as Array<{ id: number; email: string; is_active: number }>;
      
      if (!districtAdminRows.length || districtAdminRows[0].is_active !== 1) {
        return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
      }
    }

    // Generate new token with same claims
    const newToken = await signAdminJwt({
      sub: claims.sub,
      email: claims.email,
      role: claims.role,
      type: claims.type,
      district: claims.district,
      permissions: claims.permissions,
    }, 8 * 60 * 60); // 8 hours

    return NextResponse.json({
      success: true,
      token: newToken,
      expiresIn: 8 * 60 * 60, // 8 hours in seconds
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}

