import { test, expect } from '@playwright/test';

test.describe('Basic Smoke Tests', () => {
  test('should load the application', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Check if page loads (either shows dashboard or redirects to signin)
    await expect(page).toHaveURL(/(localhost:3000|auth\/signin)/);
    
    // Page should have some content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have signin page', async ({ page }) => {
    // Go directly to signin
    await page.goto('http://localhost:3000/auth/signin');
    
    // Should load signin page
    await expect(page).toHaveURL(/auth\/signin/);
    
    // Should have signin content - look for the card title specifically
    await expect(page.locator('[data-slot="card-title"]')).toContainText('QA Test Manager');
  });

  test('should show 404 for invalid route', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('http://localhost:3000/non-existent-page');
    
    // Should show 404 or error content
    await expect(page.locator('text=/404|not found/i')).toBeVisible();
  });
});