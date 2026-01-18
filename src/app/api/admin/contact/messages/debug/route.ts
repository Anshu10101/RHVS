import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database';
import { noCacheJsonResponse } from '@/lib/api-helpers';
import { getAdminScope } from '@/lib/admin-scope';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const scope = await getAdminScope(request);

  if (!scope.isSuperAdmin) {
    return noCacheJsonResponse(
      { success: false, error: 'Unauthorized - superadmin only' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      // Get all messages with their deleted_at status
      const allMessages = await executeQuery(
        `SELECT id, sender_name, target_type, deleted_at, updated_at, created_at 
         FROM contact_messages 
         ORDER BY id DESC 
         LIMIT 50`
      ) as Array<{
        id: number;
        sender_name: string;
        target_type: string;
        deleted_at: string | null;
        updated_at: string;
        created_at: string;
      }>;

      return noCacheJsonResponse({
        success: true,
        total: allMessages.length,
        messages: allMessages,
        deletedCount: allMessages.filter(m => m.deleted_at !== null).length,
        activeCount: allMessages.filter(m => m.deleted_at === null).length,
      });
    }

    // Get specific message
    const message = await executeQuery(
      `SELECT * FROM contact_messages WHERE id = ?`,
      [id]
    ) as Array<any>;

    return noCacheJsonResponse({
      success: true,
      message: message[0] || null,
      found: message.length > 0,
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return noCacheJsonResponse(
      { success: false, error: 'Failed to fetch debug info' },
      { status: 500 }
    );
  }
}

