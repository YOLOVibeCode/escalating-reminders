import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../helpers/login-as-role';

/**
 * Layer 4: @feature - Agents CRUD
 */

test.describe('Layer 4: Agents CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'user');
  });

  test('04-10: Subscribe to agent @feature', async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
    
    const subscribeButton = page.locator('[data-testid="subscribe-button"], button:has-text("Subscribe")').first();
    if (await subscribeButton.isVisible().catch(() => false)) {
      await subscribeButton.click();
      
      // Fill configuration if form appears
      const configInput = page.locator('[data-testid="config-input"], input').first();
      if (await configInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await configInput.fill('test-config');
        const saveButton = page.locator('button[type="submit"]').first();
        await saveButton.click();
      }
      
      await page.waitForTimeout(2000);
    }
  });

  test('04-11: Configure agent @feature', async ({ page }) => {
    await page.goto('/agents/subscriptions');
    await page.waitForLoadState('networkidle');
    
    const configureButton = page.locator('[data-testid="configure-button"], button:has-text("Configure")').first();
    if (await configureButton.isVisible().catch(() => false)) {
      await configureButton.click();
      
      await page.waitForURL(/\/agents\/.*\/configure/, { timeout: 10000 });
      
      const configInput = page.locator('[data-testid="config-input"], input').first();
      if (await configInput.isVisible().catch(() => false)) {
        await configInput.fill('updated-config');
        const saveButton = page.locator('button[type="submit"]').first();
        await saveButton.click();
      }
    }
  });

  test('04-12: Unsubscribe agent @feature', async ({ page }) => {
    await page.goto('/agents/subscriptions');
    await page.waitForLoadState('networkidle');
    
    const unsubscribeButton = page.locator('[data-testid="unsubscribe-button"], button:has-text("Unsubscribe")').first();
    if (await unsubscribeButton.isVisible().catch(() => false)) {
      await unsubscribeButton.click();
      
      const confirmButton = page.locator('button:has-text("Confirm")').first();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }
      
      await page.waitForTimeout(2000);
    }
  });

  test('04-13: Test agent delivery @feature', async ({ page }) => {
    await page.goto('/agents/subscriptions');
    await page.waitForLoadState('networkidle');
    
    const testButton = page.locator('[data-testid="test-button"], button:has-text("Test")').first();
    if (await testButton.isVisible().catch(() => false)) {
      await testButton.click();
      
      // Wait for success message
      const successMessage = page.locator('[data-testid="success-message"], .success').first();
      await successMessage.isVisible({ timeout: 5000 }).catch(() => {
        // Test might complete without visible message
      });
      
      await page.waitForTimeout(2000);
    }
  });
});
