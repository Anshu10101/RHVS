// Server-only: This file should NEVER be imported by client components
// @ts-ignore - Suppress any static analysis warnings
'use server';

// Lazy load Bull to avoid Next.js/Turbopack bundling issues
let Bull: any;
let Redis: any;
let redis: any;
let memberVerificationQueue: any;
let certificateGenerationQueue: any;

// Redis connection config
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

// Initialize queues lazily (only when actually needed)
async function initializeQueues() {
  if (memberVerificationQueue) return; // Already initialized

  // Use dynamic import - Next.js API routes are ES modules, so require() isn't available
  // Dynamic import works at runtime even if Turbopack tries to analyze it during build
  const bullModule = await import('bull');
  const redisModule = await import('ioredis');
  Bull = bullModule.default || bullModule;
  Redis = redisModule.default || redisModule;

  // Create Redis connection with error handling
  redis = new Redis(redisConfig);

  redis.on('error', (error: any) => {
    console.error('[Redis] Connection error:', error);
  });

  redis.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  redis.on('ready', () => {
    console.log('[Redis] Ready to accept commands');
  });

  // Queue for member verification processing (PDF generation + email)
  memberVerificationQueue = new Bull('member-verification', {
    redis: redisConfig,
    settings: {
      stalledInterval: 30000, // Check for stalled jobs every 30 seconds
      maxStalledCount: 1, // Max times a job can be stalled before failing
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 1000, // Keep max 1000 completed jobs
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
      },
    },
  });

  // Queue for certificate generation
  certificateGenerationQueue = new Bull('certificate-generation', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  });
}

// NOTE: This file is ONLY for Next.js API routes - uses dynamic imports
// Workers should import from '../lib/queue-worker' instead (has direct Bull imports)

// Helper to add job to queue (for API routes - lazy loads Bull)
export async function queueMemberVerification(data: {
  memberId: number;
  memberName: string;
  memberRegNumber: string;
  email: string;
  registrationDate: string;
  profilePhotoPath?: string;
  address?: string;
  language: 'hi' | 'en';
  state?: string;
  district?: string;
  adminId?: number;
}) {
  await initializeQueues();
  return await memberVerificationQueue.add('process-verification', data, {
    priority: 1, // Higher priority
  });
}

// Helper to add bulk verification jobs (for API routes - lazy loads Bull)
export async function queueBulkMemberVerification(
  members: Array<{
    memberId: number;
    memberName: string;
    memberRegNumber: string;
    email: string;
    registrationDate: string;
    profilePhotoPath?: string;
    address?: string;
    language: 'hi' | 'en';
    state?: string;
    district?: string;
    adminId?: number;
  }>
) {
  await initializeQueues();
  const jobs = members.map((member) => ({
    name: 'process-verification',
    data: member,
    opts: {
      priority: 1,
    },
  }));

  return await memberVerificationQueue.addBulk(jobs);
}

// Get queue status (for API routes - lazy loads Bull)
export async function getQueueStatus() {
  await initializeQueues();
  const [waiting, active, completed, failed] = await Promise.all([
    memberVerificationQueue.getWaitingCount(),
    memberVerificationQueue.getActiveCount(),
    memberVerificationQueue.getCompletedCount(),
    memberVerificationQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active + completed + failed,
  };
}

// Clean up Redis connection
export async function closeQueue() {
  if (memberVerificationQueue) {
    await memberVerificationQueue.close();
  }
  if (certificateGenerationQueue) {
    await certificateGenerationQueue.close();
  }
  if (redis) {
    await redis.quit();
  }
}


