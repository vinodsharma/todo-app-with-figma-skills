import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Path to credentials file created by global-setup
const AUTH_FILE = path.join(__dirname, '.auth-credentials.json');

// Read test user credentials created by global setup
function getTestCredentials(): { email: string; password: string } {
  try {
    const data = fs.readFileSync(AUTH_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Fallback for local development without running global setup
    console.warn('Warning: Auth credentials file not found, using defaults');
    return {
      email: 'test@example.com',
      password: 'testpassword123',
    };
  }
}

// Custom fixture that handles authentication
export const test = base.extend<{ authenticatedPage: void }>({
  authenticatedPage: async ({ page }, use) => {
    const credentials = getTestCredentials();

    // Navigate to login
    await page.goto('/login');

    // Fill in credentials
    await page.getByLabel(/email/i).fill(credentials.email);
    await page.getByLabel(/password/i).fill(credentials.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to home page or dashboard
    await page.waitForURL('/', { timeout: 10000 }).catch(() => {
      // If redirect doesn't happen, we might still be on login with error
      console.log('Login may have failed - check credentials');
    });

    await use();
  },
});

export { expect };

// Helper to create a unique todo title
export function uniqueTitle(prefix: string = 'Test Todo'): string {
  return `${prefix} ${Date.now()}`;
}
