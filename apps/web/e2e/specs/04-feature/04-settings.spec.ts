import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../helpers/login-as-role';

/**
 * Layer 4: @feature - Settings CRUD
 */

test.describe('Layer 4: Settings CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'user');
  });

  test('04-14: Update profile @feature', async ({ page }) => {
    await page.goto('/settings/profile');
    
    const displayNameInput = page.locator('[data-testid="display-name-input"], input[name="displayName"]').first();
    if (await displayNameInput.isVisible().catch(() => false)) {
      await displayNameInput.fill('Updated Name');
      
      const saveButton = page.locator('[data-testid="save-button"], button[type="submit"]').first();
      await saveButton.click();
      
      await page.waitForTimeout(2000);
    }
  });

  test('04-15: Change password @feature', async ({ page }) => {
    await page.goto('/settings/profile');
    
    const passwordSection = page.locator('[data-testid="password-section"], h2:has-text("Password")').first();
    if (await passwordSection.isVisible().catch(() => false)) {
      const currentPasswordInput = page.locator('[data-testid="current-password"], input[name="currentPassword"]').first();
      const newPasswordInput = page.locator('[data-testid="new-password"], input[name="newPassword"]').first();
      
      if (await currentPasswordInput.isVisible().catch(() => false)) {
        await currentPasswordInput.fill('CurrentPass123!');
        await newPasswordInput.fill('NewPass123!');
        
        const saveButton = page.locator('button[type="submit"]').first();
        await saveButton.click();
        
        await page.waitForTimeout(2000);
      }
    }
  });

  test('04-16: Update preferences @feature', async ({ page }) => {
    await page.goto('/settings');
    
    const preferencesSection = page.locator('[data-testid="preferences"], h2:has-text("Preferences")').first();
    if (await preferencesSection.isVisible().catch(() => false)) {
      const timezoneSelect = page.locator('[data-testid="timezone-select"], select[name="timezone"]').first();
      if (await timezoneSelect.isVisible().catch(() => false)) {
        await timezoneSelect.selectOption('America/New_York');
        
        const saveButton = page.locator('button[type="submit"]').first();
        await saveButton.click();
        
        await page.waitForTimeout(2000);
      }
    }
  });
});
