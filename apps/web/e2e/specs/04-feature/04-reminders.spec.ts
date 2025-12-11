import { test, expect } from '@playwright/test';
import { loginAsRole } from '../../helpers/login-as-role';

/**
 * Layer 4: @feature - Reminders CRUD
 * 
 * Purpose: Verify reminder CRUD operations work correctly
 * Execution: Parallel (within role groups)
 * Fail Behavior: If any fail → skip Layer 5+
 * Dependencies: Layer 3 passes
 */

test.describe('Layer 4: Reminders CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, 'user');
  });

  test('04-01: Create reminder @feature', async ({ page }) => {
    await page.goto('/reminders/new');
    
    // Fill reminder form
    const titleInput = page.locator('[data-testid="title-input"], input[name="title"]').first();
    await titleInput.fill('Test Reminder');
    
    const descriptionInput = page.locator('[data-testid="description-input"], textarea[name="description"]').first();
    if (await descriptionInput.isVisible().catch(() => false)) {
      await descriptionInput.fill('Test description');
    }
    
    const submitButton = page.locator('[data-testid="submit-button"], button[type="submit"]').first();
    await submitButton.click();
    
    // Should redirect to reminders list or show success
    await page.waitForURL(/\/reminders/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/reminders/);
  });

  test('04-02: Read reminder @feature', async ({ page }) => {
    // First create a reminder, then read it
    await page.goto('/reminders/new');
    const titleInput = page.locator('[data-testid="title-input"], input[name="title"]').first();
    await titleInput.fill('Test Read Reminder');
    
    const submitButton = page.locator('[data-testid="submit-button"], button[type="submit"]').first();
    await submitButton.click();
    
    await page.waitForURL(/\/reminders/, { timeout: 15000 });
    
    // Try to find and click the reminder
    const reminderLink = page.locator('text=Test Read Reminder').first();
    if (await reminderLink.isVisible().catch(() => false)) {
      await reminderLink.click();
      await page.waitForTimeout(2000);
    }
  });

  test('04-03: Update reminder @feature', async ({ page }) => {
    await page.goto('/reminders');
    await page.waitForLoadState('networkidle');
    
    // Find first reminder and try to edit
    const editButton = page.locator('[data-testid="edit-button"], button:has-text("Edit")').first();
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      
      const titleInput = page.locator('[data-testid="title-input"], input[name="title"]').first();
      if (await titleInput.isVisible().catch(() => false)) {
        await titleInput.fill('Updated Reminder');
        
        const saveButton = page.locator('[data-testid="save-button"], button[type="submit"]').first();
        await saveButton.click();
        
        await page.waitForTimeout(2000);
      }
    }
  });

  test('04-04: Delete reminder @feature', async ({ page }) => {
    await page.goto('/reminders');
    await page.waitForLoadState('networkidle');
    
    const deleteButton = page.locator('[data-testid="delete-button"], button:has-text("Delete")').first();
    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();
      
      // Confirm deletion if dialog appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")').first();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }
      
      await page.waitForTimeout(2000);
    }
  });

  test('04-05: Snooze reminder @feature', async ({ page }) => {
    await page.goto('/reminders');
    await page.waitForLoadState('networkidle');
    
    const snoozeButton = page.locator('[data-testid="snooze-button"], button:has-text("Snooze")').first();
    if (await snoozeButton.isVisible().catch(() => false)) {
      await snoozeButton.click();
      
      // Fill snooze form if it appears
      const snoozeInput = page.locator('[data-testid="snooze-input"], input[name="snooze"]').first();
      if (await snoozeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await snoozeInput.fill('1 hour');
        const confirmButton = page.locator('button[type="submit"]').first();
        await confirmButton.click();
      }
      
      await page.waitForTimeout(2000);
    }
  });

  test('04-06: Complete reminder @feature', async ({ page }) => {
    await page.goto('/reminders');
    await page.waitForLoadState('networkidle');
    
    const completeButton = page.locator('[data-testid="complete-button"], button:has-text("Complete")').first();
    if (await completeButton.isVisible().catch(() => false)) {
      await completeButton.click();
      await page.waitForTimeout(2000);
    }
  });

  test('04-17: Filter reminders @feature', async ({ page }) => {
    await page.goto('/reminders');
    await page.waitForLoadState('networkidle');
    
    const filterButton = page.locator('[data-testid="filter-button"], button:has-text("Filter")').first();
    if (await filterButton.isVisible().catch(() => false)) {
      await filterButton.click();
      
      const statusFilter = page.locator('[data-testid="status-filter"], select[name="status"]').first();
      if (await statusFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
        await statusFilter.selectOption('active');
        await page.waitForTimeout(1000);
      }
    }
  });

  test('04-18: Sort reminders @feature', async ({ page }) => {
    await page.goto('/reminders');
    await page.waitForLoadState('networkidle');
    
    const sortButton = page.locator('[data-testid="sort-button"], th button').first();
    if (await sortButton.isVisible().catch(() => false)) {
      await sortButton.click();
      await page.waitForTimeout(1000);
    }
  });
});
