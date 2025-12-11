import { defineConfig, devices } from '@playwright/test';

/**
 * E2E Test Pyramid Configuration
 * 
 * Layers execute in order with dependencies:
 * 0. @critical - Must pass first (serial, stop on failure)
 * 1. @auth - Depends on critical
 * 2. @dashboard - Depends on auth
 * 3. @navigation - Depends on dashboard
 * 4. @feature - Depends on navigation
 * 5. @integration - Depends on feature
 * 6. @error - Depends on integration
 */
export default defineConfig({
  testDir: './specs',
  
  // Global timeout
  timeout: 60000,
  
  // Expect timeout
  expect: { 
    timeout: 10000 
  },
  
  // Retries in CI only
  retries: process.env.CI ? 2 : 0,
  
  // Workers - parallel within layers, serial across layers
  workers: process.env.CI ? 2 : 4,
  
  // Reporter configuration
  reporter: [
    ['html', { open: 'never', outputFolder: 'e2e-results/html' }],
    ['json', { outputFile: 'e2e-results/results.json' }],
    ['list'],
    ...(process.env.CI ? [['github']] : [])
  ],
  
  // Global setup/teardown
  globalSetup: require.resolve('./global-setup.ts'),
  globalTeardown: require.resolve('./global-teardown.ts'),
  
  // Projects for ordered execution with dependencies
  projects: [
    // Layer 0: Critical (serial, stop on failure)
    {
      name: 'critical',
      testMatch: /00-critical\.spec\.ts/,
      fullyParallel: false,
      retries: 0,
      timeout: 30000,
    },
    
    // Layer 1: Auth (depends on critical)
    {
      name: 'auth',
      testMatch: /01-auth\.spec\.ts/,
      dependencies: ['critical'],
      timeout: 60000,
    },
    
    // Layer 2: Dashboard (depends on auth)
    {
      name: 'dashboard',
      testMatch: /02-.*\.spec\.ts/,
      dependencies: ['auth'],
      timeout: 60000,
    },
    
    // Layer 3: Navigation (depends on dashboard)
    {
      name: 'navigation',
      testMatch: /03-.*\.spec\.ts/,
      dependencies: ['dashboard'],
      timeout: 60000,
    },
    
    // Layer 4: Features (depends on navigation)
    {
      name: 'features',
      testMatch: /04-.*\.spec\.ts/,
      dependencies: ['navigation'],
      timeout: 60000,
    },
    
    // Layer 5: Integration (depends on features, serial)
    {
      name: 'integration',
      testMatch: /05-integration\.spec\.ts/,
      dependencies: ['features'],
      fullyParallel: false,
      timeout: 120000,
    },
    
    // Layer 6: Error handling (depends on integration)
    {
      name: 'error',
      testMatch: /06-error\.spec\.ts/,
      dependencies: ['integration'],
      timeout: 60000,
    },
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3800',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  // Web server configuration for local development
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3800',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
