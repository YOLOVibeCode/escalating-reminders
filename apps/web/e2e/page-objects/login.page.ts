import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // Prioritize data-testid selectors for stability
    this.emailInput = page.locator('[data-testid="email-input"]').first();
    this.passwordInput = page.locator('[data-testid="password-input"]').first();
    this.loginButton = page.locator('[data-testid="login-button"]').first();
    this.registerLink = page.locator('[data-testid="register-link"]').first();
    this.errorMessage = page.locator('[data-testid="login-error"]').first();
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
