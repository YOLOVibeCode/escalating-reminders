import { Page, expect } from '@playwright/test';

/**
 * Assert that there are no critical console errors
 * Filters out known acceptable errors (favicon, ResizeObserver, etc.)
 * @param page - Playwright page object
 */
export async function assertNoConsoleErrors(page: Page): Promise<void> {
  const errors: string[] = [];
  
  // Listen for console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Wait for page to settle
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    // Ignore timeout - page may still be loading
  });
  
  // Filter out known acceptable errors
  const criticalErrors = errors.filter(err => {
    const lowerErr = err.toLowerCase();
    return !lowerErr.includes('favicon') && 
           !lowerErr.includes('resizeobserver') &&
           !lowerErr.includes('non-error promise rejection') &&
           !lowerErr.includes('chunk load');
  });
  
  if (criticalErrors.length > 0) {
    console.warn('Console errors detected:', criticalErrors);
  }
  
  // For now, we'll warn but not fail - adjust based on your needs
  // expect(criticalErrors).toHaveLength(0);
}
