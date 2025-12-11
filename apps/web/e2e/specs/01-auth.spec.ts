import { test, expect } from '@playwright/test';
import { loginAsRole, type TestRole } from '../helpers/login-as-role';
import { assertOnDashboard } from '../helpers/assert-on-dashboard';
import { LoginPage } from '../page-objects/login.page';

/**
 * Layer 1: @auth
 * 
 * Purpose: Verify all authentication flows for all roles
 * Execution: Parallel (within layer)
 * Fail Behavior: If any fail → skip Layer 2+
 * Dependencies: Layer 0 passes
 */

test.describe('Layer 1: Authentication Tests', () => {
  test('01-01: User registration @auth', async ({ page }) => {
    // Navigate to register page
    await page.goto('/register');
    
    // Wait for registration form
    const emailInput = page.locator('[data-testid="email-input"], input[type="email"]').first();
    const passwordInput = page.locator('[data-testid="password-input"], input[type="password"]').first();
    const registerButton = page.locator('[data-testid="register-button"], button[type="submit"]').first();
    
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    
    // Fill registration form with unique email
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    
    await emailInput.fill(testEmail);
    await passwordInput.fill('TestUser123!');
    
    // If there's a display name field
    const displayNameInput = page.locator('[data-testid="display-name-input"], input[name="displayName"]').first();
    if (await displayNameInput.isVisible().catch(() => false)) {
      await displayNameInput.fill('Test User');
    }
    
    // Submit registration
    await registerButton.click();
    
    // Should redirect to dashboard or show success message
    await page.waitForURL(/\/dashboard|\/login/, { timeout: 15000 });
    
    // Verify we're either on dashboard (auto-login) or login page (manual login)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/dashboard|\/login/);
  });

  test('01-02: User login @auth', async ({ page }) => {
    await loginAsRole(page, 'user');
    await assertOnDashboard(page, 'user');
  });

  test('01-03: User logout @auth', async ({ page }) => {
    // Login first
    await loginAsRole(page, 'user');
    await assertOnDashboard(page, 'user');
    
    // Find and click logout button
    const logoutButton = page.locator('[data-testid="logout-button"], button:has-text("Logout"), a:has-text("Logout")').first();
    
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
    } else {
      // Try user menu dropdown
      const userMenu = page.locator('[data-testid="user-menu"], [aria-label*="user"], [aria-label*="menu"]').first();
      if (await userMenu.isVisible().catch(() => false)) {
        await userMenu.click();
        await page.locator('text=Logout').first().click();
      }
    }
    
    // Should redirect to login page
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('01-04: Admin login @auth', async ({ page }) => {
    await loginAsRole(page, 'admin');
    await assertOnDashboard(page, 'admin');
  });

  test('01-05: Admin logout @auth', async ({ page }) => {
    // Login first
    await loginAsRole(page, 'admin');
    await assertOnDashboard(page, 'admin');
    
    // Find and click logout button
    const logoutButton = page.locator('[data-testid="logout-button"], button:has-text("Logout"), a:has-text("Logout")').first();
    
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
    } else {
      // Try admin menu dropdown
      const adminMenu = page.locator('[data-testid="admin-menu"], [aria-label*="admin"], [aria-label*="menu"]').first();
      if (await adminMenu.isVisible().catch(() => false)) {
        await adminMenu.click();
        await page.locator('text=Logout').first().click();
      }
    }
    
    // Should redirect to login page
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('01-06: Invalid login rejected @auth', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Try to login with wrong password
    await loginPage.login('testuser@example.com', 'WrongPassword123!');
    
    // Should show error message or stay on login page
    await page.waitForTimeout(2000); // Wait for error to appear
    
    const errorVisible = await loginPage.errorMessage.isVisible().catch(() => false);
    const stillOnLogin = page.url().includes('/login');
    
    expect(errorVisible || stillOnLogin).toBeTruthy();
  });

  test('01-07: Token refresh works @auth', async ({ page }) => {
    // Login first
    await loginAsRole(page, 'user');
    await assertOnDashboard(page, 'user');
    
    // Wait a bit to simulate token usage
    await page.waitForTimeout(2000);
    
    // Navigate to another page to trigger potential token refresh
    await page.goto('/reminders');
    await page.waitForLoadState('networkidle');
    
    // Should still be authenticated (not redirected to login)
    expect(page.url()).not.toMatch(/\/login/);
  });

  test('01-08: Protected route redirect @auth', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/dashboard');
    
    // Should redirect to login page
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
