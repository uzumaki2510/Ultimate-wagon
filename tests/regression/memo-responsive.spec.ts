import { test, expect } from '@playwright/test';
import { mockWorkspace } from './ui-fixture';

test('memo search and actions fit tablet widths with wider fallback fonts', async ({ page }) => {
  await mockWorkspace(page);
  for (const width of [360, 640, 767, 768, 800, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/memos');
    await expect(page.getByRole('heading', { name: 'Unit Memos' })).toBeVisible();
    // Linux and macOS have different fallback font metrics. Stress the layout
    // without weakening the overflow assertion or hiding excess content.
    await page.addStyleTag({ content: 'body, h1 { font-family: monospace !important; }' });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), { message: `Memos at ${width}px` }).toBe(true);
    const search = page.getByRole('textbox', { name: 'Search memo, rake, wagon no…' });
    for (const control of [search, page.getByRole('link', { name: 'Sick Memo', exact: true }), page.getByRole('link', { name: 'Fit Memo', exact: true })]) {
      const bounds = await control.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1);
    }
    await search.fill('not-a-memo');
    await expect(page.getByText('No Memos Found', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Clear search', exact: true }).click();
    await expect(search).toHaveValue('');
    await expect(page.getByText('YM-014', { exact: true })).toBeVisible();
  }
  await page.getByRole('link', { name: 'Fit Memo', exact: true }).click();
  await expect(page).toHaveURL(/\/memos\/new\?type=fit$/);
});
