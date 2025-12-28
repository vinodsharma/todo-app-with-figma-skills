import { test as base, expect } from '@playwright/test';

// Test user credentials - should be set in environment or use test user
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

// Custom fixture that handles authentication
export const test = base.extend<{ authenticatedPage: void }>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/login');

    // Fill in credentials
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to home page or dashboard
    await page.waitForURL('/', { timeout: 10000 }).catch(() => {
      // If redirect doesn't happen, we might still be on login with error
      console.log('Login may have failed - continuing anyway for test setup');
    });

    await use();
  },
});

export { expect };

// Helper to create a unique todo title
export function uniqueTitle(prefix: string = 'Test Todo'): string {
  return `${prefix} ${Date.now()}`;
}
