import { sendCertificateEmail } from './email-service';
import { 
  getPendingEmails, 
  updateEmailQueueStatus, 
  markEmailForRetry,
  type EmailQueueItem 
} from './email-queue';

/**
 * Email Queue Processor - Processes pending emails with retry logic
 * Call this function periodically (e.g., every 5 minutes via cron or API endpoint)
 */
export async function processEmailQueue(maxEmails: number = 10): Promise<{
  processed: number;
  sent: number;
  failed: number;
  errors: Array<{ queueId: number; error: string }>;
}> {
  console.log('[Queue Processor] Starting email queue processing...');
  
  const results = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: [] as Array<{ queueId: number; error: string }>
  };
  
  try {
    // Get pending emails ready for processing
    const pendingEmails = await getPendingEmails(maxEmails);
    
    if (pendingEmails.length === 0) {
      console.log('[Queue Processor] No pending emails to process');
      return results;
    }
    
    console.log(`[Queue Processor] Found ${pendingEmails.length} emails to process`);
    
    // Process each email
    for (const item of pendingEmails) {
      results.processed++;
      
      try {
        await processEmailQueueItem(item);
        results.sent++;
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          queueId: item.id!,
          error: errorMessage
        });
        console.error(`[Queue Processor] Failed to process queue item ${item.id}:`, error);
      }
    }
    
    console.log(`[Queue Processor] Completed. Processed: ${results.processed}, Sent: ${results.sent}, Failed: ${results.failed}`);
    return results;
    
  } catch (error) {
    console.error('[Queue Processor] Fatal error during queue processing:', error);
    throw error;
  }
}

/**
 * Process a single email queue item
 */
async function processEmailQueueItem(item: EmailQueueItem): Promise<void> {
  const queueId = item.id!;
  
  console.log(`[Queue Processor] Processing queue item ${queueId} (${item.email_type}, attempt ${item.retry_count! + 1})`);
  
  // Mark as processing
  await updateEmailQueueStatus(queueId, 'processing');
  
  try {
    // Send email based on type
    let emailResult;
    
    switch (item.email_type) {
      case 'appointment_certificate':
        emailResult = await sendCertificateEmail(item.email_data);
        break;
        
      case 'removal_notification':
        // TODO: Implement removal notification email
        emailResult = await sendRemovalNotificationEmail(item.email_data);
        break;
        
      case 'test':
        // Test email
        emailResult = { success: true, messageId: 'test-' + Date.now() };
        break;
        
      default:
        throw new Error(`Unknown email type: ${item.email_type}`);
    }
    
    // Check result
    if (emailResult.success) {
      // Email sent successfully
      await updateEmailQueueStatus(queueId, 'sent');
      console.log(`[Queue Processor] ✅ Successfully sent email ${queueId}. Message ID: ${emailResult.messageId}`);
      
      // Update related certificate if exists
      if (item.related_certificate_id) {
        const { executeQuery } = await import('./database');
        await executeQuery(
          `UPDATE certificates 
           SET email_status = 'sent', email_sent_at = NOW()
           WHERE id = ?`,
          [item.related_certificate_id]
        );
      }
    } else {
      // Email failed - schedule retry
      const error = emailResult.error || 'Unknown error';
      await markEmailForRetry(queueId, error);
      console.log(`[Queue Processor] ❌ Failed to send email ${queueId}: ${error}`);
    }
    
  } catch (error: any) {
    // Unexpected error - schedule retry
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorCode = error?.code || null;
    
    await markEmailForRetry(queueId, errorMessage, errorCode);
    console.error(`[Queue Processor] ❌ Error processing queue item ${queueId}:`, error);
    
    throw error; // Re-throw to be caught by outer handler
  }
}

/**
 * Send removal notification email
 * TODO: Implement proper removal email template
 */
async function sendRemovalNotificationEmail(data: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Use the proper removal email function
  const { sendRemovalEmail } = await import('./email-service');
  return await sendRemovalEmail(data);
}

/**
 * Process queue continuously with interval
 * Use this for development/testing. In production, use a proper cron job or scheduler.
 */
export function startQueueProcessor(intervalMinutes: number = 5) {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  console.log(`[Queue Processor] Starting continuous processor (interval: ${intervalMinutes} minutes)`);
  
  // Process immediately
  processEmailQueue().catch(error => {
    console.error('[Queue Processor] Error in initial processing:', error);
  });
  
  // Then process at intervals
  const interval = setInterval(() => {
    processEmailQueue().catch(error => {
      console.error('[Queue Processor] Error in scheduled processing:', error);
    });
  }, intervalMs);
  
  // Return cleanup function
  return () => {
    console.log('[Queue Processor] Stopping continuous processor');
    clearInterval(interval);
  };
}
