import { Page, expect } from '@playwright/test';

export class NavigationHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goToDashboard() {
    await this.page.click('a:has-text("Dashboard")');
    await this.page.waitForURL('**/');
    await expect(this.page.locator('h1')).toContainText('QA Test Manager');
  }

  async goToTestCases() {
    await this.page.click('a:has-text("Test Cases")');
    await this.page.waitForURL('**/testcases');
    await expect(this.page.locator('h1')).toContainText('Test Cases');
  }

  async goToTestPlans() {
    await this.page.click('a:has-text("Test Plans")');
    await this.page.waitForURL('**/testplans');
    await expect(this.page.locator('h1')).toContainText('Test Plans');
  }

  async goToTestRuns() {
    await this.page.click('a:has-text("Test Runs")');
    await this.page.waitForURL('**/testruns');
    await expect(this.page.locator('h1')).toContainText('Test Runs');
  }

  async goToSettings() {
    await this.page.click('a:has-text("Settings")');
    await this.page.waitForURL('**/settings');
    await expect(this.page.locator('h1')).toContainText('Settings');
  }

  async openUserMenu() {
    const userButton = this.page.locator('button[aria-label="User menu"]').or(
      this.page.locator('button:has-text("Guest")')
    );
    await userButton.click();
  }

  async toggleTheme() {
    const themeToggle = this.page.locator('button[aria-label*="theme"]').or(
      this.page.locator('button:has([class*="sun"]), button:has([class*="moon"])')
    );
    
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
    }
  }

  async isDarkMode(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });
  }
}