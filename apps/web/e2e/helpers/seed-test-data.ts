import { APIRequestContext } from '@playwright/test';

/**
 * Seed test data via API endpoint
 * @param request - Playwright API request context
 * @param apiBaseURL - Base URL of the API
 */
export async function seedTestData(
  request: APIRequestContext,
  apiBaseURL: string = process.env.API_BASE_URL || 'http://localhost:3801',
): Promise<void> {
  const response = await request.post(`${apiBaseURL}/v1/seeding/seed`);

  if (!response.ok()) {
    const error = await response.text();
    throw new Error(`Failed to seed test data: ${response.status()} - ${error}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Seeding failed: ${data.error?.message || 'Unknown error'}`);
  }

  console.log('✅ Test data seeded successfully');
}

/**
 * Clear test data via API endpoint
 * @param request - Playwright API request context
 * @param apiBaseURL - Base URL of the API
 */
export async function clearTestData(
  request: APIRequestContext,
  apiBaseURL: string = process.env.API_BASE_URL || 'http://localhost:3801',
): Promise<void> {
  const response = await request.delete(`${apiBaseURL}/v1/seeding/clear`);

  if (!response.ok()) {
    const error = await response.text();
    throw new Error(`Failed to clear test data: ${response.status()} - ${error}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Clear failed: ${data.error?.message || 'Unknown error'}`);
  }

  console.log('✅ Test data cleared successfully');
}
