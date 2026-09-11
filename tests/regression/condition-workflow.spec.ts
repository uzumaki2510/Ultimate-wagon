import { test, expect, Page } from '@playwright/test';
import definitions from '../../shared/workflowDefinitions.json' with { type: 'json' };
import { mockWorkspace } from './ui-fixture';

async function setup(page: Page, options: { fit?: boolean; missing?: boolean; failAdvance?: boolean; failRepair?: boolean; tank?: boolean; branch?: boolean } = {}) {
  await mockWorkspace(page);
  const wagon = { _id: '000000000000000000000002', wagonNo: '40059961419', type: options.tank ? 'BTPN' : 'BOXN', owner: 'Northeast Frontier Railway', builtYear: 2020, status: options.fit ? 'FIT_READY' : 'SICK_LINE', repairTasks: [{ id: 'task-one', category: 'Brake', subRepair: 'Brake pipe leakage', severity: 'Safety Critical', status: 'pending', inspector: 'Test inspector' }], inspectionChecklist: {}, updatedAt: '2026-09-10T00:00:00.000Z' };
  const definition = options.tank ? definitions.BTPN_LOCAL_TANK_WORKFLOW : definitions.GENERAL_FREIGHT_WORKFLOW;
  let workflow = { _id: '000000000000000000000100', wagonId: wagon._id, wagonNo: wagon.wagonNo, wagonType: wagon.type, currentStage: definition.initialStage, stages: Object.values(definition.stages).map(stage => ({ stageName: stage.key, status: 'Pending', targetDurationHours: stage.targetDurationHours || 0 })), actionHistory: [], updatedAt: wagon.updatedAt };
  if (options.branch) {
    let key = definition.initialStage;
    while (definition.stages[key].nextStages.length === 1) {
      workflow.stages.find(stage => stage.stageName === key)!.status = 'Done';
      key = definition.stages[key].nextStages[0];
    }
    workflow.currentStage = key;
    workflow.stages.find(stage => stage.stageName === key)!.status = 'In Progress';
  }
  let exists = !options.missing;
  let failed = false;
  let doneWrites = 0;
  let creates = 0;
  let wagonWrites = 0;
  await page.route('**/api/v1/wagons**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/readiness')) return route.fulfill({ json: { success: true, data: { blockers: ['Complete saved workflow'], integrity: { problems: [], canNormalize: false }, documents: [] } } });
    if (route.request().method() === 'PUT') {
      wagonWrites++;
      if (options.failRepair) return route.fulfill({ status: 500, json: { message: 'Save failed for test' } });
      Object.assign(wagon, route.request().postDataJSON(), { updatedAt: new Date().toISOString() });
    }
    return route.fulfill({ json: { success: true, data: path.endsWith('/wagons') ? [wagon] : wagon, pagination: { hasNextPage: false } } });
  });
  await page.route('**/api/v1/workflows**', async route => {
    const method = route.request().method();
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/assignees')) return route.fulfill({ json: { success: true, data: [] } });
    if (method === 'POST' && path.endsWith('/transition')) {
      const body = route.request().postDataJSON();
      if (options.failAdvance && !failed && body.action === 'complete') {
        failed = true; return route.fulfill({ status: 503, json: { message: 'Stage save temporarily unavailable' } });
      }
      const stage = workflow.stages.find(item => item.stageName === body.stageName)!;
      if (body.action === 'start') stage.startedAt = '2026-09-10T04:00:00.000Z';
      stage.status = body.action === 'complete' ? 'Done' : body.action === 'pause' ? 'Paused' : 'In Progress';
      if (body.action === 'complete') { doneWrites++; stage.completedAt = '2026-09-10T05:30:00.000Z'; }
      if (body.nextStage) {
        workflow.currentStage = body.nextStage;
        workflow.stages.find(item => item.stageName === body.nextStage)!.status = 'In Progress';
        workflow.stages.find(item => item.stageName === body.nextStage)!.startedAt = '2026-09-10T05:30:00.000Z';
      }
      workflow.updatedAt = new Date().toISOString(); wagon.status = 'REPAIR_IN_PROGRESS'; wagon.updatedAt = workflow.updatedAt;
      return route.fulfill({ json: { success: true, data: { workflow, wagon } } });
    }
    if (method === 'POST') { exists = true; creates++; }
    if (method === 'PUT') {
      const patch = route.request().postDataJSON();
      if (options.failAdvance && !failed && patch.currentStage !== definition.initialStage) {
        failed = true; return route.fulfill({ status: 503, json: { message: 'Next stage temporarily unavailable' } });
      }
      if (patch.stages[0].status === 'Done' && workflow.stages[0].status !== 'Done') doneWrites++;
      workflow = { ...workflow, ...patch, updatedAt: new Date().toISOString() };
      wagon.status = 'REPAIR_IN_PROGRESS';
    }
    return route.fulfill({ json: { success: true, data: method === 'GET' ? exists ? [workflow] : [] : workflow } });
  });
  return { wagon, counts: () => ({ doneWrites, creates, wagonWrites }), workflow: () => workflow };
}

test('simplified workflow saves and displays both timestamps after reload', async ({ page }) => {
  const fixture = await setup(page);
  await page.goto('/wagon/000000000000000000000002?tab=work');
  await expect(page.getByRole('button', { name: 'Update assignment', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Confirm wagon fit', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Start stage', exact: true }).click();
  await expect(page.locator('time[datetime="2026-09-10T04:00:00.000Z"]').first()).toBeVisible();
  await page.getByLabel('Work notes', { exact: true }).fill('Inspection recorded');
  await page.getByRole('button', { name: 'Complete stage & continue', exact: true }).click();
  await page.reload();
  const first = page.getByRole('list', { name: 'Saved workflow timeline' }).getByRole('listitem').first();
  await expect(first).toContainText('Completed');
  await expect(first.locator('time')).toHaveCount(2);
  await expect(first.locator('time').first()).toHaveAttribute('datetime', '2026-09-10T04:00:00.000Z');
  await expect(first.locator('time').last()).toHaveAttribute('datetime', '2026-09-10T05:30:00.000Z');
  expect(fixture.counts().doneWrites).toBe(1);
});

for (const width of [390, 1440]) {
  test(`simplified wagon dialog fits ${width}px and exposes saved times`, async ({ page }) => {
    const fixture = await setup(page, { tank: true });
    const workflow = fixture.workflow();
    workflow.stages[0].status = 'Done';
    workflow.stages[0].startedAt = '2026-09-10T04:00:00.000Z';
    workflow.stages[0].completedAt = '2026-09-10T04:30:00.000Z';
    workflow.currentStage = definitions.BTPN_LOCAL_TANK_WORKFLOW.stages[workflow.currentStage].nextStages[0];
    const current = workflow.stages.find(stage => stage.stageName === workflow.currentStage)!;
    current.status = 'In Progress'; current.startedAt = '2026-09-10T04:30:00.000Z';
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/register');
    await page.getByRole('button', { name: '40059961419', exact: true }).click();
    const panel = page.getByRole('dialog', { name: '40059961419' });
    await panel.getByRole('tab', { name: 'Workflow', exact: true }).click();
    await page.setViewportSize({ width, height: 950 });
    await expect(panel.getByRole('button', { name: 'Complete stage & continue', exact: true })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Confirm wagon fit' })).toBeHidden();
    await expect(panel.locator('time').first()).toBeVisible();
    expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.screenshot({ path: `/tmp/railflow-simple-workflow-${width}.png` });
  });
}

test('inconsistent FIT record keeps a concise warning without offering release', async ({ page }) => {
  const fixture = await setup(page, { fit: true, tank: true });
  await page.goto('/wagon/000000000000000000000002?tab=work');
  await expect(page.getByRole('alert')).toContainText('records need review');
  await expect(page.getByRole('button', { name: 'Reopen for correction' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Release wagon', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start stage', exact: true })).toHaveCount(0);
  await expect(page.getByText('Not ready to certify', { exact: true })).toBeHidden();
  await page.locator('summary').filter({ hasText: 'Certification & record checks' }).click();
  await expect(page.getByText('Not ready to certify', { exact: true })).toBeVisible();
  expect(fixture.counts().wagonWrites).toBe(0);
});

test('condition panel uses repair evidence and warns about inconsistent fit records', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const fixture = await setup(page, { fit: true, tank: true });
  await page.goto('/register');
  await page.getByRole('button', { name: 'Open condition for 40059961419' }).click();
  const panel = page.getByRole('dialog', { name: '40059961419' });
  await expect(panel.getByRole('alert')).toContainText('Records need review');
  await expect(panel.getByText('SSE Mechanical')).toHaveCount(0);
  await expect(panel.getByText('1419-M')).toHaveCount(0);
  await page.screenshot({ path: 'docs/ui/condition-desktop.png' });
  await panel.getByRole('tab', { name: 'Repairs (1)' }).click();
  await expect(panel.getByText('0 repaired · 1 open.', { exact: false })).toBeVisible();
  await expect(panel.getByRole('button', { name: /Update repair/ })).toHaveCount(0);
  await panel.getByRole('tab', { name: 'Workflow', exact: true }).click();
  await expect(panel.getByText('FIT status — records need review')).toBeVisible();
  expect(fixture.counts().wagonWrites).toBe(0);
});

test('failed atomic completion keeps the stage unchanged and retry advances once', async ({ page }) => {
  const fixture = await setup(page, { failAdvance: true });
  await page.goto('/wagon/000000000000000000000002?tab=work');
  await page.getByRole('button', { name: 'Start stage', exact: true }).click();
  await page.getByLabel('Work notes', { exact: true }).fill('Inspection completed');
  await page.getByRole('button', { name: 'Complete stage & continue', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Stage save temporarily unavailable');
  expect(fixture.workflow().stages[0].status).toBe('In Progress');
  expect(fixture.counts().doneWrites).toBe(0);
  await page.reload();
  await page.getByRole('button', { name: 'Complete stage & continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sick Marking & Defect Classification', exact: true })).toBeVisible();
  expect(fixture.counts().doneWrites).toBe(1);
  expect(fixture.workflow().currentStage).toBe('SICK_MARKING');
});

test('missing workflow does not crash or create records merely by viewing the passport', async ({ page }) => {
  const fixture = await setup(page, { missing: true });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/wagon/000000000000000000000002');
  await expect(page.getByRole('heading', { name: '40059961419' })).toBeVisible();
  await page.getByRole('tab', { name: 'Work', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Create workflow', exact: true })).toBeVisible();
  expect(fixture.counts().creates).toBe(0);
  await page.getByRole('button', { name: 'Create workflow', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start stage', exact: true })).toBeVisible();
  expect(fixture.counts().creates).toBe(1);
  expect(errors).toEqual([]);
});

test('repair updates persist across reload and same-name tasks are not overwritten', async ({ page }) => {
  const fixture = await setup(page);
  fixture.wagon.repairTasks.push({ ...fixture.wagon.repairTasks[0], id: 'task-two' });
  await page.goto('/wagon/000000000000000000000002?tab=defects');
  await page.getByRole('button', { name: 'Update repair: Brake pipe leakage' }).first().click();
  await page.getByLabel('Status', { exact: true }).click();
  await page.getByRole('option', { name: 'Repaired', exact: true }).click();
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('1 repaired · 1 open.', { exact: false })).toBeVisible();
  expect(fixture.wagon.repairTasks.map(task => task.status)).toEqual(['repaired', 'pending']);
});

test('failed repair saves retain the editor and unchanged record', async ({ page }) => {
  const fixture = await setup(page, { failRepair: true });
  await page.goto('/wagon/000000000000000000000002?tab=defects');
  await page.getByRole('button', { name: 'Update repair: Brake pipe leakage' }).click();
  await page.getByLabel('Repair description').fill('Changed description');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
  expect(fixture.wagon.repairTasks[0].subRepair).toBe('Brake pipe leakage');
});

for (const width of [360, 390, 768, 1440]) {
  test(`workflow submenus remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await setup(page, { tank: true });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/wagon/000000000000000000000002?tab=work');
    if (width < 768) await expect(page.getByRole('tab')).toHaveCount(0);
    for (const tab of ['Overview', 'Work', 'Defect Centre', 'Audit Timeline', 'Maintenance', 'Documents & Gallery']) {
      if (width < 768) await page.getByLabel('Wagon section').selectOption({ 'Overview': 'overview', 'Work': 'work', 'Defect Centre': 'defects', 'Audit Timeline': 'timeline', 'Maintenance': 'maintenance', 'Documents & Gallery': 'documents' }[tab]);
      else await page.getByRole('tab', { name: tab, exact: true }).click();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), { message: tab }).toBe(true);
    }
    if (width < 768) await page.getByLabel('Wagon section').selectOption('work');
    else await page.getByRole('tab', { name: 'Work', exact: true }).click();
    if (width === 390 || width === 1440) await page.screenshot({ path: `docs/ui/workflow-${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

test('tank workflow requires a branch choice and starts only the selected route', async ({ page }) => {
  const fixture = await setup(page, { tank: true, branch: true });
  const definition = definitions.BTPN_LOCAL_TANK_WORKFLOW;
  const branchStage = definition.stages[fixture.workflow().currentStage];
  await page.goto('/wagon/000000000000000000000002?tab=work');
  await page.getByRole('button', { name: 'Complete stage & continue', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Choose the next route');
  const next = branchStage.nextStages[0];
  await page.getByRole('radio', { name: definition.stages[next].label, exact: true }).check();
  await page.getByRole('button', { name: 'Complete stage & continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: definition.stages[next].label, exact: true })).toBeVisible();
  expect(fixture.workflow().stages.filter(stage => stage.status === 'In Progress').map(stage => stage.stageName)).toEqual([next]);
});

test('condition sheet remains usable on a narrow screen and preserves search focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await setup(page, { tank: true });
  await page.goto('/register');
  await page.getByRole('button', { name: 'Open condition for 40059961419' }).click();
  await page.setViewportSize({ width: 360, height: 800 });
  const panel = page.getByRole('dialog', { name: '40059961419' });
  await panel.getByRole('tab', { name: 'Repairs (1)' }).click();
  const search = panel.getByLabel('Search repairs');
  await search.pressSequentially('Brake');
  await expect(search).toHaveValue('Brake');
  await expect(search).toBeFocused();
  await expect(panel.getByRole('button', { name: 'Update repair: Brake pipe leakage' })).toBeVisible();
  expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await panel.getByRole('button', { name: 'Continue workflow' }).click();
  await expect(panel.getByRole('button', { name: 'Start stage', exact: true })).toBeVisible();
  expect(await panel.evaluate(el => Math.round(el.getBoundingClientRect().height))).toBe(800);
  await page.screenshot({ path: 'docs/ui/condition-mobile.png' });
});
