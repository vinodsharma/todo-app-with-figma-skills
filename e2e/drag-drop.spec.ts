import { test, expect, uniqueTitle } from './fixtures';

test.describe('Drag and Drop Reordering', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    // authenticatedPage fixture handles login
    await page.goto('/');
  });

  test('drag handles are visible on todos', async ({ page }) => {
    const title = uniqueTitle('Test Drag Handle');

    // Create a todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Check drag handle is visible
    const dragHandle = todoCard.getByRole('button', { name: 'Drag to reorder' });
    await expect(dragHandle).toBeVisible();

    // Cleanup - delete the todo
    await todoCard.hover();
    const deleteButton = todoCard.locator('button[aria-label^="Delete "]');
    await deleteButton.click();
    await expect(page.locator('h3', { hasText: title })).not.toBeVisible({ timeout: 5000 });
  });

  test('can create multiple todos and see order', async ({ page }) => {
    const firstTitle = uniqueTitle('First Todo');
    const secondTitle = uniqueTitle('Second Todo');

    // Create first todo
    await page.getByPlaceholder('Add a new todo...').fill(firstTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(firstTitle)).toBeVisible({ timeout: 5000 });

    // Create second todo
    await page.getByPlaceholder('Add a new todo...').fill(secondTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(secondTitle)).toBeVisible({ timeout: 5000 });

    // New todos appear at top (Second should be before First in the DOM)
    const todoTitles = await page.locator('h3.font-medium').allTextContents();
    const secondIndex = todoTitles.findIndex(t => t.includes('Second Todo'));
    const firstIndex = todoTitles.findIndex(t => t.includes('First Todo'));

    expect(secondIndex).toBeLessThan(firstIndex);

    // Cleanup - delete both todos
    for (const title of [secondTitle, firstTitle]) {
      const todoTitle = page.locator('h3', { hasText: title });
      const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();
      await todoCard.hover();
      const deleteButton = todoCard.locator('button[aria-label^="Delete "]');
      await deleteButton.click();
      await expect(page.locator('h3', { hasText: title })).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('keyboard navigation for drag handles', async ({ page }) => {
    const title = uniqueTitle('Keyboard Test');

    // Create todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Focus the drag handle
    const dragHandle = todoCard.getByRole('button', { name: 'Drag to reorder' });
    await dragHandle.focus();

    // Press space to pick up, then Escape to cancel
    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');

    // Todo should still be there
    await expect(page.getByText(title)).toBeVisible();

    // Cleanup
    await todoCard.hover();
    const deleteButton = todoCard.locator('button[aria-label^="Delete "]');
    await deleteButton.click();
    await expect(page.locator('h3', { hasText: title })).not.toBeVisible({ timeout: 5000 });
  });

  test('drag handle has correct cursor style', async ({ page }) => {
    const title = uniqueTitle('Cursor Style Test');

    // Create todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Check drag handle has cursor-grab class
    const dragHandle = todoCard.getByRole('button', { name: 'Drag to reorder' });
    await expect(dragHandle).toHaveClass(/cursor-grab/);

    // Cleanup
    await todoCard.hover();
    const deleteButton = todoCard.locator('button[aria-label^="Delete "]');
    await deleteButton.click();
    await expect(page.locator('h3', { hasText: title })).not.toBeVisible({ timeout: 5000 });
  });
});
