import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WAGON_TYPES } from "@/types";
import { toast } from "sonner";

export default function RakeManagement() {
  const store = useAppStore();
  const [form, setForm] = useState({ rakeId: "", rakeName: "", yard: "" });
  const [selectedRake, setSelectedRake] = useState<string | null>(store.rakes[0]?.id ?? null);

  const rake = store.rakes.find((r) => r.id === selectedRake);
  const wagonsInRake = store.wagons.filter((w) => w.rakeId === selectedRake);

  const createRake = () => {
    if (!form.rakeId) return toast.error("Rake ID required");
    const r = store.addRake({ rakeId: form.rakeId, rakeName: form.rakeName, yard: form.yard });
    setSelectedRake(r.id);
    setForm({ rakeId: "", rakeName: "", yard: "" });
    toast.success("Rake created");
  };

  const addWagon = () => {
    if (!selectedRake) return;
    const w = store.addWagon({ wagonNo: "", type: "BTPN", owner: "", builtYear: new Date().getFullYear(), status: "In Service", rakeId: selectedRake });
    store.addWagonToRake(selectedRake, w.id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rake Management</h1>
        <p className="text-sm text-muted-foreground">Create rakes, add wagons, mark defective wagons for sick line.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Create Rake</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Rake ID</Label><Input value={form.rakeId} onChange={(e) => setForm({ ...form, rakeId: e.target.value })} /></div>
            <div><Label>Rake Name</Label><Input value={form.rakeName} onChange={(e) => setForm({ ...form, rakeName: e.target.value })} /></div>
            <div><Label>Yard</Label><Input value={form.yard} onChange={(e) => setForm({ ...form, yard: e.target.value })} /></div>
            <Button className="w-full" onClick={createRake}><Plus className="h-4 w-4 mr-1" /> Create Rake</Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Rakes</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {store.rakes.map((r) => (
                <button key={r.id} onClick={() => setSelectedRake(r.id)}
                  className={`text-left border rounded-lg p-3 hover:bg-muted/40 ${selectedRake === r.id ? "border-primary bg-primary/5" : ""}`}>
                  <div className="font-mono font-semibold">{r.rakeId}</div>
                  <div className="text-sm">{r.rakeName}</div>
                  <div className="text-xs text-muted-foreground">{r.yard} · {r.wagonIds.length} wagons</div>
                </button>
              ))}
              {store.rakes.length === 0 && <div className="text-sm text-muted-foreground">No rakes yet.</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {rake && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{rake.rakeName} · {rake.rakeId}</CardTitle>
              <div className="text-xs text-muted-foreground">{rake.yard}</div>
            </div>
            <Button size="sm" onClick={addWagon}><Plus className="h-4 w-4 mr-1" /> Add Wagon</Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="text-left p-2">Wagon No</th><th className="text-left p-2">Type</th><th className="text-left p-2">Owner</th>
                  <th className="text-left p-2">Built</th><th className="text-left p-2">Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {wagonsInRake.map((w) => (
                  <tr key={w.id} className="border-b last:border-0">
                    <td className="p-2"><Input value={w.wagonNo} onChange={(e) => store.updateWagon(w.id, { wagonNo: e.target.value })} className="h-8" /></td>
                    <td className="p-2">
                      <Select value={w.type as string} onValueChange={(v) => store.updateWagon(w.id, { type: v })}>
                        <SelectTrigger className="h-8 min-w-[110px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{WAGON_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="p-2"><Input value={w.owner} onChange={(e) => store.updateWagon(w.id, { owner: e.target.value })} className="h-8" /></td>
                    <td className="p-2"><Input value={String(w.builtYear)} onChange={(e) => store.updateWagon(w.id, { builtYear: e.target.value })} className="h-8 w-20" /></td>
                    <td className="p-2"><Badge variant={w.status === "REPAIR_IN_PROGRESS" ? "destructive" : "secondary"}>{w.status}</Badge></td>
                    <td className="p-2 text-right space-x-1">
                      <Button size="sm" variant="outline" onClick={() => store.markDefective(w.id)}>
                        <AlertTriangle className="h-4 w-4 mr-1" /> Mark Defective
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => store.removeWagon(w.id)}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
                {wagonsInRake.length === 0 && <tr><td colSpan={6} className="text-center text-muted-foreground py-6">No wagons in this rake.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
