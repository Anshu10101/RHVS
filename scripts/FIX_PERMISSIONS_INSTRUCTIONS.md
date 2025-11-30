# Step-by-Step: Fix Cache Permissions on Ubuntu VPS

## Prerequisites
- SSH access to your VPS
- Sudo privileges
- Your app is already deployed

## Quick Fix (5 minutes)

### Step 1: SSH into your VPS
```bash
ssh myuser@your-vps-ip
```

### Step 2: Navigate to your app directory
```bash
cd /home/myuser/RHVS
```

**Note:** Replace `/home/myuser/RHVS` with your actual app path if different.

### Step 3: Make the script executable
```bash
chmod +x scripts/fix-cache-permissions-ubuntu.sh
```

### Step 4: Run the fix script
```bash
sudo ./scripts/fix-cache-permissions-ubuntu.sh
```

The script will:
- ✅ Stop your app
- ✅ Remove old cache
- ✅ Create new cache with proper permissions
- ✅ Show you what user it detected

### Step 5: Restart your app
```bash
pm2 restart rhvs-app
```

### Step 6: Check if it worked
```bash
pm2 logs rhvs-app --lines 50
```

Look for any permission errors. If you see none, you're good! 🎉

## Troubleshooting

### If the script can't find your app directory:

Edit the script first:
```bash
nano scripts/fix-cache-permissions-ubuntu.sh
```

Change line 11 to your actual path:
```bash
APP_DIR="/your/actual/path"
```

### If you still see permission errors:

**Option A: Check PM2 user**
```bash
pm2 info rhvs-app
```

Make sure it's running as your user, not root.

**Option B: Manual fix**
```bash
# Stop app
pm2 stop rhvs-app

# Remove cache
sudo rm -rf /home/myuser/RHVS/.next/cache

# Create cache
sudo mkdir -p /home/myuser/RHVS/.next/cache/images
sudo mkdir -p /home/myuser/RHVS/.next/cache/webpack

# Fix ownership (replace 'myuser' with your username)
sudo chown -R myuser:myuser /home/myuser/RHVS/.next/cache

# Fix permissions
sudo chmod -R 755 /home/myuser/RHVS/.next/cache

# Restart app
pm2 restart rhvs-app
```

### If PM2 is running as root:

Set it up to run as your user:
```bash
# Stop PM2
pm2 kill

# Start PM2 as your user (not sudo)
pm2 start npm --name "rhvs-app" -- start

# Save PM2 config
pm2 save

# Set up PM2 to start on boot as your user
pm2 startup systemd -u myuser --hp /home/myuser
```

Then run the permissions fix again.

## Verification

After fixing, test your website:
1. Visit your site
2. Navigate to pages with images (gallery, products, etc.)
3. Check PM2 logs: `pm2 logs rhvs-app`
4. No permission errors = Success! ✅

## What Changed?

- ✅ Image optimization remains **enabled** (better performance)
- ✅ Cache directory has proper **write permissions**
- ✅ Your app can now **cache optimized images**
- ✅ No more "Operation not permitted" errors

## Need Help?

If you still have issues:
1. Check your actual username: `whoami`
2. Check your app path: `pwd`
3. Check PM2 user: `pm2 info rhvs-app`
4. Share these details for troubleshooting

