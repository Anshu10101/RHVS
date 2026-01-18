# Testing Queue System with Mock Data

## 🎯 Overview

This guide shows you how to test the queue-based PDF generation system using mock data without affecting real members.

## 📋 Prerequisites

1. ✅ Redis running
2. ✅ Worker running (`npm run worker` or via PM2)
3. ✅ Main app running
4. ✅ Admin access (superadmin)

## 🧪 Method 1: Using API Endpoint (Easiest)

### Step 1: Generate Mock Tokens

Use the test endpoint to generate mock tokens:

```bash
# Generate 150 mock tokens
curl -X POST http://localhost:3000/api/admin/test/generate-mock-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"count": 150}'
```

Or use your browser's developer console:

```javascript
fetch('/api/admin/test/generate-mock-tokens', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  },
  body: JSON.stringify({ count: 150 })
})
.then(r => r.json())
.then(console.log);
```

### Step 2: View Tokens in Admin Panel

1. Go to Admin Panel → Token Verification
2. You should see all the mock tokens (emails like `test.member1@rhvs-test.com`, `test.member2@rhvs-test.com`, etc.)
3. Filter by status "pending" to see only unverified tokens

### Step 3: Test Bulk Verification

**Option A: Use Bulk Verify Endpoint**

Get token IDs from the admin panel, then:

```javascript
// Get token IDs (you can get these from admin panel)
const tokenIds = [1, 2, 3, 4, 5, /* ... up to 500 */];

fetch('/api/admin/verify-token/bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  },
  body: JSON.stringify({ tokenIds })
})
.then(r => r.json())
.then(console.log);
```

**Option B: Verify Rapidly in UI**

1. In admin panel, click verify on multiple tokens rapidly
2. All jobs will be queued
3. Worker processes them in parallel

### Step 4: Monitor Queue Processing

```bash
# Watch worker logs
pm2 logs rhvs-worker --lines 100

# Or if running locally
# Worker logs will show in terminal
```

You should see:
```
[Worker] Processing verification for member X (RHVS000001)
[Worker] Generating certificate for RHVS000001
[Worker] ✅ Certificate generated: CERT-...
[Worker] Generating ID card for RHVS000001
[Worker] ✅ ID card generated: /id-cards/...
[Worker] Sending email to test.member1@rhvs-test.com
[Worker] ✅ Email sent to test.member1@rhvs-test.com
```

### Step 5: Check Results

```bash
# Check queue status (if you create the endpoint)
# Or check Redis directly
redis-cli
> LLEN bull:member-verification:waiting
> LLEN bull:member-verification:active
> LLEN bull:member-verification:completed
```

## 🧪 Method 2: Using Script (Command Line)

### Step 1: Generate Mock Tokens

```bash
# Generate 150 mock tokens
npm run test:generate-tokens 150

# Or use tsx directly
npx tsx scripts/generate-mock-tokens.ts 150
```

### Step 2-5: Same as Method 1

Follow steps 2-5 from Method 1 above.

## 🧹 Cleanup After Testing

### Cleanup Test Tokens

```bash
npm run test:cleanup-tokens

# Or use tsx directly
npx tsx scripts/cleanup-test-tokens.ts
```

This will delete all test tokens (emails like `test.member*@rhvs-test.com`).

**Note:** Test members are NOT deleted by default (uncomment in script if needed).

## 📊 Expected Results

### Performance Test (150 tokens)

**Before Queue System:**
- Time: ~30 minutes (150 × 12 seconds per member)
- Blocking: Yes (admin waits)

**With Queue System:**
- Time: ~3-5 minutes (parallel processing)
- Blocking: No (admin gets immediate response)
- Worker processes 10 at a time

### What to Check

1. ✅ **API Response Time**: Should be < 1 second even for 100+ tokens
2. ✅ **Worker Logs**: Should show parallel processing (10 jobs at once)
3. ✅ **Email Delivery**: Check if test emails are sent (if email service configured)
4. ✅ **PDF Generation**: Check `public/certificates/` folder for generated PDFs
5. ✅ **Database**: Check `members` table for new members
6. ✅ **Queue Status**: Should show jobs processing and completing

## 🔍 Debugging

### Worker Not Processing?

```bash
# Check if worker is running
pm2 list

# Check worker logs
pm2 logs rhvs-worker

# Check Redis connection
redis-cli ping
```

### Jobs Stuck?

```bash
redis-cli
> LLEN bull:member-verification:waiting
> LLEN bull:member-verification:active
> KEYS bull:member-verification:*
```

### Clear Queue (if needed)

```bash
redis-cli
> DEL bull:member-verification:waiting
> DEL bull:member-verification:active
> DEL bull:member-verification:completed
> DEL bull:member-verification:failed
```

## ⚠️ Important Notes

1. **Test Emails**: Mock tokens use emails like `test.member1@rhvs-test.com` - these won't receive real emails unless you configure email service
2. **Test Members**: A test member with reg number `RHVS000001` will be created if none exists
3. **Cleanup**: Always cleanup test data after testing
4. **Production**: DO NOT run test scripts in production!

## 🎯 Quick Test Workflow

```bash
# 1. Generate 100 test tokens
npm run test:generate-tokens 100

# 2. Verify them via admin panel (bulk or rapid clicks)

# 3. Watch worker process them
pm2 logs rhvs-worker

# 4. Check results (should complete in ~2-3 minutes)

# 5. Cleanup
npm run test:cleanup-tokens
```

## ✅ Success Criteria

- ✅ 100 tokens verified in < 5 minutes
- ✅ Worker processes 10 jobs simultaneously
- ✅ No blocking on admin interface
- ✅ All certificates generated
- ✅ All emails queued (even if not sent to test emails)
- ✅ Queue shows jobs completing

