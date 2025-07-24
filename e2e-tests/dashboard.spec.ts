import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set up authenticated state
    await context.addInitScript(() => {
      localStorage.setItem('github_pat', 'test_token_123');
    });
    
    await page.goto('http://localhost:3000');
  });

  test('should display dashboard with main sections', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('h1:has-text("QA Test Manager")');
    
    // Check for main navigation items
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('a:has-text("Test Cases")')).toBeVisible();
    await expect(page.locator('a:has-text("Test Plans")')).toBeVisible();
    await expect(page.locator('a:has-text("Test Runs")')).toBeVisible();
    await expect(page.locator('a:has-text("Settings")')).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    // Check for statistics cards
    const statsSection = page.locator('[class*="grid"]:has([class*="card"])');
    await expect(statsSection).toBeVisible();
    
    // Verify statistic cards are present
    await expect(page.locator('text=Total Test Cases')).toBeVisible();
    await expect(page.locator('text=Active Test Plans')).toBeVisible();
    await expect(page.locator('text=Test Runs')).toBeVisible();
    await expect(page.locator('text=Pass Rate')).toBeVisible();
  });

  test('should navigate to Test Cases page', async ({ page }) => {
    // Click on Test Cases navigation
    await page.click('a:has-text("Test Cases")');
    
    // Verify URL changed
    await expect(page).toHaveURL(/.*\/testcases/);
    
    // Verify page content
    await expect(page.locator('h1')).toContainText('Test Cases');
  });

  test('should navigate to Test Plans page', async ({ page }) => {
    // Click on Test Plans navigation
    await page.click('a:has-text("Test Plans")');
    
    // Verify URL changed
    await expect(page).toHaveURL(/.*\/testplans/);
    
    // Verify page content
    await expect(page.locator('h1')).toContainText('Test Plans');
  });

  test('should navigate to Test Runs page', async ({ page }) => {
    // Click on Test Runs navigation
    await page.click('a:has-text("Test Runs")');
    
    // Verify URL changed
    await expect(page).toHaveURL(/.*\/testruns/);
    
    // Verify page content
    await expect(page.locator('h1')).toContainText('Test Runs');
  });

  test('should show recent activity section', async ({ page }) => {
    // Look for recent activity section
    const activitySection = page.locator('h2:has-text("Recent Activity")').locator('..');
    await expect(activitySection).toBeVisible();
  });

  test('should display user menu with correct options', async ({ page }) => {
    // Click on user menu
    const userButton = page.locator('button[aria-label="User menu"]').or(page.locator('button:has-text("Guest")'));
    await userButton.click();
    
    // Check menu items
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Sign out')).toBeVisible();
  });

  test('should handle dark mode toggle', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.locator('button[aria-label*="theme"]').or(page.locator('button:has([class*="sun"]), button:has([class*="moon"])'));
    
    if (await themeToggle.isVisible()) {
      // Get initial theme
      const initialTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      
      // Click theme toggle
      await themeToggle.click();
      
      // Verify theme changed
      const newTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      expect(newTheme).toBe(!initialTheme);
    }
  });
});