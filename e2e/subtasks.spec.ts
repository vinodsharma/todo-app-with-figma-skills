import { test, expect, uniqueTitle } from './fixtures';
import { Page, Locator } from '@playwright/test';

// Helper to expand subtasks section, handles both collapsed and expanded states
async function ensureSubtasksExpanded(todoCard: Locator, page: Page) {
  // Wait for any in-progress updates to settle
  await page.waitForTimeout(300);

  const expandBtn = todoCard.locator('button[aria-label="Expand subtasks"]');
  const addSubtaskBtn = todoCard.getByText('Add subtask');

  // Check if already expanded (Add subtask button visible means expanded)
  const isExpanded = await addSubtaskBtn.isVisible({ timeout: 500 }).catch(() => false);

  if (!isExpanded) {
    // Need to expand - click the expand button
    await expect(expandBtn).toBeVisible({ timeout: 5000 });
    await expandBtn.click();
    // Wait for expansion animation
    await page.waitForTimeout(200);
  }

  // Wait for subtasks section to be visible (Add subtask button should appear)
  await expect(addSubtaskBtn).toBeVisible({ timeout: 5000 });
}

// Helper to add a subtask and ensure it's visible
async function addSubtask(page: Page, todoCard: Locator, subtaskTitle: string) {
  // Ensure expanded by clicking expand button (only if not already expanded)
  await ensureSubtasksExpanded(todoCard, page);

  // Click "Add subtask" button
  await todoCard.getByText('Add subtask').click();

  // Fill in subtask title and submit
  await page.getByPlaceholder('Subtask title...').fill(subtaskTitle);
  await page.locator('form').filter({ hasText: 'Cancel' }).getByRole('button', { name: 'Add' }).click();

  // Wait for the API call to complete and state to update
  // Look for the progress badge to appear (which confirms subtask was created)
  await expect(todoCard.locator('[data-slot="badge"]', { hasText: /\d\/\d/ })).toBeVisible({ timeout: 10000 });

  // After subtask is added, component may re-render and collapse
  // Wait a moment for the re-render
  await page.waitForTimeout(500);

  // Re-expand if it collapsed
  await ensureSubtasksExpanded(todoCard, page);

  // Verify subtask is visible
  await expect(page.getByText(subtaskTitle)).toBeVisible({ timeout: 5000 });
}

test.describe('Subtasks', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    // authenticatedPage fixture handles login
    await page.goto('/');
  });

  test('can expand a todo to see Add subtask button', async ({ page }) => {
    const title = uniqueTitle('Expandable');

    // Create a todo
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: title });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Click the expand chevron
    const expandButton = todoCard.locator('button[aria-label="Expand subtasks"]');
    await expandButton.click();

    // Verify "Add subtask" button is visible
    await expect(todoCard.getByText('Add subtask')).toBeVisible();
  });

  test('can create a subtask and see progress', async ({ page }) => {
    const parentTitle = uniqueTitle('Parent Todo');
    const subtaskTitle = `Subtask ${Date.now()}`;

    // Create parent todo
    await page.getByPlaceholder('Add a new todo...').fill(parentTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(parentTitle)).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: parentTitle });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Add subtask using helper
    await addSubtask(page, todoCard, subtaskTitle);

    // Verify progress badge shows "0/1"
    await expect(todoCard.locator('[data-slot="badge"]', { hasText: '0/1' })).toBeVisible({ timeout: 5000 });
  });

  test('can complete a subtask and see progress update', async ({ page }) => {
    const parentTitle = uniqueTitle('Parent Complete');
    const subtaskTitle = `Subtask Complete ${Date.now()}`;

    // Create parent todo
    await page.getByPlaceholder('Add a new todo...').fill(parentTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(parentTitle)).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: parentTitle });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Add subtask using helper
    await addSubtask(page, todoCard, subtaskTitle);

    // Verify initial progress is "0/1"
    await expect(todoCard.locator('[data-slot="badge"]', { hasText: '0/1' })).toBeVisible({ timeout: 5000 });

    // Find the subtask checkbox using aria-label and click it to complete
    // The checkbox is within the subtasks section, so make sure we're looking in the right place
    const subtaskCheckbox = todoCard.locator(`[data-slot="checkbox"][aria-label*="${subtaskTitle}"]`);
    await expect(subtaskCheckbox).toBeVisible({ timeout: 5000 });
    await subtaskCheckbox.click();

    // Wait for the API call to complete and UI to update
    await page.waitForTimeout(500);

    // Verify progress updates to "1/1"
    await expect(todoCard.locator('[data-slot="badge"]', { hasText: '1/1' })).toBeVisible({ timeout: 10000 });

    // Re-expand subtasks section to verify the completed subtask has line-through
    await ensureSubtasksExpanded(todoCard, page);

    // Verify subtask title has line-through
    await expect(todoCard.locator('span', { hasText: subtaskTitle })).toHaveClass(/line-through/);
  });

  test('can delete a subtask', async ({ page }) => {
    const parentTitle = uniqueTitle('Parent Delete Subtask');
    const subtaskTitle = `Subtask To Delete ${Date.now()}`;

    // Create parent todo
    await page.getByPlaceholder('Add a new todo...').fill(parentTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(parentTitle)).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: parentTitle });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Add subtask using helper
    await addSubtask(page, todoCard, subtaskTitle);

    // Verify progress badge shows "0/1"
    await expect(todoCard.locator('[data-slot="badge"]', { hasText: '0/1' })).toBeVisible({ timeout: 5000 });

    // Find the subtask item and hover to reveal delete button
    const subtaskItem = page.locator('span', { hasText: subtaskTitle }).locator('xpath=ancestor::div[contains(@class, "rounded-md")]').first();
    await subtaskItem.hover();

    // Click delete button (has aria-label like 'Delete "Subtask..."')
    const deleteButton = subtaskItem.locator('button[aria-label^="Delete "]');
    await deleteButton.click();

    // Verify subtask is gone
    await expect(page.getByText(subtaskTitle)).not.toBeVisible({ timeout: 5000 });

    // Verify progress badge is gone (no subtasks left)
    await expect(todoCard.locator('[data-slot="badge"]', { hasText: /\d\/\d/ })).not.toBeVisible();
  });

  test('deleting parent todo also deletes its subtasks', async ({ page }) => {
    const parentTitle = uniqueTitle('Parent To Delete');
    const subtaskTitle = `Subtask Cascade ${Date.now()}`;

    // Create parent todo
    await page.getByPlaceholder('Add a new todo...').fill(parentTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(parentTitle)).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: parentTitle });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Add subtask using helper
    await addSubtask(page, todoCard, subtaskTitle);

    // Now delete the parent todo using the dropdown menu
    await todoCard.hover();
    const actionsButton = todoCard.getByRole('button', { name: /actions for/i });
    await actionsButton.click();

    // Click delete in dropdown
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Verify parent is gone
    await expect(page.locator('h3', { hasText: parentTitle })).not.toBeVisible({ timeout: 5000 });

    // Verify subtask is also gone (cascade delete)
    await expect(page.getByText(subtaskTitle)).not.toBeVisible({ timeout: 5000 });
  });

  test('can add multiple subtasks and track progress', async ({ page }) => {
    // Increase timeout for this test as it involves multiple subtasks
    test.setTimeout(60000);

    const timestamp = Date.now();
    const parentTitle = uniqueTitle('Multiple Subtasks');
    const subtask1 = `First Subtask ${timestamp}`;
    const subtask2 = `Second Subtask ${timestamp}`;

    // Create parent todo
    await page.getByPlaceholder('Add a new todo...').fill(parentTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(parentTitle)).toBeVisible({ timeout: 5000 });

    // Find the todo card
    const todoTitle = page.locator('h3', { hasText: parentTitle });
    const todoCard = todoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();

    // Add first subtask
    await addSubtask(page, todoCard, subtask1);

    // Add second subtask
    await addSubtask(page, todoCard, subtask2);

    // Verify progress shows "0/2"
    await expect(todoCard.locator('[data-slot="badge"]', { hasText: '0/2' })).toBeVisible({ timeout: 5000 });

    // Complete first subtask - use data-slot selector which matches the checkbox component
    const checkbox1 = todoCard.locator(`[data-slot="checkbox"][aria-label*="${subtask1}"]`);
    await expect(checkbox1).toBeVisible({ timeout: 5000 });
    await checkbox1.click();

    // Wait for API call and UI update
    await page.waitForTimeout(500);

    // Verify progress updates to "1/2"
    await expect(todoCard.locator('[data-slot="badge"]', { hasText: '1/2' })).toBeVisible({ timeout: 10000 });

    // Re-expand after first subtask completion (section may have collapsed)
    await ensureSubtasksExpanded(todoCard, page);

    // Complete second subtask
    const checkbox2 = todoCard.locator(`[data-slot="checkbox"][aria-label*="${subtask2}"]`);
    await expect(checkbox2).toBeVisible({ timeout: 5000 });
    await checkbox2.click();

    // Wait for API call and UI update
    await page.waitForTimeout(500);

    // Verify progress updates to "2/2"
    await expect(todoCard.locator('[data-slot="badge"]', { hasText: '2/2' })).toBeVisible({ timeout: 10000 });
  });
});
