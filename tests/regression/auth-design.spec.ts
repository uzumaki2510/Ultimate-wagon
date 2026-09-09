import { test, expect, type Page } from '@playwright/test';
import { mockWorkspace } from './ui-fixture';

async function loggedOut(page: Page) {
  await page.addInitScript(() => localStorage.setItem('theme', 'light'));
  await page.route('**/api/v1/**', route => route.fulfill({ status: 401, json: { success: false, message: 'Please sign in.' } }));
}

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`login and access request fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await loggedOut(page);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/auth');
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
    const tabs = await page.getByRole('tablist').boundingBox();
    const signInTab = await page.getByRole('tab', { name: 'Sign in', exact: true }).boundingBox();
    expect(signInTab!.width).toBeGreaterThan(tabs!.width * 0.4);
    const login = page.getByRole('button', { name: 'Login', exact: true });
    const bounds = await login.boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThan(900);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page).toHaveTitle('RailFlow — Wagon Maintenance');
    await expect(page.locator('.auth-page img')).toHaveCount(0);
    await expect(page.getByText(/RailFlow brings wagon inspections/)).toBeVisible();
    await page.evaluate(() => scrollTo(0, 0));
    if (width === 1440 || width === 390) await page.screenshot({ path: `docs/ui/login-${width === 1440 ? 'desktop' : 'mobile'}.png`, fullPage: true });
    await page.getByRole('tab', { name: 'Request access', exact: true }).click();
    await expect(page.getByLabel('Full name')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('password visibility, help and recoverable login errors', async ({ page }) => {
  await loggedOut(page);
  await page.route('**/api/v1/auth/login', route => route.fulfill({ status: 401, json: { success: false, message: 'Email or password is incorrect.' } }));
  await page.goto('/auth');
  await page.getByLabel('Work email', { exact: true }).fill('inspector@example.com');
  await page.getByLabel('Password', { exact: true }).fill('test-only-password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Email or password is incorrect.');
  await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeEnabled();
  await page.getByText('Trouble signing in?', { exact: true }).click();
  await expect(page.getByText(/Contact your department administrator/)).toBeVisible();
  await page.getByRole('tab', { name: 'Request access', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('access requests preserve approval flow and clear the password', async ({ page }) => {
  await loggedOut(page);
  let payload: Record<string, string> | undefined;
  await page.route('**/api/v1/auth/register', route => {
    payload = route.request().postDataJSON();
    return route.fulfill({ json: { success: true, data: {} } });
  });
  await page.goto('/auth');
  await page.getByRole('tab', { name: 'Request access', exact: true }).click();
  await page.getByLabel('Full name').fill('Test Inspector');
  await page.getByLabel('Employee code').fill('TEST-001');
  await page.getByLabel('Work email', { exact: true }).fill('inspector@example.com');
  await page.getByLabel('Create a password').fill('test-only-password');
  await page.getByRole('button', { name: 'Request access', exact: true }).click();
  await expect(page.getByRole('heading', { name: "You're on the list." })).toBeFocused();
  await expect(page.getByText(/waiting for administrator approval/)).toBeVisible();
  expect(payload).toMatchObject({ name: 'Test Inspector', empCode: 'TEST-001', department: 'C&W Department', designation: 'Staff' });
  await page.getByRole('button', { name: 'Back to Login', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  await page.getByRole('tab', { name: 'Request access', exact: true }).click();
  await expect(page.getByLabel('Create a password')).toHaveValue('');
});

test('successful login still opens the workspace', async ({ page }) => {
  await mockWorkspace(page);
  await page.route('**/api/v1/auth/login', route => route.fulfill({ json: { success: true, data: { accessToken: 'fixture-token' } } }));
  await page.goto('/auth');
  await page.getByLabel('Work email', { exact: true }).fill('sample@example.com');
  await page.getByLabel('Password', { exact: true }).fill('test-only-password');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('main h1')).toBeVisible();
});

test('keyboard and dark appearance remain usable', async ({ page }) => {
  await loggedOut(page);
  await page.goto('/auth');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to sign in' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#workspace-access')).toBeFocused();
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 720, height: 450 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
