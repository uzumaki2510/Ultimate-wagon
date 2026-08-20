import { test, expect } from '@playwright/test';

test.describe('Live Sick-Line Board - Drag and Drop Workflow Transitions', () => {

  test.beforeEach(async ({ page }) => {
    // Assuming auth and seed data runs prior
    await page.goto('/live-sick-line');
  });

  test('1. Valid transition: drag wagon to valid target', async ({ page }) => {
    // Wagon starts in SICK_LINE, can be moved to WORK_IN_PROGRESS
    const sourceWagon = page.locator('data-testid="wagon-card-WAG123"');
    const targetColumn = page.locator('data-testid="board-column-WORK_IN_PROGRESS"');

    await sourceWagon.dragTo(targetColumn);

    // Confirmation dialog appears
    const confirmDialog = page.locator('text=Confirm Workflow Transition');
    await expect(confirmDialog).toBeVisible();

    // Confirm transition
    await page.getByRole('button', { name: 'Confirm Transition' }).click();

    // Dialog closes
    await expect(confirmDialog).toBeHidden();

    // Wagon appears in new column (mocked optimistic / state update)
    await expect(targetColumn.locator('data-testid="wagon-card-WAG123"')).toBeVisible();
  });

  test('2. Invalid transition: target is unavailable', async ({ page }) => {
    // SICK_LINE to RELEASED is invalid
    const sourceWagon = page.locator('data-testid="wagon-card-WAG123"');
    const targetColumn = page.locator('data-testid="board-column-RELEASED"');

    await sourceWagon.dragTo(targetColumn);

    // No dialog appears because the drop logic rejects invalid targets
    const confirmDialog = page.locator('text=Confirm Workflow Transition');
    await expect(confirmDialog).toBeHidden();

    // Card remains in original column (SICK_LINE)
    const originalColumn = page.locator('data-testid="board-column-SICK_LINE"');
    await expect(originalColumn.locator('data-testid="wagon-card-WAG123"')).toBeVisible();
  });

  test('3. User cancels transition', async ({ page }) => {
    const sourceWagon = page.locator('data-testid="wagon-card-WAG123"');
    const targetColumn = page.locator('data-testid="board-column-WORK_IN_PROGRESS"');

    await sourceWagon.dragTo(targetColumn);

    // Confirmation dialog appears
    const confirmDialog = page.locator('text=Confirm Workflow Transition');
    await expect(confirmDialog).toBeVisible();

    // Cancel transition
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Dialog closes
    await expect(confirmDialog).toBeHidden();

    // Card remains in original column
    const originalColumn = page.locator('data-testid="board-column-SICK_LINE"');
    await expect(originalColumn.locator('data-testid="wagon-card-WAG123"')).toBeVisible();
  });

  test('7. Accessible status menu uses same validation', async ({ page }) => {
    // Accessible dropdown triggers the same confirmation dialog
    const sourceWagon = page.locator('data-testid="wagon-card-WAG123"');
    
    // Open menu
    await sourceWagon.getByRole('button', { name: 'Open menu' }).click();
    
    // Select valid target
    await page.getByText('Move to Work In Progress').click();

    // Dialog appears
    const confirmDialog = page.locator('text=Confirm Workflow Transition');
    await expect(confirmDialog).toBeVisible();
  });
});
