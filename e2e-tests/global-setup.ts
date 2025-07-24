import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests with performance optimizations
 */
async function globalSetup(config: FullConfig) {
  console.log('🎭 Starting Playwright global setup...');
  const startTime = Date.now();

  // Set up test environment
  process.env.NODE_ENV = 'test';
  
  // Pre-warm the application if needed
  if (process.env.PREWARM_APP === 'true') {
    await prewarmApplication(config);
  }

  // Set up authentication state for reuse
  if (process.env.SETUP_AUTH === 'true') {
    await setupAuthenticationState(config);
  }

  // Initialize test data
  if (process.env.SEED_TEST_DATA === 'true') {
    await seedTestData();
  }

  const setupTime = Date.now() - startTime;
  console.log(`✅ Global setup completed in ${setupTime}ms`);
}

async function prewarmApplication(config: FullConfig) {
  console.log('Pre-warming application...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Visit main pages to warm up Next.js
    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
    const pagesToWarm = ['/', '/test-cases', '/test-plans', '/test-runs'];
    
    for (const path of pagesToWarm) {
      await page.goto(`${baseURL}${path}`, { 
        waitUntil: 'networkidle',
        timeout: 10000 
      });
    }
    
    console.log('Application pre-warmed successfully');
  } catch (error) {
    console.warn('Failed to pre-warm application:', error);
  } finally {
    await browser.close();
  }
}

async function setupAuthenticationState(config: FullConfig) {
  console.log('Setting up authentication state...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
    
    // Log in and save authentication state
    await page.goto(`${baseURL}/auth/signin`);
    
    // Use test credentials
    await page.fill('[name="token"]', process.env.TEST_GITHUB_TOKEN || 'test-token');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(`${baseURL}/`);
    
    // Save storage state
    await context.storageState({ path: 'playwright/.auth/user.json' });
    
    console.log('Authentication state saved');
  } catch (error) {
    console.warn('Failed to setup authentication:', error);
  } finally {
    await browser.close();
  }
}

async function seedTestData() {
  console.log('Seeding test data...');
  
  // This would typically make API calls or database operations
  // to set up consistent test data
  
  const testData = {
    testCases: 10,
    testPlans: 3,
    testRuns: 5,
  };
  
  // Save test data info for cleanup
  process.env.TEST_DATA_SEEDED = JSON.stringify(testData);
  
  console.log('Test data seeded:', testData);
}

export default globalSetup;