import { WagonRepair } from '@/lib/wagonData';
import { Wagon } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { getResolvedWorkflowForWagon, normalizeStageKey } from '@/lib/wagonWorkflows';
import { StageTiming } from '@/components/StageTiming';

export function DefectTimeline({ wagon }: { wagon: Wagon | WagonRepair }) {
  const workflow = useAppStore(state => state.workflows.find(item => item.wagonId === wagon.id));
  const resolved = getResolvedWorkflowForWagon(wagon, workflow);
  if (!workflow || !resolved) return <p className="text-sm text-muted-foreground">No saved stage history. Open Workflow to begin.</p>;
  const olderRecords = workflow.stages.filter(item => {
    const key = normalizeStageKey(resolved.definition, item.stageName);
    return !resolved.definition.stages[item.stageName] || (key && workflow.stages.filter(other => normalizeStageKey(resolved.definition, other.stageName) === key).length > 1);
  });
  return <div className="space-y-3"><p className="text-xs text-muted-foreground">Saved dates and times · your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})</p><ol className="divide-y" aria-label="Saved workflow timeline">{resolved.resolvedPath.map((key, index) => {
    const matches = workflow.stages.filter(item => normalizeStageKey(resolved.definition, item.stageName) === key);
    const stage = matches.length === 1 ? matches[0] : undefined;
    const active = key === resolved.currentStageKey && stage?.status !== 'Done';
    return <li key={key} className="py-3 space-y-2"><div className="flex items-start justify-between gap-3"><span className="text-sm font-medium"><span className="text-muted-foreground mr-2">{index + 1}.</span>{resolved.definition.stages[key].label}</span><span className={`shrink-0 text-xs rounded-full px-2 py-1 ${stage?.status === 'Done' ? 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200' : active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{matches.length > 1 ? 'Review needed' : stage?.status === 'Done' ? 'Completed' : stage?.status || 'Pending'}</span></div>{matches.length > 1 ? <p className="text-sm text-amber-800 dark:text-amber-200">Multiple saved records. Review the older records below before making changes.</p> : <StageTiming stage={stage} />}{stage && (stage.inspectorName || stage.staffName) && <p className="text-xs text-muted-foreground">By {stage.inspectorName || stage.staffName}</p>}</li>;
  })}{resolved.branchState === 'UNRESOLVED' && <li className="py-3 text-sm text-muted-foreground">Choose a route at the current step to see the remaining stages.</li>}</ol>
    {!!olderRecords.length && <details className="rounded-lg border p-3"><summary className="cursor-pointer text-sm font-medium">Older stage records ({olderRecords.length})</summary><ul className="divide-y mt-2">{olderRecords.map((stage, index) => <li key={index} className="py-3 space-y-2"><p className="text-sm font-medium break-words">{stage.stageName} · {stage.status}</p><StageTiming stage={stage} /></li>)}</ul></details>}
  </div>;
}
