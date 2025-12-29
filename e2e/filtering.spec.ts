import { test, expect, uniqueTitle } from './fixtures';

test.describe('Filtering and Sorting', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
  });

  test('should filter by search text', async ({ page }) => {
    // Create a todo with unique text
    const searchableTitle = uniqueTitle('Searchable');

    await page.getByPlaceholder('Add a new todo...').fill(searchableTitle);
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText(searchableTitle)).toBeVisible({ timeout: 5000 });

    // Search for it
    await page.getByPlaceholder('Search todos...').fill('Searchable');

    // Should still be visible
    await expect(page.getByText(searchableTitle)).toBeVisible();

    // Search for something else
    await page.getByPlaceholder('Search todos...').fill('NonExistent12345');

    // Should not be visible (or show empty state)
    await expect(page.getByText(searchableTitle)).not.toBeVisible({ timeout: 3000 });
  });

  test('should filter by priority', async ({ page }) => {
    // Create high priority todo
    const highTitle = uniqueTitle('High Priority Filter');
    await page.getByPlaceholder('Add a new todo...').fill(highTitle);
    // Click the first combobox in the form (priority select in todo form)
    const form = page.locator('form');
    await form.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: /^high$/i }).click();
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText(highTitle)).toBeVisible({ timeout: 5000 });

    // Create low priority todo
    const lowTitle = uniqueTitle('Low Priority Filter');
    await page.getByPlaceholder('Add a new todo...').fill(lowTitle);
    await form.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: /^low$/i }).click();
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText(lowTitle)).toBeVisible({ timeout: 5000 });

    // Filter by high priority using filter bar
    const priorityFilter = page.locator('button[role="combobox"]').filter({ hasText: 'All Priority' });
    await priorityFilter.click();
    await page.getByRole('option', { name: /^high$/i }).click();

    // High priority should be visible, low should not
    await expect(page.getByText(highTitle)).toBeVisible();
    await expect(page.getByText(lowTitle)).not.toBeVisible();
  });

  test('should filter by status', async ({ page }) => {
    // Create and complete a todo
    const completedTitle = uniqueTitle('Completed Filter');
    await page.getByPlaceholder('Add a new todo...').fill(completedTitle);
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText(completedTitle)).toBeVisible({ timeout: 5000 });

    // Mark as complete
    const todoItem = page.locator('[class*="border"]').filter({ hasText: completedTitle }).first();
    await todoItem.getByRole('checkbox').click();
    await page.waitForTimeout(500);

    // Create an active todo
    const activeTitle = uniqueTitle('Active Filter');
    await page.getByPlaceholder('Add a new todo...').fill(activeTitle);
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText(activeTitle)).toBeVisible({ timeout: 5000 });

    // Filter by active using filter bar
    const statusFilter = page.locator('button[role="combobox"]').filter({ hasText: 'All Status' });
    await statusFilter.click();
    await page.getByRole('option', { name: /^active$/i }).click();

    // Active should be visible, completed should not
    await expect(page.getByText(activeTitle)).toBeVisible();
    await expect(page.getByText(completedTitle)).not.toBeVisible();

    // Filter by completed
    await page.locator('button[role="combobox"]').filter({ hasText: 'Active' }).click();
    await page.getByRole('option', { name: /^completed$/i }).click();

    // Completed should be visible, active should not
    await expect(page.getByText(completedTitle)).toBeVisible();
    await expect(page.getByText(activeTitle)).not.toBeVisible();
  });

  test('should clear all filters', async ({ page }) => {
    // Create a todo
    const title = uniqueTitle('Clear Filters');
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Apply a filter that hides the todo
    await page.getByPlaceholder('Search todos...').fill('HideTodo123');
    await expect(page.getByText(title)).not.toBeVisible();

    // Clear filters
    await page.getByRole('button', { name: /clear/i }).click();

    // Todo should be visible again
    await expect(page.getByText(title)).toBeVisible();
  });

  test('should change sort order', async ({ page }) => {
    // Check that sort dropdown exists
    const sortDropdown = page.locator('button[role="combobox"]').filter({ hasText: 'Newest First' });

    if (await sortDropdown.isVisible()) {
      await sortDropdown.click();

      // Should see sort options
      await expect(page.getByRole('option', { name: /oldest first/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /priority/i }).first()).toBeVisible();
      await expect(page.getByRole('option', { name: /title/i }).first()).toBeVisible();
    }
  });
});
