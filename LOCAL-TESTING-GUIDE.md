# Local Testing Guide - Queue System

## 🎯 Quick Start (Local Machine)

Test the queue system on your local machine before deploying to production.

## 📋 Prerequisites

1. ✅ Node.js installed
2. ✅ Redis installed and running (see below)
3. ✅ Dependencies installed (`npm install`)

## 🚀 Step-by-Step Local Setup

### Step 1: Install Redis (if not already installed)

**Windows:**
```bash
# Option A: Using Docker (easiest)
docker run -d -p 6379:6379 --name redis redis:alpine

# Option B: Download from https://github.com/microsoftarchive/redis/releases
# Then run: redis-server.exe
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

### Step 2: Verify Redis is Running

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG
```

If you get "command not found" on Windows:
```bash
# If using Docker, test with:
docker exec redis redis-cli ping
```

### Step 3: Setup Environment Variables

Create/edit `.env.local` in your project root:

```env
# Redis Configuration (add these to your existing .env.local)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Your other env variables here...
DB_HOST=localhost
DB_USER=root
# etc.
```

### Step 4: Install Dependencies

```bash
npm install
```

This should install: `bull`, `ioredis`, `tsx` (already in package.json)

### Step 5: Start Worker (Terminal 1)

Open a new terminal window/tab:

```bash
# Navigate to project directory
cd C:\Users\ANSHUL\Desktop\RHVS\rhvs

# Start worker
npm run worker
```

You should see:
```
✅ Member verification worker started
📊 Processing jobs from queue...
Press Ctrl+C to stop
```

**Keep this terminal open!** This is your worker process.

### Step 6: Start Main App (Terminal 2)

Open another terminal window/tab:

```bash
# Navigate to project directory
cd C:\Users\ANSHUL\Desktop\RHVS\rhvs

# Start Next.js app
npm run dev
```

App should start at `http://localhost:3000`

## 🧪 Testing with Mock Data

### Step 7: Generate Mock Tokens

**Option A: Using Browser Console (Easiest)**

1. Go to `http://localhost:3000/admin`
2. Login as admin
3. Open browser console (F12)
4. Run this:

```javascript
fetch('/api/admin/test/generate-mock-tokens', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  },
  body: JSON.stringify({ count: 100 })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Generated:', data.inserted, 'mock tokens');
  console.log('📊 Total pending:', data.totalPending);
  alert(`Generated ${data.inserted} tokens! Check Token Verification page.`);
});
```

**Option B: Using Script**

```bash
# In a new terminal
npm run test:generate-tokens 100
```

### Step 8: View Mock Tokens

1. Go to Admin Panel → Token Verification
2. You should see tokens like:
   - `test.member1@rhvs-test.com`
   - `test.member2@rhvs-test.com`
   - etc.

### Step 9: Test Bulk Verification

**Option A: Use Bulk Verify Endpoint**

In browser console:

```javascript
// First, get token IDs (check admin panel or use this to get all pending)
fetch('/api/admin/verify-token?status=pending', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  }
})
.then(r => r.json())
.then(data => {
  // Get IDs of test tokens (first 100)
  const testTokenIds = data.tokens
    .filter(t => t.email.includes('test.member'))
    .slice(0, 100)
    .map(t => t.id);
  
  console.log('Found', testTokenIds.length, 'test tokens');
  
  // Bulk verify
  return fetch('/api/admin/verify-token/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
    },
    body: JSON.stringify({ tokenIds: testTokenIds })
  });
})
.then(r => r.json())
.then(data => {
  console.log('✅ Bulk verify result:', data);
  alert(`Queued ${data.queued} members for processing!`);
});
```

**Option B: Rapid Click Test**

1. In Token Verification page, click "Verify" on multiple tokens rapidly
2. Each click queues a job immediately
3. Worker processes them in parallel

### Step 10: Monitor Worker Processing

Watch Terminal 1 (where worker is running):

You should see logs like:
```
[Worker] Processing verification for member 123 (RHVS000001)
[Worker] Generating certificate for RHVS000001
[Worker] ✅ Certificate generated: CERT-...
[Worker] Generating ID card for RHVS000001
[Worker] ✅ ID card generated: /id-cards/...
[Worker] Sending email to test.member1@rhvs-test.com
[Worker] ✅ Email sent to test.member1@rhvs-test.com
[Worker] Job 1 completed: { success: true, ... }
```

Watch for:
- Multiple jobs processing simultaneously (should see 10 at a time)
- Jobs completing quickly
- No errors

### Step 11: Check Results

**Check Queue Status:**

```bash
# In a new terminal
redis-cli

# Then in Redis CLI:
KEYS bull:*
LLEN bull:member-verification:waiting
LLEN bull:member-verification:active
LLEN bull:member-verification:completed

# Exit
exit
```

**Check Generated Files:**

```bash
# Check if PDFs were generated
ls public/certificates/ | head -20

# Check if ID cards were generated
ls public/id-cards/ | head -20
```

**Check Database:**

Check `members` table - should have new test members.

## ⏱️ Expected Performance

**100 Mock Tokens:**
- **API Response**: < 1 second (returns immediately)
- **Processing Time**: 2-3 minutes (worker processes 10 at a time)
- **Total**: Much faster than sequential (which would be ~20 minutes)

## 🧹 Cleanup After Testing

### Cleanup Test Tokens

```bash
npm run test:cleanup-tokens
```

This deletes all test tokens (emails like `test.member*@rhvs-test.com`).

### Stop Worker and App

- **Terminal 1 (Worker)**: Press `Ctrl+C`
- **Terminal 2 (App)**: Press `Ctrl+C`

### Stop Redis (if using Docker)

```bash
docker stop redis
```

## 🐛 Troubleshooting

### Worker Not Processing?

1. **Check Redis:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Check Worker Logs:**
   - Look at Terminal 1 for errors
   - Should show: `[Worker] Member verification worker started`

3. **Restart Worker:**
   - Stop (Ctrl+C)
   - Start again: `npm run worker`

### Redis Connection Error?

```bash
# Check if Redis is running
# Windows (Docker):
docker ps | grep redis

# macOS/Linux:
redis-cli ping
```

### Jobs Stuck?

```bash
redis-cli
> LLEN bull:member-verification:waiting
> LLEN bull:member-verification:active
> KEYS bull:*
```

### Clear Queue (Start Fresh)

```bash
redis-cli
> DEL bull:member-verification:waiting
> DEL bull:member-verification:active
> DEL bull:member-verification:completed
> DEL bull:member-verification:failed
```

## ✅ Success Checklist

- [ ] Redis running (`redis-cli ping` returns PONG)
- [ ] Worker started (Terminal 1 shows worker started message)
- [ ] Main app running (Terminal 2, http://localhost:3000 works)
- [ ] Mock tokens generated (100+ tokens in admin panel)
- [ ] Bulk verify executed (API returns success immediately)
- [ ] Worker processing (Terminal 1 shows job logs)
- [ ] Jobs completing (see completion messages)
- [ ] Performance: 100 tokens processed in < 5 minutes

## 🎯 Quick Test Workflow

```bash
# Terminal 1: Start Worker
npm run worker

# Terminal 2: Start App
npm run dev

# Terminal 3: Generate Test Data
npm run test:generate-tokens 100

# Then:
# 1. Go to http://localhost:3000/admin
# 2. Token Verification page
# 3. Bulk verify tokens (use browser console script above)
# 4. Watch Terminal 1 for processing logs
# 5. Verify performance (should be fast!)

# Cleanup:
npm run test:cleanup-tokens
```

## 📝 Notes

- **Test Emails**: Emails like `test.member1@rhvs-test.com` won't receive real emails (they're fake)
- **Test Members**: A test member (RHVS000001) will be created automatically if none exists
- **Worker Must Run**: Keep Terminal 1 (worker) running while testing
- **No PM2 Needed**: For local testing, just run `npm run worker` directly

