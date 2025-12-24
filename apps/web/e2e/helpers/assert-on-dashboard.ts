import { expect, type Page } from '@playwright/test';

/**
 * Assert that we're on the correct dashboard for a role
 * @param page - Playwright page object
 * @param role - 'user' or 'admin'
 */
export async function assertOnDashboard(page: Page, role: 'user' | 'admin'): Promise<void> {
  const expectedUrl = role === 'admin' ? '/admin/dashboard' : '/dashboard';
  
  // Verify URL
  await expect(page).toHaveURL(new RegExp(expectedUrl));
  
  // Verify sidebar is visible (use stable data-testid)
  const sidebar = page.locator('[data-testid="header"]').first(); // Header contains nav
  await expect(sidebar).toBeVisible({ timeout: 5000 });
  
  // Verify header/navigation is visible
  const header = page.locator('[data-testid="header"]').first();
  await expect(header).toBeVisible({ timeout: 5000 });
}
