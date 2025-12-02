#!/bin/bash

# Server-side cron script to clean up expired department post assignments
# Run this daily via crontab: 0 2 * * * /path/to/cleanup-expired-posts.sh
# (Runs at 2 AM daily)

# Configuration
API_URL="https://rashtriyahinduvahinisangathan.in/api/cron/cleanup-expired-posts"
CRON_SECRET="hqisYzfLH9T4Gv60e3XQZ8uRalWDdEVM"

# Log file location
LOG_FILE="${LOG_FILE:-/var/log/rhvs-cron.log}"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_message "Starting expired posts cleanup cron job..."

# Make HTTP request to cleanup endpoint
if [ -n "$CRON_SECRET" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Authorization: Bearer $CRON_SECRET" \
        "$API_URL")
else
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
        "$API_URL")
fi

# Extract HTTP status code (last line) and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Log result
if [ "$HTTP_CODE" -eq 200 ]; then
    log_message "Cleanup completed successfully: $BODY"
    exit 0
else
    log_message "ERROR: Cleanup failed with HTTP $HTTP_CODE: $BODY"
    exit 1
fi

