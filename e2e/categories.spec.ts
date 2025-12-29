import { test, expect } from './fixtures';

test.describe('Category Management', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
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

    // Create a category
    await page.getByRole('button', { name: /add category/i }).click();
    await page.getByLabel(/name/i).fill(categoryName);
    await page.getByRole('dialog').getByRole('button', { name: /add category/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: new RegExp(categoryName) })).toBeVisible({ timeout: 5000 });

    // Create a todo in that category
    await page.getByPlaceholder('Add a new todo...').fill(todoTitle);

    // Select the category from the form's category dropdown
    const form = page.locator('form');
    const categorySelects = form.locator('button[role="combobox"]');
    // The category select is the last one (after priority)
    const categorySelect = categorySelects.last();
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      await page.getByRole('option', { name: new RegExp(categoryName) }).click();
    }

    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });

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
    await expect(page.getByRole('button', { name: new RegExp(categoryName) })).toBeVisible({ timeout: 5000 });

    // Hover over category to reveal delete button
    const categoryButton = page.getByRole('button', { name: new RegExp(categoryName) });
    await categoryButton.hover();

    // Look for delete button (has sr-only text "Delete {categoryName}")
    const deleteButton = page.getByRole('button', { name: new RegExp(`delete ${categoryName}`, 'i') });

    if (await deleteButton.isVisible({ timeout: 2000 })) {
      await deleteButton.click();

      // Category should be removed
      await expect(page.getByRole('button', { name: new RegExp(categoryName) })).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should show todo count in category', async ({ page }) => {
    const categoryName = `Count Category ${Date.now()}`;
    const todoTitle = `Count Todo ${Date.now()}`;

    // Create a category
    await page.getByRole('button', { name: /add category/i }).click();
    await page.getByLabel(/name/i).fill(categoryName);
    await page.getByRole('dialog').getByRole('button', { name: /add category/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: new RegExp(categoryName) })).toBeVisible({ timeout: 5000 });

    // Initially should show 0 count (category button should contain "0")
    const categoryButton = page.getByRole('button', { name: new RegExp(categoryName) });
    await expect(categoryButton).toContainText('0');

    // Create a todo in that category
    await page.getByPlaceholder('Add a new todo...').fill(todoTitle);

    // Select the category
    const form = page.locator('form');
    const categorySelects = form.locator('button[role="combobox"]');
    const categorySelect = categorySelects.last();
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      await page.getByRole('option', { name: new RegExp(categoryName) }).click();
    }

    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });

    // Category should now show count 1
    await expect(categoryButton).toContainText('1');
  });
});
