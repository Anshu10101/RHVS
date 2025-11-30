#!/bin/bash
# Quick one-liner fix - customize the path first!

# Replace 'myuser' with your actual username, or set APP_DIR environment variable
APP_DIR="${RHVS_APP_DIR:-/home/myuser/RHVS}"
APP_USER="${SUDO_USER:-$USER}"

echo "Fixing cache permissions for: $APP_DIR"
echo "Setting ownership to: $APP_USER"
echo ""

pm2 stop rhvs-app 2>/dev/null && \
sudo rm -rf "$APP_DIR/.next/cache" && \
sudo mkdir -p "$APP_DIR/.next/cache/images" "$APP_DIR/.next/cache/webpack" && \
sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR/.next/cache" && \
sudo chmod -R 755 "$APP_DIR/.next/cache" && \
pm2 restart rhvs-app && \
echo "✅ Done! Cache permissions fixed."

