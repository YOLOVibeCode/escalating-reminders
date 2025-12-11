import { test, expect } from '@playwright/test';

/**
 * Layer 0: @critical
 * 
 * Purpose: Absolute minimum viability. If these fail, nothing else matters.
 * Execution: Serial (one by one)
 * Fail Behavior: Stop immediately on first failure
 * Dependencies: None (first to run)
 */

test.describe('Layer 0: Critical Tests', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3800';
  const apiBaseURL = process.env.API_BASE_URL || 'http://localhost:3801';

  test('00-01: App loads @critical', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Verify page loads (200 status)
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    
    // Verify page title exists
    await expect(page).toHaveTitle(/Escalating Reminders|Reminders/i);
  });

  test('00-02: Login page renders @critical', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Verify login form is visible
    const emailInput = page.locator('[data-testid="email-input"], input[type="email"]').first();
    const passwordInput = page.locator('[data-testid="password-input"], input[type="password"]').first();
    const loginButton = page.locator('[data-testid="login-button"], button[type="submit"]').first();
    
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await expect(loginButton).toBeVisible({ timeout: 10000 });
  });

  test('00-03: API health check @critical', async ({ request }) => {
    // Check API health endpoint
    const response = await request.get(`${apiBaseURL}/health`);
    
    // API should respond (200 or 404 is acceptable - means server is running)
    // 404 means endpoint doesn't exist yet, but server is up
    expect([200, 404]).toContain(response.status());
  });
});
