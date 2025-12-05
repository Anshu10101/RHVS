# Permission History Cleanup System

This document explains the automatic cleanup system for permission history with 2-month retention.

## Overview

The system automatically deletes old permission history records to:
- Prevent database bloat
- Maintain performance
- Keep only relevant recent history

## Retention Policy

- **Retention Period**: 2 months (60 days)
- **What Gets Deleted**:
  - `permission_assignment_history` records older than 2 months
  - Inactive permission assignments (`is_active = false`) older than 2 months
  - Legacy `district_admin_permissions` inactive records older than 2 months
- **What Stays**:
  - All active permissions (regardless of age)
  - Recent history (within 2 months)

## How It Works

### Automatic Cleanup

The cleanup runs daily via cron job at **3:00 AM** (after expired posts cleanup at 2 AM).

### What Gets Cleaned

1. **Permission Assignment History** (`permission_assignment_history`)
   - All records older than 2 months are deleted
   - This includes: granted, revoked, expired, extended actions

2. **Inactive Permission Assignments** (`district_admin_permission_assignments`)
   - Only records where `is_active = false` AND older than 2 months
   - Active permissions are never deleted

3. **Legacy Permissions** (`district_admin_permissions`)
   - Inactive records older than 2 months
   - Maintains compatibility with old system

## Setup

### For Vercel (Automatic)

The cron job is already configured in `vercel.json`:
```json
{
  "path": "/api/cron/cleanup-permission-history",
  "schedule": "0 3 * * *"
}
```

No additional setup needed - Vercel will run it automatically.

### For Self-Hosted Server

1. **Make script executable**:
   ```bash
   chmod +x scripts/cleanup-permission-history.sh
   ```

2. **Set environment variable** (optional, for security):
   ```bash
   export CRON_SECRET="your-secret-key-here"
   ```

3. **Add to crontab**:
   ```bash
   crontab -e
   ```

4. **Add this line** (runs at 3 AM daily):
   ```bash
   0 3 * * * /path/to/your/project/scripts/cleanup-permission-history.sh >> /home/your-username/rhvs-cron.log 2>&1
   ```

5. **Or use full path with cd**:
   ```bash
   0 3 * * * cd /path/to/your/project && /bin/bash scripts/cleanup-permission-history.sh >> /home/your-username/rhvs-cron.log 2>&1
   ```

## Manual Testing

### Test the API endpoint directly:

```bash
curl -X GET "https://your-domain.com/api/cron/cleanup-permission-history" \
  -H "Authorization: Bearer your-cron-secret"
```

### Test the script locally:

```bash
./scripts/cleanup-permission-history.sh
```

## Configuration

### Change Retention Period

To change the retention period (e.g., to 3 months), edit:
- `src/app/api/cron/cleanup-permission-history/route.ts`
- Change `const retentionMonths = 2;` to your desired value

### Environment Variables

- `CRON_SECRET`: Optional secret for securing the cron endpoint
  - If set, the endpoint requires `Authorization: Bearer <CRON_SECRET>` header
  - If not set, the endpoint is publicly accessible (not recommended for production)

## Monitoring

### Check Logs

The cleanup script logs to:
- Default: `~/rhvs-cron.log`
- Custom: Set `LOG_FILE` environment variable

### Log Format

```
[2024-01-15 03:00:00] Starting permission history cleanup cron job (2 months retention)...
[2024-01-15 03:00:01] Permission history cleanup completed successfully: {"success":true,"deleted":{"history":45,"assignments":12,"legacy":3,"total":60},"retentionPeriod":"2 months","cutoffDate":"2023-11-15"}
```

### API Response

```json
{
  "success": true,
  "message": "Cleanup completed: 60 records deleted (History: 45, Assignments: 12, Legacy: 3)",
  "deleted": {
    "history": 45,
    "assignments": 12,
    "legacy": 3,
    "total": 60
  },
  "retentionPeriod": "2 months",
  "cutoffDate": "2023-11-15"
}
```

## Important Notes

1. **Irreversible**: Deleted records cannot be recovered
2. **Active Permissions**: Active permissions are never deleted, only history
3. **Cascade Deletes**: If a district admin is deleted, their permission history is automatically deleted (CASCADE)
4. **Time Zone**: Cron jobs run in server timezone (UTC for Vercel)

## Troubleshooting

### Cleanup not running?

1. Check cron logs: `tail -f ~/rhvs-cron.log`
2. Verify cron is enabled: `crontab -l`
3. Check API endpoint manually: `curl https://your-domain.com/api/cron/cleanup-permission-history`
4. Verify `CRON_SECRET` matches if using authentication

### Too many records deleted?

- Check the cutoff date in the response
- Verify retention period is correct
- Review logs to see what was deleted

### Not enough cleanup?

- Verify the cron job is running
- Check database for old records manually
- Ensure the API endpoint is accessible

