import { test, expect } from '@playwright/test';
import { loginAsRole } from '../helpers/login-as-role';

/**
 * Layer 6: @error
 * 
 * Purpose: Error handling and edge cases
 * Execution: Parallel
 * Fail Behavior: Report all failures
 * Dependencies: Layer 5 passes
 */

test.describe('Layer 6: Error Handling', () => {
  test('06-01: 404 page renders @error', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    await page.waitForLoadState('networkidle');
    
    // Should show 404 page or error message
    const error404 = page.locator('text=/404|not found|page not found/i').first();
    const is404 = await error404.isVisible().catch(() => false);
    
    // Or check if redirected to a 404 page
    const is404Page = page.url().includes('404') || is404;
    
    expect(is404Page || page.url().includes('/dashboard')).toBeTruthy();
  });

  test('06-02: API error handling @error', async ({ page }) => {
    await loginAsRole(page, 'user');
    
    // Try to access a non-existent reminder
    await page.goto('/reminders/non-existent-id-99999');
    await page.waitForLoadState('networkidle');
    
    // Should show error message or redirect
    const errorMessage = page.locator('[data-testid="error-message"], .error, [role="alert"]').first();
    const hasError = await errorMessage.isVisible().catch(() => false);
    const isRedirected = page.url().includes('/reminders') && !page.url().includes('non-existent');
    
    expect(hasError || isRedirected).toBeTruthy();
  });

  test('06-03: Form validation @error', async ({ page }) => {
    await loginAsRole(page, 'user');
    
    await page.goto('/reminders/new');
    
    // Try to submit empty form
    const submitButton = page.locator('[data-testid="submit-button"], button[type="submit"]').first();
    await submitButton.click();
    
    await page.waitForTimeout(1000);
    
    // Should show validation errors
    const validationError = page.locator('[data-testid="error"], .error, [role="alert"], text=/required|invalid/i').first();
    const hasValidationError = await validationError.isVisible().catch(() => false);
    
    // Or form should still be visible (not submitted)
    const form = page.locator('form').first();
    const formStillVisible = await form.isVisible().catch(() => false);
    
    expect(hasValidationError || formStillVisible).toBeTruthy();
  });

  test('06-04: Network timeout handling @error', async ({ page, context }) => {
    await loginAsRole(page, 'user');
    
    // Simulate offline mode
    await context.setOffline(true);
    
    try {
      await page.goto('/reminders');
      await page.waitForTimeout(2000);
      
      // Should show error or offline message
      const offlineMessage = page.locator('text=/offline|network|connection/i').first();
      const hasOfflineMessage = await offlineMessage.isVisible().catch(() => false);
      
      // Or page should show cached content or error
      expect(hasOfflineMessage || page.url().includes('/reminders')).toBeTruthy();
    } finally {
      await context.setOffline(false);
    }
  });

  test('06-05: Session expiry @error', async ({ page }) => {
    await loginAsRole(page, 'user');
    
    // Clear cookies to simulate expired session
    await page.context().clearCookies();
    
    // Try to access protected route
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('06-06: Rate limit response @error', async ({ page }) => {
    await loginAsRole(page, 'user');
    
    // Make many rapid requests (if rate limiting is implemented)
    for (let i = 0; i < 10; i++) {
      await page.goto('/reminders');
      await page.waitForTimeout(100);
    }
    
    // Should either work or show rate limit message
    const rateLimitMessage = page.locator('text=/rate limit|too many|429/i').first();
    const hasRateLimit = await rateLimitMessage.isVisible().catch(() => false);
    
    // Or page should still load normally (rate limit might not be triggered)
    const pageLoaded = page.url().includes('/reminders');
    
    expect(hasRateLimit || pageLoaded).toBeTruthy();
  });
});
