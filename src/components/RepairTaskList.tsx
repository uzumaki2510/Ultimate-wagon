import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Wagon, RepairTask } from '@/types';
import { conditionTasks, conditionCounts, workflowLocked } from '@/lib/condition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EditConditionDialog } from '@/components/EditConditionDialog';

export function RepairTaskList({ wagon }: { wagon: Wagon }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState<RepairTask | null>(null);
  const [version, setVersion] = useState<string | undefined>();
  const [adding, setAdding] = useState(false);
  const tasks = conditionTasks(wagon);
  const counts = conditionCounts(tasks);
  const locked = workflowLocked(wagon.status);
  const shown = tasks.filter(task => `${task.subRepair} ${task.location || ''}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'all' || (filter === 'open' ? task.status !== 'repaired' : task.status === 'repaired')));
  const save = async (task: RepairTask) => {
    const current = useAppStore.getState().wagons.find(record => record.id === wagon.id);
    if (!current) throw new Error('Wagon no longer available. Refresh the register.');
    if (current.updatedAt !== version) throw new Error('This wagon changed while you were editing. Close and reopen the repair to review the latest record.');
    const previous = conditionTasks(current);
    const next = adding ? [...previous, task] : previous.map(item => item.id === task.id ? task : item);
    await useAppStore.getState().updateWagon(wagon.id, { repairTasks: next, repairTypes: Array.from(new Set(next.map(item => item.subRepair))) });
  };
  return <section className="space-y-4" aria-label="Repair records">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Defects & repairs</h3><p className="text-sm text-muted-foreground">{counts.repaired} repaired · {counts.pending} open. Repair completion does not certify fitness.</p></div>
      {!locked && <Button variant="outline" onClick={() => { setVersion(wagon.updatedAt); setAdding(true); setEditing({ id: crypto.randomUUID(), category: 'Recorded repair', subRepair: '', severity: 'Normal', status: 'pending' }); }}>Add repair</Button>}
    </div>
    {locked && <p className="rounded-lg border p-3 text-sm">Read-only: this wagon is certified or released. An administrator must reopen it before repairs can change.</p>}
    <div className="flex flex-col sm:flex-row gap-2"><Input aria-label="Search repairs" placeholder="Search repairs or location" value={query} onChange={e => setQuery(e.target.value)} /><select aria-label="Repair status filter" className="rounded-md border bg-background px-3 py-2 text-sm" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All repairs</option><option value="open">Open repairs</option><option value="repaired">Repaired</option></select></div>
    {!shown.length && <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{tasks.length ? 'No repairs match these filters.' : 'No repair tasks recorded. This does not mean the wagon has passed inspection.'}</p>}
    {shown.map(task => <article key={task.id} className="rounded-xl border bg-card p-4 space-y-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h4 className="font-semibold break-words">{task.subRepair}</h4><div className="flex flex-wrap gap-2 mt-2"><Badge variant="outline">{task.severity}</Badge><Badge variant="secondary">{(task.status || 'pending').replaceAll('_', ' ')}</Badge></div></div>{!locked && <Button variant="outline" size="sm" aria-label={`Update repair: ${task.subRepair}`} onClick={() => { setVersion(wagon.updatedAt); setAdding(false); setEditing(task); }}>Update</Button>}</div>
      <p className="text-sm text-muted-foreground">{task.location || 'Location not recorded'} · Reported by {task.inspector || 'not recorded'}</p>{task.remarks && <p className="text-sm break-words">{task.remarks}</p>}
    </article>)}
    <EditConditionDialog wagonId={wagon.id} wagonNumber={wagon.wagonNo} defect={editing} creating={adding} onClose={() => setEditing(null)} onSave={save} />
  </section>;
}
