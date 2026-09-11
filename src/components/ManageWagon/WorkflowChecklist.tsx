import { WorkAssignment } from '@/components/WorkAssignment';
import { WorkRecordActions } from '@/components/WorkRecordActions';
import { isAxiosError } from 'axios';
import { useState } from 'react';
import { Wagon } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { getResolvedWorkflowForWagon, getWorkflowDefinitionForWagon, normalizeStageKey } from '@/lib/wagonWorkflows';
import { workflowLocked } from '@/lib/condition';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DefectTimeline } from '@/components/DefectTimeline';
import { FitnessConfirmation } from '@/components/maintenance/FitnessConfirmation';
import { CorrectionDialog } from '@/components/ui/CorrectionDialog';
import { Input } from '@/components/ui/input';
import { StageTiming } from '@/components/StageTiming';

export function WorkflowChecklist({ wagon }: { wagon: Wagon }) {
  const { user, isAdmin } = useAuth();
  const workflow = useAppStore(state => state.workflows.find(item => item.wagonId === wagon.id));
  const definition = getWorkflowDefinitionForWagon(wagon.type);
  const resolved = getResolvedWorkflowForWagon(wagon, workflow);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [remarks, setRemarks] = useState('');
  const [branch, setBranch] = useState('');
  const [correcting, setCorrecting] = useState<string | null>(null);
  const [staff, setStaff] = useState('');
  const [correctionRemarks, setCorrectionRemarks] = useState('');
  const locked = workflowLocked(wagon.status);
  const actor = user?.name || user?.email || 'Current user';
  const run = async (operation: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await operation(); }
    catch (cause) { setError(isAxiosError(cause) ? cause.response?.data?.message || cause.message : cause instanceof Error ? cause.message : 'Unable to save. Please retry.'); }
    finally { setBusy(false); }
  };
  if (!definition || !resolved) return <p>Workflow configuration is unavailable for this wagon type.</p>;
  const key = resolved.currentStageKey || definition.initialStage;
  const stage = definition.stages[key];
  const saved = workflow?.stages.find(item => normalizeStageKey(definition, item.stageName) === key);
  // Old non-canonical records need an explicit migration, never a silent reset.
  const needsMigration = workflow?.stages.some(item => !definition.stages[item.stageName]);
  const allDone = !!workflow && resolved.branchState !== 'UNRESOLVED' && resolved.resolvedPath.every(item => workflow.stages.some(record => record.stageName === item && record.status === 'Done'));
  const completedAwaitingNext = saved?.status === 'Done' && stage.nextStages.length > 0 && !allDone;
  const requiresBranch = stage.nextStages.length > 1;
  const next = requiresBranch ? branch : stage.nextStages[0];
  const startOrComplete = () => run(async () => {
    if (!workflow || locked || needsMigration) return;
    const store = useAppStore.getState();
    if (!saved || saved.status === 'Pending') {
      await store.transitionWorkflow(workflow.id, 'start', key); setNotice('Stage started. Record the work before completing it.'); return;
    }
    if (saved.status === 'Paused' || saved.status === 'Delayed') {
      await store.transitionWorkflow(workflow.id, 'resume', key); setNotice('Stage resumed.'); return;
    }
    if (requiresBranch && !branch) { setError('Choose the next route before continuing.'); return; }
    if (workflow.stages.find(item => item.stageName === next)?.status === 'Done' && !remarks.trim()) { setError('Add a return-to-work reason in Work notes before choosing an earlier stage.'); return; }
    await store.transitionWorkflow(workflow.id, 'complete', key, next, remarks.trim());
    setRemarks(''); setBranch('');
    setNotice(next ? 'Stage saved and next stage started.' : 'Workflow stages completed. Fitness approval is still required.');
  });
  const buttonLabel = completedAwaitingNext ? 'Continue to next stage' : saved?.status === 'Paused' || saved?.status === 'Delayed' ? 'Resume stage' : !saved || saved.status === 'Pending' ? 'Start stage' : 'Complete stage & continue';

  return <section className="space-y-5" aria-label="Wagon workflow">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-semibold">Work process</h3><span className="text-sm text-muted-foreground">{resolved.completedCount} / {resolved.totalCount} recorded complete</span></div>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="rounded-lg border p-3 text-sm">{notice}</p>}
    {locked ? <div role={!allDone || needsMigration ? 'alert' : 'status'} className="rounded-xl border p-4 space-y-2"><h4 className="font-semibold">{!allDone || needsMigration ? 'FIT status — records need review' : 'Work closed'}</h4><p className="text-sm text-muted-foreground">{!allDone || needsMigration ? 'Saved stages do not fully support this status. An administrator must review and reopen the record before editing.' : 'This wagon is certified or released. Reopen it only if a correction is needed.'}</p><WorkRecordActions wagon={wagon} allowRelease={allDone && !needsMigration} /></div>
    : needsMigration ? <div role="alert" className="rounded-xl border p-4 space-y-3 text-sm"><p>Older stage names need administrator review before work can continue. Saved history is preserved.</p><WorkRecordActions wagon={wagon} /></div>
    : !workflow ? <div className="rounded-xl border p-4 space-y-3"><p className="text-sm">No workflow has been saved. Start with {definition.stages[definition.initialStage].label}.</p><Button disabled={busy} onClick={() => run(async () => { await useAppStore.getState().upsertWorkflowForWagon(wagon.id); setNotice('Workflow created. Start the first stage when ready.'); })}>{busy ? 'Creating…' : 'Create workflow'}</Button></div>
    : allDone ? <div className="rounded-xl border p-4 space-y-2"><h4 className="font-semibold">Stages complete — fitness approval next</h4><p className="text-sm text-muted-foreground">Review repairs and the maintenance checklist before an authorized inspector confirms fitness.</p></div>
    : <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 sm:p-5 space-y-4">
      <div><p className="text-xs font-semibold uppercase text-primary">{completedAwaitingNext ? 'Saved — next step needed' : saved?.status || 'Ready to start'}</p><h4 className="text-lg font-bold mt-1">{stage.label}</h4>{stage.description && <p className="text-sm text-muted-foreground mt-2">{stage.description}</p>}</div>
      <StageTiming stage={saved} />
      {completedAwaitingNext && <p className="text-sm">This stage is already saved. Continue below to start the next stage without recording completion again.</p>}
      {(saved?.status === 'In Progress' || completedAwaitingNext) && <>
        {requiresBranch && <fieldset className="space-y-2"><legend className="font-medium text-sm mb-2">Choose next route</legend>{stage.nextStages.map(item => <label key={item} className="flex items-center gap-3 rounded-lg border bg-background p-3 text-sm"><input type="radio" name={`route-${wagon.id}`} value={item} checked={branch === item} onChange={() => setBranch(item)} disabled={busy} />{definition.stages[item].label}</label>)}</fieldset>}
        {!completedAwaitingNext && <div className="space-y-2"><Label htmlFor={`stage-remarks-${wagon.id}`}>Work notes</Label><Textarea id={`stage-remarks-${wagon.id}`} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Record observations or work completed" disabled={busy} /></div>}
      </>}
      <p className="text-xs text-muted-foreground">Start and completion times are saved automatically · {actor}</p>
      <div className="flex flex-wrap gap-2"><Button className="w-full sm:w-auto" disabled={busy} onClick={startOrComplete}>{busy ? 'Saving…' : buttonLabel}</Button>
        {saved?.status === 'In Progress' && <Button variant="outline" disabled={busy} onClick={() => run(async () => { if (!remarks.trim()) { setError('Add a pause reason in Work notes.'); return; } await useAppStore.getState().transitionWorkflow(workflow.id, 'pause', key, undefined, remarks.trim()); setNotice('Stage paused.'); })}>Pause stage</Button>}
      </div>
    </div>}
    <section className="rounded-xl border p-4 space-y-3" aria-label="Process dates and times"><h4 className="font-semibold">Stages & times</h4><DefectTimeline wagon={wagon} /></section>
    <details className="rounded-xl border p-4"><summary className="cursor-pointer font-medium text-sm py-1">Assignment & handoff · {wagon.assignment?.assigneeName || 'Unassigned'}</summary><div className="pt-3"><WorkAssignment wagon={wagon} /></div></details>
    <details className="rounded-xl border p-4" open={allDone && !locked ? true : undefined}><summary className="cursor-pointer font-medium text-sm py-1">{locked ? 'Certification & record checks' : 'Fitness approval'}{!locked && !allDone && ' · after work is complete'}</summary><div className="pt-3"><FitnessConfirmation wagon={wagon} /></div></details>
    {isAdmin && !locked && !needsMigration && workflow?.stages.some(item => item.status === 'Done') && <details className="rounded-xl border p-4"><summary className="cursor-pointer font-medium text-sm py-1">Correct a saved record</summary>{workflow.stages.filter(item => item.status === 'Done').map(item => <Button key={item.stageName} variant="outline" className="mt-3 w-full justify-start whitespace-normal h-auto min-h-11 text-left" onClick={() => { setCorrecting(item.stageName); setStaff(item.staffName || item.inspectorName || actor); setCorrectionRemarks(item.remarks || ''); }}>Correct {definition.stages[item.stageName]?.label || item.stageName}</Button>)}</details>}
    {!!workflow?.cycleHistory?.length && <details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">Previous work cycles ({workflow.cycleHistory.length})</summary><ol className="space-y-3 mt-3">{workflow.cycleHistory.map((cycle, index) => <li key={index} className="text-sm border-l-2 pl-3"><p className="font-medium">{definition.stages[cycle.fromStage]?.label} → {definition.stages[cycle.returnedTo]?.label}</p><p>{cycle.reason}</p><p className="text-muted-foreground">{cycle.actorName} · {new Date(cycle.completedAt).toLocaleString()}</p><ul className="mt-2">{cycle.stages.filter(item => item.status === 'Done').map(item => <li key={item.stageName}>{definition.stages[item.stageName]?.label} · {item.inspectorName || 'Inspector not recorded'} · {item.completedAt ? new Date(item.completedAt).toLocaleString() : 'Time not recorded'}</li>)}</ul></li>)}</ol></details>}
    <CorrectionDialog isOpen={!!correcting} onOpenChange={open => !open && setCorrecting(null)} title="Correct stage record" description="Update attribution or notes with an audit reason. This does not change the process route." reasonRequired onSave={async reason => { if (!workflow || !correcting) return; await useAppStore.getState().correctWorkflowStage(workflow.id, correcting, { staffName: staff, inspectorName: staff, remarks: correctionRemarks }, actor, reason); setCorrecting(null); }}>
      <div className="space-y-3"><Label htmlFor="correction-staff">Recorded staff</Label><Input id="correction-staff" value={staff} onChange={e => setStaff(e.target.value)} /><Label htmlFor="correction-notes">Work notes</Label><Textarea id="correction-notes" value={correctionRemarks} onChange={e => setCorrectionRemarks(e.target.value)} /></div>
    </CorrectionDialog>
  </section>;
}
