import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests.
 *
 * In CI, tests run against deployed URLs:
 * - PR to staging: Tests run against Vercel Preview URL
 * - PR to main: Tests run against Staging URL
 *
 * Locally, tests run against localhost:3000 (default).
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
      },
      testMatch: /responsive\.spec\.ts/,
    },
    {
      name: 'tablet',
      use: {
        browserName: 'chromium',
        viewport: { width: 810, height: 1080 },
        isMobile: true,
        hasTouch: true,
      },
      testMatch: /responsive\.spec\.ts/,
    },
    // Uncomment to add more browsers in CI
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Only start webServer when running locally (not in CI against deployed URLs)
  ...(process.env.CI ? {} : {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  }),
});
