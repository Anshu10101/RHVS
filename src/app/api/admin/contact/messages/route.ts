import { NextRequest } from 'next/server';
import { executeQuery, getConnection } from '@/lib/database';
import { noCacheJsonResponse } from '@/lib/api-helpers';
import { getAdminScope } from '@/lib/admin-scope';

// Force dynamic rendering to prevent Next.js route caching in production
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Build scope filter - use same logic as GET query
    // For superadmin: can delete messages where target_type='superadmin' AND (superadmin_id matches OR is NULL)
    // For district admin: can only delete their own messages
    let scopeFilter = '';
    const scopeParams: unknown[] = [];

    if (scope.isSuperAdmin && scope.adminId) {
      // Superadmin can delete any superadmin message (including NULL superadmin_id)
      scopeFilter =
        'AND (cm.target_type = "superadmin" AND (cm.superadmin_id = ? OR cm.superadmin_id IS NULL))';
      scopeParams.push(scope.adminId);
    } else if (scope.isDistrictAdmin && scope.adminId) {
      // District admin can only delete their own messages
      scopeFilter =
        'AND (cm.target_type = "district_admin" AND cm.district_admin_id = ?)';
      scopeParams.push(scope.adminId);
    }

    if (action === 'delete') {
      // First, check what messages exist before deletion
      const preCheckQuery = `SELECT cm.id, cm.target_type, cm.superadmin_id, cm.district_admin_id, cm.deleted_at
         FROM contact_messages cm
         WHERE cm.id IN (${placeholders})`;
      
      const preCheckMessages = await executeQuery(
        preCheckQuery,
        baseParams
      ) as Array<{ id: number; target_type: string; superadmin_id: number | null; district_admin_id: number | null; deleted_at: string | null }>;
      
      const undeletedPreCheck = preCheckMessages.filter(m => m.deleted_at === null);
      
      console.log('🔍 Pre-delete check - Messages found:', {
        requestedIds: ids,
        foundMessages: preCheckMessages.length,
        undeletedMessages: undeletedPreCheck.length,
        isSuperAdmin: scope.isSuperAdmin,
        adminId: scope.adminId,
        messages: preCheckMessages.map(m => ({
          id: m.id,
          target_type: m.target_type,
          superadmin_id: m.superadmin_id,
          district_admin_id: m.district_admin_id,
          deleted_at: m.deleted_at
        }))
      });
      
      if (undeletedPreCheck.length === 0) {
        // All messages are already deleted or don't exist
        console.log('All messages already deleted or not found');
        return noCacheJsonResponse({
          success: true,
          message: 'Messages already deleted or not found',
        });
      }
      
      // For superadmins: Remove ALL scope filters - superadmin can delete ANY message
      // For district admins: Keep scope filter to only delete their own messages
      let finalScopeFilter = '';
      let deleteParams: unknown[] = baseParams;
      
      if (scope.isSuperAdmin) {
        // Superadmin can delete ANY message - no scope filter needed
        finalScopeFilter = '';
        deleteParams = baseParams;
        console.log('✅ Superadmin detected - allowing deletion of ANY message (no scope filter)');
      } else if (scope.isDistrictAdmin) {
        // District admin can only delete their own messages
        finalScopeFilter = scopeFilter;
        deleteParams = [...baseParams, ...scopeParams];
      }
      
      // Use soft delete to match GET query filter (deleted_at IS NULL)
      const deleteQuery = `UPDATE contact_messages cm
         SET cm.deleted_at = NOW(), cm.updated_at = NOW()
         WHERE cm.id IN (${placeholders})
         AND cm.deleted_at IS NULL
         ${finalScopeFilter}`;
      
      console.log('🗑️ Executing delete query with direct connection:', {
        query: deleteQuery,
        params: deleteParams,
        paramsLength: deleteParams.length,
        ids,
        idsLength: ids.length,
        scope: scope.isSuperAdmin ? 'superadmin' : 'district_admin',
        adminId: scope.adminId,
        finalScopeFilter: finalScopeFilter || '(none - superadmin)',
        undeletedCount: undeletedPreCheck.length
      });
      
      // Test query to see what matches BEFORE deletion
      const beforeDeleteQuery = `SELECT id, target_type, deleted_at FROM contact_messages WHERE id IN (${placeholders})`;
      const beforeDelete = await executeQuery(beforeDeleteQuery, baseParams) as Array<{ id: number; target_type: string; deleted_at: string | null }>;
      console.log('📋 BEFORE DELETE - Messages in DB:', beforeDelete);
      
      let affectedRows = 0;
      
      // Try the actual query with deleted_at check first
      console.log('🚀 Attempting delete query with deleted_at check...');
      try {
        const deleteResult = await executeQuery(deleteQuery, deleteParams);
        affectedRows = Array.isArray(deleteResult)
          ? (deleteResult[0] as any)?.affectedRows ?? 0
          : (deleteResult as any)?.affectedRows ?? 0;
        
        console.log('✅ Delete query result:', {
          affectedRows,
          result: deleteResult,
          query: deleteQuery,
          params: deleteParams
        });
      } catch (deleteError) {
        console.error('❌ Delete query failed:', deleteError);
        
        // Fallback: Try simplest query without deleted_at check
        console.log('🔄 Fallback: Trying simplest query (no deleted_at check)...');
        try {
          const simplestQuery = `UPDATE contact_messages SET deleted_at = NOW(), updated_at = NOW() WHERE id IN (${placeholders})`;
          const simpleResult = await executeQuery(simplestQuery, baseParams);
          affectedRows = Array.isArray(simpleResult)
            ? (simpleResult[0] as any)?.affectedRows ?? 0
            : (simpleResult as any)?.affectedRows ?? 0;
          
          console.log('✅ Fallback query result:', {
            affectedRows,
            result: simpleResult
          });
        } catch (simpleError) {
          console.error('❌ Fallback query also failed:', simpleError);
          return noCacheJsonResponse({
            success: false,
            error: 'Failed to delete messages: ' + (deleteError instanceof Error ? deleteError.message : 'Unknown error'),
          }, { status: 500 });
        }
      }
      
      // Wait a moment for DB to ensure changes are visible
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // CRITICAL: Verify deletion by checking if messages are actually deleted
      // Use a fresh query to ensure we're reading committed data
      const verifyQuery = `SELECT cm.id, cm.deleted_at, cm.target_type, cm.updated_at
         FROM contact_messages cm
         WHERE cm.id IN (${placeholders})`;
      
      const verifyMessages = await executeQuery(
        verifyQuery,
        baseParams
      ) as Array<{ id: number; deleted_at: string | null; target_type: string; updated_at: string }>;
      
      const successfullyDeleted = verifyMessages.filter(m => m.deleted_at !== null);
      const stillExists = verifyMessages.filter(m => m.deleted_at === null);
      
      console.log('✅ Delete verification (CRITICAL CHECK):', {
        affectedRows,
        requestedIds: ids,
        successfullyDeleted: successfullyDeleted.length,
        stillExists: stillExists.length,
        deletedIds: successfullyDeleted.map(m => ({ id: m.id, deleted_at: m.deleted_at, updated_at: m.updated_at })),
        existingIds: stillExists.map(m => ({ id: m.id, target_type: m.target_type, deleted_at: m.deleted_at })),
        allMessages: verifyMessages.map(m => ({ id: m.id, deleted_at: m.deleted_at, updated_at: m.updated_at }))
      });
      
      // Double-check: Query the database again after a longer delay to ensure persistence
      if (successfullyDeleted.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const finalVerify = await executeQuery(verifyQuery, baseParams) as Array<{ id: number; deleted_at: string | null }>;
        const finalStillExists = finalVerify.filter(m => m.deleted_at === null);
        console.log('🔍 Final persistence check (after 500ms):', {
          stillExists: finalStillExists.length,
          deleted: finalVerify.filter(m => m.deleted_at !== null).length,
          all: finalVerify.map(m => ({ id: m.id, deleted_at: m.deleted_at }))
        });
      }
      
      // ONLY return success if verification confirms messages were actually deleted
      if (stillExists.length > 0) {
        console.error('❌ DELETE FAILED - Messages still exist in DB:', {
          requestedIds: ids,
          stillExists: stillExists.map(m => m.id),
          affectedRows,
          finalScopeFilter,
          stillExistsDetails: stillExists.map(m => ({ id: m.id, target_type: m.target_type }))
        });
        
        // Try retry with minimal WHERE clause (just IDs and deleted_at check) - no scope filter
        console.log('Retrying delete with minimal WHERE clause (no scope filter)...');
        const retryQuery = `UPDATE contact_messages cm
           SET cm.deleted_at = NOW(), cm.updated_at = NOW()
           WHERE cm.id IN (${placeholders})
           AND cm.deleted_at IS NULL`;
        
        let retryConnection;
        try {
          retryConnection = await getConnection();
          const [retryResult] = await retryConnection.execute(retryQuery, baseParams) as [any, any];
          const retryAffected = retryResult?.affectedRows ?? 0;
          
          await retryConnection.commit();
          console.log(`Retry delete committed: ${retryAffected} rows affected`);
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verify retry
          const retryVerify = await executeQuery(verifyQuery, baseParams) as Array<{ id: number; deleted_at: string | null }>;
          const retryStillExists = retryVerify.filter(m => m.deleted_at === null);
          
          if (retryStillExists.length === 0) {
            console.log(`✅ Successfully deleted ${retryAffected} message(s) on retry`);
            if (retryConnection) retryConnection.release();
            return noCacheJsonResponse({
              success: true,
              message: 'Messages deleted successfully',
            });
          } else {
            console.error('❌ Retry also failed - messages still exist:', retryStillExists.map(m => m.id));
            console.error('This suggests the UPDATE query itself is not working. Check database permissions and table structure.');
          }
        } catch (retryError) {
          console.error('Retry delete failed:', retryError);
          if (retryConnection) {
            try {
              await retryConnection.rollback();
            } catch (rollbackError) {
              console.error('Retry rollback error:', rollbackError);
            }
            retryConnection.release();
          }
        } finally {
          if (retryConnection) {
            retryConnection.release();
          }
        }
        
        return noCacheJsonResponse({
          success: false,
          error: `Failed to delete messages. ${stillExists.length} message(s) still exist in database. Check server logs for details.`,
        }, { status: 500 });
      }
      
      // All messages were successfully deleted
      console.log(`✅ Successfully soft-deleted ${successfullyDeleted.length} message(s) with IDs:`, ids);
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


