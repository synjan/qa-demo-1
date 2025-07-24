import { test, expect } from '@playwright/test';

test.describe('E2E Error Scenarios', () => {
  test.describe('Network Errors', () => {
    test('should handle offline mode gracefully', async ({ page, context }) => {
      await page.goto('/');
      
      // Go offline
      await context.setOffline(true);
      
      // Try to navigate
      await page.getByRole('link', { name: 'Test Cases' }).click();
      
      // Should show offline indicator or error message
      await expect(page.getByText(/offline|no connection/i)).toBeVisible({ timeout: 5000 });
      
      // Go back online
      await context.setOffline(false);
      
      // Should recover
      await page.reload();
      await expect(page).toHaveURL('/');
    });

    test('should handle slow network gracefully', async ({ page }) => {
      // Simulate slow 3G
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
        await route.continue();
      });
      
      await page.goto('/');
      
      // Should show loading states
      await expect(page.getByTestId('loading-spinner')).toBeVisible();
      
      // Should eventually load
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10000 });
    });

    test('should handle API timeout', async ({ page }) => {
      // Mock API to never respond
      await page.route('**/api/testcases', async route => {
        // Never resolve
        await new Promise(() => {});
      });
      
      await page.goto('/test-cases');
      
      // Should show timeout error after reasonable time
      await expect(page.getByText(/timeout|taking too long/i)).toBeVisible({ timeout: 35000 });
    });
  });

  test.describe('Authentication Errors', () => {
    test('should redirect to login on 401', async ({ page }) => {
      // Mock unauthorized response
      await page.route('**/api/testcases', route => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Unauthorized' }),
        });
      });
      
      await page.goto('/test-cases');
      
      // Should redirect to login
      await expect(page).toHaveURL(/auth\/signin/);
    });

    test('should handle expired session', async ({ page }) => {
      await page.goto('/');
      
      // Mock session expiry
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Trigger an authenticated action
      await page.getByRole('button', { name: 'Create Test Case' }).click();
      
      // Should redirect to login
      await expect(page).toHaveURL(/auth\/signin/);
    });

    test('should handle invalid GitHub token', async ({ page }) => {
      await page.goto('/auth/signin');
      
      // Enter invalid token
      await page.getByLabel('Personal Access Token').fill('invalid-token');
      await page.getByRole('button', { name: 'Sign in' }).click();
      
      // Should show error
      await expect(page.getByText(/invalid token|authentication failed/i)).toBeVisible();
    });
  });

  test.describe('Form Validation Errors', () => {
    test('should validate required fields', async ({ page }) => {
      await page.goto('/test-cases/new');
      
      // Try to submit empty form
      await page.getByRole('button', { name: 'Save' }).click();
      
      // Should show validation errors
      await expect(page.getByText(/title is required/i)).toBeVisible();
      await expect(page.getByText(/description is required/i)).toBeVisible();
    });

    test('should handle special characters in input', async ({ page }) => {
      await page.goto('/test-cases/new');
      
      // Enter problematic characters
      await page.getByLabel('Title').fill('<script>alert("XSS")</script>');
      await page.getByLabel('Description').fill('Test"; DROP TABLE testcases; --');
      
      // Should escape properly when saved
      await page.getByRole('button', { name: 'Save' }).click();
      
      // Check that content is escaped
      await expect(page.locator('text=<script>')).toBeVisible();
      await expect(page.locator('text=alert("XSS")')).not.toBeVisible();
    });

    test('should enforce input length limits', async ({ page }) => {
      await page.goto('/test-cases/new');
      
      const longText = 'x'.repeat(10000);
      
      // Try to enter very long text
      await page.getByLabel('Title').fill(longText);
      
      // Should truncate or show error
      const titleValue = await page.getByLabel('Title').inputValue();
      expect(titleValue.length).toBeLessThan(1000);
    });
  });

  test.describe('File Upload Errors', () => {
    test('should reject invalid file types', async ({ page }) => {
      await page.goto('/test-cases/import');
      
      // Create a fake .exe file
      const buffer = Buffer.from('fake exe content');
      await page.setInputFiles('input[type="file"]', {
        name: 'malicious.exe',
        mimeType: 'application/x-msdownload',
        buffer,
      });
      
      // Should show error
      await expect(page.getByText(/invalid file type|not allowed/i)).toBeVisible();
    });

    test('should handle oversized files', async ({ page }) => {
      await page.goto('/test-cases/import');
      
      // Create a large file (>10MB)
      const buffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      await page.setInputFiles('input[type="file"]', {
        name: 'large-file.json',
        mimeType: 'application/json',
        buffer,
      });
      
      // Should show size error
      await expect(page.getByText(/file too large|exceeds.*limit/i)).toBeVisible();
    });

    test('should handle corrupted file upload', async ({ page }) => {
      await page.goto('/test-cases/import');
      
      // Upload corrupted JSON
      const buffer = Buffer.from('{"invalid": json content}');
      await page.setInputFiles('input[type="file"]', {
        name: 'corrupted.json',
        mimeType: 'application/json',
        buffer,
      });
      
      // Should show parse error
      await expect(page.getByText(/invalid.*format|parse error/i)).toBeVisible();
    });
  });

  test.describe('Browser Compatibility Errors', () => {
    test('should handle unsupported browser features', async ({ page, browserName }) => {
      if (browserName !== 'webkit') {
        test.skip();
      }
      
      await page.goto('/');
      
      // Check for feature detection
      const hasWebGL = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      });
      
      if (!hasWebGL) {
        // Should show compatibility warning
        await expect(page.getByText(/browser.*not.*supported|compatibility/i)).toBeVisible();
      }
    });

    test('should handle disabled JavaScript', async ({ browser }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false,
      });
      const page = await context.newPage();
      
      await page.goto('/');
      
      // Should show noscript message
      await expect(page.getByText(/javascript.*required|enable.*javascript/i)).toBeVisible();
      
      await context.close();
    });

    test('should handle disabled cookies', async ({ context, page }) => {
      await context.clearCookies();
      await context.addCookies([]); // Clear all cookies
      
      // Block all cookies
      await context.route('**/*', route => {
        const headers = route.request().headers();
        delete headers['cookie'];
        route.continue({ headers });
      });
      
      await page.goto('/auth/signin');
      
      // Try to sign in
      await page.getByLabel('Personal Access Token').fill('valid-token');
      await page.getByRole('button', { name: 'Sign in' }).click();
      
      // Should show cookie error
      await expect(page.getByText(/cookies.*required|enable.*cookies/i)).toBeVisible();
    });
  });

  test.describe('Concurrent Action Errors', () => {
    test('should handle double-click on submit', async ({ page }) => {
      await page.goto('/test-cases/new');
      
      // Fill form
      await page.getByLabel('Title').fill('Test Case');
      await page.getByLabel('Description').fill('Description');
      
      // Double-click submit
      await page.getByRole('button', { name: 'Save' }).dblclick();
      
      // Should not create duplicate
      await page.waitForURL(/test-cases\/tc-/);
      
      // Go back to list
      await page.goto('/test-cases');
      
      // Count items with same title
      const count = await page.getByText('Test Case').count();
      expect(count).toBe(1);
    });

    test('should handle rapid navigation', async ({ page }) => {
      await page.goto('/');
      
      // Rapidly click multiple links
      const promises = [
        page.getByRole('link', { name: 'Test Cases' }).click(),
        page.getByRole('link', { name: 'Test Plans' }).click(),
        page.getByRole('link', { name: 'Test Runs' }).click(),
      ];
      
      await Promise.all(promises);
      
      // Should end up on one valid page
      await expect(page).toHaveURL(/\/(test-cases|test-plans|test-runs)/);
      
      // Page should be functional
      await expect(page.getByRole('heading')).toBeVisible();
    });
  });

  test.describe('Memory and Performance Errors', () => {
    test('should handle large data sets', async ({ page }) => {
      // Mock large response
      await page.route('**/api/testcases', route => {
        const largeData = Array(1000).fill(null).map((_, i) => ({
          id: `tc-${i}`,
          title: `Test Case ${i}`,
          description: 'x'.repeat(1000),
          priority: 'medium',
          tags: ['test'],
        }));
        
        route.fulfill({
          status: 200,
          body: JSON.stringify(largeData),
        });
      });
      
      await page.goto('/test-cases');
      
      // Should handle pagination or virtualization
      const visibleItems = await page.getByRole('row').count();
      expect(visibleItems).toBeLessThan(100); // Should not render all 1000 at once
    });

    test('should handle memory leaks', async ({ page }) => {
      await page.goto('/test-cases');
      
      // Perform actions that could leak memory
      for (let i = 0; i < 10; i++) {
        await page.getByRole('button', { name: 'Create Test Case' }).click();
        await page.getByRole('button', { name: 'Cancel' }).click();
      }
      
      // Check memory usage didn't explode
      const metrics = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      // Memory should be reasonable (< 100MB)
      expect(metrics).toBeLessThan(100 * 1024 * 1024);
    });
  });

  test.describe('Security Errors', () => {
    test('should prevent XSS attacks', async ({ page }) => {
      await page.goto('/test-cases/new');
      
      const xssPayload = '<img src=x onerror="window.xssTriggered=true">';
      
      // Enter XSS payload
      await page.getByLabel('Title').fill(xssPayload);
      await page.getByLabel('Description').fill(xssPayload);
      await page.getByRole('button', { name: 'Save' }).click();
      
      // Wait for navigation
      await page.waitForURL(/test-cases\/tc-/);
      
      // Check XSS didn't execute
      const xssTriggered = await page.evaluate(() => (window as any).xssTriggered);
      expect(xssTriggered).toBeUndefined();
    });

    test('should prevent clickjacking', async ({ page }) => {
      await page.goto('/');
      
      // Check X-Frame-Options or CSP
      const response = await page.goto('/');
      const headers = response?.headers() || {};
      
      const xFrameOptions = headers['x-frame-options'];
      const csp = headers['content-security-policy'];
      
      expect(
        xFrameOptions === 'DENY' || 
        xFrameOptions === 'SAMEORIGIN' ||
        csp?.includes('frame-ancestors')
      ).toBeTruthy();
    });
  });

  test.describe('State Management Errors', () => {
    test('should handle back button after form submission', async ({ page }) => {
      await page.goto('/test-cases/new');
      
      // Fill and submit form
      await page.getByLabel('Title').fill('Test Case');
      await page.getByLabel('Description').fill('Description');
      await page.getByRole('button', { name: 'Save' }).click();
      
      // Wait for redirect
      await page.waitForURL(/test-cases\/tc-/);
      
      // Go back
      await page.goBack();
      
      // Form should be cleared or show warning
      const titleValue = await page.getByLabel('Title').inputValue();
      expect(titleValue).toBe('');
    });

    test('should handle stale data after updates', async ({ page, context }) => {
      // Open two tabs
      const page1 = page;
      const page2 = await context.newPage();
      
      // Load same test case in both
      await page1.goto('/test-cases/tc-123');
      await page2.goto('/test-cases/tc-123');
      
      // Update in first tab
      await page1.getByRole('button', { name: 'Edit' }).click();
      await page1.getByLabel('Title').fill('Updated Title');
      await page1.getByRole('button', { name: 'Save' }).click();
      
      // Second tab should show stale data warning or auto-refresh
      await page2.reload();
      await expect(page2.getByText('Updated Title')).toBeVisible();
    });
  });

  test.describe('Accessibility Errors', () => {
    test('should handle keyboard navigation errors', async ({ page }) => {
      await page.goto('/');
      
      // Tab through page
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Should not get stuck in focus trap
      const activeElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(activeElement).toBeTruthy();
    });

    test('should provide error context for screen readers', async ({ page }) => {
      await page.goto('/test-cases/new');
      
      // Submit empty form
      await page.getByRole('button', { name: 'Save' }).click();
      
      // Error should be announced
      const errorRegion = page.getByRole('alert');
      await expect(errorRegion).toBeVisible();
      await expect(errorRegion).toContainText(/required|error/i);
    });
  });
});