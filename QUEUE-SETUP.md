# Queue-Based PDF Generation Setup

## 🚀 What This Does

**Before:** Verifying 100 members = 8-20 minutes (blocking, sequential)
- Each member: PDF (5s) + ID card (5s) + Email (2s) = 12s
- 100 members × 12s = 1200s = **20 minutes**

**After:** Verifying 100 members = **~2-3 minutes** (async, parallel)
- Admin verifies all → Returns immediately
- Background workers process in parallel (10-20 at a time)
- Total time: **2-3 minutes** (10x faster!)

## 📦 Installation

### Step 1: Install Dependencies (Development)

```bash
npm install bull ioredis tsx
```

### Step 2: Install Redis

#### For Ubuntu Server (Hostinger/Production)

**Option A: Install Redis on Same Server (Recommended for most cases)**

```bash
# 1. Update package list
sudo apt update

# 2. Install Redis
sudo apt install redis-server -y

# 3. Start Redis service
sudo systemctl start redis-server

# 4. Enable Redis to start on boot
sudo systemctl enable redis-server

# 5. Check if Redis is running
sudo systemctl status redis-server
# Should show: "Active: active (running)"

# 6. Test Redis connection
redis-cli ping
# Should return: PONG
```

**Option B: Use Redis Cloud/Upstash (Recommended for high traffic)**

1. Sign up at [Upstash](https://upstash.com/) (free tier available) or [Redis Cloud](https://redis.com/cloud/)
2. Create a Redis database
3. Copy the connection URL
4. Use connection URL in environment variables (see Step 3)

### Step 3: Environment Variables

Add to your `.env.local` (development) or `.env.production` (production):

**For Local Redis:**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty if no password set
```

**For Redis Cloud/Upstash:**
```env
REDIS_HOST=your-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
# Or use full URL:
REDIS_URL=redis://default:password@host:port
```

**For Hostinger/Ubuntu Server with local Redis:**
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

## 🏃 Running

### Development (Local Machine)

#### 1. Start Redis
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running, start it:
# macOS: brew services start redis
# Ubuntu: sudo systemctl start redis-server
# Windows: docker run -d -p 6379:6379 redis:alpine
```

#### 2. Start Worker (in separate terminal)
```bash
npm run worker
```

#### 3. Start Main App
```bash
npm run dev
```

### Production (Ubuntu Server - Hostinger)

#### Step 1: Install PM2 (Process Manager)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

#### Step 2: Build Your Application
```bash
# In your project directory
npm run build
```

#### Step 3: Setup Environment Variables
```bash
# Create or edit .env.production
nano .env.production

# Add Redis configuration:
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
# Add your other environment variables here
```

#### Step 4: Start Redis (if using local Redis)
```bash
# Start Redis service
sudo systemctl start redis-server

# Enable auto-start on boot
sudo systemctl enable redis-server

# Verify it's running
sudo systemctl status redis-server
```

#### Step 5: Start Worker with PM2
```bash
# Navigate to your project directory
cd /path/to/your/project

# Start worker as PM2 process
pm2 start npm --name "rhvs-worker" -- run worker

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it outputs (usually involves sudo)
```

#### Step 6: Start Main App with PM2
```bash
# Start Next.js app
pm2 start npm --name "rhvs-app" -- start

# Save configuration
pm2 save
```

#### Step 7: Monitor PM2 Processes
```bash
# View all processes
pm2 list

# View logs
pm2 logs rhvs-worker    # Worker logs
pm2 logs rhvs-app       # App logs
pm2 logs                # All logs

# Monitor resources
pm2 monit

# Restart processes
pm2 restart rhvs-worker
pm2 restart rhvs-app

# Stop processes
pm2 stop rhvs-worker
pm2 stop rhvs-app
```

#### Step 8: Verify Everything is Working
```bash
# 1. Check Redis is running
redis-cli ping
# Should return: PONG

# 2. Check PM2 processes
pm2 list
# Should show both rhvs-worker and rhvs-app as "online"

# 3. Check worker logs
pm2 logs rhvs-worker --lines 50
# Should show: "[Worker] Member verification worker started"

# 4. Test by verifying a member through your app
# Then check logs again to see job processing
```

## 📡 API Usage

### Bulk Verify Members

**Endpoint:** `POST /api/admin/verify-token/bulk`

**Request:**
```json
{
  "tokenIds": [1, 2, 3, 4, 5, ...]  // Max 500 at a time
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully verified 100 member(s). PDF generation and emails are being processed in the background.",
  "verified": 100,
  "queued": 100,
  "queueStatus": {
    "waiting": 100,
    "active": 0
  }
}
```

### Check Queue Status

**Endpoint:** `GET /api/admin/queue/status` (create this if needed)

## 🎯 How It Works

1. **Admin clicks "Verify All"** → Calls bulk endpoint
2. **API verifies members** → Updates database immediately
3. **Jobs queued** → PDF generation + emails added to queue
4. **API returns** → Admin sees success immediately
5. **Worker processes** → Generates PDFs/emails in background (parallel)
6. **Members receive emails** → Within 2-3 minutes

## ⚙️ Configuration

### Concurrency (how many jobs run at once)

Edit `src/lib/queue.ts`:
```typescript
memberVerificationQueue.process('process-verification', 10, async (job) => {
  // 10 = process 10 members simultaneously
  // Increase for faster processing (but more CPU/memory)
  // Decrease if server is slow
});
```

### Retry Logic

Already configured:
- 3 attempts per job
- Exponential backoff (2s, 4s, 8s)
- Failed jobs kept for 24 hours

## 🐛 Troubleshooting

### Development

**Worker not processing jobs?**
1. Check Redis is running: `redis-cli ping` (should return PONG)
2. Check worker is running: `npm run worker` (should show worker started message)
3. Check logs for errors in terminal

**Jobs stuck?**
```bash
# Connect to Redis
redis-cli

# Check queue keys
KEYS bull:*

# Check waiting jobs count
LLEN bull:member-verification:waiting

# Check active jobs count
LLEN bull:member-verification:active

# Exit Redis
exit
```

### Production (Ubuntu/Hostinger)

**Worker not processing jobs?**
```bash
# 1. Check if worker process is running
pm2 list
# Should show rhvs-worker as "online"

# 2. Check worker logs
pm2 logs rhvs-worker --lines 50

# 3. Check Redis connection
redis-cli ping
# Should return: PONG

# 4. Check Redis service status
sudo systemctl status redis-server

# 5. Restart worker if needed
pm2 restart rhvs-worker
```

**Jobs stuck in queue?**
```bash
# Connect to Redis CLI
redis-cli

# Check queue status
KEYS bull:*
LLEN bull:member-verification:waiting
LLEN bull:member-verification:active
LLEN bull:member-verification:completed
LLEN bull:member-verification:failed

# View failed jobs
LRANGE bull:member-verification:failed 0 -1

# Exit
exit
```

**Clear failed jobs (if needed)**
```bash
# Connect to Redis
redis-cli

# Delete failed jobs queue
DEL bull:member-verification:failed

# Or clear all queue data (use carefully!)
KEYS bull:member-verification:*
# Then delete keys you want to clear
```

**Redis connection errors?**
```bash
# 1. Verify Redis is running
sudo systemctl status redis-server

# 2. Check Redis is listening
sudo netstat -tlnp | grep 6379

# 3. Check Redis logs
sudo journalctl -u redis-server -n 50

# 4. Test connection manually
redis-cli ping
```

**PM2 worker keeps crashing?**
```bash
# View detailed logs
pm2 logs rhvs-worker --err --lines 100

# Check for errors in logs
pm2 logs rhvs-worker | grep -i error

# Restart with more memory (if needed)
pm2 restart rhvs-worker --max-memory-restart 500M
```

## 📊 Performance

- **Sequential (old):** 100 members = 20 minutes
- **Queue (new):** 100 members = 2-3 minutes
- **Speedup:** ~10x faster

## 🔄 Migration from Old System

The old single-verify endpoint still works. You can:
1. Use bulk endpoint for multiple verifications
2. Keep single endpoint for one-off verifications
3. Both use the same queue system

## 🚀 Production Deployment (Hostinger Ubuntu Server)

### Complete Setup Checklist

- [ ] Redis installed and running
- [ ] Environment variables configured
- [ ] Application built (`npm run build`)
- [ ] PM2 installed globally
- [ ] Worker started with PM2
- [ ] Main app started with PM2
- [ ] PM2 auto-start configured (`pm2 startup`)
- [ ] Processes saved (`pm2 save`)
- [ ] Redis auto-start enabled (`sudo systemctl enable redis-server`)
- [ ] Firewall allows necessary ports (if applicable)

### Quick Commands Reference

```bash
# Start everything
sudo systemctl start redis-server
pm2 start all

# Stop everything
pm2 stop all
sudo systemctl stop redis-server

# Restart everything
pm2 restart all
sudo systemctl restart redis-server

# View status
pm2 status
sudo systemctl status redis-server

# View logs
pm2 logs rhvs-worker
pm2 logs rhvs-app

# Check Redis
redis-cli ping
```

### Troubleshooting Production Issues

**Worker not processing jobs?**
```bash
# 1. Check if worker is running
pm2 list

# 2. Check worker logs
pm2 logs rhvs-worker --lines 100

# 3. Check Redis connection
redis-cli ping

# 4. Restart worker
pm2 restart rhvs-worker
```

**Redis connection refused?**
```bash
# Check Redis is running
sudo systemctl status redis-server

# Start Redis if stopped
sudo systemctl start redis-server

# Check Redis is listening on correct port
sudo netstat -tlnp | grep 6379
```

**PM2 processes not starting on reboot?**
```bash
# Re-run PM2 startup command
pm2 startup

# Make sure you ran the sudo command it outputted
# Then save processes
pm2 save
```

### Alternative: Using Redis Cloud/Upstash (Easier)

If you prefer managed Redis (no server setup needed):

1. **Sign up** at [Upstash](https://upstash.com/) (free tier available)
2. **Create Redis database**
3. **Copy connection details** (host, port, password)
4. **Update `.env.production`:**
```env
REDIS_HOST=your-redis.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```
5. **Skip Redis installation steps** on server
6. **Everything else remains the same**

## 💡 Next Steps

1. Add queue dashboard (Bull Board) for monitoring
2. Add email notifications when bulk job completes
3. Add progress tracking for admin UI

