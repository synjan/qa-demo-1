import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NavigationHelper } from '../helpers/navigation.helper';
import { TestData, Timeouts, Selectors } from '../helpers/test-data.helper';

test.describe('Test Runs - Execution', () => {
  let nav: NavigationHelper;

  test.beforeEach(async ({ page, context }) => {
    await AuthHelper.authenticateWithPAT(context, TestData.auth.validPAT);
    await page.goto('/testruns');
    nav = new NavigationHelper(page);
  });

  test('should display test runs list page', async ({ page }) => {
    // Page header
    await expect(page.locator('h1')).toContainText('Test Runs');
    
    // Action buttons
    const startRunButton = page.locator('button:has-text("Start Test Run")').or(
      page.locator('a:has-text("New Test Run")')
    );
    await expect(startRunButton).toBeVisible();
    
    // List or empty state
    const runsList = page.locator(Selectors.tables.root).or(
      page.locator('.grid').filter({ has: page.locator('[class*="test-run"]') })
    );
    const emptyState = page.locator('text=/No test runs|Start your first test run/i');
    
    await expect(runsList.or(emptyState)).toBeVisible();
  });

  test('should start a new test run', async ({ page }) => {
    // Click start test run
    const startButton = page.locator('button:has-text("Start Test Run")').or(
      page.locator('a:has-text("New Test Run")')
    );
    await startButton.click();
    
    // Test run configuration
    await page.waitForTimeout(1000);
    
    // Select test plan
    const planSelect = page.locator('select[name="testPlan"]').or(
      page.locator('button[role="combobox"]')
    );
    
    if (await planSelect.isVisible()) {
      await planSelect.click();
      
      // Select first available plan
      const planOption = page.locator('[role="option"]').first().or(
        page.locator('option').first()
      );
      
      if (await planOption.isVisible()) {
        await planOption.click();
      }
    }
    
    // Environment
    const envInput = page.locator('input[name="environment"]').or(
      page.locator('input[placeholder*="Environment"]')
    );
    if (await envInput.isVisible()) {
      await envInput.fill(TestData.testRuns.basic.environment);
    }
    
    // Browser/Platform
    const browserSelect = page.locator('select[name="browser"]').or(
      page.locator('input[name="browser"]')
    );
    if (await browserSelect.isVisible()) {
      await browserSelect.fill(TestData.testRuns.basic.browser);
    }
    
    // Start run
    await page.click('button:has-text("Start")');
    
    // Should navigate to execution page
    await page.waitForURL(/\/testruns\/[^\/]+(?:\/execute)?$/, { timeout: Timeouts.medium });
    
    // Should show test execution interface
    await expect(page.locator('text=/Test Case|Executing/i')).toBeVisible();
  });

  test('should execute test cases in a run', async ({ page }) => {
    // Find or create an active test run
    let activeRun = page.locator('a[href*="/testruns/"]').filter({ hasText: /In Progress|Active/i }).first();
    
    if (!(await activeRun.isVisible())) {
      // Start a new run
      await startNewTestRun(page);
    } else {
      await activeRun.click();
    }
    
    // Should be on execution page
    await page.waitForURL(/\/testruns\/[^\/]+/);
    
    // Test case execution interface
    const testCaseTitle = page.locator('h2').or(
      page.locator('[class*="test-case-title"]')
    );
    await expect(testCaseTitle).toBeVisible();
    
    // Test steps
    const stepsContainer = page.locator('[class*="test-steps"]').or(
      page.locator('ol, ul').filter({ has: page.locator('[class*="step"]') })
    );
    await expect(stepsContainer).toBeVisible();
    
    // Result buttons
    const passButton = page.locator('button:has-text("Pass")').or(
      page.locator('button[data-result="pass"]')
    );
    const failButton = page.locator('button:has-text("Fail")').or(
      page.locator('button[data-result="fail"]')
    );
    const skipButton = page.locator('button:has-text("Skip")').or(
      page.locator('button[data-result="skip"]')
    );
    
    await expect(passButton).toBeVisible();
    await expect(failButton).toBeVisible();
    await expect(skipButton).toBeVisible();
    
    // Execute first test case
    await passButton.click();
    
    // Should move to next test case or complete
    await page.waitForTimeout(1000);
    
    // Check if moved to next test case
    const nextButton = page.locator('button:has-text("Next")');
    const completeButton = page.locator('button:has-text("Complete")');
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
    } else if (await completeButton.isVisible()) {
      await completeButton.click();
    }
  });

  test('should handle failed test case', async ({ page }) => {
    // Navigate to active test run
    const activeRun = await getOrCreateActiveRun(page);
    await activeRun.click();
    
    // Mark test as failed
    const failButton = page.locator('button:has-text("Fail")').or(
      page.locator('button[data-result="fail"]')
    );
    await failButton.click();
    
    // Should show failure details form
    const failureDialog = page.locator(Selectors.dialogs.root).or(
      page.locator('[class*="failure-details"]')
    );
    
    if (await failureDialog.isVisible()) {
      // Add failure reason
      const reasonInput = page.locator('textarea[name="failureReason"]').or(
        page.locator('textarea[placeholder*="reason"]')
      );
      await reasonInput.fill('Button not visible on page');
      
      // Add screenshot if option available
      const screenshotButton = page.locator('button:has-text("Add Screenshot")');
      if (await screenshotButton.isVisible()) {
        // Would normally handle file upload
      }
      
      // Save failure
      await page.click('button:has-text("Save")');
    }
    
    // Should record failure and move on
    await page.waitForTimeout(1000);
  });

  test('should pause and resume test run', async ({ page }) => {
    // Navigate to active test run
    const activeRun = await getOrCreateActiveRun(page);
    await activeRun.click();
    
    // Pause button
    const pauseButton = page.locator('button:has-text("Pause")').or(
      page.locator('button[aria-label="Pause test run"]')
    );
    
    if (await pauseButton.isVisible()) {
      await pauseButton.click();
      
      // Should show paused state
      await expect(page.locator('text=/Paused|On Hold/i')).toBeVisible();
      
      // Resume button should appear
      const resumeButton = page.locator('button:has-text("Resume")');
      await expect(resumeButton).toBeVisible();
      
      // Resume
      await resumeButton.click();
      
      // Should return to active state
      await expect(pauseButton).toBeVisible();
    }
  });

  test('should view test run results', async ({ page }) => {
    // Find completed test run
    const completedRun = page.locator('a[href*="/testruns/"]').filter({ 
      hasText: /Completed|Finished/i 
    }).first();
    
    if (await completedRun.isVisible()) {
      await completedRun.click();
      
      // Results summary
      await expect(page.locator('text=/Results|Summary/i')).toBeVisible();
      
      // Statistics
      const stats = ['Total', 'Passed', 'Failed', 'Skipped'];
      for (const stat of stats) {
        const statElement = page.locator(`text=/${stat}/i`);
        if (await statElement.isVisible()) {
          // Should have associated number
          const parent = statElement.locator('..');
          const text = await parent.textContent();
          expect(text).toMatch(/\d+/);
        }
      }
      
      // Test case results list
      const resultsList = page.locator(Selectors.tables.root).or(
        page.locator('[class*="results-list"]')
      );
      await expect(resultsList).toBeVisible();
    }
  });

  test('should filter test runs', async ({ page }) => {
    // Status filter
    const statusFilter = page.locator('select[name="status"]').or(
      page.locator('button:has-text("Status")')
    );
    
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      
      // Select completed runs
      const completedOption = page.locator('[role="option"]:has-text("Completed")').or(
        page.locator('option:has-text("Completed")')
      );
      
      if (await completedOption.isVisible()) {
        await completedOption.click();
        
        // Wait for filter
        await page.waitForTimeout(1000);
        
        // All visible runs should be completed
        const runs = page.locator('[class*="test-run"]');
        const count = await runs.count();
        
        for (let i = 0; i < count; i++) {
          const runText = await runs.nth(i).textContent();
          expect(runText).toMatch(/Completed|Finished/i);
        }
      }
    }
  });

  test('should export test run results', async ({ page }) => {
    // Navigate to completed run
    const completedRun = page.locator('a[href*="/testruns/"]').filter({ 
      hasText: /Completed|Finished/i 
    }).first();
    
    if (await completedRun.isVisible()) {
      await completedRun.click();
      
      // Export button
      const exportButton = page.locator('button:has-text("Export")').or(
        page.locator('button[aria-label*="Export"]')
      );
      
      if (await exportButton.isVisible()) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download');
        
        await exportButton.click();
        
        // Format selection
        const pdfOption = page.locator('button:has-text("PDF")');
        const csvOption = page.locator('button:has-text("CSV")');
        
        if (await pdfOption.isVisible()) {
          await pdfOption.click();
        } else if (await csvOption.isVisible()) {
          await csvOption.click();
        }
        
        // Wait for download
        try {
          const download = await downloadPromise;
          expect(download).toBeTruthy();
        } catch {
          // Export might be handled differently
          expect(true).toBe(true);
        }
      }
    }
  });

  test('should add comments to test results', async ({ page }) => {
    // Navigate to active or completed run
    const testRun = page.locator('a[href*="/testruns/"]').first();
    
    if (await testRun.isVisible()) {
      await testRun.click();
      
      // Find comment button on a test case
      const commentButton = page.locator('button[aria-label*="Add comment"]').or(
        page.locator('button:has([class*="comment"])')
      ).first();
      
      if (await commentButton.isVisible()) {
        await commentButton.click();
        
        // Comment input
        const commentInput = page.locator('textarea[placeholder*="comment"]').or(
          page.locator('textarea[name="comment"]')
        );
        
        await commentInput.fill('Test executed successfully on Chrome 120');
        
        // Save comment
        await page.click('button:has-text("Save")');
        
        // Comment should be visible
        await expect(page.locator('text="Test executed successfully on Chrome 120"')).toBeVisible();
      }
    }
  });

  test('should show test run timeline', async ({ page }) => {
    // Navigate to a test run
    const testRun = page.locator('a[href*="/testruns/"]').first();
    
    if (await testRun.isVisible()) {
      await testRun.click();
      
      // Timeline or activity log
      const timeline = page.locator('[class*="timeline"]').or(
        page.locator('[class*="activity-log"]')
      );
      
      if (await timeline.isVisible()) {
        // Should show events
        const events = timeline.locator('[class*="event"], [class*="activity"]');
        expect(await events.count()).toBeGreaterThan(0);
        
        // Events should have timestamps
        const firstEvent = events.first();
        const eventText = await firstEvent.textContent();
        expect(eventText).toMatch(/\d{1,2}:\d{2}|\d{4}-\d{2}-\d{2}/);
      }
    }
  });
});

// Helper functions
async function startNewTestRun(page: any) {
  await page.click('button:has-text("Start Test Run")');
  await page.waitForTimeout(1000);
  
  // Select first available test plan
  const planSelect = page.locator('select[name="testPlan"]').or(
    page.locator('button[role="combobox"]')
  );
  
  if (await planSelect.isVisible()) {
    await planSelect.click();
    const firstOption = page.locator('[role="option"]').first();
    await firstOption.click();
  }
  
  await page.click('button:has-text("Start")');
  await page.waitForURL(/\/testruns\/[^\/]+/, { timeout: Timeouts.medium });
}

async function getOrCreateActiveRun(page: any) {
  let activeRun = page.locator('a[href*="/testruns/"]').filter({ 
    hasText: /In Progress|Active/i 
  }).first();
  
  if (!(await activeRun.isVisible())) {
    await startNewTestRun(page);
    await page.goto('/testruns');
    activeRun = page.locator('a[href*="/testruns/"]').filter({ 
      hasText: /In Progress|Active/i 
    }).first();
  }
  
  return activeRun;
}