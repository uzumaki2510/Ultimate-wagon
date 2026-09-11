import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { StageTiming } from './StageTiming';
import { WorkflowStageRecord } from '@/types';

const stage = (patch: Partial<WorkflowStageRecord> = {}): WorkflowStageRecord => ({ stageName: 'YARD_EXAM', status: 'Pending', targetDurationHours: 2, ...patch });
const render = (record?: WorkflowStageRecord) => renderToStaticMarkup(createElement(StageTiming, { stage: record }));
it('renders both saved dates as semantic timestamps', () => {
  const html = render(stage({ status: 'Done', startedAt: '2026-09-10T04:00:00Z', completedAt: '2026-09-10T05:30:00Z' }));
  expect(html).toContain('dateTime="2026-09-10T04:00:00Z"');
  expect(html).toContain('dateTime="2026-09-10T05:30:00Z"');
  expect(html).toContain('10 Sep 2026');
});
it('distinguishes pending work from missing historical dates', () => {
  expect(render()).toContain('Not started');
  expect(render()).toContain('Not completed');
  const done = render(stage({ status: 'Done' }));
  expect(done.match(/Not recorded/g)).toHaveLength(2);
  expect(done).not.toContain('<time');
});
it('never renders an invalid date or invents a completion time', () => {
  const html = render(stage({ status: 'In Progress', startedAt: 'invalid' }));
  expect(html).toContain('Not recorded');
  expect(html).toContain('Not completed');
  expect(html).not.toContain('<time');
  expect(html).not.toContain('Invalid Date');
});
