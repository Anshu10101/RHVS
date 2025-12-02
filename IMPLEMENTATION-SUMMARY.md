# Post Validity & Auto-Expiry Implementation Summary

## ✅ What Was Implemented

### 1. Database Schema Changes
- ✅ Added `valid_from` and `valid_until` columns to `department_members` table
- ✅ Added `id_card_path` column to `certificates` table
- ✅ Created indexes for efficient queries

**Files:**
- `database/add-post-validity-columns.sql`
- `database/add-id-card-path-to-certificates.sql`

### 2. API Updates

**Assignment Endpoint** (`POST /api/departments/[id]/members`):
- ✅ Accepts optional `valid_until` date parameter
- ✅ Defaults to 1 year from assignment date if not provided
- ✅ Stores validity dates in database
- ✅ Stores ID card path in certificates table

**List Members Endpoint** (`GET /api/departments/[id]/members`):
- ✅ Automatically filters out expired assignments
- ✅ Returns `valid_from` and `valid_until` dates in response

**Files Modified:**
- `src/app/api/departments/[id]/members/route.ts`

### 3. Daily Cleanup Cron Job
- ✅ Created API endpoint: `/api/cron/cleanup-expired-posts`
- ✅ Finds expired assignments (valid_until < today)
- ✅ Deletes related certificates
- ✅ Deletes ID card files
- ✅ Deletes certificate files
- ✅ Deletes department_members records

**Files:**
- `src/app/api/cron/cleanup-expired-posts/route.ts`

### 4. Cron Configuration
- ✅ Vercel cron config (`vercel.json`) - runs daily at 2 AM UTC
- ✅ Server cron script (`scripts/cleanup-expired-posts.sh`)
- ✅ Setup guide (`database/POST-VALIDITY-SETUP.md`)

## 📋 Next Steps (Admin UI - Optional Enhancement)

The backend is fully functional. For better UX, you can optionally update the admin UI to:

1. **Show validity dates** when listing department members
2. **Display expiry countdown** (e.g., "Expires in 45 days")
3. **Add date picker** for custom validity override when assigning members
4. **Highlight expiring posts** (e.g., red badge if expiring within 30 days)

## 🚀 How to Deploy

1. **Run database migrations:**
   ```bash
   mysql -u your_user -p your_database < database/add-post-validity-columns.sql
   mysql -u your_user -p your_database < database/add-id-card-path-to-certificates.sql
   ```

2. **Set environment variable (optional but recommended):**
   ```bash
   CRON_SECRET=your-secret-key-here
   ```

3. **Deploy to Vercel** (cron will auto-configure) OR setup server cron using `scripts/cleanup-expired-posts.sh`

4. **Test manually:**
   ```bash
   curl -X GET "https://your-domain.com/api/cron/cleanup-expired-posts" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

## 📝 API Usage Examples

### Assign Member (Default 1 Year)
```json
POST /api/departments/1/members
{
  "post_id": 1,
  "member_id": 123,
  "level": "national"
}
```

### Assign Member (Custom 2 Years)
```json
POST /api/departments/1/members
{
  "post_id": 1,
  "member_id": 123,
  "level": "state",
  "state": "Uttar Pradesh",
  "valid_until": "2026-12-31"
}
```

## 🔒 Security Notes

- Cron endpoint can be protected with `CRON_SECRET` environment variable
- Only expired assignments (valid_until < today) are deleted
- File deletions are safe (checks for path traversal)
- Errors are logged but don't stop the cleanup process

## 📊 Complexity Assessment

- **Database**: ⭐ Easy (2 columns + indexes)
- **API Logic**: ⭐ Easy (default calculation, optional override)
- **Cron Job**: ⭐⭐ Medium (cleanup logic + file deletion)
- **Overall**: ⭐⭐ **Easy to Medium** - Very manageable implementation

The system is production-ready once database migrations are run and cron is configured.

