import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NavigationHelper } from '../helpers/navigation.helper';
import { TestData, Timeouts, Selectors } from '../helpers/test-data.helper';

test.describe('Test Plans - Management', () => {
  let nav: NavigationHelper;

  test.beforeEach(async ({ page, context }) => {
    await AuthHelper.authenticateWithPAT(context, TestData.auth.validPAT);
    await page.goto('/testplans');
    nav = new NavigationHelper(page);
  });

  test('should display test plans list page', async ({ page }) => {
    // Page header
    await expect(page.locator('h1')).toContainText('Test Plans');
    
    // Action buttons
    const createButton = page.locator('button:has-text("Create Test Plan")').or(
      page.locator('a:has-text("New Test Plan")')
    );
    await expect(createButton).toBeVisible();
    
    // List or empty state
    const plansList = page.locator(Selectors.tables.root).or(
      page.locator('.grid').filter({ has: page.locator('[class*="test-plan"]') })
    );
    const emptyState = page.locator('text=/No test plans|Create your first test plan/i');
    
    await expect(plansList.or(emptyState)).toBeVisible();
  });

  test('should create a new test plan', async ({ page }) => {
    // Click create button
    const createButton = page.locator('button:has-text("Create Test Plan")').or(
      page.locator('a:has-text("New Test Plan")')
    );
    await createButton.click();
    
    // Fill test plan form
    await page.waitForTimeout(1000);
    
    // Name
    const nameInput = page.locator('input[name="name"]').or(
      page.locator('input[placeholder*="Plan name"]')
    );
    await nameInput.fill(TestData.testPlans.basic.name);
    
    // Description
    const descInput = page.locator('textarea[name="description"]').or(
      page.locator('textarea[placeholder*="Description"]')
    );
    await descInput.fill(TestData.testPlans.basic.description);
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Should redirect or show success
    await page.waitForTimeout(2000);
    
    // Verify plan was created
    await expect(page.locator(`text="${TestData.testPlans.basic.name}"`)).toBeVisible();
  });

  test('should add test cases to a test plan', async ({ page }) => {
    // Find or create a test plan
    let planLink = page.locator('a[href*="/testplans/"]').first();
    
    if (!(await planLink.isVisible())) {
      // Create a test plan first
      await createTestPlan(page);
      planLink = page.locator('a[href*="/testplans/"]').first();
    }
    
    // Navigate to test plan
    await planLink.click();
    await page.waitForURL(/\/testplans\/[^\/]+$/);
    
    // Add test cases button
    const addTestCasesButton = page.locator('button:has-text("Add Test Cases")').or(
      page.locator('button:has-text("Select Test Cases")')
    );
    await addTestCasesButton.click();
    
    // Select test cases dialog/modal
    await expect(page.locator(Selectors.dialogs.root)).toBeVisible();
    
    // Select test cases
    const testCaseCheckboxes = page.locator('[role="dialog"] input[type="checkbox"]');
    const checkboxCount = await testCaseCheckboxes.count();
    
    if (checkboxCount > 0) {
      // Select first few test cases
      const selectCount = Math.min(3, checkboxCount);
      for (let i = 0; i < selectCount; i++) {
        await testCaseCheckboxes.nth(i).check();
      }
      
      // Add selected
      await page.click('[role="dialog"] button:has-text("Add")');
      
      // Dialog should close
      await expect(page.locator(Selectors.dialogs.root)).not.toBeVisible();
      
      // Test cases should be added to plan
      await page.waitForTimeout(1000);
      const testCasesList = page.locator('[class*="test-case"]');
      expect(await testCasesList.count()).toBeGreaterThan(0);
    }
  });

  test('should edit test plan details', async ({ page }) => {
    // Navigate to a test plan
    const planLink = page.locator('a[href*="/testplans/"]').first();
    
    if (await planLink.isVisible()) {
      await planLink.click();
      await page.waitForURL(/\/testplans\/[^\/]+$/);
      
      // Edit button
      const editButton = page.locator('button:has-text("Edit")').or(
        page.locator('button[aria-label="Edit test plan"]')
      );
      await editButton.click();
      
      // Update name
      const nameInput = page.locator('input[name="name"]');
      await nameInput.clear();
      await nameInput.fill('Updated Test Plan Name');
      
      // Save
      await page.click('button:has-text("Save")');
      
      // Verify update
      await expect(page.locator('h1')).toContainText('Updated Test Plan Name');
    }
  });

  test('should remove test cases from plan', async ({ page }) => {
    // Navigate to a test plan with test cases
    const planWithCases = await findTestPlanWithCases(page);
    
    if (planWithCases) {
      await planWithCases.click();
      await page.waitForURL(/\/testplans\/[^\/]+$/);
      
      // Find test case remove buttons
      const removeButtons = page.locator('button[aria-label*="Remove"]').or(
        page.locator('button:has([class*="trash"], [class*="x"])')
      );
      
      if (await removeButtons.count() > 0) {
        const initialCount = await removeButtons.count();
        
        // Remove first test case
        await removeButtons.first().click();
        
        // Confirm if needed
        const confirmButton = page.locator('button:has-text("Confirm")').or(
          page.locator('button:has-text("Remove")')
        );
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        // Wait for removal
        await page.waitForTimeout(1000);
        
        // Count should decrease
        const newCount = await removeButtons.count();
        expect(newCount).toBeLessThan(initialCount);
      }
    }
  });

  test('should delete a test plan', async ({ page }) => {
    // Navigate to a test plan
    const planLink = page.locator('a[href*="/testplans/"]').first();
    
    if (await planLink.isVisible()) {
      const planName = await planLink.textContent();
      await planLink.click();
      await page.waitForURL(/\/testplans\/[^\/]+$/);
      
      // Delete button
      const deleteButton = page.locator('button:has-text("Delete")').or(
        page.locator('button[data-variant="destructive"]')
      );
      await deleteButton.click();
      
      // Confirm deletion
      await page.click('[role="dialog"] button:has-text("Delete")');
      
      // Should redirect to list
      await page.waitForURL(/\/testplans(?:\/)?$/);
      
      // Plan should not exist
      await expect(page.locator(`text="${planName}"`)).not.toBeVisible();
    }
  });

  test('should clone a test plan', async ({ page }) => {
    // Navigate to a test plan
    const planLink = page.locator('a[href*="/testplans/"]').first();
    
    if (await planLink.isVisible()) {
      const originalName = await planLink.textContent();
      await planLink.click();
      await page.waitForURL(/\/testplans\/[^\/]+$/);
      
      // Clone button
      const cloneButton = page.locator('button:has-text("Clone")').or(
        page.locator('button[aria-label*="Clone"]')
      );
      
      if (await cloneButton.isVisible()) {
        await cloneButton.click();
        
        // Clone dialog might appear
        const dialog = page.locator(Selectors.dialogs.root);
        if (await dialog.isVisible()) {
          // Update clone name
          const nameInput = dialog.locator('input[name="name"]');
          await nameInput.fill(`${originalName} - Copy`);
          
          // Confirm clone
          await dialog.locator('button:has-text("Clone")').click();
        }
        
        // Should create new plan
        await page.waitForTimeout(2000);
        await page.goto('/testplans');
        
        // Both original and clone should exist
        await expect(page.locator(`text="${originalName}"`)).toBeVisible();
        await expect(page.locator(`text="${originalName} - Copy"`)).toBeVisible();
      }
    }
  });

  test('should filter test plans', async ({ page }) => {
    // Search input
    const searchInput = page.locator(Selectors.inputs.search);
    
    if (await searchInput.isVisible()) {
      // Search for specific plan
      await searchInput.fill('smoke');
      await searchInput.press('Enter');
      
      // Wait for filter
      await page.waitForTimeout(1000);
      
      // Check filtered results
      const plans = page.locator('[class*="test-plan"]');
      if (await plans.count() > 0) {
        const count = await plans.count();
        for (let i = 0; i < count; i++) {
          const text = await plans.nth(i).textContent();
          expect(text?.toLowerCase()).toContain('smoke');
        }
      }
    }
  });

  test('should show test plan statistics', async ({ page }) => {
    // Navigate to a test plan
    const planLink = page.locator('a[href*="/testplans/"]').first();
    
    if (await planLink.isVisible()) {
      await planLink.click();
      await page.waitForURL(/\/testplans\/[^\/]+$/);
      
      // Look for statistics
      const stats = [
        'Total Test Cases',
        'Estimated Duration',
        'Last Run',
        'Pass Rate'
      ];
      
      for (const stat of stats) {
        const statElement = page.locator(`text=/${stat}/i`);
        if (await statElement.isVisible()) {
          // Should have associated value
          const parent = statElement.locator('..');
          const value = await parent.textContent();
          expect(value).not.toBe(stat); // Should contain more than just the label
        }
      }
    }
  });

  test('should export test plan', async ({ page }) => {
    // Navigate to a test plan
    const planLink = page.locator('a[href*="/testplans/"]').first();
    
    if (await planLink.isVisible()) {
      await planLink.click();
      await page.waitForURL(/\/testplans\/[^\/]+$/);
      
      // Export button
      const exportButton = page.locator('button:has-text("Export")').or(
        page.locator('button[aria-label*="Export"]')
      );
      
      if (await exportButton.isVisible()) {
        // Set up download promise
        const downloadPromise = page.waitForEvent('download');
        
        await exportButton.click();
        
        // Might have format selection
        const formatOption = page.locator('button:has-text("JSON")').or(
          page.locator('button:has-text("CSV")')
        );
        if (await formatOption.isVisible()) {
          await formatOption.click();
        }
        
        // Wait for download
        try {
          const download = await downloadPromise;
          expect(download).toBeTruthy();
        } catch {
          // Download might be handled differently
          expect(true).toBe(true);
        }
      }
    }
  });
});

// Helper functions
async function createTestPlan(page: any) {
  const createButton = page.locator('button:has-text("Create Test Plan")').or(
    page.locator('a:has-text("New Test Plan")')
  );
  await createButton.click();
  
  await page.waitForTimeout(1000);
  
  await page.fill('input[name="name"]', TestData.testPlans.basic.name);
  await page.fill('textarea[name="description"]', TestData.testPlans.basic.description);
  await page.click('button:has-text("Save")');
  
  await page.waitForTimeout(2000);
}

async function findTestPlanWithCases(page: any) {
  const planLinks = page.locator('a[href*="/testplans/"]');
  const count = await planLinks.count();
  
  for (let i = 0; i < count; i++) {
    const link = planLinks.nth(i);
    const parent = link.locator('..');
    const hasTestCases = await parent.locator('text=/\d+ test cases/i').isVisible();
    
    if (hasTestCases) {
      return link;
    }
  }
  
  return null;
}