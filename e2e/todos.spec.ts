import { test, expect, uniqueTitle } from './fixtures';

test.describe('Todo CRUD', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    // authenticatedPage fixture handles login
    await page.goto('/');
  });

  test('should display todo form', async ({ page }) => {
    await expect(page.getByPlaceholder('Add a new todo...')).toBeVisible();
  });

  test('should create a todo with title only', async ({ page }) => {
    const title = uniqueTitle('Simple');

    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: /add/i }).click();

    // Wait for todo to appear in list
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });
  });

  test('should create a todo with priority', async ({ page }) => {
    const title = uniqueTitle('High Priority');

    // Fill title
    await page.getByPlaceholder('Add a new todo...').fill(title);

    // Select high priority - click the first combobox in the form (priority is first)
    const form = page.locator('form');
    const prioritySelect = form.locator('button[role="combobox"]').first();
    await prioritySelect.click();
    await page.getByRole('option', { name: /^high$/i }).click();

    await page.getByRole('button', { name: /add/i }).click();

    // Verify todo appears with high priority badge
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });
    const todoItem = page.locator('[class*="border"]').filter({ hasText: title }).first();
    await expect(todoItem.getByText('High')).toBeVisible();
  });

  test('should mark todo as complete', async ({ page }) => {
    const title = uniqueTitle('Complete Me');

    // Create todo first
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find the todo item and click its checkbox
    const todoItem = page.locator('[class*="border"]').filter({ hasText: title }).first();
    const checkbox = todoItem.getByRole('checkbox');
    await checkbox.click();

    // Verify it's marked complete (title should have line-through class)
    await page.waitForTimeout(500);
    const titleElement = todoItem.locator('h3');
    await expect(titleElement).toHaveClass(/line-through/);
  });

  test('should unmark completed todo', async ({ page }) => {
    const title = uniqueTitle('Toggle Complete');

    // Create todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Complete it
    const todoItem = page.locator('[class*="border"]').filter({ hasText: title }).first();
    const checkbox = todoItem.getByRole('checkbox');
    await checkbox.click();
    await page.waitForTimeout(500);
    await expect(todoItem.locator('h3')).toHaveClass(/line-through/);

    // Uncomplete it
    await checkbox.click();
    await page.waitForTimeout(500);
    await expect(todoItem.locator('h3')).not.toHaveClass(/line-through/);
  });

  test('should delete a todo', async ({ page }) => {
    const title = uniqueTitle('Delete Me');

    // Create todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find and hover over the todo item to reveal delete button
    const todoItem = page.locator('[class*="border"]').filter({ hasText: title }).first();
    await todoItem.hover();

    // Click delete button (has aria-label with "Delete")
    await todoItem.getByRole('button', { name: /delete/i }).click();

    // Verify it's gone
    await expect(page.getByText(title)).not.toBeVisible({ timeout: 5000 });
  });

  test('should edit a todo', async ({ page }) => {
    const title = uniqueTitle('Edit Me');
    const newTitle = uniqueTitle('Edited Title');

    // Create todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find and hover over the todo item
    const todoItem = page.locator('[class*="border"]').filter({ hasText: title }).first();
    await todoItem.hover();

    // Click edit button
    await todoItem.getByRole('button', { name: /edit/i }).click();

    // Edit dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Change title
    const titleInput = page.getByRole('dialog').getByLabel(/title/i);
    await titleInput.clear();
    await titleInput.fill(newTitle);

    // Save
    await page.getByRole('dialog').getByRole('button', { name: /save|update/i }).click();

    // Verify new title appears
    await expect(page.getByText(newTitle)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(title)).not.toBeVisible();
  });

  test('should add notes to a todo', async ({ page }) => {
    const title = uniqueTitle('With Notes');
    const notes = 'These are my test notes for this todo item.';

    // Create todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: /add/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find and hover over the todo item
    const todoItem = page.locator('[class*="border"]').filter({ hasText: title }).first();
    await todoItem.hover();

    // Click edit button
    await todoItem.getByRole('button', { name: /edit/i }).click();

    // Add notes
    const notesTextarea = page.getByRole('dialog').getByLabel(/description|notes/i);
    await notesTextarea.fill(notes);

    // Save
    await page.getByRole('dialog').getByRole('button', { name: /save|update/i }).click();

    // Wait for dialog to close and notes indicator to appear
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Click to expand notes
    const notesButton = todoItem.getByRole('button', { name: /expand notes/i });
    await notesButton.click();

    // Notes content should be visible
    await expect(page.getByText(notes)).toBeVisible();
  });
});
