import { test, expect, uniqueTitle } from './fixtures';

test.describe('Calendar View', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto('/');
  });

  test('can toggle between list and calendar views', async ({ page }) => {
    // View toggle buttons should be visible (using title attributes)
    await expect(page.getByTitle('List view')).toBeVisible();
    await expect(page.getByTitle('Calendar view')).toBeVisible();

    // Click calendar view
    await page.getByTitle('Calendar view').click();

    // Should show calendar header with Today, Month, Week buttons
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Month' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Week' })).toBeVisible();

    // Click list view to go back
    await page.getByTitle('List view').click();

    // Calendar header should not be visible
    await expect(page.getByRole('button', { name: 'Today' })).not.toBeVisible();
  });

  test('can navigate between months', async ({ page }) => {
    await page.getByTitle('Calendar view').click();

    // Get current month text from heading (the calendar header h2, not sidebar)
    // The calendar header contains month/year like "January 2026" or "Week of..."
    const monthHeading = page.locator('h2.text-lg');
    const currentMonth = await monthHeading.textContent();

    // Click next month button using aria-label (exact match to avoid Next.js dev tools button)
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Month should change
    await expect(monthHeading).not.toHaveText(currentMonth || '');

    // Click previous month button to go back
    await page.getByRole('button', { name: 'Previous', exact: true }).click();
    await expect(monthHeading).toHaveText(currentMonth || '');
  });

  test('can switch between month and week views', async ({ page }) => {
    await page.getByTitle('Calendar view').click();

    // Month button should be active by default
    const monthButton = page.getByRole('button', { name: 'Month' });
    const weekButton = page.getByRole('button', { name: 'Week' });

    // Check that Month button has bg-accent class (active state)
    // Using a regex that matches 'bg-accent' as a standalone class, not within hover:bg-accent
    const monthClass = await monthButton.getAttribute('class');
    expect(monthClass).toContain(' bg-accent');

    // Switch to week view
    await weekButton.click();

    // Wait for state to update
    await page.waitForTimeout(100);

    // Week should now have bg-accent, Month should not
    const weekClassAfter = await weekButton.getAttribute('class');
    const monthClassAfter = await monthButton.getAttribute('class');
    expect(weekClassAfter).toContain(' bg-accent');
    expect(monthClassAfter).not.toContain(' bg-accent');

    // Switch back to month view
    await monthButton.click();
    await page.waitForTimeout(100);
    const monthClassFinal = await monthButton.getAttribute('class');
    expect(monthClassFinal).toContain(' bg-accent');
  });

  test('can quick-add todo from calendar', async ({ page }) => {
    const todoTitle = uniqueTitle('Calendar Quick Add');

    await page.getByTitle('Calendar view').click();

    // Click Today button to ensure we're on the current month
    await page.getByRole('button', { name: 'Today' }).click();

    // Find today's date button in the calendar grid
    // Today's date button has bg-primary class and contains the current date number
    // Find button within the calendar grid (not the calendar header) that has bg-primary styling
    const calendarGrid = page.locator('.grid.grid-cols-7');
    const todayButton = calendarGrid.locator('button.bg-primary').first();
    await todayButton.click();

    // Quick add popover should appear with input
    const quickAddInput = page.getByPlaceholder('Todo title...');
    await expect(quickAddInput).toBeVisible({ timeout: 5000 });

    // Add a todo
    await quickAddInput.fill(todoTitle);
    // Click the Add button in the popover (has Plus icon)
    await page.locator('[data-radix-popper-content-wrapper]').getByRole('button', { name: /add/i }).click();

    // Wait for popover to close (may take time for API call)
    await expect(quickAddInput).not.toBeVisible({ timeout: 10000 });

    // Switch to list view to verify todo was created
    await page.getByTitle('List view').click();
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });
  });

  test('displays todos on their due dates in calendar', async ({ page }) => {
    const todoTitle = uniqueTitle('Calendar Due Date');

    // Create a todo with today's due date in list view
    await page.getByPlaceholder('Add a new todo...').fill(todoTitle);

    // Click the due date button in the form to open date picker
    const form = page.locator('form');
    await form.getByRole('button', { name: /due date/i }).click();

    // Select today's date in the date picker popover
    const today = new Date().getDate().toString();
    await page.getByRole('gridcell', { name: today, exact: true }).click();

    // Submit the form
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // Wait for todo to appear in list
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });

    // Switch to calendar view
    await page.getByTitle('Calendar view').click();

    // Click Today to ensure we're viewing current date
    await page.getByRole('button', { name: 'Today' }).click();

    // The todo should be visible on the calendar as a chip
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });
  });

  test('Today button navigates to current date', async ({ page }) => {
    await page.getByTitle('Calendar view').click();

    // Get current month from the calendar header
    const monthHeading = page.locator('h2.text-lg');
    const initialMonth = await monthHeading.textContent();

    // Navigate to a different month first (use exact match to avoid Next.js dev tools)
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    const futureMonth = await monthHeading.textContent();

    // Ensure we navigated to a different month
    expect(futureMonth).not.toBe(initialMonth);

    // Click Today
    await page.getByRole('button', { name: 'Today' }).click();

    // Should be back to current month (same as initial)
    await expect(monthHeading).toHaveText(initialMonth || '');
  });

  test('week view shows week heading and day columns', async ({ page }) => {
    // Switch to calendar view
    await page.getByTitle('Calendar view').click();

    // Wait for calendar to load
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible({ timeout: 5000 });

    // Should start in month view
    await expect(page.getByRole('button', { name: 'Month' })).toHaveClass(/ bg-accent/);

    // Switch to week view
    await page.getByRole('button', { name: 'Week' }).click();

    // Week view should show "Week of" in the heading
    const weekHeading = page.locator('h2.text-lg');
    await expect(weekHeading).toContainText('Week of');

    // Week button should now be active
    const weekClass = await page.getByRole('button', { name: 'Week' }).getAttribute('class');
    expect(weekClass).toContain(' bg-accent');

    // Day columns should be visible (grid with 7 columns - use last() to get the day grid, not header)
    const calendarGrid = page.locator('.grid.grid-cols-7').last();
    await expect(calendarGrid).toBeVisible();

    // Navigate to today
    await page.getByRole('button', { name: 'Today' }).click();

    // Today's date button should be highlighted (has bg-primary class)
    const todayButton = calendarGrid.locator('button.bg-primary').first();
    await expect(todayButton).toBeVisible({ timeout: 5000 });
  });
});
