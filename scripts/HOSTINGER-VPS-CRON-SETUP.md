# Hostinger VPS Cron Setup Guide

## Step-by-Step Instructions for Setting Up Daily Cleanup

### Step 1: Upload the Script to Your Server

1. **SSH into your Hostinger VPS**
   ```bash
   ssh your-username@your-server-ip
   ```

2. **Navigate to your project directory**
   ```bash
   cd /path/to/your/rhvs/project
   ```

3. **Make the script executable**
   ```bash
   chmod +x scripts/cleanup-expired-posts.sh
   ```

### Step 2: Set Environment Variables

You have two options:

#### Option A: Set in the script directly (recommended for VPS)

Edit the script and update the variables:

```bash
nano scripts/cleanup-expired-posts.sh
```

Update these lines:
```bash
API_URL="https://your-actual-domain.com/api/cron/cleanup-expired-posts"
CRON_SECRET="your-secret-key-here"  # Optional but recommended
LOG_FILE="/home/your-username/rhvs-cron.log"  # Use a path you have write access to
```

#### Option B: Set as system environment variables

Add to your `.bashrc` or `.profile`:
```bash
export NEXT_PUBLIC_APP_URL="https://your-domain.com"
export CRON_SECRET="your-secret-key-here"
export LOG_FILE="/home/your-username/rhvs-cron.log"
```

### Step 3: Test the Script Manually

Test if it works:

```bash
# If you set variables in script:
./scripts/cleanup-expired-posts.sh

# If you set environment variables:
export NEXT_PUBLIC_APP_URL="https://your-domain.com"
export CRON_SECRET="your-secret-key"
./scripts/cleanup-expired-posts.sh
```

Check the output - it should call your API endpoint and show results.

### Step 4: Set Up Cron Job

1. **Open crontab editor**
   ```bash
   crontab -e
   ```

2. **Add this line** (runs daily at 2 AM server time):
   ```
   0 2 * * * cd /path/to/your/rhvs/project && /bin/bash scripts/cleanup-expired-posts.sh >> /home/your-username/rhvs-cron.log 2>&1
   ```

   **Important:** Replace `/path/to/your/rhvs/project` with your actual project path.

   **Alternative** (if you set environment variables in script):
   ```
   0 2 * * * /path/to/your/rhvs/project/scripts/cleanup-expired-posts.sh >> /home/your-username/rhvs-cron.log 2>&1
   ```

3. **Save and exit** (in nano: `Ctrl+X`, then `Y`, then `Enter`)

### Step 5: Set CRON_SECRET in Your Next.js Environment

Add to your `.env.local` or server environment:

```bash
CRON_SECRET=your-very-secret-key-here-make-it-random
```

**Generate a secure secret:**
```bash
# On Linux/Mac:
openssl rand -hex 32

# Or just use a long random string
```

### Step 6: Verify Cron is Working

1. **Check if cron is running:**
   ```bash
   systemctl status cron
   # or
   service cron status
   ```

2. **View cron jobs:**
   ```bash
   crontab -l
   ```

3. **Test immediately** (run cron job now for testing):
   ```bash
   # Manually trigger to test
   cd /path/to/your/rhvs/project
   ./scripts/cleanup-expired-posts.sh
   ```

4. **Check logs:**
   ```bash
   tail -f /home/your-username/rhvs-cron.log
   # or wherever you set LOG_FILE
   ```

### Step 7: Alternative - Use Hostinger Control Panel Cron

If you prefer using Hostinger's control panel:

1. **Login to Hostinger Control Panel**
2. **Go to Cron Jobs section**
3. **Create new cron job:**
   - **Schedule:** `0 2 * * *` (2 AM daily)
   - **Command:** 
     ```bash
     cd /path/to/your/rhvs/project && /bin/bash scripts/cleanup-expired-posts.sh
     ```
   - **Email:** (optional) your-email@example.com

### Important Notes:

1. **Path to your project:** Make sure you use the FULL absolute path to your project
   - Find it: `pwd` (when you're in your project folder)
   - Example: `/home/username/domains/yourdomain.com/public_html/rhvs`

2. **Log file location:** Use a path you have write permissions for
   - Good: `/home/username/rhvs-cron.log`
   - Good: `/var/log/rhvs-cron.log` (if you have sudo access)
   - Bad: `/root/` (if you're not root)

3. **API URL:** Must be your actual domain, e.g., `https://rhvs.org/api/cron/cleanup-expired-posts`

4. **CRON_SECRET:** Must match the one in your `.env.local` file

### Troubleshooting:

**Script not running?**
```bash
# Check if script is executable
ls -l scripts/cleanup-expired-posts.sh

# Test manually
bash scripts/cleanup-expired-posts.sh

# Check cron logs
grep CRON /var/log/syslog
# or
journalctl -u cron
```

**Permission denied?**
```bash
chmod +x scripts/cleanup-expired-posts.sh
```

**Cannot write log file?**
```bash
# Use a directory you own
touch /home/your-username/rhvs-cron.log
chmod 644 /home/your-username/rhvs-cron.log
```

**API not responding?**
```bash
# Test the endpoint manually
curl https://your-domain.com/api/cron/cleanup-expired-posts
```

### Quick Test Command:

Run this to test everything:
```bash
cd /path/to/your/project
export NEXT_PUBLIC_APP_URL="https://your-domain.com"
export CRON_SECRET="your-secret"
./scripts/cleanup-expired-posts.sh
```

You should see output in the console and log file showing the cleanup results.

