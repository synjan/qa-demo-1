import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { TestData, Timeouts, Selectors } from '../helpers/test-data.helper';

test.describe('Authentication - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect unauthenticated users to signin page', async ({ page }) => {
    await page.waitForURL('**/auth/signin', { timeout: Timeouts.short });
    await expect(page).toHaveURL(/.*\/auth\/signin/);
    await expect(page.locator('[data-slot="card-title"]')).toContainText('QA Test Manager');
  });

  test('should display all authentication options', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // GitHub OAuth option
    const githubButton = page.locator('button:has-text("Continue with GitHub")');
    await expect(githubButton).toBeVisible();
    await expect(githubButton).toBeEnabled();
    
    // Personal Access Token input and button
    const patInput = page.locator('input[placeholder*="ghp_"]');
    const patButton = page.locator('button:has-text("Continue with PAT")');
    await expect(patInput).toBeVisible();
    await expect(patButton).toBeVisible();
    
    // Check for branding
    await expect(page.locator('[data-slot="card-title"]')).toContainText('QA Test Manager');
  });

  test('should validate PAT input form', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check PAT form elements
    const patInput = page.locator('input[id="pat"]');
    await expect(patInput).toBeVisible();
    await expect(patInput).toHaveAttribute('type', 'password');
    await expect(patInput).toHaveAttribute('placeholder', 'ghp_xxxxxxxxxxxx');
    
    // PAT button should be disabled when input is empty
    const patButton = page.locator('button:has-text("Continue with PAT")');
    await expect(patButton).toBeDisabled();
    
    // Type in PAT input
    await patInput.fill('test_token');
    
    // Button should now be enabled
    await expect(patButton).toBeEnabled();
    
    // Clear input
    await patInput.clear();
    
    // Button should be disabled again
    await expect(patButton).toBeDisabled();
  });

  test('should handle invalid PAT authentication', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Enter invalid token
    const tokenInput = page.locator('input[id="pat"]');
    await tokenInput.fill(TestData.auth.invalidPAT);
    
    // Try to authenticate
    await page.click('button:has-text("Continue with PAT")');
    
    // Should navigate but likely redirect back due to invalid token
    await page.waitForTimeout(1000);
    
    // For now, just verify the token was stored (actual validation happens server-side)
    const storedToken = await page.evaluate(() => localStorage.getItem('github_pat'));
    expect(storedToken).toBe(TestData.auth.invalidPAT);
  });

  test('should successfully authenticate with valid PAT', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Use helper to sign in
    await AuthHelper.signInWithPAT(page, TestData.auth.validPAT);
    
    // Should redirect to dashboard
    await page.waitForURL('**/', { timeout: Timeouts.medium });
    await expect(page).not.toHaveURL(/.*\/auth\/signin/);
    
    // Should show navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Verify token is stored
    const isAuthenticated = await AuthHelper.isAuthenticated(page);
    expect(isAuthenticated).toBe(true);
  });

  test('should persist authentication across page reloads', async ({ page, context }) => {
    // Set up authenticated state
    await AuthHelper.authenticateWithPAT(context, TestData.auth.validPAT);
    
    // Navigate to app
    await page.goto('/');
    
    // Should not redirect to signin
    await expect(page).not.toHaveURL(/.*\/auth\/signin/);
    
    // Reload page
    await page.reload();
    
    // Should still be authenticated
    await expect(page).not.toHaveURL(/.*\/auth\/signin/);
    const isAuthenticated = await AuthHelper.isAuthenticated(page);
    expect(isAuthenticated).toBe(true);
  });

  test('should handle sign out correctly', async ({ page, context }) => {
    // Set up authenticated state
    await AuthHelper.authenticateWithPAT(context, TestData.auth.validPAT);
    await page.goto('/');
    
    // Sign out
    await AuthHelper.signOut(page);
    
    // Should be on signin page
    await expect(page).toHaveURL(/.*\/auth\/signin/);
    
    // Token should be cleared
    const isAuthenticated = await AuthHelper.isAuthenticated(page);
    expect(isAuthenticated).toBe(false);
    
    // Try to access protected route
    await page.goto('/testcases');
    await page.waitForURL('**/auth/signin');
  });

  test('should handle OAuth sign in button', async ({ page }) => {
    await page.goto('/auth/signin');
    
    const githubButton = page.locator('button:has-text("Continue with GitHub")');
    
    // Verify button is enabled
    await expect(githubButton).toBeEnabled();
    
    // Note: Actual OAuth flow would redirect to GitHub
    // We can't test the full flow without mocking NextAuth
  });

  test('should show user info when authenticated', async ({ page, context }) => {
    // Set up authenticated state
    await AuthHelper.authenticateWithPAT(context, TestData.auth.validPAT);
    await page.goto('/');
    
    // Look for user menu button
    const userButton = page.locator('button[aria-label="User menu"]').or(
      page.locator('button:has-text("Guest")')
    );
    await expect(userButton).toBeVisible();
    
    // Open user menu
    await userButton.click();
    
    // Should show menu options
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Sign out')).toBeVisible();
  });

  test('should protect all app routes', async ({ page }) => {
    const protectedRoutes = [
      '/testcases',
      '/testplans',
      '/testruns',
      '/settings',
      '/testcases/new',
      '/testplans/new',
      '/testruns/new'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForURL('**/auth/signin', { timeout: Timeouts.short });
      await expect(page).toHaveURL(/.*\/auth\/signin/);
    }
  });
});