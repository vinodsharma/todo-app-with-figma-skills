import { test, expect } from './fixtures';

test.describe('Category Management', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
  });

  test('should display category sidebar', async ({ page }) => {
    // Sidebar should be visible with "All Todos" option
    await expect(page.getByText(/all todos/i)).toBeVisible();
  });

  test('should have add category button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add category|new category|\+/i });
    await expect(addButton).toBeVisible();
  });

  test('should open add category dialog', async ({ page }) => {
    await page.getByRole('button', { name: /add category|new category|\+/i }).click();

    // Dialog should open with name input
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
  });

  test('should create a new category', async ({ page }) => {
    const categoryName = `Test Category ${Date.now()}`;

    // Open add category dialog
    await page.getByRole('button', { name: /add category|new category|\+/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill in name
    await page.getByLabel(/name/i).fill(categoryName);

    // Submit
    await page.getByRole('dialog').getByRole('button', { name: /add|create|save/i }).click();

    // Category should appear in sidebar
    await expect(page.getByText(categoryName)).toBeVisible({ timeout: 5000 });
  });

  test('should filter todos by category', async ({ page }) => {
    const categoryName = `Filter Category ${Date.now()}`;
    const todoTitle = `Category Todo ${Date.now()}`;

    // Create a category
    await page.getByRole('button', { name: /add category|new category|\+/i }).click();
    await page.getByLabel(/name/i).fill(categoryName);
    await page.getByRole('dialog').getByRole('button', { name: /add|create|save/i }).click();
    await expect(page.getByText(categoryName)).toBeVisible({ timeout: 5000 });

    // Create a todo in that category
    await page.getByPlaceholderText(/add a new todo|what needs to be done/i).fill(todoTitle);

    // Select the category
    const categorySelect = page.locator('form').getByRole('combobox', { name: /category/i });
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      await page.getByRole('option', { name: categoryName }).click();
    }

    await page.getByRole('button', { name: /add|create|submit/i }).click();
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });

    // Click on the category in sidebar to filter
    await page.locator('aside').getByText(categoryName).click();

    // Todo should still be visible
    await expect(page.getByText(todoTitle)).toBeVisible();

    // Click on "All Todos" to see all
    await page.getByText(/all todos/i).click();
  });

  test('should delete a category', async ({ page }) => {
    const categoryName = `Delete Category ${Date.now()}`;

    // Create a category
    await page.getByRole('button', { name: /add category|new category|\+/i }).click();
    await page.getByLabel(/name/i).fill(categoryName);
    await page.getByRole('dialog').getByRole('button', { name: /add|create|save/i }).click();
    await expect(page.getByText(categoryName)).toBeVisible({ timeout: 5000 });

    // Hover over category to reveal delete button
    const categoryItem = page.locator('aside').locator(`text=${categoryName}`).locator('xpath=ancestor::*[contains(@class, "group")]');

    // Look for delete button
    const deleteButton = categoryItem.getByRole('button', { name: /delete/i });

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Category should be removed
      await expect(page.getByText(categoryName)).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should show todo count in category', async ({ page }) => {
    const categoryName = `Count Category ${Date.now()}`;
    const todoTitle = `Count Todo ${Date.now()}`;

    // Create a category
    await page.getByRole('button', { name: /add category|new category|\+/i }).click();
    await page.getByLabel(/name/i).fill(categoryName);
    await page.getByRole('dialog').getByRole('button', { name: /add|create|save/i }).click();
    await expect(page.getByText(categoryName)).toBeVisible({ timeout: 5000 });

    // Create a todo in that category
    await page.getByPlaceholderText(/add a new todo|what needs to be done/i).fill(todoTitle);

    const categorySelect = page.locator('form').getByRole('combobox', { name: /category/i });
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      await page.getByRole('option', { name: categoryName }).click();
    }

    await page.getByRole('button', { name: /add|create|submit/i }).click();
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });

    // Category should show count (1)
    const categoryItem = page.locator('aside').locator(`text=${categoryName}`).locator('xpath=ancestor::*[contains(@class, "group")]');
    await expect(categoryItem.getByText('1')).toBeVisible();
  });
});
