import { test, expect } from './fixtures';

test.describe('Settings and Theme', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
  });

  test('should have theme toggle button', async ({ page }) => {
    // Look for theme toggle in header - it has sr-only "Toggle theme" text
    const themeButton = page.getByRole('button', { name: /toggle theme/i });
    await expect(themeButton).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    // Click theme toggle to open menu
    const themeButton = page.getByRole('button', { name: /toggle theme/i });
    await themeButton.click();

    // Should see theme options
    await expect(page.getByRole('menuitem', { name: /light/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /dark/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /system/i })).toBeVisible();

    // Click dark theme
    await page.getByRole('menuitem', { name: /dark/i }).click();

    // Wait for theme to change
    await page.waitForTimeout(500);

    // HTML should have dark class
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Toggle back to light
    await themeButton.click();
    await page.getByRole('menuitem', { name: /light/i }).click();
    await page.waitForTimeout(500);
    await expect(html).not.toHaveClass(/dark/);
  });

  test('should show user avatar in header', async ({ page }) => {
    // The user menu trigger is a button with an avatar inside the header
    const header = page.locator('header');
    // Look for a button that contains an avatar (could be img or span with initials)
    const avatarButton = header.locator('button').filter({ has: page.locator('[class*="avatar"], img') }).last();
    await expect(avatarButton).toBeVisible();
  });

  test('should have sign out option', async ({ page }) => {
    // Click user menu (avatar button in header)
    const header = page.locator('header');
    const avatarButton = header.locator('button').filter({ has: page.locator('[class*="avatar"], img') }).last();
    await avatarButton.click();

    // Look for sign out option
    const signOutOption = page.getByRole('menuitem', { name: /sign out/i });
    await expect(signOutOption).toBeVisible();
  });

  test('should sign out and redirect to login', async ({ page }) => {
    // Click user menu (avatar button in header)
    const header = page.locator('header');
    const avatarButton = header.locator('button').filter({ has: page.locator('[class*="avatar"], img') }).last();
    await avatarButton.click();

    // Click sign out
    const signOutOption = page.getByRole('menuitem', { name: /sign out/i });
    await signOutOption.click();

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
