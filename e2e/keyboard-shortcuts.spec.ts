import { test, expect, uniqueTitle } from './fixtures';

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
  });

  test('n key focuses new todo input', async ({ page }) => {
    // Click somewhere neutral first to ensure not in input
    await page.locator('main').click();
    await page.keyboard.press('n');

    const todoInput = page.getByPlaceholder('Add a new todo...');
    await expect(todoInput).toBeFocused();
  });

  test('/ key focuses search input', async ({ page }) => {
    await page.locator('main').click();
    await page.keyboard.press('/');

    const searchInput = page.getByPlaceholder('Search todos...');
    await expect(searchInput).toBeFocused();
  });

  test('? key opens help dialog', async ({ page }) => {
    await page.locator('main').click();
    await page.keyboard.press('?');

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Keyboard Shortcuts')).toBeVisible();
  });

  test('Escape closes help dialog', async ({ page }) => {
    await page.locator('main').click();
    await page.keyboard.press('?');
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('j/k navigates todos with visual selection', async ({ page }) => {
    // Create two todos
    const todo1 = uniqueTitle('First Todo');
    const todo2 = uniqueTitle('Second Todo');

    const todoInput = page.getByPlaceholder('Add a new todo...');
    await todoInput.fill(todo1);
    await todoInput.press('Enter');
    await expect(page.getByText(todo1)).toBeVisible({ timeout: 5000 });

    await todoInput.fill(todo2);
    await todoInput.press('Enter');
    await expect(page.getByText(todo2)).toBeVisible({ timeout: 5000 });

    // Navigate with j
    await page.locator('main').click();
    await page.keyboard.press('j');

    // First todo should have ring highlight (todo2 was added second so appears first with newest-first sort)
    const firstTodoCard = page.locator('.rounded-lg.border').filter({ hasText: todo2 });
    await expect(firstTodoCard).toHaveClass(/ring-2/);

    // Press j again to go to second todo
    await page.keyboard.press('j');
    const secondTodoCard = page.locator('.rounded-lg.border').filter({ hasText: todo1 });
    await expect(secondTodoCard).toHaveClass(/ring-2/);
  });

  test('Enter toggles selected todo', async ({ page }) => {
    const todoTitle = uniqueTitle('Toggle Me');

    const todoInput = page.getByPlaceholder('Add a new todo...');
    await todoInput.fill(todoTitle);
    await todoInput.press('Enter');
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });

    // Select and toggle
    await page.locator('main').click();
    await page.keyboard.press('j');
    await page.keyboard.press('Enter');

    // Wait for toggle to process
    await page.waitForTimeout(500);

    // Verify checkbox is now checked
    const todoCard = page.locator('.rounded-lg.border').filter({ hasText: todoTitle });
    const checkbox = todoCard.getByRole('checkbox');
    await expect(checkbox).toBeChecked();
  });

  test('d deletes selected todo', async ({ page }) => {
    const todoTitle = uniqueTitle('Delete Me');

    const todoInput = page.getByPlaceholder('Add a new todo...');
    await todoInput.fill(todoTitle);
    await todoInput.press('Enter');
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });

    // Select and delete
    await page.locator('main').click();
    await page.keyboard.press('j');
    await page.keyboard.press('d');

    // Todo should be gone
    await expect(page.getByText(todoTitle)).not.toBeVisible();
  });

  test('shortcuts do not trigger when typing in input', async ({ page }) => {
    const todoInput = page.getByPlaceholder('Add a new todo...');
    await todoInput.click();
    await todoInput.fill('test?');

    // Help dialog should NOT open
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Input should have the ? character
    await expect(todoInput).toHaveValue('test?');
  });

  test('Escape clears selection', async ({ page }) => {
    const todoTitle = uniqueTitle('Clear Selection');

    const todoInput = page.getByPlaceholder('Add a new todo...');
    await todoInput.fill(todoTitle);
    await todoInput.press('Enter');
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });

    // Select
    await page.locator('main').click();
    await page.keyboard.press('j');

    const todoCard = page.locator('.rounded-lg.border').filter({ hasText: todoTitle });
    await expect(todoCard).toHaveClass(/ring-2/);

    // Clear with Escape
    await page.keyboard.press('Escape');
    await expect(todoCard).not.toHaveClass(/ring-2/);
  });

  test('e opens edit dialog for selected todo', async ({ page }) => {
    const todoTitle = uniqueTitle('Edit Me');

    const todoInput = page.getByPlaceholder('Add a new todo...');
    await todoInput.fill(todoTitle);
    await todoInput.press('Enter');
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });

    // Select and press e
    await page.locator('main').click();
    await page.keyboard.press('j');
    await page.keyboard.press('e');

    // Edit dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/title/i)).toHaveValue(todoTitle);
  });

  test('arrow keys also work for navigation', async ({ page }) => {
    const todoTitle = uniqueTitle('Arrow Nav');

    const todoInput = page.getByPlaceholder('Add a new todo...');
    await todoInput.fill(todoTitle);
    await todoInput.press('Enter');
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });

    // Navigate with ArrowDown
    await page.locator('main').click();
    await page.keyboard.press('ArrowDown');

    const todoCard = page.locator('.rounded-lg.border').filter({ hasText: todoTitle });
    await expect(todoCard).toHaveClass(/ring-2/);

    // Clear with ArrowUp (wraps to last when at first)
    await page.keyboard.press('ArrowUp');
    // Still selected since there's only one todo
    await expect(todoCard).toHaveClass(/ring-2/);
  });
});
