import { useState } from 'react';
import { WagonRepair } from '@/lib/wagonData';
import { useAppStore } from '@/store/useAppStore';
import { conditionTasks, conditionCounts } from '@/lib/condition';
import { ConditionPanel } from './ConditionPanel';

export function ConditionSummary({ wagon }: { wagon: WagonRepair }) {
  const [open, setOpen] = useState(false);
  const record = useAppStore(state => state.wagons.find(item => item.id === wagon.id));
  const counts = conditionCounts(conditionTasks(record || wagon));
  return <>
    <button type="button" aria-label={`Open condition for ${wagon.wagonNumber}`} onClick={() => setOpen(true)} className="w-full max-w-[240px] rounded-lg border-l-4 border-primary bg-primary/5 p-3 text-left hover:bg-primary/10">
      <span className="block text-xs font-semibold">{counts.total} repair tasks · {counts.pending} open</span>
      <span className="block text-xs text-muted-foreground mt-1">{counts.critical ? `${counts.critical} safety-critical open` : counts.total ? `${counts.repaired} recorded as repaired` : 'Review inspection & workflow'}</span>
    </button>
    {open && <ConditionPanel wagon={wagon} open={open} onOpenChange={setOpen} />}
  </>;
}
