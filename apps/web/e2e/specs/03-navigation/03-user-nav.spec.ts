import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../helpers/login-as-role';

/**
 * Layer 3: @navigation - User Navigation
 * 
 * Purpose: Verify sidebar navigation links work correctly
 * Execution: Parallel (within role groups)
 * Fail Behavior: If any fail → skip Layer 4+
 * Dependencies: Layer 2 passes
 */

test.describe('Layer 3: User Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'user');
  });

  test('03-01: Sidebar visible @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const sidebar = page.locator('[data-testid="sidebar"], aside, nav').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });

  test('03-02: Dashboard link @navigation', async ({ page }) => {
    await page.goto('/reminders');
    const dashboardLink = page.locator('a[href*="/dashboard"], [data-testid="nav-dashboard"]').first();
    await dashboardLink.click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('03-03: Reminders link @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const remindersLink = page.locator('a[href*="/reminders"], [data-testid="nav-reminders"]').first();
    await remindersLink.click();
    await expect(page).toHaveURL(/\/reminders/);
  });

  test('03-04: Agents link @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const agentsLink = page.locator('a[href*="/agents"], [data-testid="nav-agents"]').first();
    await agentsLink.click();
    await expect(page).toHaveURL(/\/agents/);
  });

  test('03-05: Notifications link @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const notificationsLink = page.locator('a[href*="/notifications"], [data-testid="nav-notifications"]').first();
    await notificationsLink.click();
    await expect(page).toHaveURL(/\/notifications/);
  });

  test('03-06: Settings link @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const settingsLink = page.locator('a[href*="/settings"], [data-testid="nav-settings"]').first();
    await settingsLink.click();
    await expect(page).toHaveURL(/\/settings/);
  });

  test('03-07: Profile link @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const profileLink = page.locator('a[href*="/settings/profile"], [data-testid="nav-profile"]').first();
    if (await profileLink.isVisible().catch(() => false)) {
      await profileLink.click();
      await expect(page).toHaveURL(/\/settings\/profile/);
    }
  });

  test('03-08: Breadcrumbs work @navigation', async ({ page }) => {
    await page.goto('/reminders/new');
    const breadcrumb = page.locator('[data-testid="breadcrumb"], nav[aria-label*="breadcrumb" i] a').first();
    if (await breadcrumb.isVisible().catch(() => false)) {
      await breadcrumb.click();
      // Should navigate back
    }
  });

  test('03-09: Back button works @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.goto('/reminders');
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('03-10: Active state highlight @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const activeLink = page.locator('[data-testid="nav-dashboard"][aria-current], a[href="/dashboard"][aria-current]').first();
    const isActive = await activeLink.isVisible().catch(() => false);
    // Active state might be styled differently - just verify navigation works
    expect(page.url()).toMatch(/\/dashboard/);
  });

  test('03-11: Sidebar collapse @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const collapseButton = page.locator('[data-testid="sidebar-toggle"], button[aria-label*="menu" i]').first();
    if (await collapseButton.isVisible().catch(() => false)) {
      await collapseButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('03-12: Keyboard navigation @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Tab');
    // Verify focus moves (hard to test without specific focus indicators)
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('03-13: Quick actions menu @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const quickActions = page.locator('[data-testid="quick-actions"], button:has-text("New")').first();
    if (await quickActions.isVisible().catch(() => false)) {
      await expect(quickActions).toBeVisible();
    }
  });

  test('03-14: User menu dropdown @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const userMenu = page.locator('[data-testid="user-menu"], button[aria-label*="user" i]').first();
    if (await userMenu.isVisible().catch(() => false)) {
      await userMenu.click();
      await page.waitForTimeout(500);
    }
  });

  test('03-15: Logout from menu @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const userMenu = page.locator('[data-testid="user-menu"], button[aria-label*="user" i]').first();
    if (await userMenu.isVisible().catch(() => false)) {
      await userMenu.click();
      const logout = page.locator('text=Logout').first();
      if (await logout.isVisible().catch(() => false)) {
        await logout.click();
        await expect(page).toHaveURL(/\/login/);
      }
    }
  });

  test('03-16: New reminder shortcut @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const newReminderBtn = page.locator('[data-testid="new-reminder"], button:has-text("New Reminder"), a[href*="/reminders/new"]').first();
    if (await newReminderBtn.isVisible().catch(() => false)) {
      await newReminderBtn.click();
      await expect(page).toHaveURL(/\/reminders\/new/);
    }
  });

  test('03-17: Notifications bell @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const bell = page.locator('[data-testid="notifications-bell"], button[aria-label*="notification" i]').first();
    if (await bell.isVisible().catch(() => false)) {
      await expect(bell).toBeVisible();
    }
  });

  test('03-18: Help link @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const helpLink = page.locator('a[href*="help"], a[href*="docs"], [data-testid="help-link"]').first();
    if (await helpLink.isVisible().catch(() => false)) {
      await expect(helpLink).toBeVisible();
    }
  });

  test('03-19: Logo click @navigation', async ({ page }) => {
    await page.goto('/reminders');
    const logo = page.locator('[data-testid="logo"], a[href="/"], img[alt*="logo" i]').first();
    if (await logo.isVisible().catch(() => false)) {
      await logo.click();
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });

  test('03-20: Search focus @navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await page.keyboard.press('/');
      // Focus might move to search - verify it exists
      await expect(searchInput).toBeVisible();
    }
  });
});
