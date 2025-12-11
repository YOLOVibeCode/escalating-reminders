import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly header: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('[data-testid="sidebar"], aside, nav').first();
    this.header = page.locator('[data-testid="header"], header').first();
    this.mainContent = page.locator('main, [data-testid="main-content"]').first();
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async isVisible(): Promise<boolean> {
    return await this.sidebar.isVisible() && await this.header.isVisible();
  }
}
