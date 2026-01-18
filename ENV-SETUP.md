# Environment Variables Setup for Queue System

## Required Environment Variables

### For Queue System (Redis)

Add these to your `.env.local` (development) or `.env.production` (production):

```env
# Redis Configuration (Required for queue system)
REDIS_HOST=localhost          # or 127.0.0.1 for production
REDIS_PORT=6379               # Default Redis port
REDIS_PASSWORD=               # Leave empty if no password (most common)
```

### Quick Setup

**Development (.env.local):**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Production (.env.production):**
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Are These Required?

**Technically NO** (they have defaults), but **YES for production** (recommended):

- Defaults work for local development
- **Explicitly set them for production** to avoid issues
- Makes configuration clear and easy to change

## If Using Redis Cloud/Upstash

```env
REDIS_HOST=your-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password-here
```

## How to Add

### Development
1. Create/edit `.env.local` in project root
2. Add the Redis variables above
3. Restart your dev server

### Production (Ubuntu/Hostinger)
1. SSH into your server
2. Navigate to project directory
3. Edit `.env.production`:
   ```bash
   nano .env.production
   ```
4. Add Redis variables
5. Save (Ctrl+X, then Y, then Enter)
6. Restart your app: `pm2 restart rhvs-app`

## Quick Test

After adding env vars, test connection:
```bash
# Test Redis connection
redis-cli ping
# Should return: PONG
```

If you see "PONG", your Redis connection is working!

