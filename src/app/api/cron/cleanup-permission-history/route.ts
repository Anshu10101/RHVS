import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

/**
 * Daily cron job to clean up old permission history
 * 
 * This job:
 * 1. Deletes permission_assignment_history records older than 2 months
 * 2. Deletes inactive permission assignments (is_active = false) older than 2 months
 * 3. Keeps all active permissions regardless of age
 * 
 * Should be called daily via Vercel Cron or server cron:
 * - Vercel: Add to vercel.json cron config
 * - Server: Setup cron to call this endpoint daily
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization check for cron endpoint
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting cleanup of old permission history (2 months retention)...');
    
    const retentionMonths = 2;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];

    // 1. Clean up permission_assignment_history older than 2 months
    const historyResult = await executeQuery(`
      DELETE FROM permission_assignment_history
      WHERE action_at < DATE_SUB(NOW(), INTERVAL ? MONTH)
    `, [retentionMonths]) as { affectedRows: number };

    const historyDeleted = historyResult.affectedRows || 0;
    console.log(`[Cron] Deleted ${historyDeleted} old permission history record(s)`);

    // 2. Clean up inactive permission assignments older than 2 months
    // Only delete records where is_active = false AND created_at is older than 2 months
    const assignmentsResult = await executeQuery(`
      DELETE FROM district_admin_permission_assignments
      WHERE is_active = false
        AND created_at < DATE_SUB(NOW(), INTERVAL ? MONTH)
    `, [retentionMonths]) as { affectedRows: number };

    const assignmentsDeleted = assignmentsResult.affectedRows || 0;
    console.log(`[Cron] Deleted ${assignmentsDeleted} old inactive permission assignment(s)`);

    // 3. Also clean up from legacy district_admin_permissions table
    const legacyResult = await executeQuery(`
      DELETE FROM district_admin_permissions
      WHERE is_active = false
        AND granted_at < DATE_SUB(NOW(), INTERVAL ? MONTH)
    `, [retentionMonths]) as { affectedRows: number };

    const legacyDeleted = legacyResult.affectedRows || 0;
    console.log(`[Cron] Deleted ${legacyDeleted} old inactive permission(s) from legacy table`);

    const totalDeleted = historyDeleted + assignmentsDeleted + legacyDeleted;

    const result = {
      success: true,
      message: `Cleanup completed: ${totalDeleted} records deleted (History: ${historyDeleted}, Assignments: ${assignmentsDeleted}, Legacy: ${legacyDeleted})`,
      deleted: {
        history: historyDeleted,
        assignments: assignmentsDeleted,
        legacy: legacyDeleted,
        total: totalDeleted
      },
      retentionPeriod: `${retentionMonths} months`,
      cutoffDate: cutoffDateString
    };

    console.log(`[Cron] Cleanup completed:`, result);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Cron] Fatal error during permission history cleanup:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to cleanup permission history' 
    }, { status: 500 });
  }
}

