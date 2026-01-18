// Separate API route for queueing - Bull is loaded at runtime to avoid Turbopack bundling
import { NextRequest, NextResponse } from 'next/server';

// Directly use Bull here with dynamic import - avoid importing queue.ts which Turbopack analyzes
async function queueJob(data: any) {
  console.log('[Queue API] Loading Bull module...');
  try {
    // Use dynamic import to load at runtime (ES module way)
    const bullModule = await import('bull');
    const redisModule = await import('ioredis');
    const Bull = bullModule.default || bullModule;
    const Redis = redisModule.default || redisModule;
    console.log('[Queue API] Bull module loaded successfully');
    
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    };
    
    console.log('[Queue API] Creating queue with Redis config:', { host: redisConfig.host, port: redisConfig.port });
    const queue = new Bull('member-verification', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 86400 },
      },
    });
    
    console.log('[Queue API] Adding job to queue...');
    const job = await queue.add('process-verification', data, { priority: 1 });
    console.log('[Queue API] Job added successfully:', job.id);
    return job;
  } catch (error) {
    console.error('[Queue API] Error in queueJob:', error);
    throw error;
  }
}

async function queueBulkJobs(members: any[]) {
  console.log('[Queue API] Loading Bull module for bulk jobs...');
  try {
    // Use dynamic import to load at runtime (ES module way)
    const bullModule = await import('bull');
    const redisModule = await import('ioredis');
    const Bull = bullModule.default || bullModule;
    const Redis = redisModule.default || redisModule;
    console.log('[Queue API] Bull module loaded successfully for bulk');
    
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    };
    
    console.log('[Queue API] Creating queue for bulk jobs...');
    const queue = new Bull('member-verification', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 86400 },
      },
    });
    
    const jobs = members.map((member) => ({
      name: 'process-verification',
      data: member,
      opts: { priority: 1 },
    }));
    
    console.log('[Queue API] Adding', jobs.length, 'jobs to queue...');
    const result = await queue.addBulk(jobs);
    console.log('[Queue API] Bulk jobs added successfully:', result.length);
    return result;
  } catch (error) {
    console.error('[Queue API] Error in queueBulkJobs:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Queue API] Received request:', { 
      hasMembers: !!body.members, 
      membersCount: body.members?.length || 0,
      singleMember: !body.members ? 'yes' : 'no'
    });
    
    if (body.members && Array.isArray(body.members)) {
      // Bulk queue
      console.log('[Queue API] Queueing bulk jobs:', body.members.length);
      await queueBulkJobs(body.members);
      console.log('[Queue API] ✅ Bulk jobs queued successfully');
      return NextResponse.json({ success: true, queued: body.members.length });
    } else {
      // Single queue
      console.log('[Queue API] Queueing single job for:', body.memberRegNumber || body.email);
      await queueJob(body);
      console.log('[Queue API] ✅ Single job queued successfully');
      return NextResponse.json({ success: true, queued: 1 });
    }
  } catch (error) {
    console.error('[Queue API] Error details:', error);
    console.error('[Queue API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to queue',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

