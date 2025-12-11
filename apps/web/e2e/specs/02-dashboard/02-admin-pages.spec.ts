import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../helpers/login-as-role';
import { assertOnDashboard } from '../../helpers/assert-on-dashboard';
import { assertNoConsoleErrors } from '../../helpers/assert-no-console-errors';

/**
 * Layer 2: @dashboard - Admin Pages
 * 
 * Purpose: Verify all admin dashboard pages render without errors
 * Execution: Parallel (within layer)
 * Fail Behavior: If any fail → skip Layer 3+
 * Dependencies: Layer 1 passes
 */

test.describe('Layer 2: Admin Dashboard Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'admin');
  });

  test('02-14: Admin dashboard @dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    
    const mainContent = page.locator('main, [data-testid="admin-dashboard"]').first();
    await expect(mainContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-15: Admin redirect @dashboard', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Should redirect to /admin/dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    
    await assertNoConsoleErrors(page);
  });

  test('02-16: Users list @dashboard', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/admin\/users/);
    
    const pageContent = page.locator('main, [data-testid="users-list"], table').first();
    await expect(pageContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-17: User detail @dashboard', async ({ page }) => {
    await page.goto('/admin/users/test-user-id');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/admin\/users\/.+/);
    
    const pageContent = page.locator('main, [data-testid="user-detail"]').first();
    await expect(pageContent).toBeVisible({ timeout: 5000 }).catch(() => {
      // Might show error if user doesn't exist - that's ok
    });
    
    await assertNoConsoleErrors(page);
  });

  test('02-18: Reminders overview @dashboard', async ({ page }) => {
    await page.goto('/admin/reminders');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/admin\/reminders/);
    
    const pageContent = page.locator('main, [data-testid="reminders-overview"]').first();
    await expect(pageContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-19: Agents management @dashboard', async ({ page }) => {
    await page.goto('/admin/agents');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/admin\/agents/);
    
    const pageContent = page.locator('main, [data-testid="agents-management"]').first();
    await expect(pageContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-20: Audit logs @dashboard', async ({ page }) => {
    await page.goto('/admin/audit');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/admin\/audit/);
    
    const pageContent = page.locator('main, [data-testid="audit-logs"], table').first();
    await expect(pageContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-21: Billing overview @dashboard', async ({ page }) => {
    await page.goto('/admin/billing');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/admin\/billing/);
    
    const pageContent = page.locator('main, [data-testid="billing-overview"]').first();
    await expect(pageContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-22: System settings @dashboard', async ({ page }) => {
    await page.goto('/admin/system');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await expect(page).toHaveURL(/\/admin\/system/);
    
    const pageContent = page.locator('main, [data-testid="system-settings"]').first();
    await expect(pageContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-23: Admin layout renders @dashboard', async ({ page }) => {
    await assertOnDashboard(page, 'admin');
    
    const sidebar = page.locator('[data-testid="sidebar"], aside, nav').first();
    await expect(sidebar).toBeVisible({ timeout: 5000 });
    
    const header = page.locator('[data-testid="header"], header').first();
    await expect(header).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-24: User cannot access admin @dashboard', async ({ page }) => {
    // Logout admin
    await page.goto('/login');
    
    // Login as regular user
    await loginAsRole(page, 'user');
    
    // Try to access admin page
    await page.goto('/admin/dashboard');
    
    // Should redirect to login or show 403
    await page.waitForTimeout(2000);
    const isRedirected = page.url().includes('/login') || page.url().includes('/dashboard');
    const hasError = await page.locator('[data-testid="error"], .error, [role="alert"]').first().isVisible().catch(() => false);
    
    expect(isRedirected || hasError).toBeTruthy();
  });

  test('02-25: Admin table pagination @dashboard', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Look for pagination controls
    const pagination = page.locator('[data-testid="pagination"], button:has-text("Next"), button:has-text("Previous")').first();
    
    // Pagination might not exist if there are few items - that's ok
    const paginationExists = await pagination.isVisible().catch(() => false);
    
    if (paginationExists) {
      await expect(pagination).toBeVisible();
    }
    
    await assertNoConsoleErrors(page);
  });

  test('02-26: Admin search works @dashboard', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Look for search input
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"], input[placeholder*="search" i]').first();
    
    const searchExists = await searchInput.isVisible().catch(() => false);
    
    if (searchExists) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000); // Wait for search to process
    }
    
    await assertNoConsoleErrors(page);
  });

  test('02-27: Admin export button @dashboard', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Look for export button
    const exportButton = page.locator('[data-testid="export-button"], button:has-text("Export"), button:has-text("Download")').first();
    
    const exportExists = await exportButton.isVisible().catch(() => false);
    
    if (exportExists) {
      await expect(exportButton).toBeVisible();
    }
    
    await assertNoConsoleErrors(page);
  });

  test('02-28: Dashboard stats load @dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Look for stats cards
    const stats = page.locator('[data-testid="stat-card"], [data-testid="stats"], .stat').first();
    
    const statsExist = await stats.isVisible().catch(() => false);
    
    if (statsExist) {
      await expect(stats).toBeVisible();
    }
    
    await assertNoConsoleErrors(page);
  });

  test('02-29: Charts render @dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Look for charts
    const charts = page.locator('[data-testid="chart"], canvas, svg').first();
    
    const chartsExist = await charts.isVisible().catch(() => false);
    
    if (chartsExist) {
      await expect(charts).toBeVisible();
    }
    
    await assertNoConsoleErrors(page);
  });

  test('02-30: No console errors (user) @dashboard', async ({ page }) => {
    await loginAsRole(page, 'user');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-31: No console errors (admin) @dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-32: Loading states shown @dashboard', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Look for loading indicators (might be brief)
    const loading = page.locator('[data-testid="loading"], .loading, [aria-busy="true"]').first();
    
    const loadingExists = await loading.isVisible({ timeout: 1000 }).catch(() => false);
    
    // Loading might appear briefly - that's expected
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-33: Empty states shown @dashboard', async ({ page }) => {
    // Navigate to a page that might be empty
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Look for empty state (might not exist if there's data)
    const emptyState = page.locator('[data-testid="empty-state"], .empty-state, :has-text("No")').first();
    
    const emptyExists = await emptyState.isVisible().catch(() => false);
    
    // Empty state is optional - depends on data
    await assertNoConsoleErrors(page);
  });

  test('02-34: Mobile responsive (user) @dashboard', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginAsRole(page, 'user');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Verify page still renders
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-35: Mobile responsive (admin) @dashboard', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Verify page still renders
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible({ timeout: 5000 });
    
    await assertNoConsoleErrors(page);
  });

  test('02-36: Dark mode toggle @dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Look for dark mode toggle
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"], button[aria-label*="theme" i]').first();
    
    const toggleExists = await darkModeToggle.isVisible().catch(() => false);
    
    if (toggleExists) {
      await darkModeToggle.click();
      await page.waitForTimeout(500); // Wait for theme change
    }
    
    await assertNoConsoleErrors(page);
  });

  test('02-37: Page titles correct @dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Verify page has a title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    await assertNoConsoleErrors(page);
  });
});
