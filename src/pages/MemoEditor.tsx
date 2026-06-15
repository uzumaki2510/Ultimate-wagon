import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { nanoid } from "nanoid";
import { useAppStore } from "@/store/useAppStore";
import { BOOKED_TO, REASONS, UnitMemo, WagonMemoEntry, WAGON_TYPES } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Save, Printer, ArrowRight, ArrowLeft, PlusCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function MemoEditor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const { toast } = useToast();
  
  const isNew = id === "new" || !id;
  const store = useAppStore();
  const existing = !isNew ? store.memos.find((m) => m.id === id) : undefined;

  const urlType = searchParams.get("type") as "sick" | "fit" | null;
  const resolvedType: "sick" | "fit" = existing?.memoType ?? urlType ?? "sick";
  const isSick = resolvedType === "sick";
  const defaultStatus = isSick ? "Cut Off" : "Fit For Loading";
  const defaultBookedTo = isSick ? "HAPA SL" : "Fit For Loading";

  const [activeTab, setActiveTab] = useState("info");

  const [memo, setMemo] = useState<UnitMemo>(
    existing ?? {
      id: "", 
      memoNo: `MEMO-${Math.floor(Math.random() * 10000)}`,
      memoType: resolvedType,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      rakeId: "", rakeName: "", yard: "CYM HAPA", lineNo: "", 
      createdBy: "Current User", remarks: "",
      entries: [], createdAt: "", approvals: [],
    },
  );

  const set = (patch: Partial<UnitMemo>) => setMemo((m) => ({ ...m, ...patch }));

  const addEntry = () => {
    const entry: WagonMemoEntry & { _tempWagonNo?: string, _tempType?: string } = {
      id: nanoid(), sno: memo.entries.length + 1, position: String(memo.entries.length + 1), wagonId: nanoid(),
      reason: "Wheel Alert", bookedTo: defaultBookedTo, defects: "", status: defaultStatus,
      _tempWagonNo: "", _tempType: "BOXN"
    };
    set({ entries: [...memo.entries, entry] });
  };

  const updateEntry = (eid: string, patch: Partial<WagonMemoEntry & { _tempWagonNo?: string, _tempType?: string }>) =>
    set({ entries: memo.entries.map((e) => e.id === eid ? { ...e, ...patch } : e) });

  const removeEntry = (eid: string) =>
    set({ entries: memo.entries.filter((e) => e.id !== eid).map((e, i) => ({ ...e, sno: i + 1 })) });

  const validate = () => {
    if (!memo.memoNo) { toast({ title: "Validation Error", description: "Memo No is required", variant: "destructive" }); return false; }
    if (!memo.date) { toast({ title: "Validation Error", description: "Date is required", variant: "destructive" }); return false; }
    if (memo.entries.length === 0) { toast({ title: "Validation Error", description: "At least one wagon is required", variant: "destructive" }); return false; }
    
    for (const e of memo.entries as any[]) {
      if (!e._tempWagonNo && isNew) { toast({ title: "Validation Error", description: "Wagon No is required", variant: "destructive" }); return false; }
      if (!e.reason) { toast({ title: "Validation Error", description: "Reason is required", variant: "destructive" }); return false; }
      if (!e.bookedTo) { toast({ title: "Validation Error", description: "Booked To is required", variant: "destructive" }); return false; }
    }
    return true;
  };

  const save = () => {
    if (!validate()) return;

    // Create wagons if new
    let finalEntries = [...memo.entries];
    if (isNew) {
      finalEntries = memo.entries.map((e: any) => {
        const w = store.addWagon({
          wagonNo: e._tempWagonNo || "UNKNOWN",
          type: e._tempType || "Other",
          owner: "Unknown", builtYear: new Date().getFullYear(),
          status: defaultStatus, defect: e.defects, bookedTo: e.bookedTo,
          rakeId: memo.rakeId, updatedAt: new Date().toISOString()
        });
        return { ...e, wagonId: w.id };
      });
    }

    if (isNew) {
      const created = store.addMemo({ ...memo, entries: finalEntries });
      if (isSick) {
        finalEntries.forEach(e => store.upsertWorkflowForWagon(e.wagonId, created.id));
      } else {
        finalEntries.forEach(e => store.updateWagon(e.wagonId, { status: "Fit For Loading" }));
      }
      toast({ title: "Success", description: "Memo saved successfully." });
      nav(`/memos/${created.id}`);
    } else {
      store.updateMemo(id!, { ...memo, entries: finalEntries });
      toast({ title: "Success", description: "Memo updated successfully." });
    }
  };

  const getWagonNo = (wid: string, temp?: string) => {
    if (temp) return temp;
    return store.wagons.find(w => w.id === wid)?.wagonNo || "Unknown";
  };

  const getWagonType = (wid: string, temp?: string) => {
    if (temp) return temp;
    return store.wagons.find(w => w.id === wid)?.type || "Other";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {isNew ? `Create ${isSick ? 'Sick' : 'Fit'} Memo` : `Edit Memo: ${memo.memoNo}`}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">1. Memo Info</TabsTrigger>
          <TabsTrigger value="wagons">2. Wagon List</TabsTrigger>
          <TabsTrigger value="preview">3. Preview</TabsTrigger>
          <TabsTrigger value="approval">4. Approval</TabsTrigger>
        </TabsList>
        
        <Card className="mt-4">
          <TabsContent value="info" className="p-0 m-0">
            <CardHeader><CardTitle>Memo Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Memo No <span className="text-red-500">*</span></Label><Input value={memo.memoNo} onChange={e => set({ memoNo: e.target.value })} /></div>
              <div className="space-y-2"><Label>Date <span className="text-red-500">*</span></Label><Input type="date" value={memo.date} onChange={e => set({ date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Time</Label><Input type="time" value={memo.time} onChange={e => set({ time: e.target.value })} /></div>
              <div className="space-y-2"><Label>Yard</Label><Input value={memo.yard} onChange={e => set({ yard: e.target.value })} /></div>
              <div className="space-y-2"><Label>Rake Name</Label><Input value={memo.rakeName} onChange={e => set({ rakeName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Line No</Label><Input value={memo.lineNo} onChange={e => set({ lineNo: e.target.value })} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Remarks</Label><Input value={memo.remarks} onChange={e => set({ remarks: e.target.value })} /></div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button onClick={() => setActiveTab("wagons")}>Next <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </CardFooter>
          </TabsContent>

          <TabsContent value="wagons" className="p-0 m-0">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Wagon List <span className="text-red-500">*</span></CardTitle>
                {isNew && <Button onClick={addEntry} size="sm"><PlusCircle className="h-4 w-4 mr-2" />Add Wagon</Button>}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pos</TableHead>
                    <TableHead>Wagon No <span className="text-red-500">*</span></TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason <span className="text-red-500">*</span></TableHead>
                    <TableHead>Booked To <span className="text-red-500">*</span></TableHead>
                    {isNew && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memo.entries.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell><Input className="w-16 h-8" value={e.position} onChange={ev => updateEntry(e.id, { position: ev.target.value })} /></TableCell>
                      <TableCell>
                        {isNew ? <Input className="h-8" value={e._tempWagonNo} onChange={ev => updateEntry(e.id, { _tempWagonNo: ev.target.value })} /> : <span className="font-mono">{getWagonNo(e.wagonId)}</span>}
                      </TableCell>
                      <TableCell>
                        {isNew ? (
                          <Select value={e._tempType} onValueChange={v => updateEntry(e.id, { _tempType: v })}>
                            <SelectTrigger className="h-8 w-[100px]"><SelectValue /></SelectTrigger>
                            <SelectContent>{WAGON_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        ) : <span>{getWagonType(e.wagonId)}</span>}
                      </TableCell>
                      <TableCell>
                        <Select value={e.reason} onValueChange={v => updateEntry(e.id, { reason: v })}>
                          <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={e.bookedTo} onValueChange={v => updateEntry(e.id, { bookedTo: v })}>
                          <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{BOOKED_TO.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      {isNew && (
                        <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeEntry(e.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      )}
                    </TableRow>
                  ))}
                  {memo.entries.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No wagons added yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={() => setActiveTab("info")}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
              <Button onClick={() => setActiveTab("preview")}>Next <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </CardFooter>
          </TabsContent>

          <TabsContent value="preview" className="p-0 m-0">
            <CardContent className="pt-6">
              <div className="bg-yellow-50/80 p-6 rounded-lg border border-yellow-200 shadow-sm">
                <div className="text-center mb-6">
                  <h3 className="font-bold text-lg text-black">WESTERN RAILWAY - {isSick ? 'SICK' : 'FIT'} MEMO</h3>
                  <p className="text-sm text-black/80">Memo No: {memo.memoNo} | Date: {memo.date} | Time: {memo.time}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-6 text-black/90">
                  <div><strong>Yard:</strong> {memo.yard}</div>
                  <div><strong>Line:</strong> {memo.lineNo || "-"}</div>
                  <div><strong>Created By:</strong> {memo.createdBy}</div>
                  <div><strong>Total Wagons:</strong> {memo.entries.length}</div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={() => setActiveTab("wagons")}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => nav(`/memos/${id || 'new'}/print`)}><Printer className="h-4 w-4 mr-2" /> Print</Button>
                <Button onClick={save}><Save className="h-4 w-4 mr-2" /> Save Memo</Button>
              </div>
            </CardFooter>
          </TabsContent>

          <TabsContent value="approval" className="p-0 m-0">
            <CardHeader><CardTitle>Approvals & Signatures</CardTitle></CardHeader>
            <CardContent>
              {!isNew && memo.approvals && memo.approvals.length > 0 ? (
                <div className="space-y-4">
                  {memo.approvals.map((app, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <div className="font-semibold">{app.role}</div>
                        <div className="text-sm text-muted-foreground">{app.name} - {app.designation}</div>
                      </div>
                      <Badge variant={app.status === "Approved" ? "default" : app.status === "Rejected" ? "destructive" : "secondary"}>
                        {app.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Save the memo first to request approvals.</div>
              )}
            </CardContent>
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}
