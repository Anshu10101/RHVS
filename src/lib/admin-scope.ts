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
  const permissions = (claims?.permissions as string[]) || [];

  if (isDistrictAdmin && adminId) {
    // Prefer DB for current district/state to avoid stale JWT
    const rows: any[] = await executeQuery(
      'SELECT district, state FROM district_admins WHERE id = ? LIMIT 1',
      [adminId]
    );
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


