import { Page, expect } from '@playwright/test';

export type TestRole = 'user' | 'admin';

/**
 * Test user credentials
 * These should match seeded test users in the database
 */
const TEST_USERS = {
  user: { 
    email: 'testuser@example.com', 
    password: 'TestUser123!' 
  },
  admin: { 
    email: 'admin@example.com', 
    password: 'AdminPass123!' 
  },
};

/**
 * Login as a specific role
 * @param page - Playwright page object
 * @param role - 'user' or 'admin'
 */
export async function loginAsRole(page: Page, role: TestRole): Promise<void> {
  const credentials = TEST_USERS[role];
  
  // Navigate to login page
  await page.goto('/login');
  
  // Wait for login form to be visible
  await page.waitForSelector('[data-testid="email-input"], input[type="email"]', { 
    timeout: 10000 
  });
  
  // Fill in credentials
  const emailInput = page.locator('[data-testid="email-input"], input[type="email"]').first();
  const passwordInput = page.locator('[data-testid="password-input"], input[type="password"]').first();
  const loginButton = page.locator('[data-testid="login-button"], button[type="submit"]').first();
  
  await emailInput.fill(credentials.email);
  await passwordInput.fill(credentials.password);
  
  // Submit form
  await loginButton.click();
  
  // Wait for redirect to dashboard
  const expectedUrl = role === 'admin' ? '/admin/dashboard' : '/dashboard';
  await page.waitForURL(new RegExp(expectedUrl), { timeout: 15000 });
  
  // Verify we're on the correct dashboard
  await expect(page).toHaveURL(new RegExp(expectedUrl));
}
