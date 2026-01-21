# Quick Start Guide - Email Queue System

## 🚀 Get Started in 3 Steps

### Step 1: Run Database Migration (2 minutes)
```bash
# Navigate to your project directory
cd c:\Users\ANSHUL\Desktop\RHVS\rhvs

# Run the SQL migration
# Option A: Command line
mysql -u root -p rhvs < database\email-queue-system.sql

# Option B: phpMyAdmin or MySQL Workbench
# - Open database/email-queue-system.sql
# - Copy and paste into SQL editor
# - Execute
```

**What this does:**
- Creates `email_queue` table
- Adds `email_queue_id` column to `certificates` table
- Creates helper views for monitoring

### Step 2: Verify Environment Variables (1 minute)
Check your `.env.local` file has these:
```env
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=admin@rashtriyahinduvahinisangathan.in
EMAIL_PASS=RhvsAdmin#992640
EMAIL_FROM=admin@rashtriyahinduvahinisangathan.in
```

✅ All good - these are already set correctly!

### Step 3: Set Up Auto-Processing (3 minutes)

#### For Windows (Development):
Create a scheduled task to run every 5 minutes:

1. Open Task Scheduler
2. Create Basic Task → Name: "RHVS Email Queue"
3. Trigger: Every 5 minutes
4. Action: Start a program
5. Program: `curl`
6. Arguments: `-X POST http://localhost:3000/api/email-queue/process`

#### For Production (Linux):
```bash
# Edit crontab
crontab -e

# Add this line:
*/5 * * * * curl -X POST https://yourdomain.com/api/email-queue/process
```

#### Quick Test (Manual Processing):
```bash
# Just run this command manually for now
curl -X POST http://localhost:3000/api/email-queue/process
```

---

## ✅ That's It!

### Now What?

1. **Test It:**
   - Go to Admin → Departments → Assign a member to a post
   - Email will be sent automatically
   - If it fails, it goes to the queue

2. **Monitor It:**
   - Visit: http://localhost:3000/admin/email-queue
   - See statistics, failed emails, pending retries

3. **Process Queue Manually (for testing):**
   - In admin panel, click "Process Queue Now"
   - Or run: `curl -X POST http://localhost:3000/api/email-queue/process`

### How to Know It's Working?

✅ **Success indicators:**
- Members receive appointment/removal emails
- Failed emails appear in queue dashboard
- Emails are automatically retried
- Success rate > 95% in statistics

❌ **If emails aren't sending:**
1. Check email settings in `.env.local`
2. Test SMTP connection
3. Check server logs for errors
4. Visit `/admin/email-queue` to see queue status

---

## 🎯 Quick Reference

### Important URLs
- **Admin Dashboard**: http://localhost:3000/admin
- **Email Queue Monitor**: http://localhost:3000/admin/email-queue
- **Process Queue API**: POST http://localhost:3000/api/email-queue/process

### Email Retry Schedule
- Attempt 1: Immediate
- Attempt 2: 5 minutes later
- Attempt 3: 15 minutes later (+20 min total)
- Attempt 4: 1 hour later (+1h 20min total)
- Attempt 5: 4 hours later (+5h 20min total)
- Attempt 6: 12 hours later (+17h 20min total)
- After attempt 6: Marked as failed (manual intervention needed)

### Common Commands
```bash
# Process queue manually
curl -X POST http://localhost:3000/api/email-queue/process

# Check queue status
curl http://localhost:3000/api/email-queue/status?view=stats

# See failed emails
curl http://localhost:3000/api/email-queue/status?view=failed

# See pending retries
curl http://localhost:3000/api/email-queue/status?view=pending
```

---

## 📞 Need Help?

1. Check `EMAIL_QUEUE_SETUP.md` for detailed setup
2. Check `EMAIL_QUEUE_IMPLEMENTATION.md` for technical details
3. Check server console logs for errors
4. Visit admin panel to see queue status

---

**⏱️ Total Setup Time: ~5 minutes**  
**🎉 Result: Bulletproof email delivery with automatic retry!**
