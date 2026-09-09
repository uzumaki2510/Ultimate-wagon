import { expect, it } from 'vitest';
import { BTPGLN_LOCAL_LPG_WORKFLOW as def, getResolvedWorkflowForWagon } from './wagonWorkflows';
import { buildReport, defaultReportFilters } from './reports';
import { Wagon, WorkflowItem } from '@/types';
const wagon = { id: 'lpg', wagonNo: '12345679999', type: 'BTPGLN', owner: 'Test', status: 'REPAIR_IN_PROGRESS' } as Wagon;
const workflow = (): WorkflowItem => ({
  id: 'workflow', wagonId: wagon.id, currentStage: 'HAPA_YARD_EXAM', updatedAt: '', wagonNo: wagon.wagonNo, wagonType: wagon.type,
  stages: Object.keys(def.stages).map(stageName => ({ stageName, targetDurationHours: 1, status: ['UPPER_GEAR_RECTIFICATION', 'ROH_POH_RECTIFICATION', 'YARD_EXAM_COMPLETED', 'FIT_FOR_LOADING'].includes(stageName) ? 'Pending' : stageName === 'HAPA_YARD_EXAM' ? 'In Progress' : 'Done' })),
});
it('LPG exit route does not loop into an already completed depot or report premature completion', () => {
  const work = workflow();
  work.stages.find(s => s.stageName === 'HAPA_DEPOT')!.selectedNextStage = 'UNDER_GEAR_RECTIFICATION';
  work.stages.find(s => s.stageName === 'PURGING')!.selectedNextStage = 'HAPA_YARD_EXAM';
  const resolved = getResolvedWorkflowForWagon(wagon, work)!;
  expect(resolved.resolvedPath).toContain('FIT_FOR_LOADING');
  expect(resolved.currentStageKey).toBe('HAPA_YARD_EXAM');
  expect(resolved.completedCount).toBeLessThan(resolved.totalCount);
});
it('legacy LPG records without explicit branch choice can reach the forward exit', () => {
  expect(getResolvedWorkflowForWagon(wagon, workflow())!.resolvedPath).toContain('FIT_FOR_LOADING');
});
it('completed prior cycles remain available in stage reports without losing current work', () => {
  const work = workflow();
  work.cycleHistory = [{ fromStage: 'PURGING', returnedTo: 'HAPA_DEPOT', reason: 'Return for inspection', actorName: 'Mira', completedAt: '2026-09-01', stages: [{ stageName: 'UNDER_GEAR_RECTIFICATION', targetDurationHours: 1, status: 'Done', completedAt: '2026-09-01', inspectorName: 'Mira' }] }];
  const result = buildReport([wagon], [work], { ...defaultReportFilters, kind: 'repair', from: '2026-09-01', to: '2026-09-01' });
  expect(result.rows).toHaveLength(1); expect(result.rows[0][6]).toBe('Mira');
});
