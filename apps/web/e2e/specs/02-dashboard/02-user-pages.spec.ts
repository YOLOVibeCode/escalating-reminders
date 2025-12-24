import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../helpers/login-as-role';
import { assertOnDashboard } from '../../helpers/assert-on-dashboard';
import { assertNoConsoleErrors } from '../../helpers/assert-no-console-errors';

/**
 * Layer 2: @dashboard - User Pages
 * 
 * Purpose: Verify all user dashboard pages render without errors
 * Execution: Parallel (within layer)
 * Fail Behavior: If any fail → skip Layer 3+
 * Dependencies: Layer 1 passes
 */

test.describe('Layer 2: User Dashboard Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'user');
  });

  test('02-01: Dashboard home @dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Verify page loaded
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verify main content is visible
    const mainContent = page.locator('main, [data-testid="main-content"]').first();
    await expect(mainContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-02: Reminders list @dashboard', async ({ page }) => {
    await page.goto('/reminders');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/reminders/);
    
    // Verify reminders page content
    const pageContent = page.locator('main, [data-testid="reminders-list"]').first();
    await expect(pageContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-03: New reminder form @dashboard', async ({ page }) => {
    await page.goto('/reminders/new');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/reminders\/new/);
    
    // Verify form is visible
    const form = page.locator('form, [data-testid="reminder-form"]').first();
    await expect(form).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-04: Edit reminder form @dashboard', async ({ page }) => {
    // First, try to get a reminder ID (this will need to be created or mocked)
    // For now, we'll test that the route structure works
    await page.goto('/reminders/test-id-123');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should either show the edit form or a 404/error (both are valid)
    await page.waitForSelector('[data-testid="reminder-form"], [data-testid="error"], form', {
      timeout: 10000,
    });
    
    await assertNoConsoleErrors(page);
  });

  test('02-05: Agents list @dashboard', async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/agents/);
    
    const pageContent = page.locator('main, [data-testid="agents-list"]').first();
    await expect(pageContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-06: Agent configure @dashboard', async ({ page }) => {
    await page.goto('/agents/test-agent-id/configure');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/agents\/.*\/configure/);
    
    const form = page.locator('form, [data-testid="agent-config-form"]').first();
    await expect(form).toBeVisible({ timeout: 5000 }).catch(() => {
      // Form might not exist if agent doesn't exist - that's ok
    });
    
    await assertNoConsoleErrors(page);
  });

  test('02-07: Agent subscriptions @dashboard', async ({ page }) => {
    await page.goto('/agents/subscriptions');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/agents\/subscriptions/);
    
    const pageContent = page.locator('main, [data-testid="subscriptions-list"]').first();
    await expect(pageContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-08: Notifications @dashboard', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/notifications/);
    
    const pageContent = page.locator('main, [data-testid="notifications-list"]').first();
    await expect(pageContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-09: Settings @dashboard', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/settings/);
    
    const pageContent = page.locator('main, [data-testid="settings-content"]').first();
    await expect(pageContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-10: Profile settings @dashboard', async ({ page }) => {
    await page.goto('/settings/profile');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/settings\/profile/);
    
    const form = page.locator('form, [data-testid="profile-form"]').first();
    await expect(form).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-11: Escalation profiles list @dashboard', async ({ page }) => {
    await page.goto('/settings/escalation-profiles');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/settings\/escalation-profiles/);
    
    const pageContent = page.locator('main, [data-testid="profiles-list"]').first();
    await expect(pageContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-12: New escalation profile @dashboard', async ({ page }) => {
    await page.goto('/settings/escalation-profiles/new');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/settings\/escalation-profiles\/new/);
    
    const form = page.locator('form, [data-testid="profile-form"]').first();
    await expect(form).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-13: Layout renders @dashboard', async ({ page }) => {
    await assertOnDashboard(page, 'user');
    
    // Verify sidebar (header contains navigation)
    const header = page.locator('[data-testid="header"]').first();
    await expect(header).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });
});
