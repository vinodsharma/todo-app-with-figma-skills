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
    // Use exact match to avoid matching "Add Category"
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Wait for todo to appear in list
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });
  });

  test('should create a todo with priority', async ({ page }) => {
    const title = uniqueTitle('High Priority');

    // Fill title
    await page.getByPlaceholder('Add a new todo...').fill(title);

    // Find the todo form (not filter bar) and select priority
    // The form contains the "Add a new todo" input
    const todoForm = page.locator('form').filter({ has: page.getByPlaceholder('Add a new todo...') });
    const prioritySelect = todoForm.locator('button[role="combobox"]').first();
    await prioritySelect.click();
    await page.getByRole('option', { name: /^high$/i }).click();

    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Verify todo appears with high priority badge
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });
    // Check that "High" badge is visible in the todo card (use badge element specifically)
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();
    await expect(todoCard.locator('[data-slot="badge"]', { hasText: 'High' })).toBeVisible();
  });

  test('should mark todo as complete', async ({ page }) => {
    const title = uniqueTitle('Complete Me');

    // Create todo first
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find the todo item's checkbox (the checkbox is in the same container as the title)
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();
    const checkbox = todoCard.getByRole('checkbox');
    await checkbox.click();

    // Verify it's marked complete (title should have line-through class)
    await page.waitForTimeout(500);
    await expect(todoTitle).toHaveClass(/line-through/);
  });

  test('should unmark completed todo', async ({ page }) => {
    const title = uniqueTitle('Toggle Complete');

    // Create todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find elements
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();
    const checkbox = todoCard.getByRole('checkbox');

    // Complete it
    await checkbox.click();
    await page.waitForTimeout(500);
    await expect(todoTitle).toHaveClass(/line-through/);

    // Uncomplete it
    await checkbox.click();
    await page.waitForTimeout(500);
    await expect(todoTitle).not.toHaveClass(/line-through/);
  });

  test('should delete a todo', async ({ page }) => {
    const title = uniqueTitle('Delete Me');

    // Create todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Hover and open dropdown menu
    await todoCard.hover();
    const actionsButton = todoCard.getByRole('button', { name: /actions for/i });
    await actionsButton.click();

    // Click delete in dropdown
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Verify it's gone
    await expect(page.locator('h3', { hasText: title })).not.toBeVisible({ timeout: 5000 });
  });

  test('should edit a todo', async ({ page }) => {
    const title = uniqueTitle('Edit Me');
    const newTitle = uniqueTitle('Edited Title');

    // Create todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Hover and open dropdown menu
    await todoCard.hover();
    const actionsButton = todoCard.getByRole('button', { name: /actions for/i });
    await actionsButton.click();

    // Click edit in dropdown
    await page.getByRole('menuitem', { name: /edit/i }).click();

    // Edit dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Change title
    const titleInput = page.getByRole('dialog').getByLabel(/title/i);
    await titleInput.clear();
    await titleInput.fill(newTitle);

    // Save
    await page.getByRole('dialog').getByRole('button', { name: /save|update/i }).click();

    // Verify new title appears
    await expect(page.locator('h3', { hasText: newTitle })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h3', { hasText: title })).not.toBeVisible();
  });

  test('should add notes to a todo', async ({ page }) => {
    const title = uniqueTitle('With Notes');
    const notes = 'These are my test notes for this todo item.';

    // Create todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Hover and open dropdown menu
    await todoCard.hover();
    const actionsButton = todoCard.getByRole('button', { name: /actions for/i });
    await actionsButton.click();

    // Click edit in dropdown
    await page.getByRole('menuitem', { name: /edit/i }).click();

    // Add notes
    const notesTextarea = page.getByRole('dialog').getByLabel(/description|notes/i);
    await notesTextarea.fill(notes);

    // Save
    await page.getByRole('dialog').getByRole('button', { name: /save|update/i }).click();

    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Click to expand notes
    const notesButton = todoCard.getByRole('button', { name: /expand notes/i });
    await notesButton.click();

    // Notes content should be visible
    await expect(page.getByText(notes)).toBeVisible();
  });
});
