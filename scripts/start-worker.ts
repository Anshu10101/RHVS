#!/usr/bin/env ts-node
/**
 * Worker script to process member verification queue
 * Run this separately from your main Next.js app
 * 
 * Usage:
 *   npm run worker
 *   or
 *   ts-node scripts/start-worker.ts
 */

// Import worker to start processing
import '../src/workers/member-verification-worker';

console.log('✅ Member verification worker started');
console.log('📊 Processing jobs from queue...');
console.log('Press Ctrl+C to stop');

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  console.log(`\n[Worker] Received ${signal}, shutting down gracefully...`);
  
  try {
    // Import queue to close connections
    const { closeQueue } = await import('../src/lib/queue');
    await closeQueue();
    console.log('[Worker] Queue connections closed');
  } catch (error) {
    console.error('[Worker] Error during shutdown:', error);
  }
  
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Worker] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Worker] Uncaught Exception:', error);
  process.exit(1);
});


