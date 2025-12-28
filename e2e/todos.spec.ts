import { test, expect, uniqueTitle } from './fixtures';

test.describe('Todo CRUD', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    // authenticatedPage fixture handles login
    await page.goto('/');
  });

  test('should display todo form', async ({ page }) => {
    await expect(page.getByPlaceholderText(/add a new todo|what needs to be done/i)).toBeVisible();
  });

  test('should create a todo with title only', async ({ page }) => {
    const title = uniqueTitle('Simple');

    await page.getByPlaceholderText(/add a new todo|what needs to be done/i).fill(title);
    await page.getByRole('button', { name: /add|create|submit/i }).click();

    // Wait for todo to appear in list
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });
  });

  test('should create a todo with priority', async ({ page }) => {
    const title = uniqueTitle('High Priority');

    // Fill title
    await page.getByPlaceholderText(/add a new todo|what needs to be done/i).fill(title);

    // Select high priority
    await page.getByRole('combobox', { name: /priority/i }).click();
    await page.getByRole('option', { name: /high/i }).click();

    await page.getByRole('button', { name: /add|create|submit/i }).click();

    // Verify todo appears with high priority badge
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });
    const todoItem = page.locator(`text=${title}`).locator('xpath=ancestor::div[contains(@class, "border")]');
    await expect(todoItem.getByText('High')).toBeVisible();
  });

  test('should mark todo as complete', async ({ page }) => {
    const title = uniqueTitle('Complete Me');

    // Create todo first
    await page.getByPlaceholderText(/add a new todo|what needs to be done/i).fill(title);
    await page.getByRole('button', { name: /add|create|submit/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find the checkbox for this todo and click it
    const todoItem = page.locator(`text=${title}`).locator('xpath=ancestor::div[contains(@class, "border")]');
    const checkbox = todoItem.getByRole('checkbox');
    await checkbox.click();

    // Verify it's marked complete (title should have line-through)
    await expect(page.getByText(title)).toHaveClass(/line-through/);
  });

  test('should unmark completed todo', async ({ page }) => {
    const title = uniqueTitle('Toggle Complete');

    // Create todo
    await page.getByPlaceholderText(/add a new todo|what needs to be done/i).fill(title);
    await page.getByRole('button', { name: /add|create|submit/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Complete it
    const todoItem = page.locator(`text=${title}`).locator('xpath=ancestor::div[contains(@class, "border")]');
    const checkbox = todoItem.getByRole('checkbox');
    await checkbox.click();
    await expect(page.getByText(title)).toHaveClass(/line-through/);

    // Uncomplete it
    await checkbox.click();
    await expect(page.getByText(title)).not.toHaveClass(/line-through/);
  });

  test('should delete a todo', async ({ page }) => {
    const title = uniqueTitle('Delete Me');

    // Create todo
    await page.getByPlaceholderText(/add a new todo|what needs to be done/i).fill(title);
    await page.getByRole('button', { name: /add|create|submit/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Delete it
    const todoItem = page.locator(`text=${title}`).locator('xpath=ancestor::div[contains(@class, "border")]');
    await todoItem.getByRole('button', { name: /delete/i }).click();

    // Verify it's gone
    await expect(page.getByText(title)).not.toBeVisible({ timeout: 5000 });
  });

  test('should edit a todo', async ({ page }) => {
    const title = uniqueTitle('Edit Me');
    const newTitle = uniqueTitle('Edited Title');

    // Create todo
    await page.getByPlaceholderText(/add a new todo|what needs to be done/i).fill(title);
    await page.getByRole('button', { name: /add|create|submit/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Click edit button
    const todoItem = page.locator(`text=${title}`).locator('xpath=ancestor::div[contains(@class, "border")]');
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
    await page.getByPlaceholderText(/add a new todo|what needs to be done/i).fill(title);
    await page.getByRole('button', { name: /add|create|submit/i }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Click edit button
    const todoItem = page.locator(`text=${title}`).locator('xpath=ancestor::div[contains(@class, "border")]');
    await todoItem.getByRole('button', { name: /edit/i }).click();

    // Add notes
    const notesTextarea = page.getByRole('dialog').getByLabel(/notes|description/i);
    await notesTextarea.fill(notes);

    // Save
    await page.getByRole('dialog').getByRole('button', { name: /save|update/i }).click();

    // Notes indicator should appear
    await expect(page.getByText(/notes/i).first()).toBeVisible({ timeout: 5000 });

    // Click to expand notes
    await page.getByRole('button', { name: /expand notes/i }).click();

    // Notes content should be visible
    await expect(page.getByText(notes)).toBeVisible();
  });
});
