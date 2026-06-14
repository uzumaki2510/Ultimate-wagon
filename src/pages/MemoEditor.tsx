import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { nanoid } from "nanoid";
import { useAppStore } from "@/store/useAppStore";
import { APPROVAL_ROLES, BOOKED_TO, REASONS, UnitMemo, WagonMemoEntry, WAGON_TYPES } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Printer, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateMemoPdf } from "@/lib/pdf";
import { exportCsv, exportExcel } from "@/lib/exporters";
import { toast } from "sonner";

export default function MemoEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = id === "new" || !id;
  const store = useAppStore();
  const existing = !isNew ? store.memos.find((m) => m.id === id) : undefined;

  const [memo, setMemo] = useState<UnitMemo>(
    existing ?? {
      id: "", memoNo: String(2000076400 + Math.floor(Math.random() * 1000)),
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      rakeId: "", rakeName: "", yard: "", lineNo: "", createdBy: "", remarks: "",
      entries: [], createdAt: "",
      approvals: APPROVAL_ROLES.map((r) => ({ role: r, name: "", designation: "", signature: "", status: "Pending" as const })),
    },
  );

  const wagonsById = Object.fromEntries(store.wagons.map((w) => [w.id, w]));

  const set = (patch: Partial<UnitMemo>) => setMemo((m) => ({ ...m, ...patch }));

  const addEntry = () => {
    // Create a new wagon shell along with the entry
    const wagon = store.addWagon({
      wagonNo: "", type: "BTPN", owner: "", builtYear: new Date().getFullYear(), status: "Cut Off",
    });
    const entry: WagonMemoEntry = {
      id: nanoid(), sno: memo.entries.length + 1, position: "", wagonId: wagon.id,
      reason: "Wheel Alert", bookedTo: "HAPA SL", defects: "", status: "Cut Off",
    };
    set({ entries: [...memo.entries, entry] });
  };

  const updateEntry = (eid: string, patch: Partial<WagonMemoEntry>) =>
    set({ entries: memo.entries.map((e) => e.id === eid ? { ...e, ...patch } : e) });

  const updateEntryWagon = (wagonId: string, patch: any) => store.updateWagon(wagonId, patch);

  const removeEntry = (eid: string) =>
    set({ entries: memo.entries.filter((e) => e.id !== eid).map((e, i) => ({ ...e, sno: i + 1 })) });

  const save = () => {
    if (!memo.memoNo) return toast.error("Memo No required");
    if (isNew) {
      const created = store.addMemo({ ...memo });
      toast.success("Memo created");
      nav(`/memos/${created.id}`);
    } else {
      store.updateMemo(memo.id, memo);
      toast.success("Memo saved");
    }
  };

  const doPdf = () => { generateMemoPdf(memo, wagonsById); store.log({ actor: "user", action: "PDF generated", memoId: memo.id }); };
  const doExcel = () => { exportExcel([memo], wagonsById, `memo-${memo.memoNo}`); store.log({ actor: "user", action: "Excel export", memoId: memo.id }); };
  const doCsv = () => { exportCsv([memo], wagonsById, `memo-${memo.memoNo}`); store.log({ actor: "user", action: "CSV export", memoId: memo.id }); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isNew ? "Create Unit Memo" : `Memo #${memo.memoNo}`}</h1>
          <p className="text-sm text-muted-foreground">Fill in memo details, add wagons, capture approvals.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && <Button variant="outline" asChild><Link to={`/memos/${memo.id}/print`}><Printer className="h-4 w-4 mr-1" /> Print Memo</Link></Button>}
          <Button variant="outline" onClick={doPdf}><FileDown className="h-4 w-4 mr-1" /> Generate PDF</Button>
          <Button variant="outline" onClick={doExcel}><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
          <Button variant="outline" onClick={doCsv}><FileText className="h-4 w-4 mr-1" /> CSV</Button>
          <Button onClick={save}>{isNew ? "Create" : "Save"}</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Memo Details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div><Label>Memo No</Label><Input value={memo.memoNo} onChange={(e) => set({ memoNo: e.target.value })} /></div>
          <div><Label>Date</Label><Input type="date" value={memo.date} onChange={(e) => set({ date: e.target.value })} /></div>
          <div><Label>Time</Label><Input type="time" value={memo.time} onChange={(e) => set({ time: e.target.value })} /></div>
          <div><Label>Rake ID</Label><Input value={memo.rakeId} onChange={(e) => set({ rakeId: e.target.value })} /></div>
          <div><Label>Rake Name</Label><Input value={memo.rakeName} onChange={(e) => set({ rakeName: e.target.value })} /></div>
          <div><Label>Yard / Station</Label><Input value={memo.yard} onChange={(e) => set({ yard: e.target.value })} /></div>
          <div><Label>Line No</Label><Input value={memo.lineNo} onChange={(e) => set({ lineNo: e.target.value })} /></div>
          <div><Label>Created By</Label><Input value={memo.createdBy} onChange={(e) => set({ createdBy: e.target.value })} /></div>
          <div className="md:col-span-3"><Label>Remarks</Label><Textarea value={memo.remarks} onChange={(e) => set({ remarks: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Wagons in this Memo</CardTitle>
          <Button size="sm" onClick={addEntry}><Plus className="h-4 w-4 mr-1" /> Add Wagon</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {["S.No","Position","Wagon No","Type","Owner","Built","POH Stn","POH Date","ROH Stn","ROH Date","Return","Reason","Booked To","Defects","Status",""].map((h) => <TableHead key={h} className="whitespace-nowrap text-xs">{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {memo.entries.map((e) => {
                const w = wagonsById[e.wagonId];
                if (!w) return null;
                const I = (v: any, on: (val: string) => void) => <Input value={v ?? ""} onChange={(ev) => on(ev.target.value)} className="h-8 min-w-[80px] text-xs" />;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs">{e.sno}</TableCell>
                    <TableCell>{I(e.position, (v) => updateEntry(e.id, { position: v }))}</TableCell>
                    <TableCell>{I(w.wagonNo, (v) => updateEntryWagon(w.id, { wagonNo: v }))}</TableCell>
                    <TableCell>
                      <Select value={w.type as string} onValueChange={(v) => updateEntryWagon(w.id, { type: v })}>
                        <SelectTrigger className="h-8 text-xs min-w-[100px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{WAGON_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{I(w.owner, (v) => updateEntryWagon(w.id, { owner: v }))}</TableCell>
                    <TableCell>{I(w.builtYear, (v) => updateEntryWagon(w.id, { builtYear: v }))}</TableCell>
                    <TableCell>{I(w.pohStation, (v) => updateEntryWagon(w.id, { pohStation: v }))}</TableCell>
                    <TableCell><Input type="date" value={w.pohDate ?? ""} onChange={(ev) => updateEntryWagon(w.id, { pohDate: ev.target.value })} className="h-8 text-xs min-w-[130px]" /></TableCell>
                    <TableCell>{I(w.rohStation, (v) => updateEntryWagon(w.id, { rohStation: v }))}</TableCell>
                    <TableCell><Input type="date" value={w.rohDate ?? ""} onChange={(ev) => updateEntryWagon(w.id, { rohDate: ev.target.value })} className="h-8 text-xs min-w-[130px]" /></TableCell>
                    <TableCell><Input type="date" value={w.returnDate ?? ""} onChange={(ev) => updateEntryWagon(w.id, { returnDate: ev.target.value })} className="h-8 text-xs min-w-[130px]" /></TableCell>
                    <TableCell>
                      <Select value={e.reason} onValueChange={(v) => updateEntry(e.id, { reason: v })}>
                        <SelectTrigger className="h-8 text-xs min-w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={e.bookedTo} onValueChange={(v) => updateEntry(e.id, { bookedTo: v })}>
                        <SelectTrigger className="h-8 text-xs min-w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{BOOKED_TO.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{I(e.defects, (v) => updateEntry(e.id, { defects: v }))}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{e.status}</Badge></TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => removeEntry(e.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                );
              })}
              {memo.entries.length === 0 && <TableRow><TableCell colSpan={16} className="text-center text-muted-foreground py-6 text-sm">No wagons added.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Digital Signatures / Approvals</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {memo.approvals.map((a, i) => (
            <div key={a.role} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm">{a.role}</div>
                <Badge variant={a.status === "Approved" ? "default" : a.status === "Rejected" ? "destructive" : "outline"}>{a.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Name" value={a.name} onChange={(ev) => set({ approvals: memo.approvals.map((x, j) => j === i ? { ...x, name: ev.target.value } : x) })} />
                <Input placeholder="Designation" value={a.designation} onChange={(ev) => set({ approvals: memo.approvals.map((x, j) => j === i ? { ...x, designation: ev.target.value } : x) })} />
                <Input placeholder="Signature / Initials" value={a.signature} onChange={(ev) => set({ approvals: memo.approvals.map((x, j) => j === i ? { ...x, signature: ev.target.value } : x) })} />
                <div className="text-xs text-muted-foreground flex items-center">{a.approvedAt ? new Date(a.approvedAt).toLocaleString() : "—"}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { set({ approvals: memo.approvals.map((x, j) => j === i ? { ...x, status: "Approved", approvedAt: new Date().toISOString() } : x) }); }}>Approve</Button>
                <Button size="sm" variant="ghost" onClick={() => { set({ approvals: memo.approvals.map((x, j) => j === i ? { ...x, status: "Rejected", approvedAt: new Date().toISOString() } : x) }); }}>Reject</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
