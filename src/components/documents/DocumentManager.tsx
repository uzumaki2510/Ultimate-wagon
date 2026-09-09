import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { workspaceApi, SavedDocument } from '@/api/workspace';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const types = ['Inspection Report', 'Gas Free Certificate', 'Fit Certificate', 'Repair Document', 'Wagon Image', 'Damage Image'];
export function DocumentManager({ wagonId }: { wagonId: string }) {
  const { isAdmin, user } = useAuth();
  const wagon = useAppStore(state => state.wagons.find(item => item.id === wagonId));
  const canUpload = !wagon?.archived && (isAdmin || wagon?.assignment?.assigneeId === user?.id && !['FIT_READY', 'RELEASED', 'IN_SERVICE'].includes(wagon?.status || ''));
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [type, setType] = useState(types[0]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const refresh = async () => { const result = await workspaceApi.documents(wagonId); setDocuments(result); };
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    workspaceApi.documents(wagonId).then(result => { if (active) setDocuments(Array.isArray(result) ? result : []); }).catch(() => { if (active) setError('Unable to load saved documents. Please retry.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [wagonId]);
  const run = async (operation: () => Promise<void>) => {
    setBusy(true); setError(''); setNotice('');
    try { await operation(); }
    catch (cause) { setError(isAxiosError(cause) ? cause.response?.data?.message || cause.message : 'Unable to complete document action'); }
    finally { setBusy(false); }
  };
  const upload = () => run(async () => {
    if (!file || !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('Choose a PDF, PNG or JPG up to 5 MB.'); return; }
    const saved = await workspaceApi.upload(wagonId, file, type);
    await refresh(); await useAppStore.getState().loadWagon(wagonId); setFile(null);
    setNotice(saved.scanStatus === 'clean' ? 'Document saved, scanned and available to authorized staff.' : 'Document saved in quarantine. An administrator must complete the security scan before download.');
  });
  return <section className="space-y-5" aria-label="Saved wagon documents">
    <div><h2 className="text-lg font-semibold">Documents & evidence</h2><p className="text-sm text-muted-foreground mt-1">Saved to the server with version history. Downloads require a successful security scan.</p></div>
    {error && <div role="alert" className="text-sm text-destructive">{error}<Button variant="ghost" disabled={busy} onClick={() => run(refresh)}>Retry</Button></div>}
    {notice && <p role="status" className="rounded-lg border p-3 text-sm">{notice}</p>}
    {canUpload ? <form className="rounded-xl border p-4 space-y-3" onSubmit={event => { event.preventDefault(); upload(); }}><label className="block text-sm space-y-2"><span>Document type</span><select aria-label="Document type" className="w-full rounded-md border bg-background p-3" value={type} onChange={e => setType(e.target.value)}>{types.map(item => <option key={item}>{item}</option>)}</select></label><label className="block text-sm space-y-2"><span>Choose file</span><Input aria-label="Choose document file" type="file" accept="application/pdf,image/png,image/jpeg" onChange={e => setFile(e.target.files?.[0] || null)} disabled={busy} /></label><p className="text-xs text-muted-foreground">PDF, PNG or JPG · up to 5 MB. Each upload is retained as a separate version.</p><Button disabled={busy || !file}>{busy ? 'Saving…' : 'Upload evidence'}</Button></form> : <p className="rounded-lg border p-3 text-sm text-muted-foreground">Uploads are available to administrators and assigned staff on active work.</p>}
    {loading && <p role="status">Loading saved documents…</p>}
    {!loading && !documents.length && <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No documents saved for this wagon.</p>}
    <div className="space-y-3">{documents.map(doc => <article key={doc._id} className="rounded-xl border p-4 space-y-3"><div><h3 className="font-semibold break-words">{doc.name}</h3><p className="text-sm text-muted-foreground">{doc.type} · v{doc.version} · {Math.ceil(doc.size / 1024)} KB</p><p className="text-xs text-muted-foreground mt-1">{doc.uploadedByName} · {new Date(doc.uploadedAt).toLocaleString()}</p></div><p className={doc.scanStatus === 'clean' ? 'text-sm text-green-700' : 'text-sm text-amber-800'}>{doc.scanStatus === 'clean' ? 'Security scan passed' : doc.scanStatus === 'rejected' ? 'Security scan rejected this file' : 'Quarantined — awaiting security scan'}</p><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy || doc.scanStatus !== 'clean'} onClick={() => run(async () => { const blob = await workspaceApi.download(doc._id); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = doc.name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); })}>Download</Button>{isAdmin && doc.scanStatus === 'quarantined' && <Button variant="outline" disabled={busy} onClick={() => run(async () => { const result = await workspaceApi.scan(doc._id); await refresh(); setNotice(result.scanStatus === 'quarantined' ? 'Scanner is not configured. Ask the deployment administrator to configure ClamAV.' : 'Security scan completed.'); })}>Retry scan</Button>}{isAdmin && <Button variant="ghost" disabled={busy} onClick={() => { if (window.confirm('Withdraw this document? Its stored evidence and audit will be retained.')) run(async () => { await workspaceApi.withdraw(doc._id); await refresh(); }); }}>Withdraw</Button>}</div></article>)}</div>
  </section>;
}
