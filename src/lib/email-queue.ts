import { executeQuery } from '@/lib/database';

export type EmailType = 'appointment_certificate' | 'removal_notification' | 'test' | 'other';
export type QueueStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface EmailQueueItem {
  id?: number;
  recipient_email: string;
  recipient_name?: string | null;
  email_type: EmailType;
  email_subject?: string | null;
  email_data: any; // JSON data for email template
  certificate_path?: string | null;
  id_card_path?: string | null;
  status?: QueueStatus;
  priority?: number;
  retry_count?: number;
  max_retries?: number;
  last_error?: string | null;
  last_error_code?: string | null;
  created_at?: Date;
  last_attempt_at?: Date | null;
  next_retry_at?: Date | null;
  sent_at?: Date | null;
  related_member_id?: number | null;
  related_certificate_id?: number | null;
  created_by_admin_id?: number | null;
}

/**
 * Calculate next retry time using exponential backoff
 * Retry delays: 5min, 15min, 1hr, 4hr, 12hr
 */
export function calculateNextRetryTime(retryCount: number): Date {
  const delays = [
    5 * 60 * 1000,      // 5 minutes
    15 * 60 * 1000,     // 15 minutes
    60 * 60 * 1000,     // 1 hour
    4 * 60 * 60 * 1000, // 4 hours
    12 * 60 * 60 * 1000 // 12 hours
  ];
  
  const delayIndex = Math.min(retryCount, delays.length - 1);
  const delay = delays[delayIndex];
  
  return new Date(Date.now() + delay);
}

/**
 * Add email to queue
 */
export async function addToEmailQueue(item: EmailQueueItem): Promise<number> {
  try {
    const emailDataJson = JSON.stringify(item.email_data);
    
    const result = await executeQuery(
      `INSERT INTO email_queue (
        recipient_email, recipient_name, email_type, email_subject,
        email_data, certificate_path, id_card_path,
        status, priority, retry_count, max_retries,
        next_retry_at, related_member_id, related_certificate_id, created_by_admin_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.recipient_email,
        item.recipient_name || null,
        item.email_type,
        item.email_subject || null,
        emailDataJson,
        item.certificate_path || null,
        item.id_card_path || null,
        item.status || 'pending',
        item.priority || 5,
        item.retry_count || 0,
        item.max_retries || 5,
        item.next_retry_at || new Date(), // Process immediately by default
        item.related_member_id || null,
        item.related_certificate_id || null,
        item.created_by_admin_id || null
      ]
    ) as { insertId: number };
    
    console.log(`[Email Queue] Added email to queue: ID ${result.insertId}, type: ${item.email_type}, recipient: ${item.recipient_email}`);
    return result.insertId;
  } catch (error) {
    console.error('[Email Queue] Error adding email to queue:', error);
    throw error;
  }
}

/**
 * Update email queue item status
 */
export async function updateEmailQueueStatus(
  queueId: number,
  status: QueueStatus,
  error?: string | null,
  errorCode?: string | null
): Promise<void> {
  try {
    const now = new Date();
    
    if (status === 'sent') {
      await executeQuery(
        `UPDATE email_queue 
         SET status = ?, sent_at = ?, last_attempt_at = ?
         WHERE id = ?`,
        [status, now, now, queueId]
      );
    } else if (status === 'failed' || status === 'processing') {
      await executeQuery(
        `UPDATE email_queue 
         SET status = ?, last_error = ?, last_error_code = ?, last_attempt_at = ?
         WHERE id = ?`,
        [status, error || null, errorCode || null, now, queueId]
      );
    } else {
      await executeQuery(
        `UPDATE email_queue 
         SET status = ?
         WHERE id = ?`,
        [status, queueId]
      );
    }
    
    console.log(`[Email Queue] Updated queue item ${queueId} to status: ${status}`);
  } catch (error) {
    console.error(`[Email Queue] Error updating queue status for ${queueId}:`, error);
    throw error;
  }
}

/**
 * Mark email as failed and schedule retry (if retries remaining)
 */
export async function markEmailForRetry(
  queueId: number,
  error: string,
  errorCode?: string
): Promise<void> {
  try {
    // Get current retry count
    const items = await executeQuery(
      'SELECT retry_count, max_retries FROM email_queue WHERE id = ?',
      [queueId]
    ) as Array<{ retry_count: number; max_retries: number }>;
    
    if (items.length === 0) {
      throw new Error(`Queue item ${queueId} not found`);
    }
    
    const { retry_count, max_retries } = items[0];
    const newRetryCount = retry_count + 1;
    
    if (newRetryCount >= max_retries) {
      // Max retries reached - mark as permanently failed
      await executeQuery(
        `UPDATE email_queue 
         SET status = 'failed', 
             retry_count = ?, 
             last_error = ?, 
             last_error_code = ?,
             last_attempt_at = NOW(),
             next_retry_at = NULL
         WHERE id = ?`,
        [newRetryCount, error, errorCode || null, queueId]
      );
      console.log(`[Email Queue] Queue item ${queueId} marked as permanently failed (max retries reached)`);
    } else {
      // Schedule retry with exponential backoff
      const nextRetryTime = calculateNextRetryTime(newRetryCount);
      
      await executeQuery(
        `UPDATE email_queue 
         SET status = 'pending', 
             retry_count = ?, 
             last_error = ?, 
             last_error_code = ?,
             last_attempt_at = NOW(),
             next_retry_at = ?
         WHERE id = ?`,
        [newRetryCount, error, errorCode || null, nextRetryTime, queueId]
      );
      
      console.log(`[Email Queue] Queue item ${queueId} scheduled for retry ${newRetryCount}/${max_retries} at ${nextRetryTime.toISOString()}`);
    }
  } catch (error) {
    console.error(`[Email Queue] Error marking email for retry:`, error);
    throw error;
  }
}

/**
 * Get pending emails that are ready to be processed
 */
export async function getPendingEmails(limit: number = 10): Promise<EmailQueueItem[]> {
  try {
    const items = await executeQuery(
      `SELECT * FROM email_queue 
       WHERE status = 'pending' 
         AND (next_retry_at IS NULL OR next_retry_at <= NOW())
         AND retry_count < max_retries
       ORDER BY priority ASC, created_at ASC
       LIMIT ?`,
      [limit]
    ) as EmailQueueItem[];
    
    // Parse JSON email_data
    return items.map(item => ({
      ...item,
      email_data: typeof item.email_data === 'string' 
        ? JSON.parse(item.email_data as string) 
        : item.email_data
    }));
  } catch (error) {
    console.error('[Email Queue] Error getting pending emails:', error);
    throw error;
  }
}

/**
 * Get email queue statistics
 */
export async function getEmailQueueStats() {
  try {
    const stats = await executeQuery(
      `SELECT 
        status,
        COUNT(*) as count,
        AVG(retry_count) as avg_retries
       FROM email_queue
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY status`
    ) as Array<{ status: string; count: number; avg_retries: number }>;
    
    const total = await executeQuery(
      'SELECT COUNT(*) as total FROM email_queue WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    ) as Array<{ total: number }>;
    
    return {
      total: total[0]?.total || 0,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = {
          count: stat.count,
          avgRetries: Math.round(stat.avg_retries * 10) / 10
        };
        return acc;
      }, {} as Record<string, { count: number; avgRetries: number }>)
    };
  } catch (error) {
    console.error('[Email Queue] Error getting stats:', error);
    throw error;
  }
}

/**
 * Get failed emails that need manual attention
 */
export async function getFailedEmails(limit: number = 50): Promise<EmailQueueItem[]> {
  try {
    const items = await executeQuery(
      `SELECT * FROM email_queue 
       WHERE status = 'failed' 
         AND retry_count >= max_retries
       ORDER BY created_at DESC
       LIMIT ?`,
      [limit]
    ) as EmailQueueItem[];
    
    // Parse JSON email_data
    return items.map(item => ({
      ...item,
      email_data: typeof item.email_data === 'string' 
        ? JSON.parse(item.email_data as string) 
        : item.email_data
    }));
  } catch (error) {
    console.error('[Email Queue] Error getting failed emails:', error);
    throw error;
  }
}

/**
 * Manually retry a failed email
 */
export async function manualRetryEmail(queueId: number): Promise<void> {
  try {
    await executeQuery(
      `UPDATE email_queue 
       SET status = 'pending',
           retry_count = 0,
           next_retry_at = NOW(),
           last_error = NULL,
           last_error_code = NULL
       WHERE id = ?`,
      [queueId]
    );
    console.log(`[Email Queue] Manually reset queue item ${queueId} for retry`);
  } catch (error) {
    console.error(`[Email Queue] Error manually retrying email:`, error);
    throw error;
  }
}

/**
 * Cancel a queued email
 */
export async function cancelQueuedEmail(queueId: number): Promise<void> {
  try {
    await executeQuery(
      `UPDATE email_queue 
       SET status = 'cancelled'
       WHERE id = ?`,
      [queueId]
    );
    console.log(`[Email Queue] Cancelled queue item ${queueId}`);
  } catch (error) {
    console.error(`[Email Queue] Error cancelling email:`, error);
    throw error;
  }
}
