#!/usr/bin/env ts-node
/**
 * Script to cleanup test tokens and test members
 * 
 * Usage:
 *   npx tsx scripts/cleanup-test-tokens.ts
 * 
 * This will delete all test tokens and optionally test members
 * created for testing purposes.
 */

import { executeQuery } from '../src/lib/database';

async function main() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Delete test tokens
    const tokenResult = await executeQuery(
      "DELETE FROM registration_tokens WHERE email LIKE 'test.member%@rhvs-test.com'"
    ) as { affectedRows: number };
    
    console.log(`✅ Deleted ${tokenResult.affectedRows || 0} test tokens`);
    
    // Delete test members (optional - uncomment if you want to clean these too)
    // const memberResult = await executeQuery(
    //   "DELETE FROM members WHERE email LIKE 'test%@rhvs-test.com'"
    // ) as { affectedRows: number };
    // console.log(`✅ Deleted ${memberResult.affectedRows || 0} test members`);
    
    console.log('✅ Cleanup complete!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();

