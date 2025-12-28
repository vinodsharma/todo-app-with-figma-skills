import { test, expect } from './fixtures';

test.describe('Settings and Theme', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
  });

  test('should have theme toggle button', async ({ page }) => {
    // Look for theme toggle in header
    const themeButton = page.getByRole('button', { name: /theme|toggle|dark|light|sun|moon/i });
    await expect(themeButton).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    const html = page.locator('html');

    // Get initial class
    const initialClass = await html.getAttribute('class') || '';
    const wasDark = initialClass.includes('dark');

    // Click theme toggle
    const themeButton = page.getByRole('button', { name: /theme|toggle|dark|light|sun|moon/i });
    await themeButton.click();

    // Wait for theme to change
    await page.waitForTimeout(500);

    // Check if class changed
    const newClass = await html.getAttribute('class') || '';
    const isNowDark = newClass.includes('dark');

    // Theme should have toggled
    expect(isNowDark).not.toBe(wasDark);
  });

  test('should show user avatar or name in header', async ({ page }) => {
    // Should have some user indicator
    const userMenu = page.getByRole('button', { name: /user|account|profile|menu/i });
    await expect(userMenu).toBeVisible();
  });

  test('should have logout option', async ({ page }) => {
    // Click user menu
    const userMenu = page.getByRole('button', { name: /user|account|profile|menu/i });
    await userMenu.click();

    // Look for logout option
    const logoutOption = page.getByRole('menuitem', { name: /log ?out|sign ?out/i });
    await expect(logoutOption).toBeVisible();
  });

  test('should logout and redirect to login', async ({ page }) => {
    // Click user menu
    const userMenu = page.getByRole('button', { name: /user|account|profile|menu/i });
    await userMenu.click();

    // Click logout
    const logoutOption = page.getByRole('menuitem', { name: /log ?out|sign ?out/i });
    await logoutOption.click();

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
