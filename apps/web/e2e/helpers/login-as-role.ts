import { expect, type Page } from '@playwright/test';

export type TestRole = 'user' | 'admin';

/**
 * Test user credentials
 * 
 * Credentials can be overridden via environment variables for production testing:
 * - TEST_USER_EMAIL / TEST_USER_PASSWORD
 * - TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD
 */
const TEST_USERS = {
  user: { 
    email: process.env.TEST_USER_EMAIL || 'testuser@example.com', 
    password: process.env.TEST_USER_PASSWORD || 'TestUser123!' 
  },
  admin: { 
    email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com', 
    password: process.env.TEST_ADMIN_PASSWORD || 'AdminPass123!' 
  },
};

/**
 * Get test credentials for a role
 * @param role - 'user' or 'admin'
 * @returns Credentials object with email and password
 */
export function getTestCredentials(role: TestRole): { email: string; password: string } {
  return TEST_USERS[role];
}

/**
 * Login as a specific role
 * 
 * Supports multiple environments:
 * - Local: Uses seeded test users
 * - Staging: Uses seeded test users
 * - Production: Uses pre-created test accounts (set via env vars)
 * 
 * @param page - Playwright page object
 * @param role - 'user' or 'admin'
 * @param options - Optional configuration
 * @param options.waitForDashboard - Wait for dashboard redirect (default: true)
 * @param options.timeout - Custom timeout in ms (default: 15000)
 */
export async function loginAsRole(
  page: Page, 
  role: TestRole,
  options: { waitForDashboard?: boolean; timeout?: number } = {}
): Promise<void> {
  const { waitForDashboard = true, timeout = 15000 } = options;
  const credentials = TEST_USERS[role];
  const isProduction = process.env.E2E_ENV === 'production';
  
  // Log which credentials we're using (helpful for debugging)
  if (process.env.DEBUG) {
    console.log(`🔐 Logging in as ${role}: ${credentials.email}`);
  }
  
  // Navigate to login page
  await page.goto('/login');
  
  // Wait for login form to be visible (prioritize data-testid)
  await page.waitForSelector('[data-testid="email-input"]', { 
    timeout: isProduction ? timeout * 2 : timeout 
  });
  
  // Fill in credentials (use stable data-testid selectors)
  const emailInput = page.locator('[data-testid="email-input"]').first();
  const passwordInput = page.locator('[data-testid="password-input"]').first();
  const loginButton = page.locator('[data-testid="login-button"]').first();
  
  await emailInput.fill(credentials.email);
  await passwordInput.fill(credentials.password);
  
  // Submit form
  await loginButton.click();
  
  // Wait for redirect to dashboard
  if (waitForDashboard) {
    const expectedUrl = role === 'admin' ? '/admin/dashboard' : '/dashboard';
    await page.waitForURL(new RegExp(expectedUrl), { 
      timeout: isProduction ? timeout * 2 : timeout 
    });
    
    // Verify we're on the correct dashboard
    await expect(page).toHaveURL(new RegExp(expectedUrl));
  }
  
  if (process.env.DEBUG) {
    console.log(`✅ Logged in as ${role} successfully`);
  }
}

/**
 * Logout current user
 * @param page - Playwright page object
 */
export async function logout(page: Page): Promise<void> {
  // Look for logout button in user menu
  const userMenu = page.locator('[data-testid="user-menu"], [data-testid="profile-menu"]').first();
  
  if (await userMenu.isVisible()) {
    await userMenu.click();
    const logoutButton = page.locator('[data-testid="logout-button"]');
    await logoutButton.click();
  } else {
    // Fallback: Navigate directly to logout
    await page.goto('/logout');
  }
  
  // Wait for redirect to login page
  await page.waitForURL(/\/(login|$)/, { timeout: 10000 });
}

/**
 * Check if user is currently logged in
 * @param page - Playwright page object
 * @returns true if logged in, false otherwise
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check for auth-related elements
    const authIndicator = page.locator('[data-testid="user-menu"], [data-testid="sidebar"]').first();
    return await authIndicator.isVisible({ timeout: 5000 });
  } catch {
    return false;
  }
}
