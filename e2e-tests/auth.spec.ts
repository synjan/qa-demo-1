import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should redirect unauthenticated users to signin page', async ({ page }) => {
    // Wait for redirect
    await page.waitForURL('**/auth/signin');
    
    // Verify we're on the signin page
    await expect(page).toHaveURL(/.*\/auth\/signin/);
    await expect(page.locator('h1')).toContainText('Sign in to QA Test Manager');
  });

  test('should show both authentication options', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signin');
    
    // Check for GitHub OAuth button
    const githubButton = page.locator('button:has-text("Sign in with GitHub")');
    await expect(githubButton).toBeVisible();
    
    // Check for Personal Access Token option
    const patButton = page.locator('button:has-text("Use Personal Access Token")');
    await expect(patButton).toBeVisible();
  });

  test('should handle Personal Access Token authentication', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signin');
    
    // Click on PAT option
    await page.click('button:has-text("Use Personal Access Token")');
    
    // Check if dialog opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('GitHub Personal Access Token');
    
    // Find token input
    const tokenInput = page.locator('input[type="password"]');
    await expect(tokenInput).toBeVisible();
    
    // Test with invalid token
    await tokenInput.fill('invalid_token_123');
    await page.click('button:has-text("Authenticate")');
    
    // Should show error (implementation may vary)
    // Note: Actual error handling depends on your implementation
  });

  test('should persist authentication state', async ({ page, context }) => {
    // Simulate authenticated state by setting localStorage
    await context.addInitScript(() => {
      localStorage.setItem('github_pat', 'test_token_123');
    });
    
    await page.goto('http://localhost:3000');
    
    // Should not redirect to signin
    await expect(page).not.toHaveURL(/.*\/auth\/signin/);
    
    // Should show navigation
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should handle sign out', async ({ page, context }) => {
    // Set up authenticated state
    await context.addInitScript(() => {
      localStorage.setItem('github_pat', 'test_token_123');
    });
    
    await page.goto('http://localhost:3000');
    
    // Find and click user menu
    const userButton = page.locator('button[aria-label="User menu"]').or(page.locator('button:has-text("Guest")'));
    await userButton.click();
    
    // Click sign out
    await page.click('text=Sign out');
    
    // Should redirect to signin
    await page.waitForURL('**/auth/signin');
    
    // Verify localStorage is cleared
    const hasToken = await page.evaluate(() => localStorage.getItem('github_pat'));
    expect(hasToken).toBeNull();
  });
});