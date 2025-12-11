import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"], input[type="email"]').first();
    this.passwordInput = page.locator('[data-testid="password-input"], input[type="password"]').first();
    this.loginButton = page.locator('[data-testid="login-button"], button[type="submit"]').first();
    this.registerLink = page.locator('a[href*="register"], [data-testid="register-link"]').first();
    this.errorMessage = page.locator('[data-testid="error-message"], .error, [role="alert"]').first();
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async isVisible(): Promise<boolean> {
    return await this.emailInput.isVisible();
  }
}
