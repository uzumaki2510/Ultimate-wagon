import { WagonRepair } from '@/lib/wagonData';
import { Wagon } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { getResolvedWorkflowForWagon, normalizeStageKey, formatWorkflowTimestamp } from '@/lib/wagonWorkflows';

export function DefectTimeline({ wagon }: { wagon: Wagon | WagonRepair }) {
  const workflow = useAppStore(state => state.workflows.find(item => item.wagonId === wagon.id));
  const resolved = getResolvedWorkflowForWagon(wagon, workflow);
  if (!workflow || !resolved) return <p className="text-sm text-muted-foreground">No saved stage history. Open Workflow to begin.</p>;
  return <ol className="space-y-3" aria-label="Saved workflow timeline">{resolved.resolvedPath.map(key => {
    const stage = workflow.stages.find(item => normalizeStageKey(resolved.definition, item.stageName) === key);
    return <li key={key} className="border-l-2 border-primary/30 pl-3 py-1"><div className="flex flex-wrap justify-between gap-1"><span className="text-sm font-medium">{resolved.definition.stages[key].label}</span><span className="text-xs text-muted-foreground">{stage?.status || 'Pending'}</span></div>{stage?.completedAt && <p className="text-xs text-muted-foreground mt-1">{formatWorkflowTimestamp(stage.completedAt)} · {stage.inspectorName || stage.staffName || 'Staff not recorded'}</p>}</li>;
  })}{resolved.branchState === 'UNRESOLVED' && <li className="text-xs text-muted-foreground">The remaining route will appear after the process branch is selected.</li>}</ol>;
}
