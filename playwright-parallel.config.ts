import { defineConfig, devices } from '@playwright/test';

/**
 * Optimized Playwright configuration for parallel execution
 */
export default defineConfig({
  testDir: './e2e-tests',
  
  // Parallel execution settings
  fullyParallel: true,
  workers: process.env.CI ? 4 : '50%', // 4 workers in CI, 50% of cores locally
  
  // Sharding for distributed execution
  ...(process.env.SHARD && {
    shard: {
      total: parseInt(process.env.TOTAL_SHARDS || '4'),
      current: parseInt(process.env.SHARD || '1'),
    },
  }),
  
  // Timeout configurations
  timeout: 30 * 1000, // 30s per test
  expect: {
    timeout: 5000, // 5s for assertions
  },
  
  // Retry configuration
  retries: process.env.CI ? 2 : 0,
  
  // Output configuration
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-parallel' }],
    ['json', { outputFile: 'test-results/parallel-results.json' }],
    ['junit', { outputFile: 'test-results/junit-parallel.xml' }],
  ],
  
  // Global setup/teardown
  globalSetup: require.resolve('./e2e-tests/global-setup.ts'),
  globalTeardown: require.resolve('./e2e-tests/global-teardown.ts'),
  
  use: {
    // Base URL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Trace collection for debugging
    trace: process.env.CI ? 'retain-on-failure' : 'off',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    
    // Performance optimizations
    launchOptions: {
      args: [
        '--disable-dev-shm-usage', // Overcome limited resource problems
        '--disable-gpu', // Disable GPU hardware acceleration
        '--no-sandbox', // Disable sandbox for CI
      ],
    },
    
    // Context options for faster execution
    contextOptions: {
      // Disable animations for faster tests
      reducedMotion: 'reduce',
      // Ignore HTTPS errors in test environment
      ignoreHTTPSErrors: true,
    },
  },
  
  // Project configuration for parallel browser testing
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Browser-specific optimizations
        launchOptions: {
          args: ['--disable-blink-features=AutomationControlled'],
        },
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Only run in CI if explicitly requested
        ...(process.env.CI && !process.env.TEST_ALL_BROWSERS && { skipMe: true }),
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // Only run in CI if explicitly requested
        ...(process.env.CI && !process.env.TEST_ALL_BROWSERS && { skipMe: true }),
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        // Run mobile tests in parallel
        ...(process.env.SKIP_MOBILE && { skipMe: true }),
      },
    },
  ],
  
  // Test file patterns for better organization
  testMatch: [
    '**/smoke.spec.ts', // Priority 1: Smoke tests
    '**/critical-*.spec.ts', // Priority 2: Critical path tests
    '**/*.spec.ts', // Priority 3: All other tests
  ],
  
  // Exclude slow tests in quick mode
  testIgnore: process.env.QUICK_TEST ? [
    '**/slow-*.spec.ts',
    '**/performance-*.spec.ts',
  ] : [],
});