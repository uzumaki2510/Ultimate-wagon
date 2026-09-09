import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { WagonCard } from '@/components/shared/WagonCard';
import { workshopLines } from '@/lib/navigation';
import { wagonWork } from '@/lib/workspaceModel';
import { SearchBar } from '@/components/shared/SearchBar';
import { Button } from '@/components/ui/button';

const views = [['all', 'All work'], ['my', 'My work'], ['blocked', 'Blocked'], ['overdue', 'Overdue'], ['unassigned', 'Unassigned'], ['fitness', 'Ready for release']];
export default function WorkshopOverview({ board = false, fixedLine }: { board?: boolean; fixedLine?: string }) {
  const { wagons, workflows } = useAppStore(); const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const line = fixedLine || (workshopLines.some(l => l.id === params.get('line')) ? params.get('line')! : 'all');
  const view = views.some(([id]) => id === params.get('view')) ? params.get('view')! : 'all';
  const [search, setSearch] = useState(''); const query = useDeferredValue(search.trim().toLowerCase());
  const [limit, setLimit] = useState(48);
  const records = useMemo(() => {
    const index = new Map(workflows.map(item => [item.wagonId, item]));
    return wagons.filter(w => !w.archived && !w.deletedAt).map(w => wagonWork(w, index.get(w.id))).filter(item => !item.released);
  }, [wagons, workflows]);
  const visible = records.filter(item => (line === 'all' || item.line === line)
    && (view === 'all' || view === 'my' && item.wagon.assignment?.assigneeId === user?.id || view === 'blocked' && item.blocked || view === 'overdue' && item.overdue || view === 'unassigned' && item.unassigned || view === 'fitness' && item.wagon.status === 'FIT_READY')
    && [item.wagon.wagonNo, item.wagon.type, item.wagon.owner, item.wagon.assignment?.assigneeName, item.label].join(' ').toLowerCase().includes(query));
  const change = (key: string, value: string) => { const next = new URLSearchParams(params); if (value === 'all') next.delete(key); else next.set(key, value); setParams(next, { replace: true }); setLimit(48); };
  const cards = (items: typeof records) => items.map(({ wagon, workflow }) => <WagonCard key={wagon.id} wagon={wagon} workflow={workflow} />);
  return <div className="space-y-6">
    <PageHeader title={fixedLine ? `${workshopLines.find(l => l.id === fixedLine)?.label} Line` : board ? 'Live workshop board' : 'Workshop'} description="One queue for saved workflow progress, ownership and the next action." actions={<Button asChild variant="outline"><Link to={board ? '/workshop' : '/live-sick-line'}>{board ? 'List view' : 'Open live board'}</Link></Button>} />
    {!fixedLine && <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">{workshopLines.map(l => <button key={l.id} onClick={() => change('line', line === l.id ? 'all' : l.id)} aria-pressed={line === l.id} className={`rounded-xl border p-4 text-left ${line === l.id ? 'border-primary bg-primary/5' : 'bg-card hover:border-primary/40'}`}><span className="text-sm font-medium">{l.label}</span><span className="mt-2 block text-2xl font-bold tabular-nums">{records.filter(item => item.line === l.id).length}</span></button>)}</div>}
    <div className="flex flex-col sm:flex-row gap-3"><SearchBar value={search} onChange={value => { setSearch(value); setLimit(48); }} placeholder="Search wagon, type, railway or staff" className="flex-1" /><select aria-label="Work queue" value={view} onChange={e => change('view', e.target.value)} className="min-h-11 rounded-lg border bg-card px-3 text-sm">{views.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>{!fixedLine && <select aria-label="Workshop line" value={line} onChange={e => change('line', e.target.value)} className="min-h-11 rounded-lg border bg-card px-3 text-sm"><option value="all">All lines</option>{workshopLines.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}</select>}</div>
    <p className="text-sm text-muted-foreground" aria-live="polite">{visible.length} wagons · {views.find(([id]) => id === view)?.[1]}</p>
    {board && line === 'all' ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{workshopLines.map(l => <section key={l.id} className="min-w-0 space-y-3 rounded-xl bg-muted/40 p-3"><h2 className="font-semibold">{l.label} · {visible.filter(item => item.line === l.id).length}</h2>{cards(visible.filter(item => item.line === l.id).slice(0, limit))}{!visible.some(item => item.line === l.id) && <p className="text-sm text-muted-foreground p-3">Queue clear</p>}</section>)}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards(visible.slice(0, limit))}</div>}
    {visible.length > limit && <Button variant="outline" onClick={() => setLimit(value => value + 48)}>Show more wagons</Button>}
    {!visible.length && <div className="rounded-xl border bg-card p-8 text-center"><h2 className="font-semibold">No wagons in this view</h2><p className="mt-2 text-sm text-muted-foreground">Try another queue or clear your filters.</p><Button variant="ghost" onClick={() => { setParams({}); setSearch(''); }}>Clear filters</Button></div>}
  </div>;
}
