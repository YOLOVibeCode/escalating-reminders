import type { Page } from '@playwright/test';

/**
 * Wait for API calls to complete
 * Useful after form submissions or data loading
 * @param page - Playwright page object
 * @param timeout - Maximum wait time in ms
 */
export async function waitForApi(page: Page, timeout: number = 10000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {
    // Ignore timeout - continue anyway
  });
}
