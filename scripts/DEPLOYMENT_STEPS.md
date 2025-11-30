# Complete Deployment Steps - Fix Cache Permissions

## Step 1: Push Updated Code to VPS

### On your local machine:

```bash
# 1. Make sure all changes are committed
git add .
git commit -m "Fix cache permissions and enable image optimization"

# 2. Push to your repository
git push origin main  # or your branch name

# 3. OR if you deploy directly to VPS, use your deployment method
```

### On your VPS (after code is pushed):

```bash
# Navigate to app directory
cd /home/myuser/RHVS

# Pull latest code
git pull origin main  # or your branch name

# OR if you use a different deployment method, do that first
```

## Step 2: Verify Files Are Present

Check that the new files exist:

```bash
cd /home/myuser/RHVS

# Check if scripts exist
ls -la scripts/fix-cache-permissions-ubuntu.sh
ls -la scripts/quick-fix-permissions.sh

# Check next.config.ts has optimization enabled
grep "unoptimized" next.config.ts
# Should show: unoptimized: false,
```

## Step 3: Run the Permission Fix Script

### Option A: Using the detailed script

```bash
cd /home/myuser/RHVS

# Make executable
chmod +x scripts/fix-cache-permissions-ubuntu.sh

# Run with sudo
sudo ./scripts/fix-cache-permissions-ubuntu.sh

# Restart app
pm2 restart rhvs-app
```

### Option B: Quick one-liner

```bash
cd /home/myuser/RHVS && chmod +x scripts/quick-fix-permissions.sh && sudo ./scripts/quick-fix-permissions.sh
```

## Step 4: Verify It Worked

```bash
# Check logs for any errors
pm2 logs rhvs-app --lines 50

# Check cache directory permissions
ls -la /home/myuser/RHVS/.next/cache/

# Test your website - images should load without errors
```

## Complete Command Sequence (Copy-Paste Ready)

If you want to do everything at once on VPS:

```bash
# Navigate to app
cd /home/myuser/RHVS

# Pull latest code (if using git)
git pull origin main

# Verify files exist
ls scripts/fix-cache-permissions-ubuntu.sh

# Run the fix
chmod +x scripts/fix-cache-permissions-ubuntu.sh
sudo ./scripts/fix-cache-permissions-ubuntu.sh

# Restart app
pm2 restart rhvs-app

# Check logs
pm2 logs rhvs-app --lines 50
```

## What Each Step Does

1. **Push/Pull Code**: Gets the new scripts and config onto VPS
2. **Run Script**: Fixes cache directory permissions
3. **Restart App**: Applies changes
4. **Verify**: Confirms no errors

## Important Notes

- ✅ **Yes, push code FIRST** - The scripts need to be on the VPS
- ✅ **Then run scripts** - After code is deployed
- ✅ Script will stop/restart your app automatically
- ✅ Takes ~1-2 minutes total

## If You Don't Use Git

If you deploy differently (FTP, rsync, etc.):

1. Upload all files to `/home/myuser/RHVS/`
2. Make sure `scripts/` folder is uploaded
3. Then run the permission fix script

