import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { REASONS, BOOKED_TO, WAGON_TYPES, WagonMemoEntry, UnitMemo } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { nanoid } from "nanoid";
import { Zap, ChevronRight, ChevronLeft, Save, FileText, Send, PlusCircle, Trash2 } from "lucide-react";

export default function QuickBoard() {
  const navigate = useNavigate();
  const { addMemo, addWagon, upsertWorkflowForWagon } = useAppStore();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);

  // Step 1: Memo Info
  const [memoNo, setMemoNo] = useState(`SICK-${Math.floor(Math.random() * 10000)}`);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(new Date().toTimeString().substring(0, 5));
  const [rakeId, setRakeId] = useState("");
  const [rakeName, setRakeName] = useState("");
  const [yard, setYard] = useState("CYM HAPA");
  const [lineNo, setLineNo] = useState("");
  const [createdBy, setCreatedBy] = useState(user?.name || "");

  // Step 2: Wagons
  const [wagons, setWagons] = useState<Partial<WagonMemoEntry & { type: string, wagonNo: string }>[]>([]);

  const handleAddWagon = () => {
    setWagons([...wagons, { 
      id: nanoid(), 
      wagonId: nanoid(),
      sno: wagons.length + 1, 
      position: String(wagons.length + 1), 
      wagonNo: "", 
      type: "BOXN",
      reason: "Wheel Alert", 
      bookedTo: "HAPA SL", 
      defects: "",
      status: "SICK_LINE"
    } as any]);
  };

  const updateWagon = (index: number, field: string, value: string) => {
    const updated = [...wagons];
    updated[index] = { ...updated[index], [field]: value };
    setWagons(updated);
  };

  const removeWagon = (index: number) => {
    setWagons(wagons.filter((_, i) => i !== index));
  };

  // Submit
  const handleSubmit = () => {
    if (wagons.length === 0) {
      toast({ title: "Error", description: "Please add at least one wagon.", variant: "destructive" });
      return;
    }
    
    // Create actual wagons in store
    const createdWagons = wagons.map(w => {
      const nw = addWagon({
        wagonNo: w.wagonNo || "UNKNOWN",
        type: w.type || "Other",
        status: "SICK_LINE",
        defect: w.defects,
        bookedTo: w.bookedTo,
        owner: "Unknown",
        builtYear: new Date().getFullYear(),
        rakeId,
        updatedAt: new Date().toISOString()
      });
      return { ...w, wagonId: nw.id };
    });

    // Create Memo
    const newMemo: Omit<UnitMemo, "id" | "createdAt"> = {
      memoNo,
      memoType: "sick",
      date,
      time,
      rakeId,
      rakeName,
      yard,
      lineNo,
      createdBy,
      remarks: "Created via Quick Entry",
      entries: createdWagons as WagonMemoEntry[],
      approvals: []
    };

    const addedMemo = addMemo(newMemo);

    // Auto-create workflows
    createdWagons.forEach(w => {
      upsertWorkflowForWagon(w.wagonId, addedMemo.id);
    });

    toast({ title: "Success", description: "Sick Memo and Workflows created successfully." });
    navigate(`/memos/${addedMemo.id}/print`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center gap-2">
        <Zap className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Quick Entry Wizard</h1>
      </div>

      <div className="flex items-center justify-between mb-8 px-4 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-10 -translate-y-1/2"></div>
        <div className={`absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 transition-all duration-300 ${step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'}`}></div>
        
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${step >= s ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-muted-foreground'}`}>
            {s}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Step 1: Memo & Rake Details"}
            {step === 2 && "Step 2: Add Sick Wagons"}
            {step === 3 && "Step 3: Preview & Submit"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Memo No</Label>
                <Input value={memoNo} onChange={(e) => setMemoNo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Created By</Label>
                <Input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Rake Name / Type</Label>
                <Input value={rakeName} onChange={(e) => setRakeName(e.target.value)} placeholder="e.g. BCN EMP" />
              </div>
              <div className="space-y-2">
                <Label>Yard / Station</Label>
                <Input value={yard} onChange={(e) => setYard(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Line No</Label>
                <Input value={lineNo} onChange={(e) => setLineNo(e.target.value)} placeholder="e.g. Line 3" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Button onClick={handleAddWagon} variant="outline" className="w-full border-dashed">
                <PlusCircle className="h-4 w-4 mr-2" /> Add Wagon
              </Button>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Pos</TableHead>
                      <TableHead>Wagon No</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Booked To</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wagons.map((w, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Input value={w.position} onChange={e => updateWagon(i, "position", e.target.value)} className="w-16 h-8" />
                        </TableCell>
                        <TableCell>
                          <Input value={w.wagonNo} onChange={e => updateWagon(i, "wagonNo", e.target.value)} className="h-8" placeholder="No." />
                        </TableCell>
                        <TableCell>
                          <Select value={w.type} onValueChange={v => updateWagon(i, "type", v)}>
                            <SelectTrigger className="h-8 w-[100px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {WAGON_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={w.reason} onValueChange={v => updateWagon(i, "reason", v)}>
                            <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={w.bookedTo} onValueChange={v => updateWagon(i, "bookedTo", v)}>
                            <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {BOOKED_TO.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeWagon(i)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {wagons.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No wagons added. Click "Add Wagon" above.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-yellow-50/80 p-6 rounded-lg border border-yellow-200">
              <div className="text-center mb-6">
                <h3 className="font-bold text-lg">WESTERN RAILWAY - SICK MEMO</h3>
                <p className="text-sm">Memo No: {memoNo} | Date: {date} | Time: {time}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div><strong>Yard:</strong> {yard}</div>
                <div><strong>Line:</strong> {lineNo || "-"}</div>
                <div><strong>Created By:</strong> {createdBy}</div>
                <div><strong>Wagon Count:</strong> {wagons.length}</div>
              </div>
              <div className="border border-yellow-300 rounded overflow-hidden">
                <Table className="bg-white/50 text-sm">
                  <TableHeader className="bg-yellow-100">
                    <TableRow>
                      <TableHead className="font-semibold text-black">Wagon No</TableHead>
                      <TableHead className="font-semibold text-black">Type</TableHead>
                      <TableHead className="font-semibold text-black">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wagons.map((w, i) => (
                      <TableRow key={i}>
                        <TableCell>{w.wagonNo || "—"}</TableCell>
                        <TableCell>{w.type}</TableCell>
                        <TableCell>{w.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20">
          <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          
          {step < 3 ? (
            <Button onClick={() => setStep(s => Math.min(3, s + 1))}>
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" /> Send to Sick Line
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
