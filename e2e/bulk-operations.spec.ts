import { test, expect, uniqueTitle } from './fixtures';

test.describe('Bulk Operations', () => {
  // Increase timeout for all tests in this suite since they involve:
  // - Page load and auth (up to 15s)
  // - Todo creation and API calls
  // - UI interactions with waits
  test.setTimeout(60000);

  test.beforeEach(async ({ page, authenticatedPage }) => {
    // authenticatedPage fixture handles login
    await page.goto('/');
    // Wait for the page to fully load - Select button indicates the app is ready
    await expect(page.getByRole('button', { name: 'Select', exact: true })).toBeVisible({ timeout: 15000 });
  });

  // Helper to find the selection checkbox for a todo by its exact title
  // In selection mode, each todo item has two checkboxes:
  // 1. Selection checkbox (for bulk operations) - a circular button with role="checkbox" and no aria-label
  // 2. Todo completion checkbox - has aria-label like 'Mark "Title" as complete'
  // We want the selection checkbox, which appears first in the DOM
  function getSelectionCheckboxForTodo(page: import('@playwright/test').Page, title: string) {
    // The DOM structure (when in selection mode) is:
    // <div class="flex items-start gap-2">  <- SortableTodoItem wrapper
    //   <div class="mt-4">
    //     <button role="checkbox">  <- Selection checkbox (what we want)
    //   </div>
    //   <div class="flex-1">  <- TodoItem wrapper
    //     <div class="group flex items-start gap-3 rounded-lg...">  <- TodoItem card
    //       ...
    //       <button role="checkbox">  <- Todo completion checkbox (NOT what we want)
    //       <h3>Title</h3>
    //     </div>
    //   </div>
    // </div>
    //
    // Use the todo completion checkbox's aria-label to find the exact todo,
    // then navigate to the selection checkbox
    const todoCompletionCheckbox = page.getByRole('checkbox', { name: `Mark "${title}" as complete` });
    // Go up to find the SortableTodoItem wrapper and get the first checkbox (selection checkbox)
    const todoItemWrapper = todoCompletionCheckbox.locator('xpath=ancestor::div[contains(@class, "flex-1")]').locator('xpath=parent::div');
    return todoItemWrapper.getByRole('checkbox').first();
  }

  test('should enter and exit selection mode', async ({ page }) => {
    // Find and click the Select button
    const selectButton = page.getByRole('button', { name: 'Select', exact: true });
    await expect(selectButton).toBeVisible();
    await selectButton.click();

    // Done button should now be visible (indicates selection mode is active)
    const doneButton = page.getByRole('button', { name: 'Done', exact: true });
    await expect(doneButton).toBeVisible();

    // Select button should no longer be visible
    await expect(selectButton).not.toBeVisible();

    // Click Done to exit selection mode
    await doneButton.click();

    // Select button should be visible again
    await expect(selectButton).toBeVisible();
    // Done button should not be visible
    await expect(doneButton).not.toBeVisible();
  });

  test('should show bulk action bar when items selected', async ({ page }) => {
    // Create a todo first
    const title = uniqueTitle('Bulk Test');
    await page.getByPlaceholder('Add a new todo...').fill(title);
    // Wait for Add button to be enabled
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeEnabled({ timeout: 5000 });
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    // Wait for the todo to appear and UI to settle
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 10000 });

    // Enter selection mode
    const selectButton = page.getByRole('button', { name: 'Select', exact: true });
    await expect(selectButton).toBeVisible({ timeout: 5000 });
    await selectButton.click();

    // Wait for selection mode to be active
    await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible();

    // Bulk action bar should NOT be visible yet (no items selected)
    await expect(page.getByTestId('bulk-action-bar')).not.toBeVisible();

    // Find and click the selection checkbox for the todo
    const selectionCheckbox = getSelectionCheckboxForTodo(page, title);
    await selectionCheckbox.click();

    // Bulk action bar should now be visible
    await expect(page.getByTestId('bulk-action-bar')).toBeVisible();
    await expect(page.getByText('1 selected')).toBeVisible();
  });

  test('should bulk complete selected todos', async ({ page }) => {
    // Create a todo
    const title = uniqueTitle('Bulk Complete Test');
    await page.getByPlaceholder('Add a new todo...').fill(title);
    // Wait for Add button to be enabled
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeEnabled({ timeout: 5000 });
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    // Wait for the todo to appear and UI to settle
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 10000 });

    // Enter selection mode
    const selectButton = page.getByRole('button', { name: 'Select', exact: true });
    await expect(selectButton).toBeVisible({ timeout: 5000 });
    await selectButton.click();
    await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible();

    // Select the todo using its selection checkbox
    const selectionCheckbox = getSelectionCheckboxForTodo(page, title);
    await selectionCheckbox.click();

    // Verify selection happened
    await expect(page.getByText('1 selected')).toBeVisible();
    await expect(page.getByTestId('bulk-action-bar')).toBeVisible();

    // Click Complete in bulk action bar
    await page.getByTestId('bulk-action-bar').getByRole('button', { name: 'Complete' }).click();

    // Wait for the todo to be completed (has line-through style)
    // The bulk complete exits selection mode, so bulk action bar should disappear
    const todoTitleElement = page.locator('h3', { hasText: title });
    await expect(todoTitleElement).toHaveClass(/line-through/, { timeout: 10000 });
  });

  test('should show confirmation before bulk delete', async ({ page }) => {
    // Create a todo
    const title = uniqueTitle('Delete Confirm');
    await page.getByPlaceholder('Add a new todo...').fill(title);
    // Wait for Add button to be enabled
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeEnabled({ timeout: 5000 });
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    // Wait for the todo to appear and UI to settle
    await expect(page.locator('h3', { hasText: title })).toBeVisible({ timeout: 10000 });

    // Enter selection mode
    const selectButton = page.getByRole('button', { name: 'Select', exact: true });
    await expect(selectButton).toBeVisible({ timeout: 5000 });
    await selectButton.click();
    await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible();

    // Select the todo
    const selectionCheckbox = getSelectionCheckboxForTodo(page, title);
    await selectionCheckbox.click();

    // Verify selection happened
    await expect(page.getByText('1 selected')).toBeVisible();

    // Click Delete in bulk action bar
    await page.getByTestId('bulk-action-bar').getByRole('button', { name: /Delete/i }).click();

    // Confirmation dialog should appear with expected content
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText('Delete 1 todo?')).toBeVisible();
    await expect(dialog.getByText('This action cannot be undone')).toBeVisible();

    // Both Cancel and Delete buttons should be in the dialog
    const cancelButton = dialog.getByRole('button', { name: 'Cancel' });
    const deleteButton = dialog.getByRole('button', { name: 'Delete' });
    await expect(cancelButton).toBeVisible();
    await expect(deleteButton).toBeVisible();

    // Click Cancel to close dialog (this should NOT delete the todo)
    await cancelButton.click();

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // Todo should still exist (verify by finding the h3 with the title)
    await expect(page.locator('h3', { hasText: title })).toBeVisible();
  });

  test('should exit selection mode with Escape key', async ({ page }) => {
    // Enter selection mode
    const selectButton = page.getByRole('button', { name: 'Select', exact: true });
    await selectButton.click();

    // Done button should be visible (selection mode active)
    const doneButton = page.getByRole('button', { name: 'Done', exact: true });
    await expect(doneButton).toBeVisible();

    // Press Escape to exit selection mode
    await page.keyboard.press('Escape');

    // Select button should be visible again (selection mode exited)
    await expect(selectButton).toBeVisible();
    await expect(doneButton).not.toBeVisible();
  });
});
