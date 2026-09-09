import { describe, expect, it } from 'vitest';
import { buildReport, defaultReportFilters } from './reports';
import { Wagon, WorkflowItem } from '@/types';
const base: Wagon = { id: 'one', wagonNo: '12345678901', type: 'BOXN', owner: 'Central', builtYear: 2020, status: 'FIT_READY', certifiedAt: '2026-09-01T12:00:00Z', updatedAt: '2026-09-10T12:00:00Z' };
const released: Wagon = { ...base, id: 'two', wagonNo: '12345678902', status: 'RELEASED', releasedAt: '2026-09-02T12:00:00Z', archived: true };
describe('one truthful report dataset', () => {
  it('separates certified, released and active workshop records', () => {
    expect(buildReport([base, released], [], { ...defaultReportFilters, kind: 'certified' }).rows).toHaveLength(2);
    expect(buildReport([base, released], [], { ...defaultReportFilters, kind: 'released' }).rows.map(r => r[0])).toEqual([released.wagonNo]);
    expect(buildReport([base, released], [], defaultReportFilters).rows.map(r => r[0])).toEqual([base.wagonNo]);
  });
  it('filters by release time, not last update, including archived releases', () => {
    const report = buildReport([released], [], { ...defaultReportFilters, kind: 'released', from: '2026-09-02', to: '2026-09-02' });
    expect(report.rows).toHaveLength(1); expect(report.rows[0][5]).toBe(released.releasedAt);
  });
  it('does not manufacture dates for legacy releases', () => {
    const record = { ...released, releasedAt: undefined };
    const all = buildReport([record], [], { ...defaultReportFilters, kind: 'released' });
    expect(all.rows[0][5]).toBe('Not recorded'); expect(all.missingDates).toBe(1);
    expect(buildReport([record], [], { ...defaultReportFilters, kind: 'released', from: '2026-01-01' }).rows).toHaveLength(0);
  });
  it('combines type, owner, status, staff and search filters', () => {
    const record = { ...base, assignment: { assigneeName: 'Mira' } };
    expect(buildReport([record, released], [], { ...defaultReportFilters, owner: 'Central', type: 'BOXN', status: 'FIT_READY', assignee: 'Mira', query: '78901' }).rows).toHaveLength(1);
    expect(buildReport([record], [], { ...defaultReportFilters, owner: 'Western' }).rows).toHaveLength(0);
  });
  it('reports only completed stages and keeps unknown duration honest', () => {
    const workflow = { wagonId: base.id, stages: [{ stageName: 'YARD_EXAM', status: 'Done', completedAt: base.certifiedAt, inspectorName: 'Mira' }, { stageName: 'MECHANICAL_INSPECTION', status: 'In Progress' }] } as WorkflowItem;
    const report = buildReport([base], [workflow], { ...defaultReportFilters, kind: 'inspection', assignee: 'Mira' });
    expect(report.rows).toHaveLength(1); expect(report.rows[0][5]).toBe('Not recorded');
  });
  it('rejects invalid or reversed date ranges', () => {
    expect(buildReport([], [], { ...defaultReportFilters, from: '2026-10-01', to: '2026-09-01' }).error).toBeTruthy();
    expect(buildReport([], [], { ...defaultReportFilters, from: 'bad' }).error).toBeTruthy();
  });
});
