import { performance } from 'perf_hooks';

/**
 * Global setup for parallel test execution
 */
export default async function globalSetup() {
  console.log('🚀 Starting parallel test setup...');
  const startTime = performance.now();

  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1';
  
  // Configure test database/storage if needed
  if (process.env.USE_TEST_DB) {
    await setupTestDatabase();
  }

  // Set up global mocks
  setupGlobalMocks();

  // Initialize performance tracking
  global.__PERF_START__ = startTime;

  const setupTime = performance.now() - startTime;
  console.log(`✅ Parallel test setup completed in ${setupTime.toFixed(2)}ms`);
}

async function setupTestDatabase() {
  // Placeholder for test database setup
  // Each worker gets its own database/schema
  const workerId = process.env.JEST_WORKER_ID;
  process.env.TEST_DB_NAME = `test_db_${workerId}`;
  
  console.log(`Setting up test database for worker ${workerId}`);
}

function setupGlobalMocks() {
  // Set up global mocks that are needed across all tests
  global.fetch = jest.fn();
  global.console.error = jest.fn();
  global.console.warn = jest.fn();
  
  // Mock timers for consistent test execution
  if (process.env.USE_FAKE_TIMERS === 'true') {
    jest.useFakeTimers();
  }
}