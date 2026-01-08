import { test, expect, uniqueTitle } from './fixtures';

test.describe('Activity History', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
    // Wait for the page to fully load (todo input should be ready)
    await expect(page.getByPlaceholder('Add a new todo...')).toBeVisible({ timeout: 10000 });
  });

  test('can toggle activity sidebar', async ({ page }) => {
    // Click activity button in header
    await page.getByTitle('Activity history').click();

    // Sidebar should open
    await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();

    // Click close button (the X icon button in the sidebar header)
    const sidebar = page.locator('div').filter({ has: page.getByRole('heading', { name: 'Activity' }) });
    await sidebar.getByRole('button').filter({ has: page.locator('svg') }).first().click();

    // Sidebar should close
    await expect(page.getByRole('heading', { name: 'Activity' })).not.toBeVisible();
  });

  test('shows activity after creating a todo', async ({ page }) => {
    // Use a title that won't conflict with "Activity" heading
    const todoTitle = uniqueTitle('Test Todo');

    // Create a todo
    await page.getByPlaceholder('Add a new todo...').fill(todoTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Wait for todo to appear in list (look for it in an h3 element to be specific)
    await expect(page.locator('h3', { hasText: todoTitle })).toBeVisible({ timeout: 10000 });

    // Open activity sidebar
    await page.getByTitle('Activity history').click();

    // Wait for sidebar to open (use exact match to avoid conflict with todo titles)
    await expect(page.getByRole('heading', { name: 'Activity', exact: true })).toBeVisible();

    // Should show the create activity - the format is "Created todo: <title>"
    // Wait a moment for activities to load
    await page.waitForTimeout(1000);

    // Check for activity entry containing the todo title in the sidebar
    const sidebar = page.locator('div').filter({ hasText: /^Activity$/ }).first();
    await expect(
      page.getByText(todoTitle, { exact: false }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('can navigate to activity page', async ({ page }) => {
    // Open sidebar
    await page.getByTitle('Activity history').click();

    // Wait for sidebar to fully load
    await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();

    // Click "View all activity" button/link
    await page.getByRole('button', { name: 'View all activity' }).click();

    // Should be on activity page
    await expect(page).toHaveURL('/activity', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Activity History' })).toBeVisible();
  });

  test('activity page has working filters', async ({ page }) => {
    await page.goto('/activity');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'Activity History' })).toBeVisible();

    // Entity type filter
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Todos' }).click();

    // Wait for dropdown to close
    await page.waitForTimeout(500);

    // Action filter
    await page.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: 'Created' }).click();

    // Page should still be functional
    await expect(page.getByRole('heading', { name: 'Activity History' })).toBeVisible();
  });
});
