import { NextRequest } from 'next/server';
import { verifyAdminJwt, getAdminToken } from '@/lib/auth-jwt';
import { executeQuery } from '@/lib/database';

export interface AdminScope {
  isSuperAdmin: boolean;
  isDistrictAdmin: boolean;
  isNewsEditor: boolean;
  adminId: number | null;
  districtName: string | null;
  stateName: string | null;
  permissions: string[];
}

export async function getAdminScope(req: NextRequest): Promise<AdminScope> {
  // Get token from Authorization header or cookie (for backward compatibility)
  const token = getAdminToken(req);
  const claims = token ? await verifyAdminJwt(token) : null;

  // Check both 'type' and 'role' fields for backward compatibility and robustness
  // Some older tokens might only have 'role', newer ones have both 'type' and 'role'
  const isSuperAdmin = !!claims && (claims.type === 'superadmin' || claims.role === 'superadmin');
  const isDistrictAdmin = !!claims && (claims.type === 'district_admin' || (claims.role === 'district_admin' && claims.type !== 'superadmin'));
  const isNewsEditor = !!claims && (claims.type === 'news_editor' || claims.role === 'news_editor' || claims.role === 'news_reporter');
  
  // Debug logging for superadmin detection issues
  if (claims && !isSuperAdmin && !isDistrictAdmin && !isNewsEditor) {
    console.log('⚠️ Admin scope detection: claims have type:', claims.type, 'role:', claims.role, 'but not recognized as superadmin, district admin, or news editor');
  }
  const adminId = claims ? Number(claims.sub) : null;
  let permissions: string[] = (claims?.permissions as string[]) || [];

  // News editors have full access to news and events (like superadmin for news/events)
  if (isNewsEditor) {
    permissions = ['edit_news_events', 'add_news', 'edit_news', 'delete_news', 'add_events', 'edit_events', 'delete_events'];
    return { isSuperAdmin, isDistrictAdmin, isNewsEditor, adminId, districtName: null, stateName: null, permissions };
  }

  if (isDistrictAdmin && adminId) {
    // Prefer DB for current district/state to avoid stale JWT
    // Try to get district and state from district_admins table
    let rows = await executeQuery(
      'SELECT district, state FROM district_admins WHERE id = ? LIMIT 1',
      [adminId]
    ) as Array<{ district: string; state: string | null }>;
    
    // If state is null, try to get it from districts table
    if (rows.length > 0 && !rows[0].state && rows[0].district) {
      try {
        const districtRows = await executeQuery(
          `SELECT s.state_name_english as state_name 
           FROM districts d 
           JOIN states s ON d.state_code = s.state_code 
           WHERE d.district_name_english = ? 
           LIMIT 1`,
          [rows[0].district.split(',')[0]?.trim() || rows[0].district]
        ) as Array<{ state_name: string }>;
        
        if (districtRows.length > 0) {
          rows[0].state = districtRows[0].state_name;
        }
      } catch (e) {
        console.error('Error fetching state from districts table:', e);
      }
    }
    
    // Load active permissions from DB for district admin
    try {
      // First, automatically deactivate any expired permissions (cleanup)
      await executeQuery(
        `UPDATE district_admin_permissions 
         SET is_active = 0 
         WHERE district_admin_id = ? 
         AND is_active = 1 
         AND expires_at IS NOT NULL 
         AND expires_at < NOW()`,
        [adminId]
      );
      
      // Then fetch active permissions
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
    // Also grant full seller management permissions when add_products is granted
    const effective = new Set<string>(permissions);
    if (effective.has('add_products')) {
      effective.add('edit_products');
      effective.add('delete_products');
      effective.add('edit_store');
      // Grant all seller management permissions
      effective.add('manage_sellers');
      effective.add('add_sellers');
      effective.add('edit_sellers');
      effective.add('delete_sellers');
      effective.add('view_sellers');
    }
    permissions = Array.from(effective);
    if (rows.length) {
      const adminDistrict: string = rows[0].district || '';
      const districtName = (adminDistrict || '').split(',')[0]?.trim() || adminDistrict || null;
      const stateName = rows[0].state || null;
      return { isSuperAdmin, isDistrictAdmin, isNewsEditor, adminId, districtName, stateName, permissions };
    }
  }

  return { isSuperAdmin, isDistrictAdmin, isNewsEditor, adminId, districtName: null, stateName: null, permissions };
}

export function ensurePermission(scope: AdminScope, required: string | string[]): boolean {
  const list = Array.isArray(required) ? required : [required];
  if (scope.isSuperAdmin) return true;
  
  // News editors have full access to news and events permissions
  if (scope.isNewsEditor) {
    const newsEventsPermissions = ['edit_news_events', 'add_news', 'edit_news', 'delete_news', 'add_events', 'edit_events', 'delete_events'];
    return list.some(p => newsEventsPermissions.includes(p));
  }
  
  return list.some(p => scope.permissions.includes(p) || scope.permissions.includes('all'));
}


