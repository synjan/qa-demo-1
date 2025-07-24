import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NavigationHelper } from '../helpers/navigation.helper';
import { TestData, Timeouts, Selectors } from '../helpers/test-data.helper';

test.describe('Test Cases - CRUD Operations', () => {
  let nav: NavigationHelper;

  test.beforeEach(async ({ page, context }) => {
    await AuthHelper.authenticateWithPAT(context, TestData.auth.validPAT);
    await page.goto('/testcases');
    nav = new NavigationHelper(page);
  });

  test('should display test cases list page', async ({ page }) => {
    // Page header
    await expect(page.locator('h1')).toContainText('Test Cases');
    
    // Action buttons
    const createButton = page.locator('button:has-text("Create Test Case")').or(
      page.locator('a:has-text("Create Test Case")')
    );
    const generateButton = page.locator('button:has-text("Generate from GitHub")');
    
    await expect(createButton.or(generateButton)).toBeVisible();
    
    // List or empty state
    const testCasesList = page.locator(Selectors.tables.root).or(
      page.locator('.grid').filter({ has: page.locator('[class*="test-case"]') })
    );
    const emptyState = page.locator('text=/No test cases|Create your first test case/i');
    
    await expect(testCasesList.or(emptyState)).toBeVisible();
  });

  test('should create a new test case manually', async ({ page }) => {
    // Click create button
    const createButton = page.locator('button:has-text("Create Test Case")').or(
      page.locator('a:has-text("Create Test Case")')
    );
    await createButton.click();
    
    // Should navigate to new test case form or open dialog
    await page.waitForTimeout(1000);
    
    const isOnNewPage = page.url().includes('/testcases/new');
    const hasDialog = await page.locator(Selectors.dialogs.root).isVisible();
    
    if (isOnNewPage) {
      // Fill form on new page
      await fillTestCaseForm(page);
      
      // Save
      await page.click('button:has-text("Save")');
      
      // Should redirect to test case detail or list
      await page.waitForURL(/\/testcases(?:\/|$)/, { timeout: Timeouts.medium });
    } else if (hasDialog) {
      // Fill form in dialog
      await fillTestCaseFormInDialog(page);
      
      // Save
      await page.click('[role="dialog"] button:has-text("Save")');
      
      // Dialog should close
      await expect(page.locator(Selectors.dialogs.root)).not.toBeVisible();
    }
    
    // Verify test case was created
    await page.waitForTimeout(1000);
    await expect(page.locator('text="Test User Login"')).toBeVisible();
  });

  test('should generate test cases from GitHub issues', async ({ page }) => {
    // Click generate button
    await page.click('button:has-text("Generate from GitHub")');
    
    // Repository selection dialog
    await expect(page.locator(Selectors.dialogs.root)).toBeVisible();
    await expect(page.locator('h2')).toContainText(/Select.*Repository|Choose.*Repository/i);
    
    // Select repository
    const repoSelect = page.locator('button[role="combobox"]').or(
      page.locator('select')
    );
    await repoSelect.click();
    
    // Type to search or select first option
    const searchInput = page.locator('input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(TestData.repositories.valid.name);
    }
    
    // Select repository option
    const repoOption = page.locator(`[role="option"]:has-text("${TestData.repositories.valid.name}")`).or(
      page.locator('option').first()
    );
    
    if (await repoOption.isVisible()) {
      await repoOption.click();
      
      // Wait for issues to load
      await page.waitForTimeout(2000);
      
      // Select issues
      const issueCheckboxes = page.locator('input[type="checkbox"][name*="issue"]');
      const checkboxCount = await issueCheckboxes.count();
      
      if (checkboxCount > 0) {
        // Select first issue
        await issueCheckboxes.first().check();
        
        // OpenAI API key might be required
        const apiKeyInput = page.locator('input[placeholder*="API"]');
        if (await apiKeyInput.isVisible()) {
          await apiKeyInput.fill(TestData.openai.apiKey);
        }
        
        // Generate
        const generateBtn = page.locator('[role="dialog"] button:has-text("Generate")');
        await generateBtn.click();
        
        // Wait for generation (this would normally call OpenAI)
        await page.waitForTimeout(3000);
        
        // Should show success or close dialog
        const successMessage = page.locator('text=/Generated|Success/i');
        const dialogClosed = !(await page.locator(Selectors.dialogs.root).isVisible());
        
        expect(await successMessage.isVisible() || dialogClosed).toBe(true);
      }
    }
  });

  test('should view test case details', async ({ page }) => {
    // Find a test case link
    const testCaseLink = page.locator('a[href*="/testcases/"]').first().or(
      page.locator('[class*="test-case"]').locator('a').first()
    );
    
    if (await testCaseLink.isVisible()) {
      const testCaseTitle = await testCaseLink.textContent();
      await testCaseLink.click();
      
      // Should navigate to detail page
      await expect(page).toHaveURL(/\/testcases\/[^\/]+$/);
      
      // Should show test case details
      await expect(page.locator('h1')).toContainText(testCaseTitle || 'Test Case');
      
      // Key sections
      await expect(page.locator('text=Description')).toBeVisible();
      await expect(page.locator('text=Preconditions')).toBeVisible();
      await expect(page.locator('text=Test Steps')).toBeVisible();
      await expect(page.locator('text=Expected Results')).toBeVisible();
      
      // Action buttons
      await expect(page.locator('button:has-text("Edit")').or(
        page.locator('a:has-text("Edit")')
      )).toBeVisible();
    }
  });

  test('should edit an existing test case', async ({ page }) => {
    // Navigate to a test case
    const testCaseLink = page.locator('a[href*="/testcases/"]').first();
    
    if (await testCaseLink.isVisible()) {
      await testCaseLink.click();
      await page.waitForURL(/\/testcases\/[^\/]+$/);
      
      // Click edit button
      const editButton = page.locator('button:has-text("Edit")').or(
        page.locator('a:has-text("Edit")')
      );
      await editButton.click();
      
      // Should show edit form
      await page.waitForTimeout(1000);
      
      // Update title
      const titleInput = page.locator('input[name="title"]').or(
        page.locator('input[placeholder*="Title"]')
      );
      await titleInput.clear();
      await titleInput.fill('Updated Test Case Title');
      
      // Save changes
      await page.click('button:has-text("Save")');
      
      // Should show updated title
      await expect(page.locator('h1')).toContainText('Updated Test Case Title');
    }
  });

  test('should delete a test case', async ({ page }) => {
    // Navigate to a test case
    const testCaseLink = page.locator('a[href*="/testcases/"]').first();
    
    if (await testCaseLink.isVisible()) {
      const testCaseTitle = await testCaseLink.textContent();
      await testCaseLink.click();
      await page.waitForURL(/\/testcases\/[^\/]+$/);
      
      // Click delete button
      const deleteButton = page.locator('button:has-text("Delete")').or(
        page.locator('button[data-variant="destructive"]')
      );
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm deletion
        const confirmDialog = page.locator(Selectors.dialogs.root);
        if (await confirmDialog.isVisible()) {
          await page.click('[role="dialog"] button:has-text("Delete")');
        }
        
        // Should redirect to list
        await page.waitForURL(/\/testcases(?:\/)?$/, { timeout: Timeouts.medium });
        
        // Test case should not be in list
        await expect(page.locator(`text="${testCaseTitle}"`)).not.toBeVisible();
      }
    }
  });

  test('should filter and search test cases', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator(Selectors.inputs.search);
    
    if (await searchInput.isVisible()) {
      // Search for a specific term
      await searchInput.fill('login');
      await searchInput.press('Enter');
      
      // Wait for results
      await page.waitForTimeout(1000);
      
      // Results should be filtered
      const testCases = page.locator('[class*="test-case"]');
      if (await testCases.count() > 0) {
        // All visible test cases should contain search term
        const count = await testCases.count();
        for (let i = 0; i < count; i++) {
          const text = await testCases.nth(i).textContent();
          expect(text?.toLowerCase()).toContain('login');
        }
      }
    }
  });

  test('should handle test case validation', async ({ page }) => {
    // Create new test case
    const createButton = page.locator('button:has-text("Create Test Case")').or(
      page.locator('a:has-text("Create Test Case")')
    );
    await createButton.click();
    
    // Try to save without required fields
    await page.waitForTimeout(1000);
    const saveButton = page.locator('button:has-text("Save")');
    await saveButton.click();
    
    // Should show validation errors
    const errorMessages = page.locator('[class*="error"], [role="alert"]');
    await expect(errorMessages.first()).toBeVisible();
  });
});

// Helper functions
async function fillTestCaseForm(page: any) {
  const testCase = TestData.testCases.basic;
  
  // Title
  await page.fill('input[name="title"]', testCase.title);
  
  // Description
  await page.fill('textarea[name="description"]', testCase.description);
  
  // Preconditions
  await page.fill('textarea[name="preconditions"]', testCase.preconditions);
  
  // Steps (might be dynamic)
  const stepsContainer = page.locator('[data-testid="test-steps"]').or(
    page.locator('fieldset:has-text("Test Steps")')
  );
  
  if (await stepsContainer.isVisible()) {
    for (let i = 0; i < testCase.steps.length; i++) {
      const stepInput = stepsContainer.locator(`input[name="steps.${i}"]`).or(
        stepsContainer.locator('input').nth(i)
      );
      if (await stepInput.isVisible()) {
        await stepInput.fill(testCase.steps[i]);
      }
      
      // Add new step if needed
      if (i < testCase.steps.length - 1) {
        const addStepButton = stepsContainer.locator('button:has-text("Add Step")');
        if (await addStepButton.isVisible()) {
          await addStepButton.click();
        }
      }
    }
  }
}

async function fillTestCaseFormInDialog(page: any) {
  const dialog = page.locator(Selectors.dialogs.root);
  const testCase = TestData.testCases.basic;
  
  // Title
  await dialog.locator('input[name="title"]').fill(testCase.title);
  
  // Description
  await dialog.locator('textarea[name="description"]').fill(testCase.description);
  
  // Other fields as available
  const preconditionsField = dialog.locator('textarea[name="preconditions"]');
  if (await preconditionsField.isVisible()) {
    await preconditionsField.fill(testCase.preconditions);
  }
}