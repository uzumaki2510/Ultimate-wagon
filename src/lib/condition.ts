import { DEFECT_LIBRARY } from '@/lib/wagonData';
import { RepairTask } from '@/types';

type RepairSource = { id: string; repairTasks?: RepairTask[]; repairTypes?: string[]; primaryRepair?: string; secondaryRepairs?: string[] };

// Keep legacy repairs visible, with deterministic IDs until their first save.
export function conditionTasks(wagon: RepairSource): RepairTask[] {
  const tasks = (wagon.repairTasks || []).map((task, index) => ({ ...task, id: task.id || `repair-${wagon.id}-${index}` }));
  const names = wagon.repairTypes?.length ? wagon.repairTypes : [wagon.primaryRepair, ...(wagon.secondaryRepairs || [])];
  for (const [index, name] of names.entries()) {
    if (!name || tasks.some(task => task.subRepair === name)) continue;
    const definition = DEFECT_LIBRARY.flatMap(group => group.defects).find(defect => defect.name === name);
    tasks.push({ id: `legacy-${wagon.id}-${index}`, category: 'Recorded repair', subRepair: name, severity: definition?.severity || 'Normal', status: 'pending' });
  }
  return tasks;
}

export function conditionCounts(tasks: RepairTask[]) {
  const repaired = tasks.filter(task => task.status === 'repaired').length;
  return { total: tasks.length, repaired, pending: tasks.length - repaired, critical: tasks.filter(task => task.severity === 'Safety Critical' && task.status !== 'repaired').length };
}

export function workflowLocked(status: string) {
  return ['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(status);
}
