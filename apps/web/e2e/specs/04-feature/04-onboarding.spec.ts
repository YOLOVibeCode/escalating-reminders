import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../helpers/login-as-role';

/**
 * Layer 4: @feature - Onboarding Wizard
 */

test.describe('Layer 4: Onboarding Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'user');
  });

  test('04-31: Onboarding creates first reminder @feature', async ({ page }) => {
    await page.goto('/onboarding');

    await expect(page.locator('[data-testid="onboarding"]')).toBeVisible();

    await page.locator('[data-testid="onboarding-title-input"]').fill(`Onboarding Reminder ${Date.now()}`);
    await page.locator('[data-testid="onboarding-next"]').click();

    await expect(page.locator('[data-testid="onboarding-triggerAt-input"]')).toBeVisible();
    await page.locator('[data-testid="onboarding-next"]').click();

    await expect(page.locator('[data-testid="onboarding-importance-select"]')).toBeVisible();
    const escalationSelect = page.locator('[data-testid="onboarding-escalation-select"]');
    await expect(escalationSelect).toBeVisible();
    // Wait until the select has options beyond the placeholder.
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="onboarding-escalation-select"]') as HTMLSelectElement | null;
      return !!el && el.options.length > 1;
    });

           const createButton = page.locator('[data-testid="onboarding-create"]');
           await expect(createButton).toBeEnabled();
           await createButton.click();

    // Wait for either successful navigation or an onboarding error.
    await page.waitForFunction(() => {
      const path = window.location.pathname;
      if (/^\/reminders\/[^/]+$/.test(path)) return true;
      const err = document.querySelector('[data-testid="onboarding-error"], [data-testid="onboarding-profiles-error"]');
      return !!err;
    }, { timeout: 30000 });

    const url = page.url();
    if (!/\/reminders\/[^/]+$/.test(new URL(url).pathname)) {
      const errorText = await page.locator('[data-testid="onboarding-error"], [data-testid="onboarding-profiles-error"]').first().innerText().catch(() => '');
      throw new Error(`Onboarding did not navigate to reminder page. Error: ${errorText || '(none shown)'}`);
    }
  });
});

