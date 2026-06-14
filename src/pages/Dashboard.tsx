import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useAppStore } from "@/store/useAppStore";
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
  const navigate = useNavigate();
  const { memos, wagons: storeWagons, audit } = useAppStore();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  // ── Wagon Register State ─────────────────────────────
  const [wagons, setWagons] = useState<WagonRepair[]>([]);
  const [deletedWagons, setDeletedWagons] = useState<WagonRepair[]>([]);
  const [selectedWagons, setSelectedWagons] = useState<WagonRepair[]>([]);
  const [tableFilter, setTableFilter] = useState<"all" | "in-repair" | "completed">("in-repair");
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
    const loadedWagons = loadWagons();
    if (loadedWagons.length === 0) {
      // Seed exact data requested by user
      const seedWagons: WagonRepair[] = [
        {
          id: generateId(), wagonNumber: "BA-CR-22-1234-5", status: "in-repair", arrivalDate: new Date().toISOString(),
          repairTypes: ["body"], primaryRepair: "Main Frame Repair", secondaryRepairs: ["Buffer Gear", "Brake system check"],
          details: { wagonNumber: "BA-CR-22-1234-5", typeCode: "10", typeName: "BCN", category: "Covered Wagon", railwayCode: "01", railwayName: "CR", yearOfManufacture: "2022", serialNumber: "1234", checkDigit: "5", isValidCheckDigit: true }
        },
        {
          id: generateId(), wagonNumber: "SA-WR-23-4567-8", status: "in-repair", arrivalDate: new Date().toISOString(),
          repairTypes: ["wheel"], primaryRepair: "Axle Replacement", secondaryRepairs: ["Wheel Profile Rectification"],
          details: { wagonNumber: "SA-WR-23-4567-8", typeCode: "10", typeName: "BOXN", category: "Open Wagon", railwayCode: "08", railwayName: "WR", yearOfManufacture: "2023", serialNumber: "4567", checkDigit: "8", isValidCheckDigit: true }
        },
        {
          id: generateId(), wagonNumber: "DA-NR-21-9876-2", status: "in-repair", arrivalDate: new Date().toISOString(),
          repairTypes: ["brake"], primaryRepair: "Pneumatic System Overhaul", secondaryRepairs: ["Draw Gear", "Coupler check"],
          details: { wagonNumber: "DA-NR-21-9876-2", typeCode: "33", typeName: "BCNHL", category: "Covered Wagon", railwayCode: "03", railwayName: "NR", yearOfManufacture: "2021", serialNumber: "9876", checkDigit: "2", isValidCheckDigit: true }
        },
        {
          id: generateId(), wagonNumber: "EA-SR-24-3321-1", status: "in-repair", arrivalDate: new Date().toISOString(),
          repairTypes: ["body"], primaryRepair: "Side Body Rectification", secondaryRepairs: ["Rivet replacement", "Floor sheet"],
          details: { wagonNumber: "EA-SR-24-3321-1", typeCode: "12", typeName: "BOXNHS", category: "Open Wagon", railwayCode: "06", railwayName: "SR", yearOfManufacture: "2024", serialNumber: "3321", checkDigit: "1", isValidCheckDigit: true }
        },
        {
          id: generateId(), wagonNumber: "FA-ER-23-7744-9", status: "in-repair", arrivalDate: new Date().toISOString(),
          repairTypes: ["bogie"], primaryRepair: "Crankshaft Repair", secondaryRepairs: ["Piston replace"],
          details: { wagonNumber: "FA-ER-23-7744-9", typeCode: "30", typeName: "BCN", category: "Covered Wagon", railwayCode: "02", railwayName: "ER", yearOfManufacture: "2023", serialNumber: "7744", checkDigit: "9", isValidCheckDigit: true }
        }
      ];
      // Generate 13 more "in-repair" to make it 18 total
      for (let i = 0; i < 13; i++) {
        seedWagons.push({
          id: generateId(), wagonNumber: `DUMMY-SICK-${i}`, status: "in-repair", arrivalDate: new Date().toISOString(),
          repairTypes: ["body"], primaryRepair: "Minor Body Repair", secondaryRepairs: ["Paint touchup"],
          details: { wagonNumber: `DUMMY-SICK-${i}`, typeCode: "10", typeName: "BOXN", category: "Open Wagon", railwayCode: "01", railwayName: "CR", yearOfManufacture: "2022", serialNumber: "1234", checkDigit: "5", isValidCheckDigit: true }
        });
      }
      // Generate 17 "completed" to make it 35 total wagons
      for (let i = 0; i < 17; i++) {
        seedWagons.push({
          id: generateId(), wagonNumber: `DUMMY-FIT-${i}`, status: "completed", arrivalDate: new Date().toISOString(), completedDate: new Date().toISOString(),
          repairTypes: ["wheel"], primaryRepair: "Wheel Turn", secondaryRepairs: [],
          details: { wagonNumber: `DUMMY-FIT-${i}`, typeCode: "10", typeName: "BOXN", category: "Open Wagon", railwayCode: "01", railwayName: "CR", yearOfManufacture: "2022", serialNumber: "1234", checkDigit: "5", isValidCheckDigit: true }
        });
      }
      setWagons(seedWagons);
    } else {
      setWagons(loadedWagons);
    }
    
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
        <StatsCards 
          wagons={wagons} 
          filter={tableFilter} 
          onFilterChange={(f) => navigate(`/wagon-directory?status=${f}`)} 
        />

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
                  <TabsTrigger value="all">All ({wagons.length})</TabsTrigger>
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
