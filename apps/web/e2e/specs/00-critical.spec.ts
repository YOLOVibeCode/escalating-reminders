import { test, expect } from '@playwright/test';

/**
 * Layer 0: @critical
 * 
 * Purpose: Absolute minimum viability. If these fail, nothing else matters.
 * Execution: Serial (one by one)
 * Fail Behavior: Stop immediately on first failure
 * Dependencies: None (first to run)
 * 
 * Environment Support:
 * - LOCAL: http://localhost:3800 / http://localhost:3801
 * - STAGING: Uses BASE_URL and API_BASE_URL env vars
 * - PRODUCTION: Uses BASE_URL and API_BASE_URL env vars
 */

// Environment configuration
const E2E_ENV = process.env.E2E_ENV || 'local';
const IS_PRODUCTION = E2E_ENV === 'production';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3801';

test.describe('Layer 0: Critical Tests', () => {
  
  // Log environment info before tests
  test.beforeAll(() => {
    console.log(`\n🔍 Critical Tests - Environment: ${E2E_ENV}`);
    console.log(`   API URL: ${API_BASE_URL}\n`);
  });

  test('00-01: App loads @critical', async ({ page }) => {
    // Navigate to home page
    const response = await page.goto('/', { 
      waitUntil: 'domcontentloaded',
      timeout: IS_PRODUCTION ? 30000 : 15000,
    });
    
    // Verify page loads (200 status)
    expect(response?.status()).toBe(200);
    
    // Verify page has content (not blank)
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
    expect(bodyContent!.length).toBeGreaterThan(0);
    
    // Verify page title exists (flexible matching for different environments)
    await expect(page).toHaveTitle(/Escalating Reminders|Reminders|Dashboard/i);
  });

  test('00-02: Login page renders @critical', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login', {
      waitUntil: 'domcontentloaded',
      timeout: IS_PRODUCTION ? 30000 : 15000,
    });
    
    // Verify login form is visible
    const emailInput = page.locator('[data-testid="email-input"], input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('[data-testid="password-input"], input[type="password"], input[name="password"]').first();
    const loginButton = page.locator('[data-testid="login-button"], button[type="submit"]').first();
    
    // Extended timeout for production (network latency)
    const elementTimeout = IS_PRODUCTION ? 20000 : 10000;
    
    await expect(emailInput).toBeVisible({ timeout: elementTimeout });
    await expect(passwordInput).toBeVisible({ timeout: elementTimeout });
    await expect(loginButton).toBeVisible({ timeout: elementTimeout });
    
    // Verify form is interactive
    await expect(emailInput).toBeEnabled();
    await expect(passwordInput).toBeEnabled();
    await expect(loginButton).toBeEnabled();
  });

  test('00-03: API health check @critical', async ({ request }) => {
    // Check API health endpoint
    const response = await request.get(`${API_BASE_URL}/health`, {
      timeout: IS_PRODUCTION ? 30000 : 15000,
      headers: IS_PRODUCTION ? { 'X-E2E-Test': 'true' } : {},
    });
    
    // API should respond with 200
    // Accept 404 only in development (endpoint may not exist yet)
    if (IS_PRODUCTION) {
      expect(response.status()).toBe(200);
    } else {
      expect([200, 404]).toContain(response.status());
    }
    
    // If 200, verify response structure
    if (response.status() === 200) {
      const body = await response.json();
      // Health endpoint should return some status info
      expect(body).toBeDefined();
    }
  });

  test('00-04: API responds to authenticated endpoints @critical', async ({ request }) => {
    // Test that API is accepting requests (even if unauthorized)
    const response = await request.get(`${API_BASE_URL}/v1/reminders`, {
      timeout: IS_PRODUCTION ? 30000 : 15000,
      headers: IS_PRODUCTION ? { 'X-E2E-Test': 'true' } : {},
    });
    
    // Should return 401 (unauthorized) not 500 (server error) or timeout
    // This proves the API is running and processing requests
    expect([401, 403]).toContain(response.status());
  });
});
