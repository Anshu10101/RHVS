import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';
import { noCacheJsonResponse } from '@/lib/api-helpers';

export async function PUT(request: NextRequest) {
  try {
    const token = getAdminToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const claims = await verifyAdminJwt(token);
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone } = body;

    if (!name || !email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name and email are required' 
      }, { status: 400 });
    }

    // Update based on user type
    if (claims.type === 'superadmin') {
      await executeQuery(
        `UPDATE superadmins 
         SET name = ?, email = ?, phone = ?, updated_at = NOW()
         WHERE id = ?`,
        [name, email, phone || null, claims.userId]
      );
    } else if (claims.type === 'district_admin') {
      await executeQuery(
        `UPDATE district_admins 
         SET name = ?, email = ?, phone = ?, updated_at = NOW()
         WHERE id = ?`,
        [name, email, phone || null, claims.userId]
      );
    } else {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    return noCacheJsonResponse({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update profile',
    }, { status: 500 });
  }
}

