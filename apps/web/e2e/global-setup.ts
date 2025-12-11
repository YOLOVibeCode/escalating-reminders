import { chromium, FullConfig, request } from '@playwright/test';
import { seedTestData } from './helpers/seed-test-data';

/**
 * Global setup runs before all tests
 * - Seeds test database with test users
 * - Verifies API is accessible
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3800';
  const apiBaseURL = process.env.API_BASE_URL || 'http://localhost:3801';
  
  console.log('🔧 E2E Global Setup');
  console.log(`   Web URL: ${baseURL}`);
  console.log(`   API URL: ${apiBaseURL}`);
  
  // Verify API health endpoint
  try {
    const healthResponse = await fetch(`${apiBaseURL}/health`);
    
    if (!healthResponse.ok && healthResponse.status !== 404) {
      throw new Error(`API health check failed: ${healthResponse.status}`);
    }
    
    console.log('✅ API is accessible');
  } catch (error) {
    console.warn('⚠️  API health check failed (tests may still run):', error);
  }
  
  // Seed test data
  try {
    const apiRequest = request.newContext();
    await seedTestData(apiRequest, apiBaseURL);
  } catch (error) {
    console.warn('⚠️  Failed to seed test data (tests may still run):', error);
    console.warn('   Make sure the seeding endpoint is available and NODE_ENV is development/test');
  }
  
  // Verify web app is accessible
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    await browser.close();
    
    console.log('✅ Web app is accessible');
  } catch (error) {
    console.warn('⚠️  Web app check failed (tests may still run):', error);
  }
  
  console.log('✅ Global setup complete\n');
}

export default globalSetup;
