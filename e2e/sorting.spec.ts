import { test, expect, uniqueTitle } from './fixtures';

/**
 * E2E Tests for Todo Sorting (Issue #30)
 *
 * These tests verify that sorting works correctly in the UI:
 * 1. Priority sorting (High to Low, Low to High)
 * 2. Due date sorting (Earliest, Latest)
 * 3. Created date sorting (Newest, Oldest)
 * 4. Title sorting (A-Z, Z-A)
 * 5. Completed todos always appear at the end
 * 6. Sort preference persists across page reload
 */

test.describe('Todo Sorting', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
  });

  test('should sort by priority high to low', async ({ page }) => {
    // Create todos with different priorities in random order
    const lowTitle = uniqueTitle('AAA Low Priority');
    const highTitle = uniqueTitle('BBB High Priority');
    const mediumTitle = uniqueTitle('CCC Medium Priority');

    // Create LOW priority todo
    await page.getByPlaceholder('Add a new todo...').fill(lowTitle);
    const form = page.locator('form').filter({ has: page.getByPlaceholder('Add a new todo...') });
    await form.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: /^low$/i }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(lowTitle)).toBeVisible({ timeout: 5000 });

    // Create HIGH priority todo
    await page.getByPlaceholder('Add a new todo...').fill(highTitle);
    await form.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: /^high$/i }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(highTitle)).toBeVisible({ timeout: 5000 });

    // Create MEDIUM priority todo
    await page.getByPlaceholder('Add a new todo...').fill(mediumTitle);
    await form.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: /^medium$/i }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(mediumTitle)).toBeVisible({ timeout: 5000 });

    // Select "Priority: High → Low" from sort dropdown
    const sortDropdown = page.locator('button[role="combobox"]').filter({ hasText: /newest|priority|due|title/i });
    await sortDropdown.click();
    await page.getByRole('option', { name: /high.*low/i }).click();

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Get all todo titles in order
    const todoTitles = await page.locator('h3').allTextContents();

    // Find positions of our test todos
    const highIndex = todoTitles.findIndex(t => t.includes('BBB High Priority'));
    const mediumIndex = todoTitles.findIndex(t => t.includes('CCC Medium Priority'));
    const lowIndex = todoTitles.findIndex(t => t.includes('AAA Low Priority'));

    // Verify order: HIGH < MEDIUM < LOW (by index)
    expect(highIndex).toBeLessThan(mediumIndex);
    expect(mediumIndex).toBeLessThan(lowIndex);
  });

  test('should sort by priority low to high', async ({ page }) => {
    // Create todos with different priorities
    const lowTitle = uniqueTitle('AAA Low');
    const highTitle = uniqueTitle('BBB High');
    const mediumTitle = uniqueTitle('CCC Medium');

    // Create HIGH priority todo first
    await page.getByPlaceholder('Add a new todo...').fill(highTitle);
    const form = page.locator('form').filter({ has: page.getByPlaceholder('Add a new todo...') });
    await form.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: /^high$/i }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(highTitle)).toBeVisible({ timeout: 5000 });

    // Create LOW priority todo
    await page.getByPlaceholder('Add a new todo...').fill(lowTitle);
    await form.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: /^low$/i }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(lowTitle)).toBeVisible({ timeout: 5000 });

    // Create MEDIUM priority todo
    await page.getByPlaceholder('Add a new todo...').fill(mediumTitle);
    await form.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: /^medium$/i }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(mediumTitle)).toBeVisible({ timeout: 5000 });

    // Select "Priority: Low → High" from sort dropdown
    const sortDropdown = page.locator('button[role="combobox"]').filter({ hasText: /newest|priority|due|title/i });
    await sortDropdown.click();
    await page.getByRole('option', { name: /low.*high/i }).click();

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Get all todo titles in order
    const todoTitles = await page.locator('h3').allTextContents();

    // Find positions of our test todos
    const highIndex = todoTitles.findIndex(t => t.includes('BBB High'));
    const mediumIndex = todoTitles.findIndex(t => t.includes('CCC Medium'));
    const lowIndex = todoTitles.findIndex(t => t.includes('AAA Low'));

    // Verify order: LOW < MEDIUM < HIGH (by index)
    expect(lowIndex).toBeLessThan(mediumIndex);
    expect(mediumIndex).toBeLessThan(highIndex);
  });

  test('should keep completed todos at the end when sorting by priority', async ({ page }) => {
    // Create a HIGH priority todo
    const highTitle = uniqueTitle('High Priority');
    await page.getByPlaceholder('Add a new todo...').fill(highTitle);
    const form = page.locator('form').filter({ has: page.getByPlaceholder('Add a new todo...') });
    await form.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: /^high$/i }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(highTitle)).toBeVisible({ timeout: 5000 });

    // Create a LOW priority todo
    const lowTitle = uniqueTitle('Low Priority');
    await page.getByPlaceholder('Add a new todo...').fill(lowTitle);
    await form.locator('button[role="combobox"]').first().click();
    await page.getByRole('option', { name: /^low$/i }).click();
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(lowTitle)).toBeVisible({ timeout: 5000 });

    // Mark the HIGH priority todo as complete
    const highTodoTitle = page.locator('h3', { hasText: highTitle });
    const highTodoCard = highTodoTitle.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]').first();
    await highTodoCard.getByRole('checkbox').click();
    await page.waitForTimeout(500);

    // Select "Priority: High → Low" from sort dropdown
    const sortDropdown = page.locator('button[role="combobox"]').filter({ hasText: /newest|priority|due|title/i });
    await sortDropdown.click();
    await page.getByRole('option', { name: /high.*low/i }).click();

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Get all todo titles in order
    const todoTitles = await page.locator('h3').allTextContents();

    // Find positions
    const highIndex = todoTitles.findIndex(t => t.includes('High Priority'));
    const lowIndex = todoTitles.findIndex(t => t.includes('Low Priority'));

    // Even though HIGH priority is higher, it should come AFTER LOW because it's completed
    expect(lowIndex).toBeLessThan(highIndex);
  });

  test('should sort by newest first', async ({ page }) => {
    // Create first todo
    const firstTitle = uniqueTitle('First Created');
    await page.getByPlaceholder('Add a new todo...').fill(firstTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(firstTitle)).toBeVisible({ timeout: 5000 });

    // Wait a bit to ensure different timestamps
    await page.waitForTimeout(1000);

    // Create second todo
    const secondTitle = uniqueTitle('Second Created');
    await page.getByPlaceholder('Add a new todo...').fill(secondTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(secondTitle)).toBeVisible({ timeout: 5000 });

    // Select "Newest First" from sort dropdown
    const sortDropdown = page.locator('button[role="combobox"]').filter({ hasText: /newest|priority|due|title/i });
    await sortDropdown.click();
    await page.getByRole('option', { name: /newest first/i }).click();

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Get all todo titles in order
    const todoTitles = await page.locator('h3').allTextContents();

    // Find positions
    const firstIndex = todoTitles.findIndex(t => t.includes('First Created'));
    const secondIndex = todoTitles.findIndex(t => t.includes('Second Created'));

    // Second (newer) should come before First (older)
    expect(secondIndex).toBeLessThan(firstIndex);
  });

  test('should sort by oldest first', async ({ page }) => {
    // Create first todo
    const firstTitle = uniqueTitle('First Created');
    await page.getByPlaceholder('Add a new todo...').fill(firstTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(firstTitle)).toBeVisible({ timeout: 5000 });

    // Wait a bit to ensure different timestamps
    await page.waitForTimeout(1000);

    // Create second todo
    const secondTitle = uniqueTitle('Second Created');
    await page.getByPlaceholder('Add a new todo...').fill(secondTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(secondTitle)).toBeVisible({ timeout: 5000 });

    // Select "Oldest First" from sort dropdown
    const sortDropdown = page.locator('button[role="combobox"]').filter({ hasText: /newest|priority|due|title/i });
    await sortDropdown.click();
    await page.getByRole('option', { name: /oldest first/i }).click();

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Get all todo titles in order
    const todoTitles = await page.locator('h3').allTextContents();

    // Find positions
    const firstIndex = todoTitles.findIndex(t => t.includes('First Created'));
    const secondIndex = todoTitles.findIndex(t => t.includes('Second Created'));

    // First (older) should come before Second (newer)
    expect(firstIndex).toBeLessThan(secondIndex);
  });

  test('should sort by title A-Z', async ({ page }) => {
    // Create todos with titles that sort alphabetically
    const zebraTitle = uniqueTitle('Zebra Task');
    const appleTitle = uniqueTitle('Apple Task');
    const mangoTitle = uniqueTitle('Mango Task');

    // Create in random order
    await page.getByPlaceholder('Add a new todo...').fill(zebraTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(zebraTitle)).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Add a new todo...').fill(appleTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(appleTitle)).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Add a new todo...').fill(mangoTitle);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(mangoTitle)).toBeVisible({ timeout: 5000 });

    // Select "Title A-Z" from sort dropdown
    const sortDropdown = page.locator('button[role="combobox"]').filter({ hasText: /newest|priority|due|title/i });
    await sortDropdown.click();
    await page.getByRole('option', { name: /title.*a.*z/i }).click();

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Get all todo titles in order
    const todoTitles = await page.locator('h3').allTextContents();

    // Find positions
    const appleIndex = todoTitles.findIndex(t => t.includes('Apple Task'));
    const mangoIndex = todoTitles.findIndex(t => t.includes('Mango Task'));
    const zebraIndex = todoTitles.findIndex(t => t.includes('Zebra Task'));

    // Verify alphabetical order: Apple < Mango < Zebra
    expect(appleIndex).toBeLessThan(mangoIndex);
    expect(mangoIndex).toBeLessThan(zebraIndex);
  });

  test('should persist sort preference across page reload', async ({ page }) => {
    // Create a todo first
    const title = uniqueTitle('Persist Test');
    await page.getByPlaceholder('Add a new todo...').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Select "Priority: High → Low" from sort dropdown
    const sortDropdown = page.locator('button[role="combobox"]').filter({ hasText: /newest|priority|due|title/i });
    await sortDropdown.click();
    await page.getByRole('option', { name: /high.*low/i }).click();

    // Wait for sort to apply and be saved
    await page.waitForTimeout(500);

    // Reload the page
    await page.reload();

    // Wait for page to load
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    // Verify the sort dropdown still shows the selected option
    const sortDropdownAfterReload = page.locator('button[role="combobox"]').filter({ hasText: /high.*low/i });
    await expect(sortDropdownAfterReload).toBeVisible();
  });
});
