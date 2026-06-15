import { useState, useEffect, useMemo } from "react";
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
import { ListFilter, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { BTPGLN_STAGE_TO_LINE } from "@/components/BTPGLNWorkflow";
import { BTPN_STAGE_TO_LINE } from "@/components/BTPNWorkflow";

const WagonRegister = () => {
  const { isAdmin } = useAuth();
  const [wagons, setWagons] = useState<WagonRepair[]>([]);
  const [deletedWagons, setDeletedWagons] = useState<WagonRepair[]>([]);
  const [selectedWagons, setSelectedWagons] = useState<WagonRepair[]>([]);
  const [tableFilter, setTableFilter] = useState<"in-repair" | "completed">("in-repair");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  // Load wagons from localStorage on mount and check for monthly archive
  useEffect(() => {
    // Check and perform monthly archive if needed
    const archiveResult = checkAndArchiveMonthlyData();
    if (archiveResult.archived) {
      toast({
        title: "Monthly Archive Created",
        description: `${archiveResult.wagonCount} wagons from ${archiveResult.monthLabel} have been archived. Register has been reset for the new month.`,
      });
    }
    
    setWagons(loadWagons());
    setDeletedWagons(loadDeletedWagons());
  }, []);

  // Save wagons to localStorage when changed
  useEffect(() => {
    saveWagons(wagons);
  }, [wagons]);

  // Save deleted wagons to localStorage when changed
  useEffect(() => {
    saveDeletedWagons(deletedWagons);
  }, [deletedWagons]);

  // Filter wagons by date range
  const filteredByDateWagons = useMemo(() => {
    let result = wagons;
    if (dateFrom) {
      result = result.filter((w) => new Date(w.arrivalDate) >= dateFrom);
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter((w) => new Date(w.arrivalDate) <= endOfDay);
    }
    return result;
  }, [wagons, dateFrom, dateTo]);

  const handleWagonParsed = (
    details: WagonDetails,
    trainNumber: string,
    arrivalDate: string,
    arrivalTime: string,
    sickLine: string,
    repairTypes: RepairType[],
    comments: string,
    isDegassed?: boolean,
    isSteamed?: boolean
  ) => {
    // Check if wagon already exists
    const exists = wagons.some((w) => w.wagonNumber === details.wagonNumber);
    if (exists) {
      toast({
        title: "Wagon Already Exists",
        description: `Wagon ${details.wagonNumber} is already in the system.`,
        variant: "destructive",
      });
      return;
    }
    
    // Directly add the wagon with all details
    const newWagon: WagonRepair = {
      id: generateId(),
      wagonNumber: details.wagonNumber,
      details: details,
      repairTypes: repairTypes,
      arrivalDate: arrivalDate,
      arrivalTime: arrivalTime,
      trainNumber: trainNumber,
      sickLine: sickLine as SickLine,
      status: "in-repair",
      comments: comments || undefined,
      isDegassed: details.typeName === "BTPGLN" ? isDegassed : undefined,
      isSteamed: details.typeName === "BTPN" ? isSteamed : undefined,
    };

    setWagons((prev) => [newWagon, ...prev]);

    toast({
      title: "Wagon Added",
      description: `Wagon ${details.wagonNumber} added to arrival register.`,
    });
  };

  const handleComplete = (id: string) => {
    setWagons((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: "completed", completedDate: new Date().toISOString() }
          : w
      )
    );
    toast({
      title: "Wagon Fit",
      description: "Wagon marked as fit (completed).",
    });
  };

  const handleUndoComplete = (id: string) => {
    setWagons((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: "in-repair", completedDate: undefined }
          : w
      )
    );
    toast({
      title: "Undo Successful",
      description: "Wagon reverted back to sick (in-repair) status.",
    });
  };

  const handleUpdateSickLine = (id: string, sickLine: SickLine) => {
    setWagons((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, sickLine } : w
      )
    );
  };

  const handleEditWagon = (id: string, updates: Partial<WagonRepair>) => {
    setWagons((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      )
    );
    toast({
      title: "Wagon Updated",
      description: "Wagon details have been updated.",
    });
  };

  const handleDelete = (id: string) => {
    const wagonToDelete = wagons.find((w) => w.id === id);
    if (wagonToDelete) {
      setDeletedWagons((prev) => [wagonToDelete, ...prev]);
      setWagons((prev) => prev.filter((w) => w.id !== id));
      toast({
        title: "Wagon Moved to Deleted",
        description: "Wagon moved to deleted section. You can restore it anytime.",
      });
    }
  };

  const handleUpdateBTPGLNWorkflow = (id: string, workflow: BTPGLNWorkflowData) => {
    setWagons((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        // Auto-update sick line based on the new workflow stage
        const mappedLine = BTPGLN_STAGE_TO_LINE[workflow.currentStage];
        return { ...w, btpglnWorkflow: workflow, sickLine: mappedLine ?? w.sickLine };
      })
    );
  };

  const handleUpdateBTPNWorkflow = (id: string, workflow: BTPNWorkflowData) => {
    setWagons((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        // Auto-update sick line based on the new workflow stage
        const mappedLine = BTPN_STAGE_TO_LINE[workflow.currentStage];
        return { ...w, btpnWorkflow: workflow, sickLine: mappedLine ?? w.sickLine };
      })
    );
  };

  const handleSelectionChange = (selected: WagonRepair[]) => {
    setSelectedWagons(selected);
  };

  const clearDateFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wagon Repair Register</h1>
          <p className="text-sm text-muted-foreground">Add new arrivals and track wagon repair status.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton wagons={filteredByDateWagons} selectedWagons={selectedWagons} />
        </div>
      </div>

      {/* Stats */}
      <StatsCards wagons={wagons} />

      {/* Wagon Input Section */}
      <WagonInput onWagonParsed={handleWagonParsed} />

      {/* Wagon Table Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-muted-foreground" />
            <Tabs
              value={tableFilter}
              onValueChange={(v) => setTableFilter(v as typeof tableFilter)}
            >
              <TabsList>
                <TabsTrigger value="in-repair">Sick</TabsTrigger>
                <TabsTrigger value="completed">Fit</TabsTrigger>
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
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
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
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={clearDateFilter}>
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
          onSelectionChange={handleSelectionChange}
          filter={tableFilter}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
};

export default WagonRegister;