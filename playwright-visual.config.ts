import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tests/visual',
  
  // Timeout for each test
  timeout: 60 * 1000,
  
  // Test file patterns
  testMatch: '**/*.spec.ts',
  
  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Limit parallel tests to avoid flakiness
  workers: process.env.CI ? 1 : 2,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report/visual' }],
    ['json', { outputFile: 'test-results/visual-results.json' }],
    ['list'],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot settings for visual regression
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    
    // Video recording
    video: process.env.CI ? 'retain-on-failure' : 'off',
    
    // Viewport
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Timeout for actions
    actionTimeout: 15000,
    
    // Navigation timeout
    navigationTimeout: 30000,
  },
  
  // Configure visual regression settings
  expect: {
    // Threshold for visual comparisons (0-1, where 0 is pixel-perfect)
    toHaveScreenshot: { 
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
  
  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Disable animations for consistent screenshots
        launchOptions: {
          args: [
            '--disable-web-animations',
            '--disable-gpu',
            '--disable-dev-shm-usage',
          ],
        },
      },
    },
    
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'ui.prefersReducedMotion': 1,
          },
        },
      },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],
  
  // Run local dev server before tests if not in CI
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
  
  // Output folder for test artifacts
  outputDir: 'test-results/visual',
  
  // Folder for visual regression snapshots
  snapshotDir: 'e2e-tests/visual/screenshots',
  snapshotPathTemplate: '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}',
});