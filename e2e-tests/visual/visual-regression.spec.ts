import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Authentication Pages', () => {
    test('sign in page', async ({ page }) => {
      await page.goto('/auth/signin');
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Take screenshot
      await expect(page).toHaveScreenshot('signin-page.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('sign in page - dark mode', async ({ page }) => {
      await page.goto('/auth/signin');
      
      // Toggle dark mode if available
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('signin-page-dark.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await AuthHelper.signInWithPAT(page);
    });

    test('dashboard overview', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Wait for any dynamic content
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('dashboard.png', {
        fullPage: true,
        animations: 'disabled',
        mask: [page.locator('[data-testid="dynamic-stats"]')],
      });
    });

    test('dashboard with widgets', async ({ page }) => {
      await page.goto('/');
      
      // Ensure widgets are loaded
      await page.waitForSelector('[data-testid="dashboard-widget"]', { 
        state: 'visible',
        timeout: 5000 
      }).catch(() => {});
      
      await expect(page).toHaveScreenshot('dashboard-widgets.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Test Cases', () => {
    test.beforeEach(async ({ page }) => {
      await AuthHelper.signInWithPAT(page);
    });

    test('test cases list - empty state', async ({ page }) => {
      await page.goto('/test-cases');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('test-cases-empty.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('create test case modal', async ({ page }) => {
      await page.goto('/test-cases');
      
      // Click create button
      const createButton = page.getByRole('button', { name: /create.*test.*case/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Wait for modal
        await page.waitForSelector('[role="dialog"]', { state: 'visible' });
        
        await expect(page).toHaveScreenshot('create-test-case-modal.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Test Plans', () => {
    test.beforeEach(async ({ page }) => {
      await AuthHelper.signInWithPAT(page);
    });

    test('test plans list', async ({ page }) => {
      await page.goto('/test-plans');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('test-plans-list.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Test Runs', () => {
    test.beforeEach(async ({ page }) => {
      await AuthHelper.signInWithPAT(page);
    });

    test('test runs list', async ({ page }) => {
      await page.goto('/test-runs');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('test-runs-list.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('test execution view', async ({ page }) => {
      await page.goto('/test-runs');
      
      // Try to find and click on a test run
      const testRunLink = page.locator('[data-testid="test-run-link"]').first();
      if (await testRunLink.count() > 0) {
        await testRunLink.click();
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot('test-execution.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Settings', () => {
    test.beforeEach(async ({ page }) => {
      await AuthHelper.signInWithPAT(page);
    });

    test('settings page', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('settings-page.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('settings - integrations tab', async ({ page }) => {
      await page.goto('/settings');
      
      // Click on integrations tab if available
      const integrationsTab = page.getByRole('tab', { name: /integrations/i });
      if (await integrationsTab.isVisible()) {
        await integrationsTab.click();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('settings-integrations.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Responsive Design', () => {
    test.beforeEach(async ({ page }) => {
      await AuthHelper.signInWithPAT(page);
    });

    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      test(`dashboard - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`dashboard-${viewport.name}.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      });

      test(`test cases - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/test-cases');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`test-cases-${viewport.name}.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  });

  test.describe('Component States', () => {
    test.beforeEach(async ({ page }) => {
      await AuthHelper.signInWithPAT(page);
    });

    test('button states', async ({ page }) => {
      await page.goto('/test-cases');
      
      // Create a test page with different button states
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.innerHTML = `
          <div style="padding: 20px; background: white;">
            <h2>Button States</h2>
            <div style="display: flex; gap: 10px; margin: 10px 0;">
              <button class="btn btn-primary">Default</button>
              <button class="btn btn-primary" disabled>Disabled</button>
              <button class="btn btn-primary btn-loading">Loading</button>
            </div>
          </div>
        `;
        document.body.appendChild(container);
      });
      
      await expect(page.locator('body')).toHaveScreenshot('button-states.png', {
        clip: { x: 0, y: 0, width: 400, height: 200 },
      });
    });

    test('form validation states', async ({ page }) => {
      await page.goto('/test-cases');
      
      // Click create button to open form
      const createButton = page.getByRole('button', { name: /create.*test.*case/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Submit empty form to trigger validation
        const submitButton = page.getByRole('button', { name: /save|create|submit/i });
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(500);
          
          await expect(page.locator('[role="dialog"]')).toHaveScreenshot('form-validation.png');
        }
      }
    });
  });
});