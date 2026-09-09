import { test, expect } from '@playwright/test';
import { mockWorkspace } from './ui-fixture';
import definitions from '../../shared/workflowDefinitions.json' with { type: 'json' };

test('assignment and blocker survive reload and feed My Work and blocked queues', async ({ page }) => {
  const fixture = await mockWorkspace(page);
  const wagon = fixture.wagons[0];
  await page.route('**/api/v1/wagons/*/assignment', async route => {
    const body = route.request().postDataJSON();
    Object.assign(wagon, { assignment: { assigneeId: body.assigneeId, assigneeName: fixture.user.name, blockedReason: body.blockedReason, handoffNote: body.handoffNote }, updatedAt: new Date().toISOString() });
    await route.fulfill({ json: { success: true, data: wagon } });
  });
  await page.goto('/wagon/' + wagon._id + '?tab=work');
  await page.getByRole('button', { name: 'Update assignment', exact: true }).click();
  await page.getByLabel('Responsible person').selectOption(fixture.user._id);
  await page.getByLabel('Blocker (clear when resolved)').fill('Waiting for brake pipe');
  await page.getByLabel('Handoff note').fill('Inspect replacement before fitting');
  await page.getByRole('button', { name: 'Save assignment', exact: true }).click();
  await expect(page.getByText('Blocked: Waiting for brake pipe')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Latest handoff: Inspect replacement before fitting')).toBeVisible();
  await page.goto('/workshop?view=my');
  await expect(page.getByTestId('wagon-card')).toHaveCount(1);
  await expect(page.getByTestId('wagon-card')).toContainText(wagon.wagonNo);
  await page.getByLabel('Work queue').selectOption('blocked');
  await expect(page.getByTestId('wagon-card')).toHaveCount(1);
  await page.screenshot({ path: 'docs/ui/upgraded-work-queue.png', fullPage: true, animations: 'disabled' });
});

test('evidence upload persists in quarantine and cannot be downloaded', async ({ page }) => {
  const { wagons, user } = await mockWorkspace(page); const wagon = wagons[0]; const documents: object[] = [];
  await page.route('**/api/v1/documents/wagon/**', async route => {
    if (route.request().method() === 'POST') {
      documents.push({ _id: 'document-one', wagonId: wagon._id, name: 'inspection.pdf', type: 'Inspection Report', fileType: 'application/pdf', size: 28, version: 1, uploadedAt: new Date().toISOString(), uploadedByName: user.name, scanStatus: 'quarantined' });
      return route.fulfill({ status: 201, json: { success: true, data: documents[0] } });
    }
    return route.fulfill({ json: { success: true, data: documents } });
  });
  await page.goto('/wagon/' + wagon._id + '?tab=documents');
  await page.getByLabel('Choose document file').setInputFiles({ name: 'inspection.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nfixture\n%%EOF') });
  await page.getByRole('button', { name: 'Upload evidence', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Document saved in quarantine' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'inspection.pdf', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download', exact: true })).toBeDisabled();
});

test('fitness shows saved blockers and rejects unavailable readiness checks', async ({ page }) => {
  const { wagons } = await mockWorkspace(page);
  await page.goto('/wagon/' + wagons[0]._id + '?tab=work');
  await expect(page.getByText('Not ready to certify', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm wagon fit' })).toBeDisabled();
  await page.route('**/api/v1/wagons/*/readiness', route => route.fulfill({ status: 503, json: { message: 'Unavailable' } }));
  await page.reload();
  await expect(page.getByText('Unable to check saved evidence.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm wagon fit' })).toBeDisabled();
});

test('reports keep certification separate from archived release and all export formats work', async ({ page }) => {
  const { wagons } = await mockWorkspace(page);
  Object.assign(wagons[0], { status: 'FIT_READY', certifiedAt: '2026-09-01T12:00:00Z' });
  const archived = { ...wagons[1], status: 'RELEASED', archived: true, releasedAt: '2026-09-02T12:00:00Z', certifiedAt: '2026-09-01T12:00:00Z' };
  await page.route('**/api/v1/wagons?**', async route => {
    const history = new URL(route.request().url()).searchParams.get('archived');
    return route.fulfill({ json: { success: true, data: history ? [archived] : wagons.filter(w => w._id !== archived._id), pagination: { hasNextPage: false } } });
  });
  await page.goto('/reports');
  await page.getByLabel('Report type').selectOption('released');
  await page.getByLabel('From date').fill('2026-09-02'); await page.getByLabel('To date').fill('2026-09-02');
  await expect(page.getByText('1 matching rows', { exact: false })).toBeVisible();
  await expect(page.getByRole('cell', { name: archived.wagonNo, exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: wagons[0].wagonNo, exact: true })).toHaveCount(0);
  for (const [name, extension] of [['CSV', 'csv'], ['Excel', 'xlsx'], ['PDF', 'pdf']]) {
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export ' + name, exact: true }).click();
    expect((await downloading).suggestedFilename()).toBe('RailFlow-released-report.' + extension);
  }
  await page.getByLabel('From date').fill('2026-09-03');
  await expect(page.getByRole('alert')).toContainText('start date must not be after');
  await expect(page.getByRole('button', { name: 'Export CSV', exact: true })).toBeDisabled();
});

test('final dashboard and board remain usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await mockWorkspace(page); await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Workshop overview' })).toBeVisible();
  await page.screenshot({ path: 'docs/ui/upgraded-dashboard-mobile.png', fullPage: true, animations: 'disabled' });
  await page.goto('/live-sick-line');
  await expect(page.getByRole('heading', { name: 'Live workshop board' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: 'docs/ui/upgraded-board-mobile.png', fullPage: true, animations: 'disabled' });
});

test('LPG forward exit remains actionable and previous return-cycle evidence is visible', async ({ page }) => {
  const { wagons } = await mockWorkspace(page); const wagon = wagons[0]; wagon.type = 'BTPGLN';
  const definition = definitions.BTPGLN_LOCAL_LPG_WORKFLOW;
  const workflow = { _id: 'lpg-workflow', wagonId: wagon._id, wagonNo: wagon.wagonNo, wagonType: wagon.type, currentStage: 'HAPA_YARD_EXAM', updatedAt: wagon.updatedAt,
    stages: Object.keys(definition.stages).map(stageName => ({ stageName, status: ['UPPER_GEAR_RECTIFICATION', 'ROH_POH_RECTIFICATION', 'YARD_EXAM_COMPLETED', 'FIT_FOR_LOADING'].includes(stageName) ? 'Pending' : stageName === 'HAPA_YARD_EXAM' ? 'In Progress' : 'Done', selectedNextStage: stageName === 'HAPA_DEPOT' ? 'UNDER_GEAR_RECTIFICATION' : stageName === 'PURGING' ? 'HAPA_YARD_EXAM' : undefined })),
    cycleHistory: [{ fromStage: 'PURGING', returnedTo: 'HAPA_DEPOT', reason: 'Return for additional inspection', actorName: 'Sample Admin', completedAt: '2026-09-01T12:00:00Z', stages: [{ stageName: 'PURGING', status: 'Done', inspectorName: 'Sample Admin', completedAt: '2026-09-01T12:00:00Z' }] }],
  };
  await page.route('**/api/v1/workflows', route => route.fulfill({ json: { success: true, data: [workflow] } }));
  await page.goto('/wagon/' + wagon._id + '?tab=work');
  await expect(page.getByRole('heading', { name: definition.stages.HAPA_YARD_EXAM.label, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Complete stage & continue', exact: true })).toBeVisible();
  await expect(page.getByText('Stages complete — fitness approval next')).toHaveCount(0);
  await page.getByText('Previous work cycles (1)', { exact: true }).click();
  await expect(page.getByText('Return for additional inspection', { exact: true })).toBeVisible();
});
