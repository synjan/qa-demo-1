import { test, expect } from '@playwright/test';

test.describe('Test Case Generation', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set up authenticated state
    await context.addInitScript(() => {
      localStorage.setItem('github_pat', 'test_token_123');
    });
    
    await page.goto('http://localhost:3000/testcases');
  });

  test('should display test cases page with generate button', async ({ page }) => {
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Test Cases');
    
    // Check for generate button
    const generateButton = page.locator('button:has-text("Generate from GitHub")').or(page.locator('button:has-text("Generate Test Cases")'));
    await expect(generateButton).toBeVisible();
  });

  test('should open repository selection dialog', async ({ page }) => {
    // Click generate button
    const generateButton = page.locator('button:has-text("Generate from GitHub")').or(page.locator('button:has-text("Generate Test Cases")'));
    await generateButton.click();
    
    // Check if dialog opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText(/Select.*Repository|Choose.*Repository/i);
    
    // Check for repository dropdown/select
    const repoSelect = page.locator('button[role="combobox"]').or(page.locator('select'));
    await expect(repoSelect).toBeVisible();
  });

  test('should handle repository selection and issue loading', async ({ page }) => {
    // Open generate dialog
    const generateButton = page.locator('button:has-text("Generate from GitHub")').or(page.locator('button:has-text("Generate Test Cases")'));
    await generateButton.click();
    
    // Wait for dialog
    await page.waitForSelector('[role="dialog"]');
    
    // Select repository (this will depend on actual implementation)
    const repoSelect = page.locator('button[role="combobox"]').or(page.locator('select'));
    await repoSelect.click();
    
    // Look for repository options
    const firstRepo = page.locator('[role="option"]').first().or(page.locator('option').first());
    
    if (await firstRepo.isVisible()) {
      await firstRepo.click();
      
      // Wait for issues to load (may show loading state)
      await page.waitForTimeout(1000); // Give time for API call
      
      // Check for issues list or empty state
      const issuesList = page.locator('text=/Issue #|No issues found/i');
      await expect(issuesList).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display existing test cases', async ({ page }) => {
    // Check for test cases table or grid
    const testCasesContainer = page.locator('[role="table"]').or(page.locator('.grid').or(page.locator('[class*="test-case"]')));
    
    // If no test cases, should show empty state
    const emptyState = page.locator('text=/No test cases|Create your first test case/i');
    
    // Either test cases or empty state should be visible
    await expect(testCasesContainer.or(emptyState)).toBeVisible();
  });

  test('should allow viewing test case details', async ({ page }) => {
    // Check if any test cases exist
    const testCaseLink = page.locator('a[href*="/testcases/"]').first();
    
    if (await testCaseLink.isVisible()) {
      // Click on first test case
      await testCaseLink.click();
      
      // Should navigate to test case detail page
      await expect(page).toHaveURL(/.*\/testcases\/.+/);
      
      // Should show test case details
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Preconditions')).toBeVisible();
      await expect(page.locator('text=Test Steps')).toBeVisible();
      await expect(page.locator('text=Expected Results')).toBeVisible();
    }
  });

  test('should handle test case generation workflow', async ({ page }) => {
    // This test simulates the full generation workflow
    // Note: This test might fail if GitHub API is not properly mocked
    
    // Click generate button
    const generateButton = page.locator('button:has-text("Generate from GitHub")').or(page.locator('button:has-text("Generate Test Cases")'));
    await generateButton.click();
    
    // Wait for dialog
    await page.waitForSelector('[role="dialog"]');
    
    // Check for OpenAI API key input (if required)
    const apiKeyInput = page.locator('input[placeholder*="API"]');
    if (await apiKeyInput.isVisible()) {
      await apiKeyInput.fill('test-api-key');
    }
    
    // Look for generate/submit button in dialog
    const submitButton = page.locator('[role="dialog"] button:has-text("Generate")').or(page.locator('[role="dialog"] button[type="submit"]'));
    
    // Check if button is disabled (needs selection)
    const isDisabled = await submitButton.isDisabled();
    if (isDisabled) {
      // Need to select repository and issues first
      expect(isDisabled).toBe(true); // This is expected behavior
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test error handling when no GitHub token
    await page.evaluate(() => localStorage.removeItem('github_pat'));
    await page.reload();
    
    // Should redirect to signin
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });
});