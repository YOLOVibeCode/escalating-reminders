import { defineConfig, devices } from '@playwright/test';

/**
 * E2E Test Pyramid Configuration
 * 
 * Supports multiple environments:
 * - LOCAL: http://localhost:3800 (default)
 * - STAGING: Set BASE_URL and API_BASE_URL env vars
 * - PRODUCTION: Set BASE_URL and API_BASE_URL env vars
 * 
 * Environment Variables:
 * - BASE_URL: Frontend URL (default: http://localhost:3800)
 * - API_BASE_URL: API URL (default: http://localhost:3801)
 * - E2E_ENV: Environment name for logging (default: local)
 * - CI: Set to true in CI environments
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

// Environment configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3800';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3801';
const E2E_ENV = process.env.E2E_ENV || 'local';
const IS_CI = !!process.env.CI;
const IS_PRODUCTION = E2E_ENV === 'production' || BASE_URL.includes('escalating-reminders.com');

// Production safety: disable destructive tests in production
const SKIP_DESTRUCTIVE_TESTS = IS_PRODUCTION && !process.env.ALLOW_DESTRUCTIVE_TESTS;

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    E2E Test Configuration                       ║
╠════════════════════════════════════════════════════════════════╣
║  Environment: ${E2E_ENV.padEnd(46)}║
║  Base URL:    ${BASE_URL.padEnd(46)}║
║  API URL:     ${API_BASE_URL.padEnd(46)}║
║  CI Mode:     ${(IS_CI ? 'Yes' : 'No').padEnd(46)}║
║  Production:  ${(IS_PRODUCTION ? 'Yes' : 'No').padEnd(46)}║
║  Destructive: ${(SKIP_DESTRUCTIVE_TESTS ? 'DISABLED' : 'Enabled').padEnd(46)}║
╚════════════════════════════════════════════════════════════════╝
`);

export default defineConfig({
  testDir: './specs',
  
  // Global timeout - longer for production (network latency)
  timeout: IS_PRODUCTION ? 90000 : 60000,
  
  // Expect timeout
  expect: { 
    timeout: IS_PRODUCTION ? 15000 : 10000 
  },
  
  // Retries - more in CI and production
  retries: IS_CI ? 2 : (IS_PRODUCTION ? 1 : 0),
  
  // Workers - parallel within layers, serial across layers
  workers: IS_CI ? 2 : 4,
  
  // Reporter configuration
  reporter: [
    ['html', { open: 'never', outputFolder: 'e2e-results/html' }],
    ['json', { outputFile: 'e2e-results/results.json' }],
    ['list'],
    ...(IS_CI ? [['github'] as ['github']] : [])
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
      timeout: IS_PRODUCTION ? 45000 : 30000,
    },
    
    // Layer 1: Auth (depends on critical)
    {
      name: 'auth',
      testMatch: /01-auth\.spec\.ts/,
      dependencies: ['critical'],
      timeout: IS_PRODUCTION ? 90000 : 60000,
    },
    
    // Layer 2: Dashboard (depends on auth)
    {
      name: 'dashboard',
      testMatch: /02-.*\.spec\.ts/,
      dependencies: ['auth'],
      timeout: IS_PRODUCTION ? 90000 : 60000,
    },
    
    // Layer 3: Navigation (depends on dashboard)
    {
      name: 'navigation',
      testMatch: /03-.*\.spec\.ts/,
      dependencies: ['dashboard'],
      timeout: IS_PRODUCTION ? 90000 : 60000,
    },
    
    // Layer 4: Features (depends on navigation)
    {
      name: 'features',
      testMatch: /04-.*\.spec\.ts/,
      dependencies: ['navigation'],
      timeout: IS_PRODUCTION ? 90000 : 60000,
    },
    
    // Layer 5: Integration (depends on features, serial)
    {
      name: 'integration',
      testMatch: /05-integration\.spec\.ts/,
      dependencies: ['features'],
      fullyParallel: false,
      timeout: IS_PRODUCTION ? 180000 : 120000,
    },
    
    // Layer 6: Error handling (depends on integration)
    {
      name: 'error',
      testMatch: /06-error\.spec\.ts/,
      dependencies: ['integration'],
      timeout: IS_PRODUCTION ? 90000 : 60000,
    },
  ],
  
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: IS_PRODUCTION ? 15000 : 10000,
    navigationTimeout: IS_PRODUCTION ? 45000 : 30000,
    
    // Extra HTTP headers for production testing
    extraHTTPHeaders: IS_PRODUCTION ? {
      'X-E2E-Test': 'true',
      'X-E2E-Env': E2E_ENV,
    } : {},
  },
  
  // Web server configuration for local development only
  webServer: (IS_CI || IS_PRODUCTION) ? undefined : {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120000,
  },
});

// Export environment config for use in tests
export const testConfig = {
  baseURL: BASE_URL,
  apiBaseURL: API_BASE_URL,
  environment: E2E_ENV,
  isCI: IS_CI,
  isProduction: IS_PRODUCTION,
  skipDestructiveTests: SKIP_DESTRUCTIVE_TESTS,
};
