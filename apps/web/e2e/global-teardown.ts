import { request, type FullConfig } from '@playwright/test';
import { clearTestData } from './helpers/seed-test-data';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';

/**
 * Global teardown runs after all tests
 * - Cleanup test data if needed
 * - Generate reports
 */
async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 E2E Global Teardown');

  // Stop webhook receiver if running
  try {
    const pidFile = path.resolve(__dirname, '.webhook-receiver.pid');
    if (existsSync(pidFile)) {
      const pid = Number(readFileSync(pidFile, 'utf8').trim());
      if (pid) {
        try {
          process.kill(pid, 'SIGTERM');
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
  } catch {
    // ignore
  }
  
  // Optionally clear test data (commented out by default to preserve data for debugging)
  // Uncomment if you want to clean up after tests
  /*
  try {
    const apiBaseURL = process.env.API_BASE_URL || 'http://localhost:3801';
    const apiRequest = request.newContext();
    await clearTestData(apiRequest, apiBaseURL);
  } catch (error) {
    console.warn('⚠️  Failed to clear test data:', error);
  }
  */
  
  console.log('✅ Test execution complete');
  console.log('📊 Reports available in e2e-results/\n');
}

export default globalTeardown;
