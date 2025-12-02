# Post Validity & Auto-Expiry Setup Guide

This document explains how to set up the 1-year post validity system with automatic cleanup.

## Overview

- **Default Validity**: All department post assignments have 1-year validity from appointment date
- **Custom Validity**: Admins can override with custom dates (e.g., 2 years, 1.5 years)
- **Auto-Cleanup**: Daily cron job removes expired posts and related data (certificates, ID cards)

## Database Setup

Run these SQL migration files in order:

1. **Add validity columns to department_members:**
   ```bash
   mysql -u your_user -p your_database < database/add-post-validity-columns.sql
   ```

2. **Add ID card path column to certificates:**
   ```bash
   mysql -u your_user -p your_database < database/add-id-card-path-to-certificates.sql
   ```

## Cron Job Setup

### Option 1: Vercel Cron (Recommended if deployed on Vercel)

The `vercel.json` file already includes the cron configuration:
- Runs daily at 2 AM UTC
- Endpoint: `/api/cron/cleanup-expired-posts`

**Setup steps:**
1. Set environment variable `CRON_SECRET` in Vercel dashboard (optional but recommended)
2. Deploy to Vercel - cron will be automatically configured
3. Verify cron is running in Vercel dashboard under "Cron Jobs"

**Manual trigger (for testing):**
```bash
curl -X GET "https://your-domain.com/api/cron/cleanup-expired-posts" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Option 2: Server Cron (If self-hosted)

1. **Make script executable:**
   ```bash
   chmod +x scripts/cleanup-expired-posts.sh
   ```

2. **Set environment variables:**
   ```bash
   export NEXT_PUBLIC_APP_URL="https://your-domain.com"
   export CRON_SECRET="your-secret-key-here"
   export LOG_FILE="/var/log/rhvs-cron.log"
   ```

3. **Add to crontab:**
   ```bash
   crontab -e
   ```

   Add this line (runs daily at 2 AM):
   ```
   0 2 * * * /path/to/your/project/scripts/cleanup-expired-posts.sh >> /var/log/rhvs-cron.log 2>&1
   ```

4. **Create log directory:**
   ```bash
   sudo mkdir -p /var/log
   sudo touch /var/log/rhvs-cron.log
   sudo chmod 666 /var/log/rhvs-cron.log
   ```

### Option 3: External Cron Service (cron-job.org, EasyCron, etc.)

1. Set up a daily scheduled job to call:
   ```
   GET https://your-domain.com/api/cron/cleanup-expired-posts
   ```
2. Add header if `CRON_SECRET` is set:
   ```
   Authorization: Bearer YOUR_CRON_SECRET
   ```

## API Changes

### Assigning Members to Posts

**Endpoint:** `POST /api/departments/[id]/members`

**New optional field:**
```json
{
  "post_id": 1,
  "member_id": 123,
  "level": "state",
  "state": "Uttar Pradesh",
  "valid_until": "2026-01-01"  // Optional: custom expiry date (YYYY-MM-DD)
}
```

- If `valid_until` is not provided, defaults to 1 year from assignment date
- If `valid_until` is provided, must be a future date

### Getting Department Members

**Endpoint:** `GET /api/departments/[id]/members`

- Now automatically filters out expired assignments
- Returns `valid_from` and `valid_until` dates in response

## What Gets Deleted When a Post Expires?

The cron job automatically deletes:

1. **Department assignment** (`department_members` record)
2. **Related certificates** (`certificates` table records matching the assignment)
3. **ID card files** (PDF files in `/public/id-cards/`)
4. **Certificate files** (PDF files in `/public/certificates/` or `/public/uploads/certificates/`)

## Admin UI Updates Needed

To fully utilize this feature, update your admin UI to:

1. **Show validity dates** when listing department members
2. **Display expiry countdown** (e.g., "Expires in 45 days")
3. **Add date picker** for custom validity override when assigning members
4. **Highlight expiring posts** (e.g., red badge if expiring within 30 days)

## Testing

1. **Test assignment with default validity:**
   ```bash
   curl -X POST "https://your-domain.com/api/departments/1/members" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"post_id": 1, "member_id": 123, "level": "national"}'
   ```
   Check database: `valid_until` should be 1 year from today.

2. **Test assignment with custom validity:**
   ```bash
   curl -X POST "https://your-domain.com/api/departments/1/members" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"post_id": 2, "member_id": 456, "level": "state", "state": "UP", "valid_until": "2025-06-30"}'
   ```

3. **Test cron cleanup manually:**
   ```bash
   # First, manually expire an assignment for testing:
   UPDATE department_members 
   SET valid_until = DATE_SUB(CURDATE(), INTERVAL 1 DAY) 
   WHERE id = 123;
   
   # Then trigger cleanup:
   curl -X GET "https://your-domain.com/api/cron/cleanup-expired-posts" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

## Troubleshooting

### Cron job not running
- Check Vercel dashboard for cron job status
- Check server logs for cron errors
- Verify `CRON_SECRET` environment variable is set correctly

### Files not being deleted
- Check file permissions on `/public/id-cards/` and `/public/certificates/`
- Verify file paths in database match actual file locations
- Check cron job logs for file deletion errors

### Expired posts still showing
- Verify GET endpoint is filtering by `valid_until >= CURDATE()`
- Check database: expired records should have `valid_until < CURDATE()`
- Clear any caching that might be serving old data

## Migration Notes

- **Existing assignments**: When you run the migration, all existing assignments will get:
  - `valid_from` = their original `assigned_at` date
  - `valid_until` = `assigned_at + 1 year`
  
- **No data loss**: The migration only adds columns and sets default values. Existing data remains intact.

