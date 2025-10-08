import { NextRequest } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';

export interface AdminScope {
  isSuperAdmin: boolean;
  isDistrictAdmin: boolean;
  adminId: number | null;
  districtName: string | null;
  stateName: string | null;
  permissions: string[];
}

export async function getAdminScope(req: NextRequest): Promise<AdminScope> {
  const token = req.cookies.get('admin_session')?.value || '';
  const claims = token ? await verifyAdminJwt(token) : null;

  const isSuperAdmin = !!claims && claims.type === 'superadmin';
  const isDistrictAdmin = !!claims && claims.type === 'district_admin';
  const adminId = claims ? Number(claims.sub) : null;
  let permissions: string[] = (claims?.permissions as string[]) || [];

  if (isDistrictAdmin && adminId) {
    // Prefer DB for current district/state to avoid stale JWT
    const rows = await executeQuery(
      'SELECT district, state FROM district_admins WHERE id = ? LIMIT 1',
      [adminId]
    ) as Array<{ district: string; state: string }>;
    // Load active permissions from DB for district admin
    try {
      const permRows = await executeQuery(
        `SELECT permission FROM district_admin_permissions WHERE district_admin_id = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY permission`,
        [adminId]
      ) as Array<{ permission: string }>;
      const dbPerms = Array.isArray(permRows) ? permRows.map((r: { permission: string }) => String(r.permission)) : [];
      if (dbPerms.length > 0) permissions = dbPerms;
    } catch (_) {
      // fall back to JWT permissions if DB lookup fails
    }

    // Imply edit/delete from add_products within district scope
    const effective = new Set<string>(permissions);
    if (effective.has('add_products')) {
      effective.add('edit_products');
      effective.add('delete_products');
      effective.add('edit_store');
    }
    permissions = Array.from(effective);
    if (rows.length) {
      const adminDistrict: string = rows[0].district || '';
      const districtName = (adminDistrict || '').split(',')[0]?.trim() || adminDistrict || null;
      const stateName = rows[0].state || null;
      return { isSuperAdmin, isDistrictAdmin, adminId, districtName, stateName, permissions };
    }
  }

  return { isSuperAdmin, isDistrictAdmin, adminId, districtName: null, stateName: null, permissions };
}

export function ensurePermission(scope: AdminScope, required: string | string[]): boolean {
  const list = Array.isArray(required) ? required : [required];
  if (scope.isSuperAdmin) return true;
  return list.some(p => scope.permissions.includes(p) || scope.permissions.includes('all'));
}


