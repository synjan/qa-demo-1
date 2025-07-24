import { performance } from 'perf_hooks';

/**
 * Global teardown for parallel test execution
 */
export default async function globalTeardown() {
  console.log('🧹 Starting parallel test teardown...');
  const startTime = performance.now();

  // Clean up test database/storage
  if (process.env.USE_TEST_DB) {
    await cleanupTestDatabase();
  }

  // Clean up any remaining resources
  await cleanupResources();

  // Report performance metrics
  if (global.__PERF_START__) {
    const totalTime = performance.now() - global.__PERF_START__;
    console.log(`\n📊 Total test execution time: ${(totalTime / 1000).toFixed(2)}s`);
  }

  const teardownTime = performance.now() - startTime;
  console.log(`✅ Parallel test teardown completed in ${teardownTime.toFixed(2)}ms`);
}

async function cleanupTestDatabase() {
  const workerId = process.env.JEST_WORKER_ID;
  const dbName = `test_db_${workerId}`;
  
  console.log(`Cleaning up test database ${dbName}`);
  // Placeholder for database cleanup
}

async function cleanupResources() {
  // Clean up any file system resources
  if (process.env.CLEANUP_TEST_FILES === 'true') {
    const fs = require('fs').promises;
    const path = require('path');
    
    const testDirs = [
      'testcases/test-*',
      'testplans/test-*',
      'results/test-*',
    ];
    
    for (const pattern of testDirs) {
      // Cleanup logic here
      console.log(`Cleaning up ${pattern}`);
    }
  }
  
  // Clear any remaining timers
  if (process.env.USE_FAKE_TIMERS === 'true') {
    jest.clearAllTimers();
  }
}