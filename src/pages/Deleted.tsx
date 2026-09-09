import { useEffect, useState } from 'react';
import { wagonApi } from '@/api/wagons';
import { Wagon } from '@/types';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
export default function Deleted({ embedded = false }: { embedded?: boolean }) {
  const [records, setRecords] = useState<Wagon[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try { const res = await wagonApi.getDeleted(); setRecords(res.data.map((w: any) => ({ ...w, id: w._id }))); }
    catch { setError('Unable to load deleted wagons'); }
  };
  useEffect(() => { void load(); }, []);
  return <div className="space-y-4">
    {!embedded && <h1 className="text-2xl font-semibold">Deleted register</h1>}
    <p>Removed wagons are retained with their history and can be restored.</p>
    {error && <p role="alert">{error}</p>}
    {!records.length && !error && <p>No deleted wagons.</p>}
    {records.map(w => <div key={w.id} className="flex justify-between border rounded p-3">
      <span>{w.wagonNo} · {w.type} · {w.owner}</span>
      <Button disabled={busy} onClick={async () => {
        setBusy(true); setError('');
        try { await wagonApi.restoreWagon(w.id); await load(); await useAppStore.getState().initializeStore(); }
        catch { setError('Unable to restore wagon'); }
        finally { setBusy(false); }
      }}>Restore</Button>
    </div>)}
  </div>;
}
