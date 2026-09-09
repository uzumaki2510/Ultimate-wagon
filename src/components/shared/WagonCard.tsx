import { Link } from 'react-router-dom';
import { Wagon, WorkflowItem } from '@/types';
import { readableStage } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { wagonWork } from '@/lib/workspaceModel';
import { ArrowUpRight } from 'lucide-react';

export function StatusPill({ status }: { status: string }) {
  const colour = ['FIT_READY', 'RELEASED', 'Done'].includes(status) ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200' : /REPAIR|SICK|Paused|Delayed/.test(status) ? 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
  const names: Record<string, string> = { FIT_READY: 'Fit ready', FIT_CERTIFICATE_PENDING: 'Awaiting fitness', REPAIR_IN_PROGRESS: 'In repair', SICK_LINE: 'Sick line', INSPECTION_PENDING: 'Awaiting inspection' };
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${colour}`}>{names[status] || readableStage(status)}</span>;
}
export function WagonCard({ wagon, workflow }: { wagon: Wagon; workflow?: WorkflowItem }) {
  const work = wagonWork(wagon, workflow);
  return <article className="rounded-xl border bg-card p-4 space-y-3" data-testid="wagon-card">
    <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="text-base font-bold tabular-nums">{wagon.wagonNo}</h3><p className="text-xs text-muted-foreground mt-1 break-words">{wagon.type} · {wagon.owner || 'Railway not recorded'}</p></div><StatusPill status={wagon.status} /></div>
    <p className="text-sm text-muted-foreground">Stage: <span className="text-foreground">{work.label}</span></p>
    <p className="text-sm">{wagon.assignment?.assigneeName || 'Unassigned'}{work.overdue && <span className="ml-2 text-destructive">Overdue</span>}</p>
    {work.blocked && <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-900 break-words">{wagon.assignment?.blockedReason || 'Stage paused — review work notes'}</p>}
    {wagon.defect && <p className="text-sm line-clamp-2">{wagon.defect}</p>}
    <Button asChild className="w-full"><Link to={`/wagon/${wagon.id}?tab=work`}>Open wagon <ArrowUpRight className="ml-auto h-4 w-4" /></Link></Button>
  </article>;
}
