import { test, expect } from './fixtures';

test.describe('Category Management', () => {
  // Increase timeout for tests with complex interactions
  test.setTimeout(60000);

  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
    // Wait for the app to fully load
    await expect(page.getByRole('button', { name: /all todos/i })).toBeVisible({ timeout: 15000 });
  });

  test('should display category sidebar', async ({ page }) => {
    // Sidebar should be visible with "All Todos" option
    await expect(page.getByRole('button', { name: /all todos/i })).toBeVisible();
  });

  test('should have add category button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add category/i });
    await expect(addButton).toBeVisible();
  });

  test('should open add category dialog', async ({ page }) => {
    await page.getByRole('button', { name: /add category/i }).click();

    // Dialog should open with name input
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
  });

  test('should create a new category', async ({ page }) => {
    const categoryName = `Test Category ${Date.now()}`;

    // Open add category dialog
    await page.getByRole('button', { name: /add category/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill in name
    await page.getByLabel(/name/i).fill(categoryName);

    // Submit
    await page.getByRole('dialog').getByRole('button', { name: /add category/i }).click();

    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Category should appear in sidebar
    await expect(page.getByRole('button', { name: new RegExp(categoryName) })).toBeVisible({ timeout: 5000 });
  });

  test('should filter todos by category', async ({ page }) => {
    const categoryName = `Filter Category ${Date.now()}`;
    const todoTitle = `Category Todo ${Date.now()}`;

    // Create a category and wait for categories API to refresh
    await page.getByRole('button', { name: /add category/i }).click();
    await page.getByLabel(/name/i).fill(categoryName);

    // Wait for both the dialog submit and the subsequent categories refetch
    const [categoryResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/categories') && resp.status() === 200),
      page.getByRole('dialog').getByRole('button', { name: /add category/i }).click(),
    ]);

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: new RegExp(categoryName) })).toBeVisible({ timeout: 5000 });

    // Create a todo in that category
    await page.getByPlaceholder('Add a new todo...').fill(todoTitle);

    // Wait for Add button to be enabled first
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeEnabled({ timeout: 5000 });

    // Select the category from the form's category dropdown
    const form = page.locator('form');
    const categorySelects = form.locator('button[role="combobox"]');
    // The category select is the one with "Category" text
    const categorySelect = categorySelects.filter({ hasText: 'Category' });
    if (await categorySelect.isVisible({ timeout: 5000 })) {
      await categorySelect.click();
      // Wait for the dropdown to open and option to appear
      const option = page.getByRole('option', { name: new RegExp(categoryName) });
      await expect(option).toBeVisible({ timeout: 5000 });
      await option.click();
    }

    await page.getByRole('button', { name: 'Add', exact: true }).click();
    // Wait for the todo to appear in the list
    await expect(page.locator('h3', { hasText: todoTitle })).toBeVisible({ timeout: 10000 });

    // Click on the category in sidebar to filter
    await page.getByRole('button', { name: new RegExp(categoryName) }).click();

    // Todo should still be visible
    await expect(page.getByText(todoTitle)).toBeVisible();

    // Click on "All Todos" to see all
    await page.getByRole('button', { name: /all todos/i }).click();
  });

  test('should delete a category', async ({ page }) => {
    const categoryName = `Delete Category ${Date.now()}`;

    // Create a category
    await page.getByRole('button', { name: /add category/i }).click();
    await page.getByLabel(/name/i).fill(categoryName);
    await page.getByRole('dialog').getByRole('button', { name: /add category/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Wait for category button to appear in sidebar (use role selector to avoid matching dropdown options)
    const categoryButton = page.getByRole('button', { name: new RegExp(categoryName) });
    await expect(categoryButton).toBeVisible({ timeout: 5000 });

    // Hover over category to reveal delete button
    await categoryButton.hover();

    // Find the delete button within the category's parent container
    // The category button and delete button are siblings in the same li element
    const categoryContainer = categoryButton.locator('xpath=ancestor::li').first();
    const visibleDeleteButton = categoryContainer.locator('button').filter({ has: page.locator('.sr-only:has-text("Delete")') });

    if (await visibleDeleteButton.first().isVisible({ timeout: 2000 })) {
      await visibleDeleteButton.first().click();
      // Wait for the category to be deleted
      await page.waitForTimeout(1000);
      // The category button should no longer be visible in the sidebar
      await expect(categoryButton).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should show todo count in category', async ({ page }) => {
    const categoryName = `Count Category ${Date.now()}`;
    const todoTitle = `Count Todo ${Date.now()}`;

    // Create a category and wait for categories API to refresh
    await page.getByRole('button', { name: /add category/i }).click();
    await page.getByLabel(/name/i).fill(categoryName);

    // Wait for both the dialog submit and the subsequent categories refetch
    const [categoryResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/categories') && resp.status() === 200),
      page.getByRole('dialog').getByRole('button', { name: /add category/i }).click(),
    ]);

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: new RegExp(categoryName) })).toBeVisible({ timeout: 5000 });

    // Initially should show 0 count (category button should contain "0")
    const categoryButton = page.getByRole('button', { name: new RegExp(categoryName) });
    await expect(categoryButton).toContainText('0');

    // Create a todo in that category
    await page.getByPlaceholder('Add a new todo...').fill(todoTitle);

    // Wait for Add button to be enabled
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeEnabled({ timeout: 5000 });

    // Select the category
    const form = page.locator('form');
    const categorySelects = form.locator('button[role="combobox"]');
    // The category select is the one with "Category" text
    const formCategorySelect = categorySelects.filter({ hasText: 'Category' });
    if (await formCategorySelect.isVisible({ timeout: 5000 })) {
      await formCategorySelect.click();
      // Wait for the dropdown to open and option to appear
      const option = page.getByRole('option', { name: new RegExp(categoryName) });
      await expect(option).toBeVisible({ timeout: 5000 });
      await option.click();
    }

    await page.getByRole('button', { name: 'Add', exact: true }).click();
    // Wait for the todo to appear in the list
    await expect(page.locator('h3', { hasText: todoTitle })).toBeVisible({ timeout: 10000 });

    // Category should now show count 1
    await expect(categoryButton).toContainText('1', { timeout: 5000 });
  });
});
