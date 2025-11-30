#!/bin/bash
# Fix permissions for Next.js cache directory on VPS
# This script removes the existing cache and lets Next.js recreate it with proper permissions

CACHE_DIR="/home/myuser/RHVS/.next/cache"

echo "Stopping Next.js app (if running with PM2)..."
pm2 stop rhvs-app 2>/dev/null || echo "App not running with PM2 or already stopped"

echo "Removing existing cache directory..."
sudo rm -rf "$CACHE_DIR" 2>/dev/null || rm -rf "$CACHE_DIR" 2>/dev/null

echo "Creating new cache directory with proper permissions..."
mkdir -p "$CACHE_DIR"
chmod -R 755 "$CACHE_DIR"

# Get the current user
CURRENT_USER=${SUDO_USER:-$USER}
echo "Setting ownership to: $CURRENT_USER"

# Try with sudo first, fallback to current user
sudo chown -R "$CURRENT_USER:$CURRENT_USER" "$CACHE_DIR" 2>/dev/null || \
chown -R "$CURRENT_USER:$CURRENT_USER" "$CACHE_DIR" 2>/dev/null || \
echo "Warning: Could not change ownership. You may need to run with sudo."

echo "Cache directory recreated: $CACHE_DIR"
echo ""
echo "Now restart your Next.js app:"
echo "  pm2 restart rhvs-app"
echo ""
echo "Or if the cache is still owned by root, run this first:"
echo "  sudo chown -R myuser:myuser $CACHE_DIR"

