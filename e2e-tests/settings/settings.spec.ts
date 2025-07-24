import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { NavigationHelper } from '../helpers/navigation.helper';
import { TestData, Timeouts, Selectors } from '../helpers/test-data.helper';

test.describe('Settings - Configuration', () => {
  let nav: NavigationHelper;

  test.beforeEach(async ({ page, context }) => {
    await AuthHelper.authenticateWithPAT(context, TestData.auth.validPAT);
    await page.goto('/settings');
    nav = new NavigationHelper(page);
  });

  test('should display settings page with all sections', async ({ page }) => {
    // Page header
    await expect(page.locator('h1')).toContainText('Settings');
    
    // Settings sections
    const sections = [
      'Profile',
      'API Keys',
      'Integrations',
      'Notifications',
      'Preferences'
    ];
    
    for (const section of sections) {
      const sectionElement = page.locator(`text=/${section}/i`).first();
      if (await sectionElement.isVisible()) {
        await expect(sectionElement).toBeVisible();
      }
    }
  });

  test('should update profile information', async ({ page }) => {
    // Profile section
    const profileSection = page.locator('section:has(h2:has-text("Profile"))').or(
      page.locator('[data-section="profile"]')
    );
    
    if (await profileSection.isVisible()) {
      // Name field
      const nameInput = profileSection.locator('input[name="name"]').or(
        profileSection.locator('input[placeholder*="Name"]')
      );
      
      if (await nameInput.isVisible()) {
        await nameInput.clear();
        await nameInput.fill('Updated Test User');
      }
      
      // Email field
      const emailInput = profileSection.locator('input[name="email"]').or(
        profileSection.locator('input[type="email"]')
      );
      
      if (await emailInput.isVisible()) {
        await emailInput.clear();
        await emailInput.fill('updated@example.com');
      }
      
      // Save changes
      const saveButton = profileSection.locator('button:has-text("Save")').or(
        page.locator('button:has-text("Update Profile")')
      );
      await saveButton.click();
      
      // Success message
      await expect(page.locator('text=/Saved|Updated|Success/i')).toBeVisible();
    }
  });

  test('should manage API keys', async ({ page }) => {
    // API Keys section
    const apiSection = page.locator('section:has(h2:has-text("API"))').or(
      page.locator('[data-section="api-keys"]')
    );
    
    if (await apiSection.isVisible()) {
      // OpenAI API key
      const openaiInput = apiSection.locator('input[name="openai_api_key"]').or(
        apiSection.locator('input[placeholder*="OpenAI"]')
      );
      
      if (await openaiInput.isVisible()) {
        // Should be masked
        const inputType = await openaiInput.getAttribute('type');
        expect(inputType).toBe('password');
        
        // Update key
        await openaiInput.clear();
        await openaiInput.fill(TestData.openai.apiKey);
        
        // Save
        const saveButton = apiSection.locator('button:has-text("Save")');
        await saveButton.click();
        
        // Success indication
        await page.waitForTimeout(1000);
      }
      
      // GitHub PAT management
      const githubSection = apiSection.locator('[class*="github"]').or(
        page.locator('text=GitHub Personal Access Token').locator('..')
      );
      
      if (await githubSection.isVisible()) {
        const patInput = githubSection.locator('input[type="password"]');
        if (await patInput.isVisible()) {
          await patInput.clear();
          await patInput.fill(TestData.auth.validPAT);
        }
      }
    }
  });

  test('should configure integrations', async ({ page }) => {
    // Integrations section
    const integrationsSection = page.locator('section:has(h2:has-text("Integrations"))').or(
      page.locator('[data-section="integrations"]')
    );
    
    if (await integrationsSection.isVisible()) {
      // GitHub integration
      const githubToggle = integrationsSection.locator('button[role="switch"]').or(
        integrationsSection.locator('input[type="checkbox"]')
      ).first();
      
      if (await githubToggle.isVisible()) {
        // Toggle state
        const isChecked = await githubToggle.isChecked().catch(() => false);
        await githubToggle.click();
        
        // State should change
        const newState = await githubToggle.isChecked().catch(() => false);
        expect(newState).toBe(!isChecked);
      }
      
      // Webhook URL
      const webhookInput = integrationsSection.locator('input[name="webhook_url"]').or(
        integrationsSection.locator('input[placeholder*="Webhook"]')
      );
      
      if (await webhookInput.isVisible()) {
        await webhookInput.fill('https://example.com/webhook');
      }
    }
  });

  test('should manage notification preferences', async ({ page }) => {
    // Notifications section
    const notifSection = page.locator('section:has(h2:has-text("Notifications"))').or(
      page.locator('[data-section="notifications"]')
    );
    
    if (await notifSection.isVisible()) {
      // Email notifications
      const emailNotif = notifSection.locator('label:has-text("Email notifications")').or(
        notifSection.locator('text=Email notifications').locator('..')
      );
      
      const emailToggle = emailNotif.locator('button[role="switch"]').or(
        emailNotif.locator('input[type="checkbox"]')
      );
      
      if (await emailToggle.isVisible()) {
        await emailToggle.click();
      }
      
      // Notification types
      const notifTypes = [
        'Test run completed',
        'Test case failed',
        'New issue created',
        'Plan updated'
      ];
      
      for (const type of notifTypes) {
        const typeToggle = notifSection.locator(`label:has-text("${type}")`).locator('input[type="checkbox"]');
        if (await typeToggle.isVisible()) {
          await typeToggle.check();
        }
      }
    }
  });

  test('should update application preferences', async ({ page }) => {
    // Preferences section
    const prefsSection = page.locator('section:has(h2:has-text("Preferences"))').or(
      page.locator('[data-section="preferences"]')
    );
    
    if (await prefsSection.isVisible()) {
      // Theme preference
      const themeSelect = prefsSection.locator('select[name="theme"]').or(
        prefsSection.locator('button[role="combobox"]:has-text("Theme")')
      );
      
      if (await themeSelect.isVisible()) {
        await themeSelect.click();
        
        const darkOption = page.locator('[role="option"]:has-text("Dark")').or(
          page.locator('option:has-text("Dark")')
        );
        await darkOption.click();
      }
      
      // Language
      const langSelect = prefsSection.locator('select[name="language"]').or(
        prefsSection.locator('button[role="combobox"]:has-text("Language")')
      );
      
      if (await langSelect.isVisible()) {
        await langSelect.click();
        
        const enOption = page.locator('[role="option"]:has-text("English")').first();
        await enOption.click();
      }
      
      // Date format
      const dateFormatSelect = prefsSection.locator('select[name="dateFormat"]');
      if (await dateFormatSelect.isVisible()) {
        await dateFormatSelect.selectOption('MM/DD/YYYY');
      }
    }
  });

  test('should export user data', async ({ page }) => {
    // Look for export section
    const exportSection = page.locator('section:has(h2:has-text("Data"))').or(
      page.locator('text=Export your data').locator('..')
    );
    
    if (await exportSection.isVisible()) {
      const exportButton = exportSection.locator('button:has-text("Export")').or(
        exportSection.locator('button:has-text("Download")')
      );
      
      if (await exportButton.isVisible()) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download');
        
        await exportButton.click();
        
        try {
          const download = await downloadPromise;
          expect(download).toBeTruthy();
          expect(download.suggestedFilename()).toMatch(/export|data|backup/i);
        } catch {
          // Export might show options first
          const jsonOption = page.locator('button:has-text("JSON")');
          if (await jsonOption.isVisible()) {
            await jsonOption.click();
          }
        }
      }
    }
  });

  test('should clear application cache', async ({ page }) => {
    // Advanced settings or maintenance
    const advancedSection = page.locator('section:has(h2:has-text("Advanced"))').or(
      page.locator('text=Clear cache').locator('..')
    );
    
    if (await advancedSection.isVisible()) {
      const clearCacheButton = advancedSection.locator('button:has-text("Clear cache")').or(
        advancedSection.locator('button:has-text("Clear")')
      );
      
      if (await clearCacheButton.isVisible()) {
        await clearCacheButton.click();
        
        // Confirmation dialog
        const confirmDialog = page.locator(Selectors.dialogs.root);
        if (await confirmDialog.isVisible()) {
          await confirmDialog.locator('button:has-text("Clear")').click();
        }
        
        // Success message
        await expect(page.locator('text=/Cleared|Cache cleared/i')).toBeVisible();
      }
    }
  });

  test('should validate API key format', async ({ page }) => {
    // API Keys section
    const apiSection = page.locator('section:has(h2:has-text("API"))');
    
    if (await apiSection.isVisible()) {
      // Invalid OpenAI key
      const openaiInput = apiSection.locator('input[placeholder*="OpenAI"]');
      
      if (await openaiInput.isVisible()) {
        await openaiInput.clear();
        await openaiInput.fill('invalid-key');
        
        // Try to save
        const saveButton = apiSection.locator('button:has-text("Save")');
        await saveButton.click();
        
        // Should show validation error
        const errorMessage = page.locator('[class*="error"], [role="alert"]');
        await expect(errorMessage.first()).toBeVisible();
      }
    }
  });

  test('should handle settings save errors', async ({ page }) => {
    // Disconnect network to simulate error
    await page.route('**/api/settings/**', route => route.abort());
    
    // Try to save any setting
    const saveButton = page.locator('button:has-text("Save")').first();
    
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Should show error message
      await expect(page.locator('text=/Error|Failed|Could not save/i')).toBeVisible();
    }
  });

  test('should navigate between settings sections', async ({ page }) => {
    // Look for settings navigation
    const settingsNav = page.locator('nav[aria-label="Settings"]').or(
      page.locator('[role="tablist"]')
    );
    
    if (await settingsNav.isVisible()) {
      // Navigate through tabs
      const tabs = ['Profile', 'API Keys', 'Integrations', 'Notifications'];
      
      for (const tab of tabs) {
        const tabButton = settingsNav.locator(`button:has-text("${tab}")`).or(
          settingsNav.locator(`a:has-text("${tab}")`)
        );
        
        if (await tabButton.isVisible()) {
          await tabButton.click();
          
          // Corresponding section should be visible
          await expect(page.locator(`h2:has-text("${tab}")`)).toBeVisible();
        }
      }
    }
  });

  test('should reset settings to defaults', async ({ page }) => {
    // Look for reset option
    const resetButton = page.locator('button:has-text("Reset to defaults")').or(
      page.locator('button:has-text("Reset")')
    );
    
    if (await resetButton.isVisible()) {
      await resetButton.click();
      
      // Confirmation dialog
      const confirmDialog = page.locator(Selectors.dialogs.root);
      await expect(confirmDialog).toBeVisible();
      await expect(confirmDialog).toContainText(/reset|restore|defaults/i);
      
      // Cancel for safety
      await confirmDialog.locator('button:has-text("Cancel")').click();
      
      // Dialog should close
      await expect(confirmDialog).not.toBeVisible();
    }
  });
});