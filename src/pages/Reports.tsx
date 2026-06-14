import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BOOKED_TO, REASONS } from "@/types";
import { exportCsv, exportExcel } from "@/lib/exporters";
import { generateMemoPdf } from "@/lib/pdf";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";

export default function Reports() {
  const { memos, wagons } = useAppStore();
  const byId = Object.fromEntries(wagons.map((w) => [w.id, w]));
  const [q, setQ] = useState("");
  const [reason, setReason] = useState<string>("all");
  const [bookedTo, setBookedTo] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const rows = useMemo(() => {
    const all = memos.flatMap((m) => m.entries.map((e) => ({ m, e, w: byId[e.wagonId] })));
    return all.filter(({ m, e, w }) => {
      const blob = [m.memoNo, m.rakeId, w?.wagonNo, w?.type, m.date].join(" ").toLowerCase();
      if (q && !blob.includes(q.toLowerCase())) return false;
      if (reason !== "all" && e.reason !== reason) return false;
      if (bookedTo !== "all" && e.bookedTo !== bookedTo) return false;
      if (status !== "all" && e.status !== status) return false;
      return true;
    });
  }, [memos, byId, q, reason, bookedTo, status]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Search, filter, and export across all memos.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <Input placeholder="Search memo / rake / wagon" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue placeholder="Reason" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Reasons</SelectItem>{REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={bookedTo} onValueChange={setBookedTo}>
            <SelectTrigger><SelectValue placeholder="Booked To" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Booked To</SelectItem>{BOOKED_TO.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {["In Service","Cut Off","Sick Line","Under Repair","Awaiting Inspection","Fit For Loading"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportExcel(memos, byId, "report")}><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
            <Button variant="outline" onClick={() => exportCsv(memos, byId, "report")}><FileText className="h-4 w-4 mr-1" /> CSV</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {["Memo No","Date","Rake","Wagon No","Type","Reason","Booked To","Defects","Status",""].map((h) => <TableHead key={h} className="text-xs">{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ m, e, w }) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono">{m.memoNo}</TableCell>
                  <TableCell>{m.date}</TableCell>
                  <TableCell>{m.rakeName}</TableCell>
                  <TableCell className="font-mono">{w?.wagonNo}</TableCell>
                  <TableCell>{w?.type}</TableCell>
                  <TableCell>{e.reason}</TableCell>
                  <TableCell>{e.bookedTo}</TableCell>
                  <TableCell>{e.defects}</TableCell>
                  <TableCell>{e.status}</TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={() => generateMemoPdf(m, byId)}><FileDown className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No matching rows.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
