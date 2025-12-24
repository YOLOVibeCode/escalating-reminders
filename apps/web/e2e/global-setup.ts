import { chromium, request, type FullConfig } from '@playwright/test';
import { clearTestData, seedTestData } from './helpers/seed-test-data';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

/**
 * Global setup runs before all tests
 * 
 * Environment Detection:
 * - LOCAL: Seeds test data, starts dev server if needed
 * - STAGING: Seeds test data (if enabled)
 * - PRODUCTION: No seeding, read-only smoke tests only
 * 
 * Environment Variables:
 * - BASE_URL: Frontend URL (default: http://localhost:3800)
 * - API_BASE_URL: API URL (default: http://localhost:3801)
 * - E2E_ENV: Environment name (local, staging, production)
 * - SKIP_SEEDING: Set to 'true' to skip database seeding
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || process.env.BASE_URL || 'http://localhost:3800';
  const apiBaseURL = process.env.API_BASE_URL || 'http://localhost:3801';
  const e2eEnv = process.env.E2E_ENV || 'local';
  const isProduction = e2eEnv === 'production' || baseURL.includes('escalating-reminders.com');
  const skipSeeding = process.env.SKIP_SEEDING === 'true' || isProduction;
  const webhookReceiverPort = process.env.WEBHOOK_RECEIVER_PORT || '3812';
  const webhookReceiverBaseUrl =
    process.env.WEBHOOK_RECEIVER_BASE_URL || `http://localhost:${webhookReceiverPort}`;
  const pidFile = path.resolve(__dirname, '.webhook-receiver.pid');
  
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                     E2E Global Setup                            ║
╠════════════════════════════════════════════════════════════════╣
║  Environment: ${e2eEnv.padEnd(46)}║
║  Web URL:     ${baseURL.padEnd(46)}║
║  API URL:     ${apiBaseURL.padEnd(46)}║
║  Production:  ${(isProduction ? 'Yes (read-only tests)' : 'No').padEnd(46)}║
║  Seeding:     ${(skipSeeding ? 'DISABLED' : 'Enabled').padEnd(46)}║
╚════════════════════════════════════════════════════════════════╝
`);

  // Step 1: Verify API health endpoint
  console.log('🔍 Checking API health...');
  try {
    const healthResponse = await fetch(`${apiBaseURL}/health`, {
      headers: isProduction ? { 'X-E2E-Test': 'true' } : {},
    });
    
    if (healthResponse.ok) {
      console.log('   ✅ API is healthy');
    } else if (healthResponse.status === 404) {
      console.log('   ⚠️  Health endpoint not found (API may still work)');
    } else {
      console.warn(`   ⚠️  API health check returned: ${healthResponse.status}`);
    }
  } catch (error) {
    console.error('   ❌ API is not accessible:', (error as Error).message);
    if (!isProduction) {
      console.log('   💡 Make sure the API is running: cd apps/api && npm run dev');
    }
  }

  // Step 2: Seed test data (skip in production)
  if (!skipSeeding) {
    console.log('🌱 Seeding test data...');
    try {
      const apiRequest = await request.newContext();
      const shouldClearFirst =
        process.env.E2E_RESET_DB === 'true' || (!!process.env.CI && process.env.E2E_RESET_DB !== 'false');
      if (shouldClearFirst) {
        console.log('🧼 Clearing existing test data (CI default)...');
        await clearTestData(apiRequest, apiBaseURL).catch(() => {});
      }
      await seedTestData(apiRequest, apiBaseURL);
      console.log('   ✅ Test data seeded successfully');
    } catch (error) {
      console.warn('   ⚠️  Failed to seed test data:', (error as Error).message);
      console.log('   💡 Make sure NODE_ENV=development or NODE_ENV=test');
      console.log('   💡 Seeding endpoint: POST /v1/seeding/seed');
    }
  } else {
    console.log('⏭️  Skipping database seeding');
    if (isProduction) {
      console.log('   ℹ️  Production mode: Using existing production data');
      console.log('   ⚠️  Destructive tests will be skipped');
    }
  }

  // Step 3: Verify web app is accessible
  console.log('🌐 Checking web app accessibility...');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const response = await page.goto(baseURL, { 
      waitUntil: 'domcontentloaded',
      timeout: isProduction ? 30000 : 15000,
    });
    
    if (response?.ok()) {
      console.log('   ✅ Web app is accessible');
    } else {
      console.warn(`   ⚠️  Web app returned status: ${response?.status()}`);
    }
    
    // Take a screenshot for debugging
    if (process.env.DEBUG) {
      await page.screenshot({ path: 'e2e-results/setup-screenshot.png' });
      console.log('   📸 Debug screenshot saved: e2e-results/setup-screenshot.png');
    }
  } catch (error) {
    console.error('   ❌ Web app is not accessible:', (error as Error).message);
    if (!isProduction) {
      console.log('   💡 Make sure the web app is running: cd apps/web && npm run dev');
    }
  } finally {
    await browser?.close();
  }

  // Step 4: Production-specific warnings
  if (isProduction) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║  ⚠️  PRODUCTION MODE - Important Notes                         ║
╠════════════════════════════════════════════════════════════════╣
║  • Using existing production data (no seeding)                  ║
║  • Destructive tests (create/update/delete) will be skipped     ║
║  • Only read-only smoke tests will run                          ║
║  • Test users must exist in production database                 ║
║                                                                 ║
║  To run destructive tests in production:                        ║
║    ALLOW_DESTRUCTIVE_TESTS=true npm run e2e                     ║
╚════════════════════════════════════════════════════════════════╝
`);
  }

  // Step 5: Start local webhook receiver (for webhook agent E2E)
  if (!isProduction) {
    try {
      // If a previous run left a receiver running, try to stop it.
      if (existsSync(pidFile)) {
        const oldPid = Number(readFileSync(pidFile, 'utf8').trim());
        if (oldPid) {
          try {
            process.kill(oldPid, 'SIGTERM');
          } catch {
            // ignore
          }
        }
        try {
          unlinkSync(pidFile);
        } catch {
          // ignore
        }
      }

      const serverPath = path.resolve(__dirname, 'webhook-receiver', 'server.js');
      const child = spawn(process.execPath, [serverPath], {
        env: {
          ...process.env,
          WEBHOOK_RECEIVER_PORT: webhookReceiverPort,
        },
        stdio: 'ignore',
        detached: true,
      });
      child.unref();
      writeFileSync(pidFile, String(child.pid || ''), 'utf8');

      // Warm up receiver
      await fetch(`${webhookReceiverBaseUrl}/health`).catch(() => {});
      console.log(`🪝 Webhook receiver ready at ${webhookReceiverBaseUrl}`);
    } catch (e) {
      console.warn('⚠️  Failed to start webhook receiver:', (e as Error).message);
    }
  }

  console.log('✅ Global setup complete\n');
}

export default globalSetup;
