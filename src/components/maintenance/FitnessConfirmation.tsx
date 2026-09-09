import { useEffect, useState } from 'react';
import { workspaceApi, Readiness } from '@/api/workspace';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Wagon, FitConfirmation } from '@/types';
const checks = {
  allStagesCompleted: 'All workflow stages completed', defectRectified: 'Every defect rectified',
  finalInspectionCompleted: 'Final inspection completed', noSafetyCriticalDefectOpen: 'No safety-critical defect remains open', inspectorVerified: 'I have verified this wagon',
};
const tankChecks = { noLeakageFound: 'No leakage', masterValveChecked: 'Master valve checked', bottomDischargeValveChecked: 'Bottom discharge valve checked', deliveryPipeChecked: 'Delivery pipe checked', blankFlangeChecked: 'Blank flange checked', tankBarrelChecked: 'Tank barrel checked', safetyFittingsChecked: 'Safety fittings checked', steamingPurgingDegassingCompleted: 'Steaming / purging / degassing completed', hydroTestingCompleted: 'Hydro testing completed' };
export function FitnessConfirmation({ wagon }: { wagon: Wagon }) {
  const { user, isAdmin } = useAuth();
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [checking, setChecking] = useState(true); const [readError, setReadError] = useState(''); const [retry, setRetry] = useState(0);
  const workflow = useAppStore(state => state.workflows.find(item => item.wagonId === wagon.id));
  useEffect(() => {
    let active = true; setChecking(true); setReadError(''); setReadiness(null);
    workspaceApi.readiness(wagon.id).then(result => {
      if (active) { if (!Array.isArray(result?.blockers)) throw new Error('Invalid readiness response'); setReadiness(result); }
    }).catch(() => { if (active) setReadError('Unable to check saved evidence. Retry before certifying.'); }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [wagon.id, wagon.updatedAt, workflow?.updatedAt, retry]);
  const [values, setValues] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const items = ['BTPN', 'BTPGLN', 'BTPFLN', 'BTPNHS', 'BTFLN'].includes(wagon.type) ? { ...checks, ...tankChecks } : checks;
  const certified = ['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(wagon.status);
  return <form className="space-y-3 rounded-lg border p-4" onSubmit={async e => {
    e.preventDefault(); if (!isAdmin || certified || checking || !readiness || readiness.blockers.length) return; setBusy(true); setError('');
    try {
      const result = await useAppStore.getState().markWagonFit(wagon.id, { ...values, inspectorName: user.name, confirmedBy: user.id, confirmedAt: new Date().toISOString(), remarks: '' } as FitConfirmation);
      if (!result.success) setError(result.error || 'Unable to certify');
    } finally { setBusy(false); }
  }}>
    <h3 className="font-semibold">Fitness confirmation</h3>
    {checking && <p role="status" className="text-sm">Checking saved workflow and evidence…</p>}
    {readError && <p role="alert" className="text-sm text-destructive">{readError}<Button type="button" variant="ghost" onClick={() => setRetry(n => n + 1)}>Retry readiness check</Button></p>}
    {readiness && <div className="space-y-2 text-sm">
      <h4 className="font-medium">{readiness.blockers.length ? 'Not ready to certify' : certified ? 'Certification recorded' : 'Saved work is ready for verification'}</h4>
      {readiness.blockers.length > 0 && <ul className="list-disc pl-5">{readiness.blockers.map(item => <li key={item}>{item}</li>)}</ul>}
      {readiness.integrity?.problems?.length > 0 && <p className="text-amber-800">Record review needed: {readiness.integrity.problems.join('; ')}</p>}
      <p>{readiness.documents.length} saved evidence file(s) · {readiness.documents.filter(item => item.scanStatus === 'clean').length} scanned.</p>
      <Link className="text-primary underline" to={`/wagon/${wagon.id}?tab=documents`}>Review documents & evidence</Link>
      {readiness.certifiedAt && <p>Certified: {new Date(readiness.certifiedAt).toLocaleString()}</p>}
      {readiness.releasedAt && <p>Released: {new Date(readiness.releasedAt).toLocaleString()}</p>}
    </div>}
    {!isAdmin && <p className="text-sm text-muted-foreground">An administrator must verify and sign the fitness confirmation.</p>}
    {isAdmin && !certified && Object.entries(items).map(([key, label]) => <label key={key} className="flex gap-2 items-center"><input type="checkbox" required checked={!!values[key]} onChange={e => setValues(v => ({ ...v, [key]: e.target.checked }))} />{label}</label>)}
    {isAdmin && !certified && <p className="text-sm text-muted-foreground">Verified by {user?.name}. The server will also check saved workflow and repair progress. Evidence requirements remain subject to your approved operating procedure.</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {isAdmin && !certified && <Button disabled={busy || checking || !readiness || readiness.blockers.length > 0 || Object.keys(items).some(key => !values[key])}>Confirm wagon fit</Button>}
  </form>;
}
