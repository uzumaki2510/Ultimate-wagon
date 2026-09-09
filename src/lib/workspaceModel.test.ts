import { expect, it } from 'vitest';
import { wagonWork } from './workspaceModel';
import { Wagon, WorkflowItem } from '@/types';
const wagon: Wagon = { id: 'one', wagonNo: '12345678901', type: 'BOXN', owner: 'Central', builtYear: 2020, status: 'SICK_LINE' };
it('classifies pending certification and fit-ready wagons consistently', () => {
  expect(wagonWork({ ...wagon, status: 'FIT_READY' }).line).toBe('fit');
  expect(wagonWork({ ...wagon, status: 'FIT_CERTIFICATE_PENDING' }).line).toBe('fit');
});
it('identifies blockers, assignment and overdue work from saved fields', () => {
  const work = wagonWork({ ...wagon, assignment: { assigneeId: 'staff', blockedReason: 'Parts', dueAt: '2026-09-01' } }, undefined, Date.parse('2026-09-10'));
  expect([work.blocked, work.unassigned, work.overdue]).toEqual([true, false, true]);
  expect(wagonWork({ ...wagon, status: 'RELEASED', assignment: { dueAt: '2026-09-01' } }).overdue).toBe(false);
});
it('uses canonical stage labels and detects paused work', () => {
  const workflow = { wagonId: wagon.id, currentStage: 'YARD_EXAM', stages: [{ stageName: 'YARD_EXAM', status: 'Paused' }] } as WorkflowItem;
  const work = wagonWork(wagon, workflow);
  expect(work.line).toBe('inspection'); expect(work.blocked).toBe(true); expect(work.label).not.toBe('YARD_EXAM');
});
