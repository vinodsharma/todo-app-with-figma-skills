import { request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Generate unique test user credentials for this test run
const TEST_USER = {
  name: 'E2E Test User',
  email: `e2e-test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
};

const AUTH_FILE = path.join(__dirname, '.auth-credentials.json');

async function globalSetup() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

  console.log(`\n🔐 Setting up E2E test user...`);
  console.log(`   Base URL: ${baseURL}`);
  console.log(`   Email: ${TEST_USER.email}`);

  // Create a request context to register the user
  const requestContext = await request.newContext({
    baseURL,
  });

  try {
    // Register the test user via API
    const response = await requestContext.post('/api/auth/register', {
      data: {
        name: TEST_USER.name,
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    });

    if (response.ok()) {
      console.log(`   ✅ Test user registered successfully`);
    } else {
      const errorBody = await response.text();
      // If user already exists, that's fine - we can use it
      if (response.status() === 400 && errorBody.includes('already exists')) {
        console.log(`   ⚠️ Test user already exists - will use existing`);
      } else {
        throw new Error(`Failed to register test user: ${response.status()} - ${errorBody}`);
      }
    }

    // Save credentials to file for fixtures to read
    fs.writeFileSync(AUTH_FILE, JSON.stringify(TEST_USER, null, 2));
    console.log(`   📁 Credentials saved to ${AUTH_FILE}\n`);

  } catch (error) {
    console.error(`   ❌ Failed to setup test user:`, error);
    throw error;
  } finally {
    await requestContext.dispose();
  }
}

export default globalSetup;

// Export for fixtures to import
export { AUTH_FILE, TEST_USER };
