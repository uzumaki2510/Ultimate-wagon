import { WorkflowStageRecord } from '@/types';
import { formatWorkflowTimestamp } from '@/lib/wagonWorkflows';

/** Display saved timestamps only; status is never used to invent a date. */
export function StageTiming({ stage }: { stage?: WorkflowStageRecord }) {
  return <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
    {([
      ['Started', stage?.startedAt, !stage || stage.status === 'Pending' ? 'Not started' : 'Not recorded'],
      ['Completed', stage?.completedAt, stage?.status === 'Done' ? 'Not recorded' : 'Not completed'],
    ] as const).map(([label, value, empty]) => {
      const formatted = value ? formatWorkflowTimestamp(value) : '';
      return <div key={label} className="min-w-0"><dt className="text-muted-foreground">{label}</dt><dd className="mt-0.5 break-words tabular-nums">{formatted ? <time dateTime={value}>{formatted}</time> : value ? 'Not recorded' : empty}</dd></div>;
    })}
  </dl>;
}
