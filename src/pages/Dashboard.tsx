import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { WagonCard } from '@/components/shared/WagonCard';
import { workshopLines } from '@/lib/navigation';
import { wagonWork } from '@/lib/workspaceModel';
import { Plus } from 'lucide-react';
export default function Dashboard() {
  const { wagons, workflows } = useAppStore(); const { user, isAdmin } = useAuth();
  const records = useMemo(() => {
    const index = new Map(workflows.map(w => [w.wagonId, w]));
    return wagons.filter(w => !w.archived && !w.deletedAt).map(w => wagonWork(w, index.get(w.id))).filter(w => !w.released);
  }, [wagons, workflows]);
  const attention = [...records].filter(w => w.wagon.status !== 'FIT_READY').sort((a, b) => Number(b.blocked) - Number(a.blocked) || Number(b.overdue) - Number(a.overdue) || Number(b.wagon.priority === 'Safety Critical') - Number(a.wagon.priority === 'Safety Critical') || (a.wagon.updatedAt || '').localeCompare(b.wagon.updatedAt || '')).slice(0, 6);
  const stats = [
    { label: 'In workshop', value: records.length, to: '/workshop' },
    { label: 'My work', value: records.filter(w => w.wagon.assignment?.assigneeId === user?.id).length, to: '/workshop?view=my' },
    { label: 'Blocked', value: records.filter(w => w.blocked).length, to: '/workshop?view=blocked' },
    { label: 'Ready for release', value: records.filter(w => w.wagon.status === 'FIT_READY').length, to: '/workshop?view=fitness' },
  ];
  return <div className="space-y-6">
    <PageHeader title="Workshop overview" description={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · Welcome, ${user?.name || 'team'}`} actions={isAdmin && <Button asChild className="gap-2"><Link to="/register?add=1"><Plus className="h-4 w-4" />Add wagon</Link></Button>} />
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">{stats.map(s => <Link to={s.to} key={s.label} className="rounded-xl border bg-card p-4 sm:p-5 hover:border-primary"><p className="text-xs sm:text-sm text-muted-foreground">{s.label}</p><p className="mt-3 text-3xl font-bold tabular-nums">{s.value}</p></Link>)}</div>
    <section className="space-y-4"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Needs attention</h2><Link className="text-sm text-primary font-medium" to="/workshop">View all →</Link></div><p className="text-sm text-muted-foreground">Blockers first, then overdue and safety-critical work.</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{attention.map(({ wagon, workflow }) => <WagonCard key={wagon.id} wagon={wagon} workflow={workflow} />)}</div>{!attention.length && <p className="p-8 text-center text-muted-foreground">No wagons awaiting work.</p>}</section>
    <section className="rounded-xl border bg-card p-4 sm:p-5"><h2 className="text-lg font-semibold mb-4">Workshop lines</h2><div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">{workshopLines.map(l => <Link key={l.id} to={`/workshop?line=${l.id}`} className="rounded-lg border p-4 hover:border-primary/50 hover:bg-primary/5"><span className="block text-sm font-medium">{l.label}</span><span className="block text-xl font-semibold mt-2">{records.filter(w => w.line === l.id).length}<span className="text-xs text-muted-foreground ml-2 font-normal">wagons</span></span></Link>)}</div></section>
  </div>;
}
