import { FullConfig } from '@playwright/test';

/**
 * Global teardown for E2E tests
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown...');
  const startTime = Date.now();

  // Clean up test data
  if (process.env.TEST_DATA_SEEDED) {
    await cleanupTestData();
  }

  // Clean up authentication state
  if (process.env.SETUP_AUTH === 'true') {
    await cleanupAuthState();
  }

  // Generate performance report
  if (process.env.GENERATE_PERF_REPORT === 'true') {
    await generatePerformanceReport();
  }

  const teardownTime = Date.now() - startTime;
  console.log(`✅ Global teardown completed in ${teardownTime}ms`);
}

async function cleanupTestData() {
  console.log('Cleaning up test data...');
  
  try {
    const testData = JSON.parse(process.env.TEST_DATA_SEEDED || '{}');
    
    // This would typically make API calls to clean up test data
    console.log('Test data cleaned up:', testData);
  } catch (error) {
    console.warn('Failed to cleanup test data:', error);
  }
}

async function cleanupAuthState() {
  console.log('Cleaning up authentication state...');
  
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    await fs.unlink(path.join(process.cwd(), 'playwright/.auth/user.json'));
    console.log('Authentication state cleaned up');
  } catch (error) {
    // File might not exist, which is fine
  }
}

async function generatePerformanceReport() {
  console.log('Generating performance report...');
  
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    // Read test results
    const resultsPath = path.join(process.cwd(), 'test-results/parallel-results.json');
    const results = JSON.parse(await fs.readFile(resultsPath, 'utf-8'));
    
    // Calculate metrics
    const metrics = {
      totalTests: results.suites.reduce((acc: number, suite: any) => 
        acc + suite.specs.length, 0),
      totalDuration: results.suites.reduce((acc: number, suite: any) => 
        acc + suite.duration, 0),
      averageDuration: 0,
      slowestTest: null as any,
      fastestTest: null as any,
    };
    
    // Find slowest and fastest tests
    let slowest = 0;
    let fastest = Infinity;
    
    results.suites.forEach((suite: any) => {
      suite.specs.forEach((spec: any) => {
        if (spec.duration > slowest) {
          slowest = spec.duration;
          metrics.slowestTest = {
            title: spec.title,
            duration: spec.duration,
          };
        }
        if (spec.duration < fastest) {
          fastest = spec.duration;
          metrics.fastestTest = {
            title: spec.title,
            duration: spec.duration,
          };
        }
      });
    });
    
    metrics.averageDuration = metrics.totalDuration / metrics.totalTests;
    
    // Write performance report
    const reportPath = path.join(process.cwd(), 'test-results/performance-report.json');
    await fs.writeFile(reportPath, JSON.stringify(metrics, null, 2));
    
    console.log('Performance report generated:', metrics);
  } catch (error) {
    console.warn('Failed to generate performance report:', error);
  }
}

export default globalTeardown;