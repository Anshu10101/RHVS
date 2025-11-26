import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { getAdminScope } from '@/lib/admin-scope';
import { noCacheJsonResponse } from '@/lib/api-helpers';

// GET available permissions (superadmin only)
export async function GET(request: NextRequest) {
  try {
    const scope = await getAdminScope(request);
    if (!scope.isSuperAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const [rows] = await pool.execute(
      `SELECT 
         permission_key AS \`key\`,
         permission_name AS \`name\`,
         COALESCE(description, '') AS description,
         COALESCE(category, 'content') AS category,
         COALESCE(default_type, 'temporary') AS \`type\`
       FROM available_permissions
       ORDER BY category ASC, permission_name ASC`
    );

    return noCacheJsonResponse({ success: true, permissions: rows });
  } catch (error) {
    console.error('Error fetching available permissions:', error);
    return noCacheJsonResponse({ success: false, error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

// (Removed duplicate GET implementation)
