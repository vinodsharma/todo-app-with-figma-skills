import { test, expect, uniqueTitle } from './fixtures';

test.describe('Archive Functionality', () => {
  // Increase timeout for tests with complex interactions
  test.setTimeout(60000);

  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
    // Wait for the app to fully load
    await expect(page.getByRole('button', { name: /all todos/i })).toBeVisible({ timeout: 15000 });
  });

  // Helper to find the selection checkbox for a todo by its exact title
  // Structure: SortableTodoItem [div.flex.items-start.gap-2]
  //   -> SelectionCheckbox container [div.mt-4] -> SelectionCheckbox [button[role=checkbox]]
  //   -> TodoItem container [div.flex-1] -> TodoItem -> h3 (title)
  function getSelectionCheckboxForTodo(page: import('@playwright/test').Page, title: string) {
    // Find the todo heading
    const todoHeading = page.locator('h3', { hasText: title });
    // Go up to the SortableTodoItem wrapper (the one with flex and gap-2)
    const sortableWrapper = todoHeading.locator('xpath=ancestor::div[contains(@class, "gap-2") and contains(@class, "flex")]').first();
    // Find the selection checkbox within the first child div (mt-4 container)
    return sortableWrapper.locator('div.mt-4 button[role="checkbox"]');
  }

  test('should archive a todo from dropdown menu', async ({ page }) => {
    const title = uniqueTitle('Archive Test');

    // Create a todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeEnabled({ timeout: 5000 });
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Wait for the todo to appear
    const todoTitle = page.locator('h3', { hasText: title });
    await expect(todoTitle).toBeVisible({ timeout: 10000 });

    // Find the todo card and hover to reveal actions
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();
    await todoCard.hover();

    // Open the actions dropdown
    const actionsButton = todoCard.locator('button[aria-label*="Actions"]');
    await actionsButton.click();

    // Click Archive from the dropdown
    const archiveItem = page.getByRole('menuitem', { name: /^archive$/i });
    await expect(archiveItem).toBeVisible({ timeout: 5000 });
    await archiveItem.click();

    // Wait for the todo to disappear from main list
    await expect(todoTitle).not.toBeVisible({ timeout: 10000 });

    // Click on Archived section in sidebar
    const archivedButton = page.getByRole('button', { name: /archived/i });
    await expect(archivedButton).toBeVisible({ timeout: 5000 });
    await archivedButton.click();

    // Verify todo appears in archived list
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 10000 });
  });

  test('should restore a todo from archive', async ({ page }) => {
    const title = uniqueTitle('Restore Test');

    // Create a todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeEnabled({ timeout: 5000 });
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Wait for the todo to appear
    let todoTitle = page.locator('h3', { hasText: title });
    await expect(todoTitle).toBeVisible({ timeout: 10000 });

    // Archive the todo
    let todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();
    await todoCard.hover();
    const actionsButton = todoCard.locator('button[aria-label*="Actions"]');
    await actionsButton.click();

    const archiveItem = page.getByRole('menuitem', { name: /^archive$/i });
    await expect(archiveItem).toBeVisible({ timeout: 5000 });
    await archiveItem.click();

    // Wait for todo to disappear from main list
    await expect(todoTitle).not.toBeVisible({ timeout: 10000 });

    // Go to archive view
    const archivedButton = page.getByRole('button', { name: /archived/i });
    await archivedButton.click();

    // Wait for archived todo to appear
    todoTitle = page.locator('h3', { hasText: title });
    await expect(todoTitle).toBeVisible({ timeout: 10000 });

    // Open actions dropdown and click Restore
    todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();
    await todoCard.hover();
    const actionsButtonArchive = todoCard.locator('button[aria-label*="Actions"]');
    await actionsButtonArchive.click();

    const restoreItem = page.getByRole('menuitem', { name: /restore/i });
    await expect(restoreItem).toBeVisible({ timeout: 5000 });
    await restoreItem.click();

    // Verify todo disappears from archive
    await expect(todoTitle).not.toBeVisible({ timeout: 10000 });

    // Go back to All Todos
    await page.getByRole('button', { name: /all todos/i }).click();

    // Verify todo is back in main list
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 10000 });
  });

  test('should permanently delete from archive', async ({ page }) => {
    const title = uniqueTitle('Delete Archive Test');

    // Create a todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeEnabled({ timeout: 5000 });
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Wait for the todo to appear
    let todoTitle = page.locator('h3', { hasText: title });
    await expect(todoTitle).toBeVisible({ timeout: 10000 });

    // Archive the todo
    let todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();
    await todoCard.hover();
    await todoCard.locator('button[aria-label*="Actions"]').click();

    const archiveItem = page.getByRole('menuitem', { name: /^archive$/i });
    await expect(archiveItem).toBeVisible({ timeout: 5000 });
    await archiveItem.click();

    // Wait for todo to disappear from main list
    await expect(todoTitle).not.toBeVisible({ timeout: 10000 });

    // Go to archive view
    const archivedButton = page.getByRole('button', { name: /archived/i });
    await archivedButton.click();

    // Wait for archived todo to appear
    todoTitle = page.locator('h3', { hasText: title });
    await expect(todoTitle).toBeVisible({ timeout: 10000 });

    // Open actions dropdown and click Delete Permanently
    todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();
    await todoCard.hover();
    await todoCard.locator('button[aria-label*="Actions"]').click();

    const deleteItem = page.getByRole('menuitem', { name: /delete permanently/i });
    await expect(deleteItem).toBeVisible({ timeout: 5000 });
    await deleteItem.click();

    // Verify todo is gone from archive
    await expect(todoTitle).not.toBeVisible({ timeout: 10000 });

    // Go to All Todos and verify todo is not there
    await page.getByRole('button', { name: /all todos/i }).click();
    await expect(page.locator('h3', { hasText: title })).not.toBeVisible({ timeout: 5000 });
  });

  test('should bulk archive selected todos', async ({ page }) => {
    const title1 = uniqueTitle('Bulk Archive 1');
    const title2 = uniqueTitle('Bulk Archive 2');

    // Create first todo
    await page.getByPlaceholder('Add a new todo...').fill(title1);
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeEnabled({ timeout: 5000 });
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('h3', { hasText: title1 })).toBeVisible({ timeout: 10000 });

    // Create second todo
    await page.getByPlaceholder('Add a new todo...').fill(title2);
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeEnabled({ timeout: 5000 });
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('h3', { hasText: title2 })).toBeVisible({ timeout: 10000 });

    // Enter selection mode
    const selectButton = page.getByRole('button', { name: 'Select', exact: true });
    await expect(selectButton).toBeVisible({ timeout: 5000 });
    await selectButton.click();
    await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible();

    // Select first todo using its specific checkbox
    const checkbox1 = getSelectionCheckboxForTodo(page, title1);
    await expect(checkbox1).toBeVisible({ timeout: 5000 });
    await checkbox1.click();

    // Wait for bulk action bar to appear with "1 selected"
    await expect(page.getByTestId('bulk-action-bar')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('bulk-action-bar').getByText(/1 selected/)).toBeVisible({ timeout: 5000 });

    // Verify first checkbox is checked before clicking second
    await expect(checkbox1).toBeChecked();

    // Select second todo
    const checkbox2 = getSelectionCheckboxForTodo(page, title2);
    await expect(checkbox2).toBeVisible({ timeout: 5000 });

    // Verify checkboxes are different elements
    const checkbox1Box = await checkbox1.boundingBox();
    const checkbox2Box = await checkbox2.boundingBox();
    expect(checkbox1Box).toBeTruthy();
    expect(checkbox2Box).toBeTruthy();
    expect(checkbox1Box!.y).not.toBe(checkbox2Box!.y); // Different y positions

    await checkbox2.click();

    // Wait for "2 selected" to appear
    await expect(page.getByTestId('bulk-action-bar').getByText(/2 selected/)).toBeVisible({ timeout: 5000 });

    // Click Archive in bulk action bar
    await page.getByTestId('bulk-action-bar').getByRole('button', { name: /archive/i }).click();

    // Verify both todos disappear from main list
    await expect(page.locator('h3', { hasText: title1 })).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('h3', { hasText: title2 })).not.toBeVisible({ timeout: 10000 });

    // Go to archive and verify both are there
    const archivedButton = page.getByRole('button', { name: /archived/i });
    await archivedButton.click();

    await expect(page.locator('h3', { hasText: title1 })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h3', { hasText: title2 })).toBeVisible({ timeout: 10000 });
  });

  test('should show archived count in sidebar', async ({ page }) => {
    // Verify Archived button is visible
    const archivedButton = page.getByRole('button', { name: /archived/i });
    await expect(archivedButton).toBeVisible({ timeout: 5000 });

    // Get the archived count by extracting the number from the button
    // The button text is in the format "Archived N" where N is the count
    const getArchivedCount = async () => {
      const text = await archivedButton.textContent();
      const match = text?.match(/Archived\s*(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Create a todo first (we need this before reading initial count)
    const title = uniqueTitle('Count Test');
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeEnabled({ timeout: 5000 });
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Wait for the todo to appear
    const todoTitle = page.locator('h3', { hasText: title });
    await expect(todoTitle).toBeVisible({ timeout: 10000 });

    // Wait for UI to settle and then read the initial count
    await page.waitForTimeout(500);
    const initialCount = await getArchivedCount();

    // Archive the todo
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();
    await todoCard.hover();
    await todoCard.locator('button[aria-label*="Actions"]').click();

    const archiveItem = page.getByRole('menuitem', { name: /^archive$/i });
    await expect(archiveItem).toBeVisible({ timeout: 5000 });
    await archiveItem.click();

    // Wait for todo to disappear from main list
    await expect(todoTitle).not.toBeVisible({ timeout: 10000 });

    // Verify archived count increases by 1
    // Wait for the count to update in the sidebar
    const expectedCount = initialCount + 1;
    await expect(async () => {
      const currentCount = await getArchivedCount();
      expect(currentCount).toBe(expectedCount);
    }).toPass({ timeout: 10000 });
  });
});
