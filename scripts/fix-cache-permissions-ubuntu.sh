#!/bin/bash
# Proper fix for Next.js cache permissions on Ubuntu VPS
# This script fixes ownership and permissions correctly

echo "=========================================="
echo "Fixing Next.js Cache Permissions (Ubuntu)"
echo "=========================================="
echo ""

# Detect the app directory and user
# You can customize these if your paths are different
APP_DIR="${RHVS_APP_DIR:-/home/myuser/RHVS}"
CACHE_DIR="$APP_DIR/.next/cache"

# Get the actual user (the one running this script)
if [ -n "$SUDO_USER" ]; then
    APP_USER="$SUDO_USER"
else
    APP_USER="$USER"
fi

echo "App directory: $APP_DIR"
echo "Cache directory: $CACHE_DIR"
echo "App user: $APP_USER"
echo ""

# Check if PM2 is running the app
if command -v pm2 &> /dev/null; then
    echo "PM2 detected. Checking running processes..."
    PM2_USER=$(pm2 describe rhvs-app 2>/dev/null | grep "username" | awk '{print $2}' || echo "")
    if [ -n "$PM2_USER" ]; then
        echo "PM2 process user: $PM2_USER"
        APP_USER="$PM2_USER"
    fi
fi

echo ""
echo "Step 1: Stopping the app..."
pm2 stop rhvs-app 2>/dev/null || echo "App not running with PM2"

echo ""
echo "Step 2: Removing old cache (will be recreated)..."
sudo rm -rf "$CACHE_DIR"

echo ""
echo "Step 3: Creating cache directory structure..."
sudo mkdir -p "$CACHE_DIR/images"
sudo mkdir -p "$CACHE_DIR/webpack"

echo ""
echo "Step 4: Setting ownership to $APP_USER..."
sudo chown -R "$APP_USER:$APP_USER" "$CACHE_DIR"

echo ""
echo "Step 5: Setting proper permissions..."
sudo chmod -R 755 "$CACHE_DIR"

echo ""
echo "Step 6: Verifying permissions..."
ls -la "$CACHE_DIR" | head -5

echo ""
echo "=========================================="
echo "✓ Cache permissions fixed!"
echo "=========================================="
echo ""
echo "Now restart your app:"
echo "  pm2 restart rhvs-app"
echo ""
echo "If you still see errors, make sure PM2 is running as $APP_USER:"
echo "  pm2 startup"
echo "  pm2 save"

