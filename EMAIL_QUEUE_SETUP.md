# Email Queue System - Setup & Usage Guide

## Overview

This system provides automatic email retry functionality with exponential backoff, queue monitoring, and manual intervention capabilities for certificate and notification emails.

## Features

- ✅ **Automatic Retry**: Failed emails are automatically retried up to 5 times with exponential backoff (5min, 15min, 1hr, 4hr, 12hr)
- ✅ **Queue Monitoring**: Admin dashboard to view pending, failed, and sent emails
- ✅ **Manual Retry**: Manually retry failed emails from admin panel
- ✅ **Status Tracking**: Track email delivery status in real-time
- ✅ **Error Logging**: Detailed error messages and codes for troubleshooting

## Installation Steps

### 1. Run Database Migration

```bash
# Run the SQL migration script
mysql -u your_username -p your_database < database/email-queue-system.sql

# Or use your database management tool to execute:
# database/email-queue-system.sql
```

This creates:
- `email_queue` table for storing email queue items
- `failed_emails_view` view for easy access to failed emails
- `pending_retries_view` view for monitoring scheduled retries
- Adds `email_queue_id` column to `certificates` table

### 2. Configure Environment Variables

Ensure your `.env.local` has all required EMAIL_* variables:

```env
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=admin@rashtriyahinduvahinisangathan.in
EMAIL_PASS=your_password_here
EMAIL_FROM=admin@rashtriyahinduvahinisangathan.in
```

**Note**: All EMAIL_* variables are REQUIRED. The system will throw clear errors if any are missing.

### 3. Start the Application

```bash
npm run dev
# or
pnpm dev
```

### 4. Set Up Queue Processor (Production)

For production, set up a cron job to process the email queue every 5 minutes:

#### Option A: System Cron Job

```bash
# Edit crontab
crontab -e

# Add this line (adjust path to your project)
*/5 * * * * curl -X POST http://localhost:3000/api/email-queue/process
```

#### Option B: External Cron Service

Use services like:
- **Vercel Cron** (if deployed on Vercel)
- **EasyCron** (easycron.com)
- **cron-job.org**

Configure to call: `POST https://yourdomain.com/api/email-queue/process`

#### Option C: Background Process (Development)

In `src/app/api/email-queue/process/route.ts`, uncomment the startup code:

```typescript
// Add at the end of the file
import { startQueueProcessor } from '@/lib/email-queue-processor';

// Start processor in background (every 5 minutes)
startQueueProcessor(5);
```

⚠️ **Not recommended for production** - use cron instead.

## Usage

### Admin Dashboard

Access the email queue monitor at:
```
http://localhost:3000/admin/email-queue
```

Features:
- **Statistics Tab**: Overview of email status for last 7 days
- **Failed Emails Tab**: Emails that failed after max retries (requires manual intervention)
- **Pending Retries Tab**: Emails scheduled for automatic retry

### API Endpoints

#### 1. Process Queue Manually

```bash
POST /api/email-queue/process
Content-Type: application/json

{
  "maxEmails": 10  # Optional, default: 10
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "processed": 5,
    "sent": 4,
    "failed": 1,
    "errors": []
  }
}
```

#### 2. Get Queue Status

```bash
# Get statistics
GET /api/email-queue/status?view=stats

# Get failed emails
GET /api/email-queue/status?view=failed&limit=50

# Get pending emails
GET /api/email-queue/status?view=pending&limit=50
```

#### 3. Retry Failed Email

```bash
POST /api/email-queue/{queueId}
```

Resets retry count and schedules immediate retry.

#### 4. Cancel Queued Email

```bash
DELETE /api/email-queue/{queueId}
```

## How It Works

### 1. Email Send Flow

```
1. Member appointment/removal triggered
2. Certificate generated (if appointment)
3. Attempt to send email
   ├─ Success → Mark as sent, done
   └─ Failure → Add to queue with retry schedule
4. Background processor runs every 5 minutes
5. Process pending emails from queue
   ├─ Success → Mark as sent
   └─ Failure → Increment retry count, schedule next retry
6. After 5 failed attempts → Mark as permanently failed
7. Admin reviews failed emails and manually retries if needed
```

### 2. Retry Schedule (Exponential Backoff)

| Attempt | Delay | Time After Initial Failure |
|---------|-------|---------------------------|
| 1       | Immediate | 0 min |
| 2       | 5 minutes | 5 min |
| 3       | 15 minutes | 20 min |
| 4       | 1 hour | 1h 20min |
| 5       | 4 hours | 5h 20min |
| 6 (final) | 12 hours | 17h 20min |

After 6 attempts (17+ hours), email is marked as permanently failed and requires manual intervention.

### 3. Database Schema

**email_queue table:**
```sql
- id: Primary key
- recipient_email: Email address
- recipient_name: Member name
- email_type: 'appointment_certificate' | 'removal_notification' | 'test'
- email_data: JSON with template data
- certificate_path: Path to certificate PDF
- id_card_path: Path to ID card PDF
- status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'
- priority: 1-10 (1=highest)
- retry_count: Current retry attempt
- max_retries: Maximum attempts (default: 5)
- last_error: Error message from last attempt
- last_error_code: SMTP error code
- created_at: When added to queue
- last_attempt_at: Last send attempt
- next_retry_at: When to retry next
- sent_at: When successfully sent
- related_member_id: FK to members table
- related_certificate_id: FK to certificates table
```

## Common Issues & Solutions

### Issue: Emails not being processed automatically

**Solution:**
- Check if cron job is running: `crontab -l`
- Manually trigger: `POST /api/email-queue/process`
- Check logs for errors

### Issue: All emails failing with same error

**Solution:**
- Verify EMAIL_* environment variables are set correctly
- Test SMTP connection: Send a test email via admin panel
- Check SMTP server status (smtp.hostinger.com)

### Issue: Queue growing too large

**Solution:**
- Increase processing frequency (every 2-3 minutes instead of 5)
- Increase `maxEmails` parameter in cron call
- Check for systematic failures (bad SMTP config, network issues)

### Issue: Failed emails stuck in queue

**Solution:**
- Go to Admin → Email Queue → Failed Emails
- Review error messages
- Fix underlying issue
- Click "Retry Now" for each email

## Monitoring & Maintenance

### Daily Checks

1. Visit `/admin/email-queue`
2. Check "Failed Emails" tab
3. Review error messages
4. Retry or cancel as needed

### Weekly Review

1. Check statistics for trends
2. Review average retry counts
3. Investigate if failure rate > 5%

### Health Indicators

- ✅ **Healthy**: 95%+ success rate, avg retries < 2
- ⚠️ **Warning**: 85-95% success rate, avg retries 2-4
- 🔴 **Critical**: <85% success rate, avg retries > 4

## Support

For issues or questions:
- Check logs: `console` in browser / server logs
- Review error messages in admin panel
- Test SMTP connection via test endpoint

---

**Implementation Date**: January 2026  
**Version**: 1.0.0
