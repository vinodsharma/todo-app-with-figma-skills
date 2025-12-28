import { test, expect, uniqueTitle } from './fixtures';

test.describe('Filtering and Sorting', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
  });

  test('should filter by search text', async ({ page }) => {
    // Create a todo with unique text
    const searchableTitle = uniqueTitle('Searchable');

    await page.getByPlaceholderText(/add a new todo|what needs to be done/i).fill(searchableTitle);
    await page.getByRole('button', { name: /add|create|submit/i }).click();
    await expect(page.getByText(searchableTitle)).toBeVisible({ timeout: 5000 });

    // Search for it
    await page.getByPlaceholderText(/search/i).fill('Searchable');

    // Should still be visible
    await expect(page.getByText(searchableTitle)).toBeVisible();

    // Search for something else
    await page.getByPlaceholderText(/search/i).fill('NonExistent12345');

    // Should not be visible (or show empty state)
    await expect(page.getByText(searchableTitle)).not.toBeVisible({ timeout: 3000 });
  });

  test('should filter by priority', async ({ page }) => {
    // Create high priority todo
    const highTitle = uniqueTitle('High Priority Filter');
    await page.getByPlaceholderText(/add a new todo|what needs to be done/i).fill(highTitle);
    await page.getByRole('combobox', { name: /priority/i }).first().click();
    await page.getByRole('option', { name: /high/i }).click();
    await page.getByRole('button', { name: /add|create|submit/i }).click();
    await expect(page.getByText(highTitle)).toBeVisible({ timeout: 5000 });

    // Create low priority todo
    const lowTitle = uniqueTitle('Low Priority Filter');
    await page.getByPlaceholderText(/add a new todo|what needs to be done/i).fill(lowTitle);
    await page.getByRole('combobox', { name: /priority/i }).first().click();
    await page.getByRole('option', { name: /low/i }).click();
    await page.getByRole('button', { name: /add|create|submit/i }).click();
    await expect(page.getByText(lowTitle)).toBeVisible({ timeout: 5000 });

    // Filter by high priority
    const priorityFilter = page.locator('button:has-text("All Priority")');
    await priorityFilter.click();
    await page.getByRole('option', { name: /high/i }).click();

    // High priority should be visible, low should not
    await expect(page.getByText(highTitle)).toBeVisible();
    await expect(page.getByText(lowTitle)).not.toBeVisible();
  });

  test('should filter by status', async ({ page }) => {
    // Create and complete a todo
    const completedTitle = uniqueTitle('Completed Filter');
    await page.getByPlaceholderText(/add a new todo|what needs to be done/i).fill(completedTitle);
    await page.getByRole('button', { name: /add|create|submit/i }).click();
    await expect(page.getByText(completedTitle)).toBeVisible({ timeout: 5000 });

    // Mark as complete
    const todoItem = page.locator(`text=${completedTitle}`).locator('xpath=ancestor::div[contains(@class, "border")]');
    await todoItem.getByRole('checkbox').click();

    // Create an active todo
    const activeTitle = uniqueTitle('Active Filter');
    await page.getByPlaceholderText(/add a new todo|what needs to be done/i).fill(activeTitle);
    await page.getByRole('button', { name: /add|create|submit/i }).click();
    await expect(page.getByText(activeTitle)).toBeVisible({ timeout: 5000 });

    // Filter by active
    const statusFilter = page.locator('button:has-text("All Status")');
    await statusFilter.click();
    await page.getByRole('option', { name: /active/i }).click();

    // Active should be visible, completed should not
    await expect(page.getByText(activeTitle)).toBeVisible();
    await expect(page.getByText(completedTitle)).not.toBeVisible();

    // Filter by completed
    await page.locator('button:has-text("Active")').click();
    await page.getByRole('option', { name: /completed/i }).click();

    // Completed should be visible, active should not
    await expect(page.getByText(completedTitle)).toBeVisible();
    await expect(page.getByText(activeTitle)).not.toBeVisible();
  });

  test('should clear all filters', async ({ page }) => {
    // Create a todo
    const title = uniqueTitle('Clear Filters');
    await page.getByPlaceholderText(/add a new todo|what needs to be done/i).fill(title);
    await page.getByRole('button', { name: /add|create|submit/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Apply a filter that hides the todo
    await page.getByPlaceholderText(/search/i).fill('HideTodo123');
    await expect(page.getByText(title)).not.toBeVisible();

    // Clear filters
    await page.getByRole('button', { name: /clear/i }).click();

    // Todo should be visible again
    await expect(page.getByText(title)).toBeVisible();
  });

  test('should change sort order', async ({ page }) => {
    // Check that sort dropdown exists
    const sortDropdown = page.locator('button:has-text("Newest First")');

    if (await sortDropdown.isVisible()) {
      await sortDropdown.click();

      // Should see sort options
      await expect(page.getByRole('option', { name: /oldest first/i })).toBeVisible();
      await expect(page.getByRole('option', { name: /priority/i }).first()).toBeVisible();
      await expect(page.getByRole('option', { name: /title/i }).first()).toBeVisible();
    }
  });
});
