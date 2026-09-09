import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { workspaceApi } from '@/api/workspace';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
interface Review { wagonId: string; wagonNo: string; problems: string[]; mapping: { from: string; to: string | null }[] }
export default function WorkflowIntegrity() {
  const [rows, setRows] = useState<Review[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try { setRows(await workspaceApi.integrity()); } catch { setError('Could not load integrity review.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  return <div className="space-y-5"><PageHeader title="Workflow integrity" description="Read-only checks for missing, legacy or conflicting evidence. No records are changed by this review." />
    <Button variant="outline" onClick={load} disabled={loading}>Refresh review</Button>{loading && <p role="status">Checking saved records…</p>}{error && <p role="alert">{error}</p>}
    {!loading && !error && <p>{rows.length} wagon records need review.</p>}
    {rows.map(row => <article key={row.wagonId} className="rounded-xl border p-4 space-y-3"><h2 className="font-semibold">{row.wagonNo}</h2><ul className="list-disc pl-5 text-sm space-y-1">{row.problems.map(problem => <li key={problem}>{problem}</li>)}</ul><details><summary className="cursor-pointer text-sm py-2">Proposed stage-name mapping</summary>{row.mapping.map((item, index) => <p key={index} className="text-xs py-1">{item.from} → {item.to || 'Manual review required'}</p>)}</details><Button asChild><Link to={`/wagon/${row.wagonId}?tab=work`}>Review wagon</Link></Button></article>)}
  </div>;
}
