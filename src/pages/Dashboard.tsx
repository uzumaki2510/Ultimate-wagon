import { useState, useEffect, useMemo } from "react";

import { useAppStore } from "@/store/useAppStore";
import { StatCard } from "@/components/StatCard";
import { FileText, AlertTriangle, Wrench, ClipboardCheck, Train, CheckCircle2, Hourglass, ListFilter, CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { WagonInput } from "@/components/WagonInput";
import { WagonTable } from "@/components/WagonTable";
import { StatsCards } from "@/components/StatsCards";
import { ExportButton } from "@/components/ExportButton";
import {
  WagonDetails,
  WagonRepair,
  SickLine,
  BTPGLNWorkflowData,
  BTPNWorkflowData,
  RepairType,
  generateId,
  loadWagons,
  saveWagons,
  loadDeletedWagons,
  saveDeletedWagons,
  checkAndArchiveMonthlyData,
} from "@/lib/wagonData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export default function Dashboard() {
  const { memos, wagons: storeWagons, audit } = useAppStore();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  // ── Memo Stats ──────────────────────────────────────
  const totalMemos = memos.length;
  const cutOff = storeWagons.filter((w) => w.status === "Cut Off").length;
  const sickLine = storeWagons.filter((w) => w.status === "Sick Line").length;
  const underRepair = storeWagons.filter((w) => w.status === "Under Repair").length;
  const awaiting = storeWagons.filter((w) => w.status === "Awaiting Inspection").length;
  const fit = storeWagons.filter((w) => w.status === "Fit For Loading").length;
  const pendingApproval = memos.reduce((n, m) => n + m.approvals.filter((a) => a.status === "Pending").length, 0);

  // ── Wagon Register State ─────────────────────────────
  const [wagons, setWagons] = useState<WagonRepair[]>([]);
  const [deletedWagons, setDeletedWagons] = useState<WagonRepair[]>([]);
  const [selectedWagons, setSelectedWagons] = useState<WagonRepair[]>([]);
  const [tableFilter, setTableFilter] = useState<"in-repair" | "completed">("in-repair");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const archiveResult = checkAndArchiveMonthlyData();
    if (archiveResult.archived) {
      toast({
        title: "Monthly Archive Created",
        description: `${archiveResult.wagonCount} wagons from ${archiveResult.monthLabel} have been archived.`,
      });
    }
    setWagons(loadWagons());
    setDeletedWagons(loadDeletedWagons());
  }, []);

  useEffect(() => { saveWagons(wagons); }, [wagons]);
  useEffect(() => { saveDeletedWagons(deletedWagons); }, [deletedWagons]);

  const filteredByDateWagons = useMemo(() => {
    let result = wagons;
    if (dateFrom) result = result.filter((w) => new Date(w.arrivalDate) >= dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      result = result.filter((w) => new Date(w.arrivalDate) <= end);
    }
    return result;
  }, [wagons, dateFrom, dateTo]);

  const handleWagonParsed = (
    details: WagonDetails, trainNumber: string, arrivalDate: string,
    arrivalTime: string, sickLine: string, repairTypes: RepairType[], comments: string
  ) => {
    const exists = wagons.some((w) => w.wagonNumber === details.wagonNumber);
    if (exists) {
      toast({ title: "Wagon Already Exists", description: `Wagon ${details.wagonNumber} is already in the system.`, variant: "destructive" });
      return;
    }
    const newWagon: WagonRepair = {
      id: generateId(),
      wagonNumber: details.wagonNumber,
      details,
      repairTypes,
      arrivalDate,
      arrivalTime,
      trainNumber,
      sickLine: sickLine as SickLine,
      status: "in-repair",
      comments: comments || undefined,
    };
    setWagons((prev) => [newWagon, ...prev]);
    toast({ title: "Wagon Added", description: `Wagon ${details.wagonNumber} added to arrival register.` });
  };

  const handleComplete = (id: string) => {
    setWagons((prev) => prev.map((w) => w.id === id ? { ...w, status: "completed", completedDate: new Date().toISOString() } : w));
    toast({ title: "Wagon Fit", description: "Wagon marked as fit (completed)." });
  };

  const handleUndoComplete = (id: string) => {
    setWagons((prev) => prev.map((w) => w.id === id ? { ...w, status: "in-repair", completedDate: undefined } : w));
    toast({ title: "Undo Successful", description: "Wagon reverted to sick (in-repair) status." });
  };

  const handleUpdateSickLine = (id: string, sickLine: SickLine) => {
    setWagons((prev) => prev.map((w) => w.id === id ? { ...w, sickLine } : w));
  };

  const handleEditWagon = (id: string, updates: Partial<WagonRepair>) => {
    setWagons((prev) => prev.map((w) => w.id === id ? { ...w, ...updates } : w));
    toast({ title: "Wagon Updated", description: "Wagon details have been updated." });
  };

  const handleDelete = (id: string) => {
    const wagonToDelete = wagons.find((w) => w.id === id);
    if (wagonToDelete) {
      setDeletedWagons((prev) => [wagonToDelete, ...prev]);
      setWagons((prev) => prev.filter((w) => w.id !== id));
      toast({ title: "Wagon Moved to Deleted", description: "Wagon moved to deleted section." });
    }
  };

  const handleUpdateBTPGLNWorkflow = (id: string, workflow: BTPGLNWorkflowData) => {
    setWagons((prev) => prev.map((w) => w.id === id ? { ...w, btpglnWorkflow: workflow } : w));
  };

  const handleUpdateBTPNWorkflow = (id: string, workflow: BTPNWorkflowData) => {
    setWagons((prev) => prev.map((w) => w.id === id ? { ...w, btpnWorkflow: workflow } : w));
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── KPI Stats ────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operations Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live overview of memos, sick line, and approvals.</p>
      </div>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Total Memos" value={totalMemos} icon={FileText} tone="info" />
        <StatCard label="Wagons Cut Off" value={cutOff} icon={AlertTriangle} tone="danger" />
        <StatCard label="In Sick Line" value={sickLine} icon={Train} tone="warning" />
        <StatCard label="Under Repair" value={underRepair} icon={Wrench} tone="warning" />
        <StatCard label="Awaiting Inspection" value={awaiting} icon={Hourglass} tone="default" />
        <StatCard label="Fit For Loading" value={fit} icon={CheckCircle2} tone="success" />
        <StatCard label="Pending Approval" value={pendingApproval} icon={ClipboardCheck} tone="info" />
      </div>

      {/* ── Wagon Arrival Entry ───────────────────── */}
      <div className="border-t pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Wagon Arrival Entry</h2>
            <p className="text-sm text-muted-foreground">Register incoming wagons, track their repair status, and manage sick line assignments.</p>
          </div>
          <ExportButton wagons={filteredByDateWagons} selectedWagons={selectedWagons} />
        </div>

        {/* Wagon Repair Stats */}
        <StatsCards wagons={wagons} />

        {/* Wagon Input */}
        <div className="mt-4">
          <WagonInput onWagonParsed={handleWagonParsed} />
        </div>

        {/* Wagon Table Section */}
        <div className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ListFilter className="h-5 w-5 text-muted-foreground" />
              <Tabs value={tableFilter} onValueChange={(v) => setTableFilter(v as typeof tableFilter)}>
                <TabsList>
                  <TabsTrigger value="in-repair">Sick ({wagons.filter(w => w.status === "in-repair").length})</TabsTrigger>
                  <TabsTrigger value="completed">Fit ({wagons.filter(w => w.status === "completed").length})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd MMM") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dateTo ? format(dateTo, "dd MMM") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <WagonTable
            wagons={filteredByDateWagons}
            onComplete={handleComplete}
            onUndoComplete={handleUndoComplete}
            onDelete={handleDelete}
            onUpdateSickLine={handleUpdateSickLine}
            onEdit={handleEditWagon}
            onUpdateBTPGLNWorkflow={handleUpdateBTPGLNWorkflow}
            onUpdateBTPNWorkflow={handleUpdateBTPNWorkflow}
            onSelectionChange={setSelectedWagons}
            filter={tableFilter}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
