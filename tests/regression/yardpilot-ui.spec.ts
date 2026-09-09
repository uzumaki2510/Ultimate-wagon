import { test, expect } from '@playwright/test';
import { mockWorkspace } from './ui-fixture';

const destinations = ['/', '/register', '/wagon-directory', '/wagon-archives', '/quick-board', '/workshop', '/live-sick-line', '/workshop/steam', '/workshop/degassing', '/workshop/inspection', '/workshop/repair', '/workshop/testing', '/workshop/fit', '/memos', '/memos/new', '/reports', '/reports/generate', '/administration', '/workflow-integrity', '/employees', '/super-admin/center', '/super-admin/master-data', '/super-admin/security', '/more', '/profile', '/help', '/wagon/000000000000000000000002', '/memos?tab=archived', '/memos/new?type=fit', '/super-admin/center?tab=approvals', '/super-admin/center?tab=roles-access', '/super-admin/security?tab=deleted'];
for (const width of [360, 390, 768, 1440]) {
  test(`menu destinations render without page overflow at ${width}px`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 900 }); await mockWorkspace(page);
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    for (const path of destinations) {
      await page.goto(path); await expect(page.locator('main h1').first(), path).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), { message: path }).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}
test('mobile navigation, wagon cards and role-aware More menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await mockWorkspace(page, 'employee'); await page.goto('/register');
  const nav = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(nav.getByRole('link')).toHaveCount(5);
  await expect(page.getByTestId('wagon-card')).toHaveCount(14);
  await nav.getByRole('link', { name: 'More', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'More', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Staff & approvals/ })).toHaveCount(0);
  await page.getByRole('main').getByRole('link', { name: 'Reports', exact: true }).click();
  await expect(page).toHaveURL(/\/reports$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('global search finds wagons beyond the first ten and closes on selection', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await mockWorkspace(page); await page.goto('/');
  await page.getByRole('button', { name: 'Search wagons or memos' }).click();
  await page.getByPlaceholder('Search wagon number, type or memo…').fill('12345678914');
  await page.getByRole('option', { name: /12345678914/ }).click();
  await expect(page).toHaveURL(/\/wagon\/000000000000000000000015$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('memo form has labelled fields and a stacked phone wagon editor', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 }); await mockWorkspace(page); await page.goto('/memos/new');
  await page.getByLabel('Memo No').fill('YM-015');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Add Wagon', exact: true }).click();
  await expect(page.getByLabel('Wagon number')).toBeVisible();
  await page.getByLabel('Wagon number').fill('12345678901');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
test('desktop has six sections, burgundy branding and no fake critical-alert count', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await mockWorkspace(page); await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link')).toHaveCount(6);
  await expect(page.getByText('2 Critical Alerts')).toHaveCount(0);
  await expect(page).toHaveTitle('RailFlow — Wagon Maintenance');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim())).toBe('354 70% 38%');
});

test('keyboard search opens and dismisses, and CSV export produces a file', async ({ page }) => {
  await mockWorkspace(page); await page.goto('/reports');
  await expect(page.getByRole('heading', { name: 'Reports', exact: true })).toBeVisible();
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('RailFlow-workshop-report.csv');
});
