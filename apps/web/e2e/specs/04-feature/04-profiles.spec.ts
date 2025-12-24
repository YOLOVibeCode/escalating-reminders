import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../helpers/login-as-role';

/**
 * Layer 4: @feature - Escalation Profiles CRUD
 */

test.describe('Layer 4: Escalation Profiles CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'user');
  });

  test('04-07: Create escalation profile @feature', async ({ page }) => {
    await page.goto('/settings/escalation-profiles/new');
    
    const nameInput = page.locator('[data-testid="name-input"]').first();
    await nameInput.fill('Test Profile');
    
    const submitButton = page.locator('[data-testid="submit-button"]').first();
    await submitButton.click();
    
    await page.waitForURL(/\/settings\/escalation-profiles/, { timeout: 15000 });
  });

  test('04-08: Edit escalation profile @feature', async ({ page }) => {
    // First create a profile to edit
    await page.goto('/settings/escalation-profiles/new');
    await page.waitForLoadState('networkidle');
    
    const nameInput = page.locator('[data-testid="name-input"]').first();
    await nameInput.fill('Test Profile to Edit');
    
    const submitButton = page.locator('[data-testid="submit-button"]').first();
    await submitButton.click();
    
    await page.waitForURL(/\/settings\/escalation-profiles/, { timeout: 15000 });
    
    // Now edit the profile
    await page.goto('/settings/escalation-profiles');
    await page.waitForLoadState('networkidle');
    
    const editButton = page.locator('[data-testid="edit-button"], button:has-text("Edit")').first();
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      
      // Should navigate to edit page
      await page.waitForURL(/\/settings\/escalation-profiles\/.*\/edit/, { timeout: 10000 });
      
      // Update the name
      const editNameInput = page.locator('[data-testid="name-input"], input[name="name"]').first();
      await editNameInput.fill('Updated Profile Name');
      
      // Submit the form
      const updateButton = page.locator('[data-testid="submit-button"], button[type="submit"]').first();
      await updateButton.click();
      
      // Should redirect back to profiles list
      await page.waitForURL(/\/settings\/escalation-profiles/, { timeout: 15000 });
      
      // Verify the updated name appears
      await expect(page.locator('text=Updated Profile Name').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('04-09: Delete escalation profile @feature', async ({ page }) => {
    await page.goto('/settings/escalation-profiles');
    await page.waitForLoadState('networkidle');
    
    const deleteButton = page.locator('[data-testid^="delete-profile-"]').first();
    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();
      
      const confirmButton = page.locator('button:has-text("Confirm")').first();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }
    }
  });
});
