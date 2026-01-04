import { test, expect, uniqueTitle } from './fixtures';

test.describe('Recurring Todos', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    // authenticatedPage fixture handles login
    await page.goto('/');
  });

  test('can create a daily recurring todo and verify recurrence icon shows', async ({ page }) => {
    const title = uniqueTitle('Daily Task');

    // Fill in the todo title
    await page.getByPlaceholder('Add a new todo...').fill(title);

    // Find the recurrence selector in the todo form and select "Daily"
    const todoForm = page.locator('form').filter({ has: page.getByPlaceholder('Add a new todo...') });
    const recurrenceSelector = todoForm.locator('button[role="combobox"]').filter({ hasText: /repeat|daily|weekly|monthly|does not/i });
    await recurrenceSelector.click();
    await page.getByRole('option', { name: /^daily$/i }).click();

    // Submit the form
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Wait for todo to appear
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Verify the repeat/recurrence icon is visible (Repeat icon from lucide)
    // The icon has a title attribute with the recurrence description
    const recurrenceIndicator = todoCard.locator('[title*="Daily"], [title*="daily"]');
    await expect(recurrenceIndicator).toBeVisible({ timeout: 5000 });
  });

  test('completing a recurring todo creates the next occurrence', async ({ page }) => {
    const title = uniqueTitle('Recurring Complete');

    // Create a daily recurring todo
    await page.getByPlaceholder('Add a new todo...').fill(title);

    // Set recurrence to daily
    const todoForm = page.locator('form').filter({ has: page.getByPlaceholder('Add a new todo...') });
    const recurrenceSelector = todoForm.locator('button[role="combobox"]').filter({ hasText: /repeat|daily|weekly|monthly|does not/i });
    await recurrenceSelector.click();
    await page.getByRole('option', { name: /^daily$/i }).click();

    // Submit the form
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Wait for todo to appear
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find the todo card and complete it
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();
    const checkbox = todoCard.getByRole('checkbox');
    await checkbox.click();

    // Wait for the API to complete and new todo to be created
    await page.waitForTimeout(1000);

    // There should now be two todos with this title:
    // 1. The completed original
    // 2. The new uncompleted occurrence
    const allTodosWithTitle = page.locator('h3', { hasText: title });
    await expect(allTodosWithTitle).toHaveCount(2, { timeout: 10000 });

    // Verify one is completed (has line-through) and one is not
    const completedTodos = page.locator('h3.line-through', { hasText: title });
    const activeTodos = page.locator('h3:not(.line-through)', { hasText: title });

    await expect(completedTodos).toHaveCount(1);
    await expect(activeTodos).toHaveCount(1);
  });

  test('can set custom weekly recurrence with specific days (Mon, Wed, Fri)', async ({ page }) => {
    const title = uniqueTitle('MWF Task');

    // Fill in the todo title
    await page.getByPlaceholder('Add a new todo...').fill(title);

    // Find the recurrence selector and select "Custom..."
    const todoForm = page.locator('form').filter({ has: page.getByPlaceholder('Add a new todo...') });
    const recurrenceSelector = todoForm.locator('button[role="combobox"]').filter({ hasText: /repeat|daily|weekly|monthly|does not/i });
    await recurrenceSelector.click();
    await page.getByRole('option', { name: /custom/i }).click();

    // Custom recurrence dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Set frequency to weekly (should be default or select it)
    const frequencySelect = page.getByRole('dialog').locator('button[role="combobox"]').first();
    await frequencySelect.click();
    await page.getByRole('option', { name: /^weekly$/i }).click();

    // Select Mon, Wed, Fri checkboxes
    // First uncheck Monday if it's already checked (it's the default)
    const monCheckbox = page.getByRole('dialog').locator('label').filter({ hasText: 'Mon' }).getByRole('checkbox');
    const wedCheckbox = page.getByRole('dialog').locator('label').filter({ hasText: 'Wed' }).getByRole('checkbox');
    const friCheckbox = page.getByRole('dialog').locator('label').filter({ hasText: 'Fri' }).getByRole('checkbox');

    // Make sure Mon is checked
    if (!(await monCheckbox.isChecked())) {
      await monCheckbox.click();
    }
    // Check Wed
    await wedCheckbox.click();
    // Check Fri
    await friCheckbox.click();

    // Save the custom recurrence
    await page.getByRole('dialog').getByRole('button', { name: /save/i }).click();

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Submit the form
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Wait for todo to appear
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Verify the recurrence indicator shows the custom schedule
    // It should have a title containing the day information
    const recurrenceIndicator = todoCard.locator('[title*="Mon"], [title*="Wed"], [title*="Fri"], [title*="week"]');
    await expect(recurrenceIndicator).toBeVisible({ timeout: 5000 });
  });

  test('can stop recurrence on a todo and verify icon disappears', async ({ page }) => {
    const title = uniqueTitle('Stop Recurring');

    // Create a daily recurring todo
    await page.getByPlaceholder('Add a new todo...').fill(title);

    // Set recurrence to daily
    const todoForm = page.locator('form').filter({ has: page.getByPlaceholder('Add a new todo...') });
    const recurrenceSelector = todoForm.locator('button[role="combobox"]').filter({ hasText: /repeat|daily|weekly|monthly|does not/i });
    await recurrenceSelector.click();
    await page.getByRole('option', { name: /^daily$/i }).click();

    // Submit the form
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Wait for todo to appear
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Verify recurrence icon is visible initially
    const recurrenceIndicator = todoCard.locator('[title*="Daily"], [title*="daily"]');
    await expect(recurrenceIndicator).toBeVisible({ timeout: 5000 });

    // Open the actions dropdown menu (the ... button)
    const actionsButton = todoCard.locator('button[aria-label*="Actions"]');
    await todoCard.hover();
    await actionsButton.click();

    // Click "Stop repeating" menu item
    await page.getByRole('menuitem', { name: /stop repeating/i }).click();

    // Wait for the API call to complete
    await page.waitForTimeout(500);

    // Verify the recurrence icon is no longer visible
    await expect(recurrenceIndicator).not.toBeVisible({ timeout: 5000 });
  });
});
