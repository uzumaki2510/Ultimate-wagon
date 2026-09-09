import { Wagon, WorkflowItem } from '@/types';
import { getResolvedWorkflowForWagon, normalizeStageKey } from './wagonWorkflows';
import { lineForStage } from './navigation';
export function wagonWork(wagon: Wagon, workflow?: WorkflowItem, now = Date.now()) {
  const resolved = getResolvedWorkflowForWagon(wagon, workflow);
  const key = resolved?.currentStageKey || '';
  const stage = workflow?.stages.find(item => resolved && normalizeStageKey(resolved.definition, item.stageName) === key);
  const released = ['RELEASED', 'IN_SERVICE'].includes(wagon.status);
  return { wagon, workflow, stage, resolved, released,
    line: ['FIT_READY', 'FIT_CERTIFICATE_PENDING'].includes(wagon.status) ? 'fit' : lineForStage(key),
    label: resolved?.definition.stages[key]?.label || 'Workflow not started',
    blocked: !!wagon.assignment?.blockedReason || ['Paused', 'Delayed'].includes(stage?.status || ''),
    unassigned: !wagon.assignment?.assigneeId,
    overdue: !released && !!wagon.assignment?.dueAt && new Date(wagon.assignment.dueAt).getTime() < now,
  };
}
