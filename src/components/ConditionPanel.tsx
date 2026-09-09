import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { WagonRepair } from '@/lib/wagonData';
import { useAppStore } from '@/store/useAppStore';
import { conditionTasks, conditionCounts, workflowLocked } from '@/lib/condition';
import { StatusPill } from '@/components/shared/WagonCard';
import { RepairTaskList } from '@/components/RepairTaskList';
import { WorkflowChecklist } from '@/components/ManageWagon/WorkflowChecklist';
import { DefectTimeline } from '@/components/DefectTimeline';
import { getResolvedWorkflowForWagon } from '@/lib/wagonWorkflows';

export function ConditionPanel({ wagon, open, onOpenChange }: { wagon: WagonRepair; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [tab, setTab] = useState('overview');
  const record = useAppStore(state => state.wagons.find(item => item.id === wagon.id));
  const workflow = useAppStore(state => state.workflows.find(item => item.wagonId === wagon.id));
  const allMemos = useAppStore(state => state.memos);
  const memos = allMemos.filter(memo => !memo.archived && memo.entries.some(entry => entry.wagonId === wagon.id));
  const counts = conditionCounts(conditionTasks(record || wagon));
  const resolved = getResolvedWorkflowForWagon(record || wagon, workflow);
  const locked = record ? workflowLocked(record.status) : true;
  const mismatch = locked && (!workflow || !resolved || resolved.completedCount < resolved.totalCount || counts.pending > 0);
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent data-workflow-sheet className="w-full sm:max-w-[760px] h-[100dvh] p-0 flex flex-col gap-0">
      <SheetHeader className="p-5 pr-14 border-b text-left">
        <SheetTitle className="text-xl text-primary tabular-nums">{record?.wagonNo || wagon.wagonNumber}</SheetTitle>
        <SheetDescription>{record?.type || wagon.details.typeName} · {record?.owner || wagon.details.railwayName}</SheetDescription>
        {record && <div><StatusPill status={record.status} /></div>}
      </SheetHeader>
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
        <TabsList className="grid grid-cols-3 rounded-none border-b bg-background h-auto p-2 shrink-0"><TabsTrigger className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary" value="overview">Overview</TabsTrigger><TabsTrigger className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary" value="repairs">Repairs ({counts.total})</TabsTrigger><TabsTrigger className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary" value="workflow">Workflow</TabsTrigger></TabsList>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          <TabsContent value="overview" className="mt-0 space-y-5">
            {mismatch && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><strong>Records need review</strong><p className="mt-1">The wagon is certified or released, but saved repair or workflow evidence is incomplete. Nothing has been marked complete automatically. Ask an administrator to review and reopen the wagon if a correction is needed.</p></div>}
            <div className="grid grid-cols-2 gap-3">{[['Recorded repairs', counts.total], ['Open repairs', counts.pending], ['Repaired', counts.repaired], ['Safety-critical open', counts.critical]].map(([label, value]) => <div key={label} className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></div>)}</div>
            {record?.defect && <div className="rounded-xl border p-4"><h3 className="font-semibold">Reported issue</h3><p className="text-sm mt-2 break-words">{record.defect}</p></div>}
            <div className="rounded-xl border p-4 space-y-3"><h3 className="font-semibold">Workflow progress</h3><p className="text-sm text-muted-foreground">{workflow && resolved ? `${resolved.completedCount} of ${resolved.totalCount} stages recorded complete` : 'No workflow record saved yet'}. Fitness requires a separate verified approval.</p><DefectTimeline wagon={record || wagon} /></div>
            <div className="rounded-xl border p-4"><h3 className="font-semibold">Linked memos</h3>{memos.length ? memos.map(memo => <Link key={memo.id} className="block py-2 text-primary underline" to={`/memos/${memo.id}`} onClick={() => onOpenChange(false)}>{memo.memoNo}</Link>) : <p className="text-sm text-muted-foreground mt-2">No linked memo recorded.</p>}</div>
          </TabsContent>
          <TabsContent value="repairs" className="mt-0">{record ? <RepairTaskList wagon={record} /> : <p>Reload the register to edit this wagon.</p>}</TabsContent>
          <TabsContent value="workflow" className="mt-0">{record ? <WorkflowChecklist wagon={record} /> : <p>Reload the register to work on this wagon.</p>}</TabsContent>
        </div>
        <div className="border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] grid grid-cols-2 gap-3 shrink-0"><Button variant="outline" asChild><Link to={`/wagon/${wagon.id}?tab=documents`} onClick={() => onOpenChange(false)}>Documents</Link></Button><Button onClick={() => setTab(tab === 'workflow' ? 'repairs' : 'workflow')}>{tab === 'workflow' ? 'Review repairs' : locked ? 'Review workflow' : 'Continue workflow'}</Button></div>
      </Tabs>
    </SheetContent>
  </Sheet>;
}
