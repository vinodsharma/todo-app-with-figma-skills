import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should display landing page for unauthenticated users', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /the todo app that gets out of your way/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started free/i }).first()).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Features link
    await page.getByRole('link', { name: 'Features' }).click();
    await expect(page.locator('#features')).toBeInViewport();

    // FAQ link
    await page.getByRole('link', { name: 'FAQ' }).click();
    await expect(page.locator('#faq')).toBeInViewport();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.getByRole('link', { name: /get started/i }).first().click();
    await expect(page).toHaveURL('/register');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).first().click();
    await expect(page).toHaveURL('/login');
  });

  test('should toggle theme', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /toggle theme/i }).first();
    await themeToggle.click();
    // Verify theme menu appears
    await expect(page.getByRole('menuitem', { name: /dark/i })).toBeVisible();
  });

  test('should expand FAQ accordion', async ({ page }) => {
    await page.getByRole('link', { name: 'FAQ' }).click();

    const firstQuestion = page.getByRole('button', { name: /is it free to use/i });
    await firstQuestion.click();

    await expect(page.getByText(/completely free/i)).toBeVisible();
  });
});
