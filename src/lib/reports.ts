import { Wagon, WorkflowItem } from '@/types';
import { lineForStage, readableStage } from './navigation';
export interface ReportFilters { kind: string; query: string; type: string; owner: string; status: string; assignee: string; from: string; to: string }
export const defaultReportFilters: ReportFilters = { kind: 'workshop', query: '', type: '', owner: '', status: '', assignee: '', from: '', to: '' };
export function buildReport(wagons: Wagon[], workflows: WorkflowItem[], filters: ReportFilters) {
  const from = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : -Infinity;
  const to = filters.to ? new Date(`${filters.to}T23:59:59.999`).getTime() : Infinity;
  if (from > to) return { headers: [], rows: [], error: 'The start date must not be after the end date.', missingDates: 0 };
  if (Number.isNaN(from) || Number.isNaN(to)) return { headers: [], rows: [], error: 'Choose valid report dates.', missingDates: 0 };
  const workflowIndex = new Map(workflows.map(w => [w.wagonId, w]));
  const stageReport = ['steam', 'degassing', 'inspection', 'repair', 'testing'].includes(filters.kind);
  const headers = stageReport ? ['Wagon', 'Type', 'Stage', 'Started', 'Completed', 'Hours', 'Staff'] : ['Wagon', 'Type', 'Railway', 'Status', 'Responsible person', filters.kind === 'released' ? 'Released at' : filters.kind === 'certified' ? 'Certified at' : 'Last updated'];
  let missingDates = 0;
  const rows: (string | number)[][] = [];
  const inRange = (value?: string) => {
    if (!value || !Number.isFinite(new Date(value).getTime())) { missingDates++; return !filters.from && !filters.to; }
    return new Date(value).getTime() >= from && new Date(value).getTime() <= to;
  };
  for (const wagon of wagons) {
    if (wagon.deletedAt || filters.type && wagon.type !== filters.type || filters.owner && wagon.owner !== filters.owner || filters.status && wagon.status !== filters.status) continue;
    if (stageReport) {
      const workflow = workflowIndex.get(wagon.id);
      for (const stage of [...(workflow?.cycleHistory || []).flatMap(cycle => cycle.stages), ...(workflow?.stages || [])]) {
        if (stage.status !== 'Done' || lineForStage(stage.stageName) !== filters.kind || filters.assignee && ![stage.staffName, stage.inspectorName].includes(filters.assignee)) continue;
        if (!inRange(stage.completedAt)) continue;
        rows.push([wagon.wagonNo, wagon.type, readableStage(stage.stageName), stage.startedAt || 'Not recorded', stage.completedAt || 'Not recorded', Number.isFinite(stage.durationHours) ? Math.round(stage.durationHours! * 100) / 100 : 'Not recorded', stage.staffName || stage.inspectorName || 'Not recorded']);
      }
    } else {
      if (filters.kind === 'workshop' && (wagon.archived || ['RELEASED', 'IN_SERVICE'].includes(wagon.status))) continue;
      if (filters.assignee && wagon.assignment?.assigneeName !== filters.assignee) continue;
      if (filters.kind === 'released' && !['RELEASED', 'IN_SERVICE'].includes(wagon.status)) continue;
      if (filters.kind === 'certified' && !['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(wagon.status)) continue;
      const date = filters.kind === 'released' ? wagon.releasedAt : filters.kind === 'certified' ? wagon.certifiedAt : wagon.updatedAt;
      if (!inRange(date)) continue;
      rows.push([wagon.wagonNo, wagon.type, wagon.owner, readableStage(wagon.status), wagon.assignment?.assigneeName || 'Unassigned', date || 'Not recorded']);
    }
  }
  return { headers, rows: rows.filter(row => row.join(' ').toLowerCase().includes(filters.query.trim().toLowerCase())), missingDates, error: '' };
}
