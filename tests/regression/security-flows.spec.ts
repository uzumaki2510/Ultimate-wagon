import { test, expect, Page } from '@playwright/test';
const user = { _id: '000000000000000000000001', name: 'Test Admin', email: 'admin@example.com', role: 'super_admin', status: 'approved', isActive: true, department: 'Test', designation: 'Inspector' };
async function mockApi(page: Page, options: { expired?: boolean; forcePasswordChange?: boolean; loadFails?: boolean; saveFails?: boolean } = {}) {
  let wagon = { _id: '000000000000000000000002', wagonNo: '12345678901', type: 'BOXN', status: 'SICK_LINE', owner: 'Test Railway', builtYear: 2020, updatedAt: '2026-09-01T00:00:00.000Z', repairTasks: [], inspectionChecklist: {} };
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    const respond = (data: unknown, status = 200) => route.fulfill({ status, json: { success: status < 400, data, message: status < 400 ? 'OK' : 'Test API failure' } });
    if (path.endsWith('/auth/refresh-token')) return respond({ accessToken: 'fixture-token' }, options.expired ? 401 : 200);
    if (path.endsWith('/auth/me')) return respond({ ...user, forcePasswordChange: !!options.forcePasswordChange });
    if (path.endsWith('/auth/logout')) return respond({});
    if (path === '/api/v1/wagons') return respond([wagon], options.loadFails ? 500 : 200);
    if (path === `/api/v1/wagons/${wagon._id}` && method === 'PUT') {
      if (options.saveFails) return respond({}, 500);
      wagon = { ...wagon, ...route.request().postDataJSON(), updatedAt: new Date().toISOString() };
      return respond(wagon);
    }
    if (path === '/api/v1/notifications') return respond({ notifications: [], unreadCount: 0 });
    if (path === '/api/v1/master-data') return route.fulfill({ json: [] });
    if (path === '/api/v1/workflows') return respond([{ _id: '000000000000000000000003', wagonId: wagon._id, wagonNo: wagon.wagonNo, wagonType: wagon.type, currentStage: 'YARD_EXAM', stages: [{ stageName: 'YARD_EXAM', status: 'In Progress', startedAt: '2026-09-01T00:00:00Z', targetDurationHours: 1 }], updatedAt: wagon.updatedAt }]);
    return respond([]);
  });
}
test('expired session redirects to login without exposing operational UI', async ({ page }) => {
  await mockApi(page, { expired: true });
  await page.goto('/register');
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
});
test('temporary-password login is limited to the password-change form', async ({ page }) => {
  await mockApi(page, { forcePasswordChange: true });
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Change your temporary password' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Change password', exact: true })).toBeVisible();
});
test('loading failures display a retry instead of an empty register', async ({ page }) => {
  await mockApi(page, { loadFails: true });
  await page.goto('/register');
  await expect(page.getByRole('alert')).toContainText('Test API failure');
  await expect(page.getByRole('button', { name: 'Retry loading' })).toBeVisible();
});
test('checklist completion persists through a page reload', async ({ page }) => {
  await mockApi(page);
  await page.goto('/wagon/000000000000000000000002');
  await page.getByRole('tab', { name: /maintenance/i }).click();
  const checkbox = page.getByTestId('maintenance-checklist').getByRole('checkbox').first();
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  await page.reload();
  await page.getByRole('tab', { name: /maintenance/i }).click();
  await expect(page.getByTestId('maintenance-checklist').getByRole('checkbox').first()).toBeChecked();
});
test('failed checklist save leaves the checkbox unchanged', async ({ page }) => {
  await mockApi(page, { saveFails: true });
  await page.goto('/wagon/000000000000000000000002');
  await page.getByRole('tab', { name: /maintenance/i }).click();
  const checkbox = page.getByTestId('maintenance-checklist').getByRole('checkbox').first();
  await checkbox.click();
  await expect(page.getByText('Test API failure').first()).toBeVisible();
  await expect(checkbox).not.toBeChecked();
});
