// Worker-only queue initialization (never imported by Next.js)
// This file should ONLY be imported by worker scripts, not by Next.js API routes
import Bull from 'bull';
import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

// Create Redis connection
const redis = new Redis(redisConfig);

redis.on('error', (error) => {
  console.error('[Redis] Connection error:', error);
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.on('ready', () => {
  console.log('[Redis] Ready to accept commands');
});

// Queue for member verification processing
export const memberVerificationQueue = new Bull('member-verification', {
  redis: redisConfig,
  settings: {
    stalledInterval: 30000,
    maxStalledCount: 1,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 86400,
    },
  },
});

// Queue for certificate generation
export const certificateGenerationQueue = new Bull('certificate-generation', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

