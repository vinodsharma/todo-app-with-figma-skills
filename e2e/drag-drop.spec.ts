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
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Check drag handle is visible (use first() since there may be multiple handles)
    const dragHandle = page.getByRole('button', { name: 'Drag to reorder' }).first();
    await expect(dragHandle).toBeVisible();

    // Cleanup - delete the todo using dropdown menu
    await todoCard.hover();
    const actionsButton = todoCard.getByRole('button', { name: /actions for/i });
    await actionsButton.click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
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

    // Cleanup - delete both todos using dropdown menu
    for (const title of [secondTitle, firstTitle]) {
      const todoTitle = page.locator('h3', { hasText: title });
      const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();
      await todoCard.hover();
      const actionsButton = todoCard.getByRole('button', { name: /actions for/i });
      await actionsButton.click();
      await page.getByRole('menuitem', { name: /delete/i }).click();
      await expect(page.locator('h3', { hasText: title })).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('keyboard navigation for drag handles', async ({ page }) => {
    const title = uniqueTitle('Keyboard Test');

    // Create todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Focus the drag handle (use first() since there may be multiple handles)
    const dragHandle = page.getByRole('button', { name: 'Drag to reorder' }).first();
    await dragHandle.focus();

    // Press space to pick up, then Escape to cancel
    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');

    // Wait for drag overlay to disappear
    await page.waitForTimeout(300);

    // Todo should still be there
    await expect(page.locator('h3', { hasText: title })).toBeVisible();

    // Cleanup using dropdown menu (use force due to drag overlay)
    await todoCard.hover({ force: true });
    const actionsButton = todoCard.getByRole('button', { name: /actions for/i });
    await actionsButton.click({ force: true });
    await page.getByRole('menuitem', { name: /delete/i }).click({ force: true });
    await expect(page.locator('h3', { hasText: title })).not.toBeVisible({ timeout: 5000 });
  });

  test('drag handle has correct cursor style', async ({ page }) => {
    const title = uniqueTitle('Cursor Style Test');

    // Create todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Check drag handle has cursor-grab class (use first() since there may be multiple handles)
    const dragHandle = page.getByRole('button', { name: 'Drag to reorder' }).first();
    await expect(dragHandle).toHaveClass(/cursor-grab/);

    // Cleanup using dropdown menu
    await todoCard.hover();
    const actionsButton = todoCard.getByRole('button', { name: /actions for/i });
    await actionsButton.click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    await expect(page.locator('h3', { hasText: title })).not.toBeVisible({ timeout: 5000 });
  });
});
