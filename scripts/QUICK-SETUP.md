# Quick CRON_SECRET Setup

## Generate Your Secret

### Easiest Way (Online):
1. Go to: https://randomkeygen.com/
2. Copy any "Fort Knox Password" (32+ characters)

### Or Use This Example:
```
rhvs2024CronSecretCleanupKeyXyz123Abc789
```

## Where to Put It

### 1. In Your Next.js App (.env.local)
```bash
CRON_SECRET=rhvs2024CronSecretCleanupKeyXyz123Abc789
```

### 2. In Your Cron Script (cleanup-expired-posts.sh)
Edit line 9:
```bash
CRON_SECRET="rhvs2024CronSecretCleanupKeyXyz123Abc789"
```

## That's It!

The secret is just a password to protect your cron endpoint. Use the same value in both places.

