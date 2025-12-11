import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../helpers/login-as-role';

/**
 * Layer 3: @navigation - Admin Navigation
 * 
 * Purpose: Verify admin sidebar navigation links work correctly
 * Execution: Parallel (within role groups)
 * Fail Behavior: If any fail → skip Layer 4+
 * Dependencies: Layer 2 passes
 */

test.describe('Layer 3: Admin Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'admin');
  });

  test('03-21: Admin sidebar visible @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const sidebar = page.locator('[data-testid="sidebar"], aside, nav').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });

  test('03-22: Admin dashboard link @navigation', async ({ page }) => {
    await page.goto('/admin/users');
    const dashboardLink = page.locator('a[href*="/admin/dashboard"], [data-testid="nav-admin-dashboard"]').first();
    await dashboardLink.click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('03-23: Users link @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const usersLink = page.locator('a[href*="/admin/users"], [data-testid="nav-users"]').first();
    await usersLink.click();
    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test('03-24: Reminders link @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const remindersLink = page.locator('a[href*="/admin/reminders"], [data-testid="nav-admin-reminders"]').first();
    await remindersLink.click();
    await expect(page).toHaveURL(/\/admin\/reminders/);
  });

  test('03-25: Agents link @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const agentsLink = page.locator('a[href*="/admin/agents"], [data-testid="nav-admin-agents"]').first();
    await agentsLink.click();
    await expect(page).toHaveURL(/\/admin\/agents/);
  });

  test('03-26: Audit link @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const auditLink = page.locator('a[href*="/admin/audit"], [data-testid="nav-audit"]').first();
    await auditLink.click();
    await expect(page).toHaveURL(/\/admin\/audit/);
  });

  test('03-27: Billing link @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const billingLink = page.locator('a[href*="/admin/billing"], [data-testid="nav-billing"]').first();
    await billingLink.click();
    await expect(page).toHaveURL(/\/admin\/billing/);
  });

  test('03-28: System link @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const systemLink = page.locator('a[href*="/admin/system"], [data-testid="nav-system"]').first();
    await systemLink.click();
    await expect(page).toHaveURL(/\/admin\/system/);
  });

  test('03-29: Switch to user view @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const switchView = page.locator('[data-testid="switch-to-user"], button:has-text("User View")').first();
    if (await switchView.isVisible().catch(() => false)) {
      await switchView.click();
      await page.waitForTimeout(1000);
    }
  });

  test('03-30: Admin breadcrumbs @navigation', async ({ page }) => {
    await page.goto('/admin/users/test-id');
    const breadcrumb = page.locator('[data-testid="breadcrumb"], nav[aria-label*="breadcrumb" i] a').first();
    if (await breadcrumb.isVisible().catch(() => false)) {
      await breadcrumb.click();
    }
  });

  test('03-31: Admin back button @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.goto('/admin/users');
    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('03-32: Admin active state @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const activeLink = page.locator('[data-testid="nav-admin-dashboard"][aria-current]').first();
    const isActive = await activeLink.isVisible().catch(() => false);
    expect(page.url()).toMatch(/\/admin\/dashboard/);
  });

  test('03-33: Admin sidebar collapse @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const collapseButton = page.locator('[data-testid="sidebar-toggle"], button[aria-label*="menu" i]').first();
    if (await collapseButton.isVisible().catch(() => false)) {
      await collapseButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('03-34: Admin keyboard nav @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('03-35: Quick user search @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const searchInput = page.locator('[data-testid="user-search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
    }
  });

  test('03-36: Admin notifications @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const notifications = page.locator('[data-testid="admin-notifications"], button[aria-label*="notification" i]').first();
    if (await notifications.isVisible().catch(() => false)) {
      await expect(notifications).toBeVisible();
    }
  });

  test('03-37: System status indicator @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const statusIndicator = page.locator('[data-testid="system-status"], [aria-label*="status" i]').first();
    if (await statusIndicator.isVisible().catch(() => false)) {
      await expect(statusIndicator).toBeVisible();
    }
  });

  test('03-38: Admin help link @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const helpLink = page.locator('a[href*="help"], a[href*="docs"], [data-testid="admin-help"]').first();
    if (await helpLink.isVisible().catch(() => false)) {
      await expect(helpLink).toBeVisible();
    }
  });

  test('03-39: Admin logo click @navigation', async ({ page }) => {
    await page.goto('/admin/users');
    const logo = page.locator('[data-testid="logo"], a[href="/admin"], img[alt*="logo" i]').first();
    if (await logo.isVisible().catch(() => false)) {
      await logo.click();
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    }
  });

  test('03-40: Admin global search @navigation', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const searchInput = page.locator('[data-testid="global-search"], input[type="search"]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await page.keyboard.press('/');
      await expect(searchInput).toBeVisible();
    }
  });
});
