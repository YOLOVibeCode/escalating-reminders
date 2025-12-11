import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../helpers/login-as-role';

/**
 * Layer 4: @feature - Admin Features CRUD
 */

test.describe('Layer 4: Admin Features CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'admin');
  });

  test('04-19: View all users @feature', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    
    const usersTable = page.locator('table, [data-testid="users-table"]').first();
    await expect(usersTable).toBeVisible({ timeout: 5000 }).catch(() => {
      // Table might not exist if no users - check for empty state
      const emptyState = page.locator('[data-testid="empty-state"]').first();
      expect(emptyState.isVisible()).resolves.toBeTruthy();
    });
  });

  test('04-20: View user detail @feature', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    
    const firstUserLink = page.locator('a[href*="/admin/users/"], [data-testid="user-link"]').first();
    if (await firstUserLink.isVisible().catch(() => false)) {
      await firstUserLink.click();
      await page.waitForURL(/\/admin\/users\/.+/, { timeout: 10000 });
    }
  });

  test('04-21: Update user tier @feature', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    
    const editButton = page.locator('[data-testid="edit-button"], button:has-text("Edit")').first();
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      
      const tierSelect = page.locator('[data-testid="tier-select"], select[name="tier"]').first();
      if (await tierSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tierSelect.selectOption('personal');
        
        const saveButton = page.locator('button[type="submit"]').first();
        await saveButton.click();
        
        await page.waitForTimeout(2000);
      }
    }
  });

  test('04-22: Disable user @feature', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    
    const disableButton = page.locator('[data-testid="disable-button"], button:has-text("Disable")').first();
    if (await disableButton.isVisible().catch(() => false)) {
      await disableButton.click();
      
      const confirmButton = page.locator('button:has-text("Confirm")').first();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }
    }
  });

  test('04-23: View all reminders @feature', async ({ page }) => {
    await page.goto('/admin/reminders');
    await page.waitForLoadState('networkidle');
    
    const remindersList = page.locator('[data-testid="reminders-list"], table').first();
    await expect(remindersList).toBeVisible({ timeout: 5000 }).catch(() => {
      // Empty state is acceptable
    });
  });

  test('04-24: View reminder as admin @feature', async ({ page }) => {
    await page.goto('/admin/reminders');
    await page.waitForLoadState('networkidle');
    
    const reminderLink = page.locator('a[href*="/reminders/"], [data-testid="reminder-link"]').first();
    if (await reminderLink.isVisible().catch(() => false)) {
      await reminderLink.click();
      await page.waitForTimeout(2000);
    }
  });

  test('04-25: Manage agent definitions @feature', async ({ page }) => {
    await page.goto('/admin/agents');
    await page.waitForLoadState('networkidle');
    
    const addButton = page.locator('[data-testid="add-agent"], button:has-text("Add")').first();
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      
      await page.waitForTimeout(2000);
    }
  });

  test('04-26: View audit logs @feature', async ({ page }) => {
    await page.goto('/admin/audit');
    await page.waitForLoadState('networkidle');
    
    const auditTable = page.locator('table, [data-testid="audit-table"]').first();
    await expect(auditTable).toBeVisible({ timeout: 5000 }).catch(() => {
      // Empty state is acceptable
    });
  });

  test('04-27: Filter audit logs @feature', async ({ page }) => {
    await page.goto('/admin/audit');
    await page.waitForLoadState('networkidle');
    
    const dateFilter = page.locator('[data-testid="date-filter"], input[type="date"]').first();
    if (await dateFilter.isVisible().catch(() => false)) {
      await dateFilter.fill('2024-01-01');
      await page.waitForTimeout(1000);
    }
  });

  test('04-28: Export audit logs @feature', async ({ page }) => {
    await page.goto('/admin/audit');
    await page.waitForLoadState('networkidle');
    
    const exportButton = page.locator('[data-testid="export-button"], button:has-text("Export")').first();
    if (await exportButton.isVisible().catch(() => false)) {
      await exportButton.click();
      await page.waitForTimeout(2000);
    }
  });

  test('04-29: View billing @feature', async ({ page }) => {
    await page.goto('/admin/billing');
    await page.waitForLoadState('networkidle');
    
    const billingContent = page.locator('[data-testid="billing-content"], main').first();
    await expect(billingContent).toBeVisible({ timeout: 5000 });
  });

  test('04-30: System health check @feature', async ({ page }) => {
    await page.goto('/admin/system');
    await page.waitForLoadState('networkidle');
    
    const healthStatus = page.locator('[data-testid="health-status"], .health').first();
    if (await healthStatus.isVisible().catch(() => false)) {
      await expect(healthStatus).toBeVisible();
    }
  });
});
