import { FullConfig, request } from '@playwright/test';
import { clearTestData } from './helpers/seed-test-data';

/**
 * Global teardown runs after all tests
 * - Cleanup test data if needed
 * - Generate reports
 */
async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 E2E Global Teardown');
  
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
