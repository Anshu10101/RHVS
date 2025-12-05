#!/bin/bash

# Server-side cron script to clean up old permission history (2 months retention)
# Run this daily via crontab: 0 3 * * * /path/to/cleanup-permission-history.sh
# (Runs at 3 AM daily, after expired posts cleanup at 2 AM)

# Configuration
API_URL="https://rashtriyahinduvahinisangathan.in/api/cron/cleanup-permission-history"
CRON_SECRET="${CRON_SECRET:-hqisYzfLH9T4Gv60e3XQZ8uRalWDdEVM}"

# Log file location (logs to home directory of user running the script)
LOG_FILE="${LOG_FILE:-${HOME}/rhvs-cron.log}"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_message "Starting permission history cleanup cron job (2 months retention)..."

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
    log_message "Permission history cleanup completed successfully: $BODY"
    exit 0
else
    log_message "ERROR: Permission history cleanup failed with HTTP $HTTP_CODE: $BODY"
    exit 1
fi

