import { Page, BrowserContext } from '@playwright/test';

export class AuthHelper {
  /**
   * Set up authenticated state using Personal Access Token
   */
  static async authenticateWithPAT(context: BrowserContext, token: string = 'test_token_123') {
    await context.addInitScript((token) => {
      localStorage.setItem('github_pat', token);
    }, token);
  }

  /**
   * Clear authentication state
   */
  static async clearAuth(page: Page) {
    await page.evaluate(() => {
      localStorage.removeItem('github_pat');
      sessionStorage.clear();
    });
  }

  /**
   * Sign in using Personal Access Token through UI
   */
  static async signInWithPAT(page: Page, token: string = 'test_token_123') {
    await page.goto('/auth/signin');
    
    // Fill in token
    const tokenInput = page.locator('input[id="pat"]');
    await tokenInput.fill(token);
    
    // Submit
    await page.click('button:has-text("Continue with PAT")');
    
    // Wait for navigation
    await page.waitForURL('**/', { timeout: 5000 }).catch(() => {
      // If navigation fails, we're still on signin page
    });
  }

  /**
   * Sign out through UI
   */
  static async signOut(page: Page) {
    // Open user menu
    const userButton = page.locator('button[aria-label="User menu"]').or(
      page.locator('button:has-text("Guest")')
    );
    await userButton.click();
    
    // Click sign out
    await page.click('text=Sign out');
    
    // Wait for redirect
    await page.waitForURL('**/auth/signin');
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(page: Page): Promise<boolean> {
    const hasToken = await page.evaluate(() => {
      return !!localStorage.getItem('github_pat');
    });
    return hasToken;
  }
}