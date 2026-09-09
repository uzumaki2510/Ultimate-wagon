import { describe, it, expect } from 'vitest';
import { conditionTasks, conditionCounts, workflowLocked } from './condition';

describe('evidence-based repair summaries', () => {
  it('never invents one defect for an empty record', () => {
    expect(conditionCounts(conditionTasks({ id: 'a' }))).toEqual({ total: 0, repaired: 0, pending: 0, critical: 0 });
  });
  it('counts task completion, not wagon fitness', () => {
    const tasks = conditionTasks({ id: 'a', repairTasks: [{ id: 'one', category: 'Brake', subRepair: 'Leak', severity: 'Safety Critical', status: 'pending' }, { id: 'two', category: 'Brake', subRepair: 'Pipe', severity: 'Normal', status: 'repaired' }] });
    expect(conditionCounts(tasks)).toEqual({ total: 2, repaired: 1, pending: 1, critical: 1 });
    expect(workflowLocked('FIT_READY')).toBe(true);
    expect(workflowLocked('FIT_CERTIFICATE_PENDING')).toBe(false);
  });
  it('preserves missing legacy tasks without duplicating recorded repairs', () => {
    const source = { id: 'a', repairTypes: ['Pipe', 'Valve'], repairTasks: [{ id: 'one', category: 'Tank', subRepair: 'Pipe', severity: 'Normal' as const, status: 'repaired' as const }] };
    expect(conditionTasks(source).map(task => task.subRepair)).toEqual(['Pipe', 'Valve']);
    expect(conditionTasks(source)).toEqual(conditionTasks(source));
    expect(conditionCounts(conditionTasks(source)).pending).toBe(1);
  });
});
