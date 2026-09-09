import { isAxiosError } from 'axios';
import { useState } from 'react';
import { Wagon } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { workspaceApi } from '@/api/workspace';
import { getWorkflowDefinitionForWagon } from '@/lib/wagonWorkflows';
import { Button } from '@/components/ui/button';
import { CorrectionDialog } from '@/components/ui/CorrectionDialog';

export function WorkRecordActions({ wagon }: { wagon: Wagon }) {
  const { isAdmin } = useAuth();
  const workflow = useAppStore(state => state.workflows.find(item => item.wagonId === wagon.id));
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [action, setAction] = useState<'reopen' | 'reconcile' | null>(null);
  const definition = getWorkflowDefinitionForWagon(wagon.type);
  const legacy = workflow?.stages.some(stage => !definition?.stages[stage.stageName]);
  if (!isAdmin) return null;
  return <div className="space-y-3">
    {['FIT_READY', 'RELEASED'].includes(wagon.status) && <Button variant="outline" onClick={() => setAction('reopen')}>Reopen for correction</Button>}
    {legacy && !['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(wagon.status) && <Button variant="outline" onClick={() => setAction('reconcile')}>Review legacy stage names</Button>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {wagon.status === 'FIT_READY' && <Button variant="outline" disabled={busy} className="ml-2" onClick={async () => {
      if (!window.confirm('Confirm this certified wagon is ready for release?')) return;
      setBusy(true); setError('');
      try { await useAppStore.getState().updateWagon(wagon.id, { status: 'RELEASED' }); }
      catch (cause) { setError(isAxiosError(cause) ? cause.response?.data?.message || 'Release could not be saved.' : 'Release could not be saved.'); }
      finally { setBusy(false); }
    }}>{busy ? 'Saving release…' : 'Release wagon'}</Button>}
    <CorrectionDialog isOpen={!!action} onOpenChange={open => !open && setAction(null)} title={action === 'reopen' ? 'Reopen certified wagon' : 'Reconcile legacy stage names'} description={action === 'reopen' ? 'This clears current certification and release state, preserves the earlier certificate in history, and returns the wagon to sick line. Enter the operational reason.' : 'Only unambiguous matching stage names will change. Missing stages are added as Pending. No work is marked complete. Ambiguous history is rejected for manual review.'} reasonRequired onSave={async reason => {
      if (action === 'reopen') await workspaceApi.reopen(wagon.id, { expectedUpdatedAt: wagon.updatedAt, reason });
      else if (workflow) await workspaceApi.reconcile(workflow.id, { expectedUpdatedAt: workflow.updatedAt, reason });
      await useAppStore.getState().initializeStore(); setAction(null);
    }}>{null}</CorrectionDialog>
  </div>;
}
