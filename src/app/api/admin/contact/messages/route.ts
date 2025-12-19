import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database';
import { noCacheJsonResponse } from '@/lib/api-helpers';
import { getAdminScope } from '@/lib/admin-scope';

type TopicKey =
  | 'membership'
  | 'certificate'
  | 'email_issue'
  | 'content_issue'
  | 'technical'
  | 'store_issue'
  | 'complaint'
  | 'feedback'
  | 'other';

interface ContactMessageRow {
  id: number;
  member_id: number | null;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  sender_member_reg_number: string | null;
  topic_key: TopicKey;
  custom_topic: string | null;
  message: string;
  target_type: 'superadmin' | 'district_admin';
  superadmin_id: number | null;
  district_admin_id: number | null;
  status: 'unread' | 'read';
  created_at: string;
  updated_at: string;
  read_at: string | null;
}

interface PatchBody {
  action: 'mark-read' | 'mark-unread' | 'delete';
  ids: number[];
}

export async function GET(request: NextRequest) {
  const scope = await getAdminScope(request);

  if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
    return noCacheJsonResponse(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const summary = searchParams.get('summary') === '1';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      summary ? 5 : parseInt(searchParams.get('limit') || '20', 10),
      100
    );
    const status = searchParams.get('status') || '';
    const search = (searchParams.get('search') || '').trim();
    const forType = (searchParams.get('forType') ||
      '') as 'superadmin' | 'district_admin' | '';
    const forId = searchParams.get('forId');

    const isSummary = summary;

    // Determine which inbox we are reading
    let targetType: 'superadmin' | 'district_admin';
    let targetAdminId: number | null = null;

    if (scope.isSuperAdmin) {
      if (forType === 'district_admin' && forId) {
        targetType = 'district_admin';
        targetAdminId = Number(forId);
      } else {
        targetType = 'superadmin';
        targetAdminId = scope.adminId;
      }
    } else {
      // District admin can only see their own inbox
      targetType = 'district_admin';
      targetAdminId = scope.adminId;
    }

    if (!targetAdminId) {
      return noCacheJsonResponse(
        { success: false, error: 'Invalid admin scope' },
        { status: 400 }
      );
    }

    const whereParts: string[] = [];
    const params: unknown[] = [];

    if (targetType === 'superadmin') {
      whereParts.push(
        '(cm.target_type = "superadmin" AND (cm.superadmin_id = ? OR cm.superadmin_id IS NULL))'
      );
      params.push(targetAdminId);
    } else {
      whereParts.push(
        '(cm.target_type = "district_admin" AND cm.district_admin_id = ?)'
      );
      params.push(targetAdminId);
    }

    if (status === 'unread' || status === 'read') {
      whereParts.push('cm.status = ?');
      params.push(status);
    }

    if (search) {
      whereParts.push(
        `(cm.sender_name LIKE ? OR cm.sender_email LIKE ? OR cm.sender_member_reg_number LIKE ? OR cm.message LIKE ?)`
      );
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    whereParts.push('cm.deleted_at IS NULL');

    const whereClause =
      whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    if (isSummary) {
      const summaryRows = (await executeQuery(
        `SELECT COUNT(*) AS unreadCount
         FROM contact_messages cm
         ${whereClause}
         AND cm.status = 'unread'`,
        params
      )) as Array<{ unreadCount: number }>;

      const unreadCount = summaryRows[0]?.unreadCount || 0;

      return noCacheJsonResponse({
        success: true,
        data: {
          unreadCount,
        },
      });
    }

    const offset = (page - 1) * limit;

    const rows = (await executeQuery(
      `SELECT 
         cm.*
       FROM contact_messages cm
       ${whereClause}
       ORDER BY cm.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )) as ContactMessageRow[];

    const countRows = (await executeQuery(
      `SELECT COUNT(*) as total
       FROM contact_messages cm
       ${whereClause}`,
      params
    )) as Array<{ total: number }>;

    const total = countRows[0]?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return noCacheJsonResponse({
      success: true,
      data: {
        messages: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return noCacheJsonResponse(
      { success: false, error: 'Failed to load contact messages' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const scope = await getAdminScope(request);

  if (!scope.isSuperAdmin && !scope.isDistrictAdmin) {
    return noCacheJsonResponse(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as PatchBody;
    const { action, ids } = body || {};

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return noCacheJsonResponse(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const placeholders = ids.map(() => '?').join(',');
    const baseParams: unknown[] = [...ids];

    let scopeFilter = '';
    const scopeParams: unknown[] = [];

    if (scope.isDistrictAdmin && scope.adminId) {
      scopeFilter =
        'AND cm.target_type = "district_admin" AND cm.district_admin_id = ?';
      scopeParams.push(scope.adminId);
    }

    if (action === 'delete') {
      await executeQuery(
        `DELETE FROM contact_messages cm
         WHERE cm.id IN (${placeholders})
         ${scopeFilter}`,
        [...baseParams, ...scopeParams]
      );
    } else if (action === 'mark-read') {
      await executeQuery(
        `UPDATE contact_messages cm
         SET cm.status = 'read', cm.read_at = NOW(), cm.updated_at = NOW()
         WHERE cm.id IN (${placeholders})
         ${scopeFilter}`,
        [...baseParams, ...scopeParams]
      );
    } else if (action === 'mark-unread') {
      await executeQuery(
        `UPDATE contact_messages cm
         SET cm.status = 'unread', cm.read_at = NULL, cm.updated_at = NOW()
         WHERE cm.id IN (${placeholders})
         ${scopeFilter}`,
        [...baseParams, ...scopeParams]
      );
    } else {
      return noCacheJsonResponse(
        { success: false, error: 'Unsupported action' },
        { status: 400 }
      );
    }

    return noCacheJsonResponse({
      success: true,
      message: 'Update successful',
    });
  } catch (error) {
    console.error('Error updating contact messages:', error);
    return noCacheJsonResponse(
      { success: false, error: 'Failed to update messages' },
      { status: 500 }
    );
  }
}


