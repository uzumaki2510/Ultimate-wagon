import { useEffect, useMemo, useState } from 'react';
import { wagonApi } from '@/api/wagons';
import { workflowApi } from '@/api/workflows';
import { Wagon, WorkflowItem } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { buildReport, defaultReportFilters, ReportFilters } from '@/lib/reports';
import { csvCell, escapeHtml } from '@/lib/safeExport';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';

export default function ReportGenerator() {
  const { wagons, workflows } = useAppStore(); const { user } = useAuth();
  const [archived, setArchived] = useState<Wagon[]>([]); const [history, setHistory] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true); const [historyError, setHistoryError] = useState(''); const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setHistoryError('');
    Promise.all([wagonApi.getWagons(true), workflowApi.getWorkflows(true)]).then(([saved, flow]) => {
      if (active) {
        setArchived(saved.data.map((w: Wagon & { _id?: string }) => ({ ...w, id: w.id || w._id! })));
        setHistory(flow.data.map((w: WorkflowItem & { _id?: string }) => ({ ...w, id: w.id || w._id! })));
      }
    }).catch(() => { if (active) setHistoryError('Historical records could not be loaded. Retry before exporting a complete report.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id, retry]);
  const reportWagons = useMemo(() => [...new Map([...archived, ...wagons].map(w => [w.id, w])).values()], [archived, wagons]);
  const reportWorkflows = useMemo(() => [...new Map([...history, ...workflows].map(w => [w.wagonId, w])).values()], [history, workflows]);
  const [filters, setFilters] = useState(defaultReportFilters);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [templateName, setTemplateName] = useState('');
  const storageKey = `yardpilot-report-templates:${user?.id}`;
  const [templates, setTemplates] = useState<{ name: string; filters: ReportFilters }[]>(() => { try { const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]'); return Array.isArray(parsed) ? parsed.filter(t => typeof t.name === 'string' && t.filters && Object.keys(defaultReportFilters).every(key => typeof t.filters[key] === 'string')) : []; } catch { return []; } });
  const report = useMemo(() => buildReport(reportWagons, reportWorkflows, filters), [reportWagons, reportWorkflows, filters]);
  const change = (key: keyof ReportFilters, value: string) => setFilters(previous => ({ ...previous, [key]: value }));
  const options = (values: (string | undefined)[]) => [...new Set(values.filter(Boolean))].sort() as string[];
  const exportFile = async (format: string) => {
    setBusy(true); setError('');
    try {
      if (format === 'CSV') {
        const blob = new Blob([[report.headers, ...report.rows].map(row => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `RailFlow-${filters.kind}-report.csv`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else if (format === 'Excel') {
        const excel = await import('@/lib/spreadsheetExport'); const book = excel.utils.book_new();
        excel.utils.book_append_sheet(book, excel.utils.aoa_to_sheet([report.headers, ...report.rows]), 'Report'); await excel.writeFile(book, `RailFlow-${filters.kind}-report.xlsx`);
      } else {
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
        const doc = new jsPDF({ orientation: 'landscape' }); doc.text('RailFlow — Wagon Maintenance', 14, 16);
        autoTable(doc, { head: [report.headers], body: report.rows, startY: 24 }); doc.save(`RailFlow-${filters.kind}-report.pdf`);
      }
    } catch { setError('Export failed. Please retry.'); } finally { setBusy(false); }
  };
  const print = () => {
    const popup = window.open('', '_blank', 'width=1000,height=700'); if (!popup) { setError('Allow the print window and try again.'); return; }
    popup.opener = null;
    popup.document.write(`<!doctype html><html><head><title>RailFlow report</title><style>body{font:12px sans-serif;padding:20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px;text-align:left}h1{color:#a51b30}</style></head><body><h1>RailFlow report</h1><p>${report.rows.length} rows</p><table><thead><tr>${report.headers.map(h => '<th>' + escapeHtml(h) + '</th>').join('')}</tr></thead><tbody>${report.rows.map(row => '<tr>' + row.map(cell => '<td>' + escapeHtml(String(cell)) + '</td>').join('') + '</tr>').join('')}</tbody></table></body></html>`);
    popup.document.close(); popup.focus(); popup.print();
  };
  return <div className="space-y-5"><PageHeader title="Reports" description="One filtered dataset for the screen, CSV, Excel, PDF and print. Certification and release are reported separately." />
    {loading && <p role="status">Loading active and archived report records…</p>}
    {historyError && <p role="alert" className="text-destructive">{historyError}<Button variant="ghost" onClick={() => setRetry(n => n + 1)}>Retry report history</Button></p>}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border bg-card p-4">
      <label className="text-sm space-y-2"><span>Report type</span><select aria-label="Report type" className="w-full rounded-md border bg-background p-3" value={filters.kind} onChange={e => change('kind', e.target.value)}>{[['workshop', 'Workshop status'], ['steam', 'Steam work'], ['degassing', 'Degassing work'], ['inspection', 'Inspections'], ['repair', 'Repairs'], ['testing', 'Tests'], ['certified', 'Certified wagons'], ['released', 'Released wagons']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {([['type', 'Wagon type', options(reportWagons.map(w => w.type))], ['owner', 'Railway', options(reportWagons.map(w => w.owner))], ['status', 'Status', options(reportWagons.map(w => w.status))], ['assignee', 'Staff', options([...reportWagons.map(w => w.assignment?.assigneeName), ...reportWorkflows.flatMap(w => w.stages.flatMap(stage => [stage.staffName, stage.inspectorName]))])]] as [keyof ReportFilters, string, string[]][]).map(([key, label, values]) => <label key={key} className="text-sm space-y-2"><span>{label}</span><select aria-label={label} className="w-full rounded-md border bg-background p-3" value={filters[key]} onChange={e => change(key, e.target.value)}><option value="">All</option>{values.map(value => <option key={value}>{value}</option>)}</select></label>)}
      <label className="text-sm space-y-2"><span>From date</span><Input aria-label="From date" type="date" value={filters.from} onChange={e => change('from', e.target.value)} /></label><label className="text-sm space-y-2"><span>To date</span><Input aria-label="To date" type="date" value={filters.to} onChange={e => change('to', e.target.value)} /></label><label className="text-sm space-y-2"><span>Search report</span><Input aria-label="Search report" value={filters.query} onChange={e => change('query', e.target.value)} /></label>
    </div>
    <div className="flex flex-wrap gap-2">{['CSV', 'Excel', 'PDF'].map(format => <Button key={format} variant="outline" disabled={busy || loading || !!historyError || !!report.error} onClick={() => exportFile(format)}>Export {format}</Button>)}<Button variant="outline" disabled={loading || !!historyError || !!report.error} onClick={print}>Print report</Button><Button variant="ghost" onClick={() => setFilters(defaultReportFilters)}>Clear filters</Button></div>
    {(error || report.error) && <p role="alert" className="text-destructive">{error || report.error}</p>}
    {!!report.missingDates && <p className="text-sm text-amber-800">{report.missingDates} matching records have no reliable date. They are excluded when a date range is selected.</p>}
    <p className="text-sm text-muted-foreground">{report.rows.length} matching rows · dates use {filters.kind === 'workshop' ? 'last update time' : filters.kind === 'released' ? 'recorded release time' : filters.kind === 'certified' ? 'recorded certification time' : 'stage completion time'}.</p>
    <Table mobileCards><TableHeader><TableRow>{report.headers.map(header => <TableHead key={header}>{header}</TableHead>)}</TableRow></TableHeader><TableBody>{report.rows.slice(0, 100).map((row, index) => <TableRow key={index}>{row.map((cell, cellIndex) => <TableCell key={cellIndex}>{cell}</TableCell>)}</TableRow>)}</TableBody></Table>
    {!report.rows.length && !report.error && <p className="rounded-xl border p-6 text-center">No records match these filters.</p>}
    {report.rows.length > 100 && <p className="text-sm text-muted-foreground">Showing the first 100 rows. Exports include all {report.rows.length} matching rows.</p>}
    <details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">Saved filter presets</summary><p className="text-xs text-muted-foreground my-3">Stored on this browser for your account.</p><div className="flex flex-wrap gap-2"><Input aria-label="Preset name" placeholder="Preset name" value={templateName} onChange={e => setTemplateName(e.target.value)} className="sm:max-w-xs" /><Button disabled={!templateName.trim()} onClick={() => { const next = [...templates, { name: templateName.trim(), filters }]; try { localStorage.setItem(storageKey, JSON.stringify(next)); setTemplates(next); setTemplateName(''); } catch { setError('This browser could not save the preset.'); } }}>Save preset</Button></div><div className="flex flex-wrap gap-2 mt-3">{templates.map((template, index) => <Button variant="outline" key={index} onClick={() => setFilters({ ...defaultReportFilters, ...template.filters })}>{template.name}</Button>)}</div></details>
  </div>;
}
