import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { noCacheJsonResponse } from '@/lib/api-helpers';

// Assign permissions (permanent or temporary)
export async function POST(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { district_admin_id, permissions, expires_at } = body || {};
    if (!district_admin_id || !Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    // Convert ISO datetime string to MySQL datetime format if provided
    let expiresAtValue: string | null = null;
    if (expires_at) {
      try {
        // Parse ISO string and convert to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
        const date = new Date(expires_at);
        if (!isNaN(date.getTime())) {
          expiresAtValue = date.toISOString().slice(0, 19).replace('T', ' ');
        }
      } catch (e) {
        console.error('Error parsing expires_at:', e);
      }
    }

    await pool.execute('START TRANSACTION');
    for (const perm of permissions) {
      await pool.execute(
        `INSERT INTO district_admin_permissions (district_admin_id, permission, granted_by, granted_at, expires_at, is_active)
         VALUES (?, ?, ?, NOW(), ?, TRUE)
         ON DUPLICATE KEY UPDATE 
           is_active = VALUES(is_active),
           expires_at = VALUES(expires_at),
           granted_at = VALUES(granted_at),
           granted_by = VALUES(granted_by)`,
        [district_admin_id, perm, scope.adminId || 0, expiresAtValue]
      );
    }
    await pool.execute('COMMIT');

    return noCacheJsonResponse({ success: true });
  } catch (error) {
    console.error('Error assigning permissions:', error);
    try { await pool.execute('ROLLBACK'); } catch {}
    return noCacheJsonResponse({ success: false, error: 'Failed to assign permissions' }, { status: 500 });
  }
}

// Revoke permissions immediately (permanent or temporary)
export async function DELETE(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const districtAdminId = Number(searchParams.get('district_admin_id'));
    const permission = searchParams.get('permission'); // optional; if absent, revoke all

    if (!districtAdminId) {
      return NextResponse.json({ success: false, error: 'district_admin_id is required' }, { status: 400 });
    }

    if (permission) {
      await pool.execute(
        `UPDATE district_admin_permissions 
         SET is_active = FALSE, expires_at = NOW()
         WHERE district_admin_id = ? AND permission = ? AND is_active = TRUE`,
        [districtAdminId, permission]
      );
    } else {
      await pool.execute(
        `UPDATE district_admin_permissions 
         SET is_active = FALSE, expires_at = NOW()
         WHERE district_admin_id = ? AND is_active = TRUE`,
        [districtAdminId]
      );
    }

    return noCacheJsonResponse({ success: true });
  } catch (error) {
    console.error('Error revoking permissions:', error);
    return noCacheJsonResponse({ success: false, error: 'Failed to revoke permissions' }, { status: 500 });
  }
}

// (Removed duplicate legacy handler and imports)
