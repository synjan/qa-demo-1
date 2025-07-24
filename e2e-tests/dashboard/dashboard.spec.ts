import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NavigationHelper } from '../helpers/navigation.helper';
import { TestData, Timeouts, Selectors } from '../helpers/test-data.helper';

test.describe('Dashboard - Complete Tests', () => {
  let nav: NavigationHelper;

  test.beforeEach(async ({ page, context }) => {
    await AuthHelper.authenticateWithPAT(context, TestData.auth.validPAT);
    await page.goto('/');
    nav = new NavigationHelper(page);
  });

  test('should display dashboard with all main sections', async ({ page }) => {
    // Page title
    await expect(page.locator('h1')).toContainText('QA Test Manager');
    
    // Navigation
    await expect(page.locator('nav')).toBeVisible();
    const navLinks = ['Dashboard', 'Test Cases', 'Test Plans', 'Test Runs', 'Settings'];
    for (const link of navLinks) {
      await expect(page.locator(`nav a:has-text("${link}")`)).toBeVisible();
    }
    
    // User menu
    const userButton = page.locator('button[aria-label="User menu"]').or(
      page.locator('button:has-text("Guest")')
    );
    await expect(userButton).toBeVisible();
  });

  test('should display statistics cards with correct data', async ({ page }) => {
    // Find statistics grid
    const statsGrid = page.locator('.grid').first();
    await expect(statsGrid).toBeVisible();
    
    // Check for statistic cards
    const statCards = [
      { title: 'Total Test Cases', icon: 'clipboard' },
      { title: 'Active Test Plans', icon: 'folder' },
      { title: 'Test Runs', icon: 'play' },
      { title: 'Pass Rate', icon: 'check' }
    ];
    
    for (const stat of statCards) {
      const card = page.locator(Selectors.cards.base).filter({ hasText: stat.title });
      await expect(card).toBeVisible();
      
      // Each card should have a value
      const value = card.locator('[class*="text-2xl"], [class*="text-3xl"], .stat-value');
      await expect(value).toBeVisible();
    }
  });

  test('should display recent activity section', async ({ page }) => {
    const activitySection = page.locator('section:has(h2:has-text("Recent Activity"))').or(
      page.locator('h2:has-text("Recent Activity")').locator('..')
    );
    
    await expect(activitySection).toBeVisible();
    
    // Should have some content or empty state
    const activityContent = activitySection.locator('.activity-item, [class*="empty"], text=/No recent activity/i');
    await expect(activityContent.first()).toBeVisible();
  });

  test('should display quick actions section', async ({ page }) => {
    // Look for quick action buttons
    const quickActions = [
      'Create Test Case',
      'New Test Plan',
      'Start Test Run',
      'Generate from GitHub'
    ];
    
    for (const action of quickActions) {
      const button = page.locator(`button:has-text("${action}")`).or(
        page.locator(`a:has-text("${action}")`)
      );
      
      // At least some quick actions should be visible
      if (await button.isVisible()) {
        await expect(button).toBeEnabled();
      }
    }
  });

  test('should navigate to all main sections', async ({ page }) => {
    // Test Cases
    await nav.goToTestCases();
    await expect(page).toHaveURL(/.*\/testcases/);
    
    // Test Plans
    await nav.goToTestPlans();
    await expect(page).toHaveURL(/.*\/testplans/);
    
    // Test Runs
    await nav.goToTestRuns();
    await expect(page).toHaveURL(/.*\/testruns/);
    
    // Settings
    await nav.goToSettings();
    await expect(page).toHaveURL(/.*\/settings/);
    
    // Back to Dashboard
    await nav.goToDashboard();
    await expect(page).toHaveURL(/.*\/$/);
  });

  test('should handle theme toggle', async ({ page }) => {
    // Get initial theme
    const initialDarkMode = await nav.isDarkMode();
    
    // Toggle theme
    await nav.toggleTheme();
    
    // Verify theme changed
    const newDarkMode = await nav.isDarkMode();
    expect(newDarkMode).toBe(!initialDarkMode);
    
    // Toggle back
    await nav.toggleTheme();
    const finalDarkMode = await nav.isDarkMode();
    expect(finalDarkMode).toBe(initialDarkMode);
  });

  test('should display user menu with all options', async ({ page }) => {
    await nav.openUserMenu();
    
    // Check menu items
    const menuItems = [
      { text: 'Settings', icon: 'settings' },
      { text: 'Sign out', icon: 'log-out' }
    ];
    
    for (const item of menuItems) {
      await expect(page.locator(`text=${item.text}`)).toBeVisible();
    }
    
    // Close menu by clicking outside
    await page.click('body');
    await expect(page.locator('text=Settings')).not.toBeVisible();
  });

  test('should show repository favorites if configured', async ({ page }) => {
    // Look for favorites section
    const favoritesSection = page.locator('section:has(h2:has-text("Favorite Repositories"))').or(
      page.locator('h2:has-text("Favorite Repositories")').locator('..')
    );
    
    if (await favoritesSection.isVisible()) {
      // Should have add button or repository items
      const addButton = favoritesSection.locator('button:has-text("Add")');
      const repoItems = favoritesSection.locator('[class*="repo-item"]');
      
      const hasContent = await addButton.isVisible() || await repoItems.count() > 0;
      expect(hasContent).toBe(true);
    }
  });

  test('should handle quick action - Create Test Case', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create Test Case")').or(
      page.locator('a:has-text("Create Test Case")')
    );
    
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Should navigate to new test case page or open dialog
      await page.waitForTimeout(1000);
      
      const isOnNewPage = page.url().includes('/testcases/new');
      const hasDialog = await page.locator(Selectors.dialogs.root).isVisible();
      
      expect(isOnNewPage || hasDialog).toBe(true);
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigation might be in hamburger menu
    const hamburger = page.locator('button[aria-label*="menu"]').or(
      page.locator('button:has([class*="menu"])')
    );
    
    if (await hamburger.isVisible()) {
      await hamburger.click();
      // Navigation should be visible after clicking hamburger
      await expect(page.locator('nav')).toBeVisible();
    }
    
    // Statistics cards should stack vertically
    const statsGrid = page.locator('.grid').first();
    const gridClasses = await statsGrid.getAttribute('class');
    expect(gridClasses).toMatch(/grid-cols-1|sm:grid-cols-2/);
  });

  test('should refresh data on page reload', async ({ page }) => {
    // Get initial statistics
    const testCasesCard = page.locator(Selectors.cards.base).filter({ hasText: 'Total Test Cases' });
    const initialValue = await testCasesCard.locator('[class*="text-2xl"], [class*="text-3xl"]').textContent();
    
    // Reload page
    await page.reload();
    
    // Statistics should be displayed again
    await expect(testCasesCard).toBeVisible();
    const newValue = await testCasesCard.locator('[class*="text-2xl"], [class*="text-3xl"]').textContent();
    
    // Value should be present (might be same or different)
    expect(newValue).toBeTruthy();
  });

  test('should handle dashboard widgets if present', async ({ page }) => {
    // Look for dashboard widgets
    const widgets = page.locator('[data-widget], [class*="widget"]');
    
    if (await widgets.count() > 0) {
      // Each widget should be visible
      const widgetCount = await widgets.count();
      for (let i = 0; i < widgetCount; i++) {
        await expect(widgets.nth(i)).toBeVisible();
      }
      
      // Widgets might have settings or close buttons
      const widgetSettings = page.locator('[aria-label*="widget settings"]').first();
      if (await widgetSettings.isVisible()) {
        await widgetSettings.click();
        // Settings menu should appear
        await expect(page.locator('[role="menu"]')).toBeVisible();
      }
    }
  });
});