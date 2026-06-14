import { useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { nanoid } from "nanoid";
import { useAppStore } from "@/store/useAppStore";
import { BOOKED_TO, REASONS, UnitMemo, WagonMemoEntry, WAGON_TYPES } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Printer, FileDown, FileSpreadsheet, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateMemoPdf } from "@/lib/pdf";
import { exportCsv, exportExcel } from "@/lib/exporters";
import { toast } from "sonner";

export default function MemoEditor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const isNew = id === "new" || !id;
  const store = useAppStore();
  const existing = !isNew ? store.memos.find((m) => m.id === id) : undefined;

  // Determine memo type from URL param (for new memos) or from existing memo
  const urlType = searchParams.get("type") as "sick" | "fit" | null;
  const resolvedType: "sick" | "fit" = existing?.memoType ?? urlType ?? "sick";

  const isSick = resolvedType === "sick";
  const defaultStatus = isSick ? "Cut Off" as const : "Fit For Loading" as const;
  const defaultBookedTo = isSick ? "HAPA SL" : "Fit For Loading";

  const [memo, setMemo] = useState<UnitMemo>(
    existing ?? {
      id: "", memoNo: String(2000076400 + Math.floor(Math.random() * 1000)),
      memoType: resolvedType,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      rakeId: "", rakeName: "", yard: "", lineNo: "", createdBy: "", remarks: "",
      entries: [], createdAt: "",
      approvals: [],
    },
  );

  const wagonsById = Object.fromEntries(store.wagons.map((w) => [w.id, w]));

  const set = (patch: Partial<UnitMemo>) => setMemo((m) => ({ ...m, ...patch }));

  const addEntry = () => {
    const wagon = store.addWagon({
      wagonNo: "", type: "BTPN", owner: "", builtYear: new Date().getFullYear(), status: defaultStatus,
    });
    const entry: WagonMemoEntry = {
      id: nanoid(), sno: memo.entries.length + 1, position: "", wagonId: wagon.id,
      reason: "Wheel Alert", bookedTo: defaultBookedTo, defects: "", status: defaultStatus,
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
      const created = store.addMemo({ ...memo, memoType: resolvedType });
      toast.success(`${isSick ? "Sick" : "Fit"} Memo created`);
      nav(`/memos/${created.id}`);
    } else {
      store.updateMemo(memo.id, memo);
      toast.success("Memo saved");
    }
  };

  const doPdf = () => { generateMemoPdf(memo, wagonsById); store.log({ actor: "user", action: "PDF generated", memoId: memo.id }); };
  const doExcel = () => { exportExcel([memo], wagonsById, `memo-${memo.memoNo}`); store.log({ actor: "user", action: "Excel export", memoId: memo.id }); };
  const doCsv = () => { exportCsv([memo], wagonsById, `memo-${memo.memoNo}`); store.log({ actor: "user", action: "CSV export", memoId: memo.id }); };

  const TypeIcon = isSick ? AlertTriangle : CheckCircle2;
  const typeLabel = isSick ? "Sick Memo" : "Fit Memo";
  const typeBadgeClass = isSick
    ? "bg-orange-500/15 text-orange-700 border-orange-400/40"
    : "bg-emerald-500/15 text-emerald-700 border-emerald-400/40";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? `Create ${typeLabel}` : `Memo #${memo.memoNo}`}
            </h1>
            <Badge className={`gap-1 ${typeBadgeClass}`}>
              <TypeIcon className="h-3.5 w-3.5" />
              {typeLabel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isSick
              ? "Record sick wagons booked for repair / sick line."
              : "Record wagons declared fit for loading / return to service."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && <Button variant="outline" asChild><Link to={`/memos/${memo.id}/print`}><Printer className="h-4 w-4 mr-1" /> Print Memo</Link></Button>}
          <Button variant="outline" onClick={doPdf}><FileDown className="h-4 w-4 mr-1" /> Generate PDF</Button>
          <Button variant="outline" onClick={doExcel}><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
          <Button variant="outline" onClick={doCsv}><FileText className="h-4 w-4 mr-1" /> CSV</Button>
          <Button
            onClick={save}
            className={isSick
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"}
          >
            {isNew ? `Create ${typeLabel}` : "Save"}
          </Button>
        </div>
      </div>

      <Card className={`border-l-4 ${isSick ? "border-l-orange-500" : "border-l-emerald-500"}`}>
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
          <Button size="sm" onClick={addEntry}
            className={isSick
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Wagon
          </Button>
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


    </div>
  );
}
