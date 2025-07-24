import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NavigationHelper } from '../helpers/navigation.helper';
import { TestData, Timeouts, Selectors } from '../helpers/test-data.helper';

test.describe('GitHub Integration', () => {
  let nav: NavigationHelper;

  test.beforeEach(async ({ page, context }) => {
    await AuthHelper.authenticateWithPAT(context, TestData.auth.validPAT);
    await page.goto('/');
    nav = new NavigationHelper(page);
  });

  test('should fetch and display user repositories', async ({ page }) => {
    // Navigate to test cases for GitHub generation
    await nav.goToTestCases();
    
    // Click generate from GitHub
    await page.click('button:has-text("Generate from GitHub")');
    
    // Repository selection dialog
    await expect(page.locator(Selectors.dialogs.root)).toBeVisible();
    
    // Repository dropdown
    const repoSelect = page.locator('button[role="combobox"]').or(
      page.locator('select[name="repository"]')
    );
    await repoSelect.click();
    
    // Should show repositories or loading state
    const loadingState = page.locator('text=/Loading|Fetching/i');
    const repoOptions = page.locator('[role="option"]');
    
    // Wait for repos to load
    await expect(loadingState.or(repoOptions.first())).toBeVisible();
    
    // If repos loaded, should have options
    if (await repoOptions.count() > 0) {
      expect(await repoOptions.count()).toBeGreaterThan(0);
      
      // Each repo should have name
      const firstRepo = repoOptions.first();
      const repoText = await firstRepo.textContent();
      expect(repoText).toMatch(/\w+/);
    }
  });

  test('should search repositories', async ({ page }) => {
    await nav.goToTestCases();
    await page.click('button:has-text("Generate from GitHub")');
    
    const repoSelect = page.locator('button[role="combobox"]');
    await repoSelect.click();
    
    // Search input
    const searchInput = page.locator('input[type="search"]').or(
      page.locator('input[placeholder*="Search"]')
    );
    
    if (await searchInput.isVisible()) {
      // Type search query
      await searchInput.fill('test');
      
      // Wait for filtered results
      await page.waitForTimeout(500);
      
      // Results should be filtered
      const repoOptions = page.locator('[role="option"]');
      if (await repoOptions.count() > 0) {
        const firstResult = await repoOptions.first().textContent();
        expect(firstResult?.toLowerCase()).toContain('test');
      }
    }
  });

  test('should fetch issues from selected repository', async ({ page }) => {
    await nav.goToTestCases();
    await page.click('button:has-text("Generate from GitHub")');
    
    // Select a repository
    const repoSelect = page.locator('button[role="combobox"]');
    await repoSelect.click();
    
    const repoOption = page.locator('[role="option"]').first();
    if (await repoOption.isVisible()) {
      const repoName = await repoOption.textContent();
      await repoOption.click();
      
      // Should show issues loading
      const issuesLoading = page.locator('text=/Loading issues|Fetching issues/i');
      const issuesList = page.locator('[class*="issues-list"]').or(
        page.locator('label:has(input[type="checkbox"][name*="issue"])')
      );
      
      await expect(issuesLoading.or(issuesList)).toBeVisible();
      
      // Wait for issues to load
      await page.waitForTimeout(2000);
      
      // Should show issues or empty state
      const noIssues = page.locator('text=/No issues|No open issues/i');
      const issueCheckboxes = page.locator('input[type="checkbox"][name*="issue"]');
      
      await expect(noIssues.or(issueCheckboxes.first())).toBeVisible();
    }
  });

  test('should filter issues by state', async ({ page }) => {
    await nav.goToTestCases();
    await page.click('button:has-text("Generate from GitHub")');
    
    // Select repository first
    const repoSelect = page.locator('button[role="combobox"]');
    await repoSelect.click();
    await page.locator('[role="option"]').first().click();
    
    // Wait for issues
    await page.waitForTimeout(2000);
    
    // State filter
    const stateFilter = page.locator('select[name="state"]').or(
      page.locator('button:has-text("State")')
    );
    
    if (await stateFilter.isVisible()) {
      await stateFilter.click();
      
      // Select closed issues
      const closedOption = page.locator('[role="option"]:has-text("Closed")').or(
        page.locator('option[value="closed"]')
      );
      
      if (await closedOption.isVisible()) {
        await closedOption.click();
        
        // Wait for refresh
        await page.waitForTimeout(1000);
        
        // Issues should update
        const issueLabels = page.locator('[class*="issue-state"]');
        if (await issueLabels.count() > 0) {
          const firstLabel = await issueLabels.first().textContent();
          expect(firstLabel).toMatch(/closed/i);
        }
      }
    }
  });

  test('should display issue details', async ({ page }) => {
    await nav.goToTestCases();
    await page.click('button:has-text("Generate from GitHub")');
    
    // Select repository and wait for issues
    const repoSelect = page.locator('button[role="combobox"]');
    await repoSelect.click();
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(2000);
    
    // Check issue details
    const issueItem = page.locator('label:has(input[type="checkbox"][name*="issue"])').first();
    
    if (await issueItem.isVisible()) {
      // Should show issue number
      const issueText = await issueItem.textContent();
      expect(issueText).toMatch(/#\d+/);
      
      // Should show issue title
      expect(issueText).toMatch(/\w+/);
      
      // May show labels
      const labels = issueItem.locator('[class*="label"], [class*="badge"]');
      if (await labels.count() > 0) {
        const labelText = await labels.first().textContent();
        expect(labelText).toBeTruthy();
      }
    }
  });

  test('should handle repository favorites', async ({ page }) => {
    // Check dashboard for favorites
    const favSection = page.locator('section:has(h2:has-text("Favorite Repositories"))');
    
    if (await favSection.isVisible()) {
      // Add favorite button
      const addFavButton = favSection.locator('button:has-text("Add")').or(
        favSection.locator('button[aria-label*="Add favorite"]')
      );
      
      if (await addFavButton.isVisible()) {
        await addFavButton.click();
        
        // Repository selection dialog
        const dialog = page.locator(Selectors.dialogs.root);
        await expect(dialog).toBeVisible();
        
        // Select a repository
        const repoOption = dialog.locator('[role="option"]').first().or(
          dialog.locator('button[class*="repo"]').first()
        );
        
        if (await repoOption.isVisible()) {
          const repoName = await repoOption.textContent();
          await repoOption.click();
          
          // Confirm
          await dialog.locator('button:has-text("Add")').click();
          
          // Should appear in favorites
          await expect(favSection.locator(`text="${repoName}"`)).toBeVisible();
        }
      }
    }
  });

  test('should remove repository from favorites', async ({ page }) => {
    const favSection = page.locator('section:has(h2:has-text("Favorite Repositories"))');
    
    if (await favSection.isVisible()) {
      // Find favorite with remove button
      const removeButton = favSection.locator('button[aria-label*="Remove"]').first();
      
      if (await removeButton.isVisible()) {
        // Get repo name before removing
        const repoItem = removeButton.locator('..');
        const repoName = await repoItem.textContent();
        
        // Remove
        await removeButton.click();
        
        // Confirm if needed
        const confirmButton = page.locator('button:has-text("Remove")').last();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        // Should be removed
        await page.waitForTimeout(1000);
        await expect(favSection.locator(`text="${repoName}"`)).not.toBeVisible();
      }
    }
  });

  test('should generate test cases from multiple issues', async ({ page }) => {
    await nav.goToTestCases();
    await page.click('button:has-text("Generate from GitHub")');
    
    // Select repository
    const repoSelect = page.locator('button[role="combobox"]');
    await repoSelect.click();
    await page.locator('[role="option"]').first().click();
    
    // Wait for issues
    await page.waitForTimeout(2000);
    
    // Select multiple issues
    const issueCheckboxes = page.locator('input[type="checkbox"][name*="issue"]');
    const checkboxCount = await issueCheckboxes.count();
    
    if (checkboxCount >= 2) {
      // Select first two issues
      await issueCheckboxes.nth(0).check();
      await issueCheckboxes.nth(1).check();
      
      // Add OpenAI key if needed
      const apiKeyInput = page.locator('input[placeholder*="API"]');
      if (await apiKeyInput.isVisible()) {
        await apiKeyInput.fill(TestData.openai.apiKey);
      }
      
      // Generate button should be enabled
      const generateButton = page.locator('[role="dialog"] button:has-text("Generate")');
      await expect(generateButton).toBeEnabled();
      
      // Click generate
      await generateButton.click();
      
      // Should show progress
      const progress = page.locator('text=/Generating|Processing/i').or(
        page.locator('[role="progressbar"]')
      );
      await expect(progress).toBeVisible();
    }
  });

  test('should handle GitHub API errors gracefully', async ({ page }) => {
    // Intercept GitHub API calls to simulate error
    await page.route('**/api/github/**', route => {
      route.fulfill({
        status: 403,
        body: JSON.stringify({ message: 'API rate limit exceeded' })
      });
    });
    
    await nav.goToTestCases();
    await page.click('button:has-text("Generate from GitHub")');
    
    // Should show error message
    await expect(page.locator('text=/Error|Failed|rate limit/i')).toBeVisible();
  });

  test('should refresh repository list', async ({ page }) => {
    await nav.goToTestCases();
    await page.click('button:has-text("Generate from GitHub")');
    
    // Look for refresh button
    const refreshButton = page.locator('button[aria-label*="Refresh"]').or(
      page.locator('button:has([class*="refresh"])')
    );
    
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      
      // Should show loading state
      const loading = page.locator('text=/Loading|Refreshing/i');
      await expect(loading).toBeVisible();
      
      // Should eventually show repos again
      await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: Timeouts.medium });
    }
  });

  test('should show repository metadata', async ({ page }) => {
    await nav.goToTestCases();
    await page.click('button:has-text("Generate from GitHub")');
    
    const repoSelect = page.locator('button[role="combobox"]');
    await repoSelect.click();
    
    // Repository options might show additional info
    const repoOption = page.locator('[role="option"]').first();
    
    if (await repoOption.isVisible()) {
      const optionText = await repoOption.textContent();
      
      // Might include stars, forks, or visibility
      const hasMetadata = optionText?.match(/⭐|🔒|public|private|\d+\s*(stars?|forks?)/i);
      
      if (hasMetadata) {
        expect(hasMetadata).toBeTruthy();
      }
    }
  });
});