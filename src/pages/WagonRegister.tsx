import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { WagonTable } from "@/components/WagonTable";
import { WagonInput } from "@/components/WagonInput";
import { ExportButton } from "@/components/ExportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WagonRepair, WagonDetails, SickLine, RepairType, generateId } from "@/lib/wagonData";
import { PriorityLevel, RepairTask } from "@/types/index";
import { Train, ListFilter, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";

export default function WagonRegister() {
  const { wagons: zustandWagons, workflows, addWagon, updateWagon, removeWagon } = useAppStore();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("filterStatus") || "all");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Map Zustand Wagons to WagonRepair format for the WagonTable component
  const mappedWagons: WagonRepair[] = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    
    return zustandWagons.map(w => {
      const wf = workflows.find(wfItem => wfItem.wagonId === w.id);
      
      const isTankWagon = ["BTPN", "BTPFLN", "BTPNHS", "BTPGLN"].includes((w.type || "").toUpperCase());
      let hasStatusConflict = false;
      let allDone = false;
      
      if (wf && wf.stages.length > 0) {
        allDone = wf.stages.every(st => st.status === "Done");
        if (isTankWagon && w.status === "Fit For Loading" && !allDone) {
          hasStatusConflict = true;
        }
      }

      let isFit = w.status === "Fit For Loading" || (w.status as string) === "Completed";
      if (allDone) isFit = true;
      if (hasStatusConflict) isFit = false; // Don't show as fit if there's a conflict

      let isSick = w.status === "Cut Off" || w.status === "Sick Line" || (w.status as string) === "Sick";
      let isRepair = w.status === "Under Repair";

      if (wf && wf.stages.length > 0) {
        const currentStageName = wf.currentStage;
        const currentStageRecord = wf.stages.find(st => st.stageName === currentStageName);
        
        // Use the store status to dictate visual badge if possible
        if (w.status === "Cut Off" || w.status === "Sick Line" || w.status === "Issue Marked" || (w.status as string) === "Sick") {
          isSick = true;
          isRepair = false;
        } else if (w.status === "Under Repair" || w.status === "Under Inspection" || w.status === "Awaiting Testing" || w.status === "Awaiting Final Inspection") {
          isSick = false;
          isRepair = true;
        } else {
           // Fallback to workflow stage if store status doesn't match
           const isFirstStage = currentStageName === wf.stages[0].stageName;
           const isFirstStageDone = isFirstStage && currentStageRecord?.status === "Done";
           
           if (isFirstStage && !isFirstStageDone) {
             isSick = true;
             isRepair = false;
           } else {
             isSick = false;
             isRepair = true;
           }
        }
      }

      let mappedStatus = "all";
      if (isFit) mappedStatus = "fit";
      else if (isRepair || hasStatusConflict) mappedStatus = "in-repair";
      else if (isSick) mappedStatus = "sick";
      
      const isToday = w.updatedAt?.startsWith(todayStr);
      
      return {
        id: w.id,
        wagonNumber: w.wagonNo,
        details: {
          wagonNumber: w.wagonNo,
          typeCode: "00",
          typeName: w.type || "Other",
          category: ["BOXN", "BOXNHL", "BOXNHS", "BOXNHA", "BOST"].includes(w.type || "") ? "Open Wagon" : 
                   ["BCN", "BCNA", "BCNMI", "BCNHL"].includes(w.type || "") ? "Covered Wagon" : 
                   ["BLC", "BLL", "BRNA", "BRNAHS"].includes(w.type || "") ? "Flat Wagon" :
                   ["BOBYN", "BOBYNHS", "BOBRN", "BOBRNHS", "BOBRAL"].includes(w.type || "") ? "Hopper Wagon" :
                   w.type?.includes("BTP") ? "Tank Wagon" : "Other",
          railwayCode: "00",
          railwayName: w.owner || "Unknown",
          yearOfManufacture: String(w.builtYear || "2000"),
          serialNumber: "0000",
          checkDigit: "0",
          isValidCheckDigit: true
        },
        repairTypes: w.repairTypes || [],
        primaryRepair: w.repairTypes?.[0] || "",
        secondaryRepairs: w.repairTypes?.slice(1) || [],
        arrivalDate: w.updatedAt || new Date().toISOString(),
        arrivalTime: "00:00",
        trainNumber: w.rakeId || "",
        sickLine: (w as any).sickLine || "line1",
        status: mappedStatus as any, // Type coercion to avoid TS errors on new statuses
        isToday,
        hasStatusConflict,
        comments: w.comments || w.defect, // prefer comments, fallback to defect
      } as unknown as WagonRepair & { isToday: boolean };
    });
  }, [zustandWagons, workflows]);

  // Apply Search & Filters
  const filteredWagons = useMemo(() => {
    let result = mappedWagons;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(w => 
        w.wagonNumber.toLowerCase().includes(q) ||
        w.details.typeName.toLowerCase().includes(q) ||
        w.details.railwayName.toLowerCase().includes(q) ||
        w.details.category.toLowerCase().includes(q)
      );
    }

    if (filterStatus !== "all") {
      if (filterStatus === "today") {
        result = result.filter(w => (w as any).isToday);
      } else {
        result = result.filter(w => w.status === filterStatus);
      }
    }

    if (filterType !== "all") {
      result = result.filter(w => w.details.typeName === filterType);
    }

    if (filterCategory !== "all") {
      result = result.filter(w => w.details.category === filterCategory);
    }

    return result;
  }, [mappedWagons, search, filterStatus, filterType, filterCategory]);

  const stats = useMemo(() => {
    const total = mappedWagons.length;
    const sick = mappedWagons.filter(w => w.status === "in-repair" || w.status === "sick").length;
    const fit = mappedWagons.filter(w => w.status === "completed").length;
    
    const categories = mappedWagons.reduce((acc, w) => {
      const cat = w.details.category;
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, sick, fit, categories };
  }, [mappedWagons]);

  const handleWagonParsed = (
    details: WagonDetails, 
    trainNumber: string, 
    arrivalDate: string, 
    arrivalTime: string, 
    sickLine: string, 
    repairTasks: RepairTask[], 
    comments: string,
    priority: PriorityLevel,
    isDegassed?: boolean,
    isSteamed?: boolean
  ) => {
    addWagon({
      wagonNo: details.wagonNumber,
      type: details.typeName,
      owner: details.railwayName,
      builtYear: parseInt(details.yearOfManufacture) || new Date().getFullYear(),
      status: "Cut Off",
      defect: repairTasks.map(r => r.subRepair).join(", ") + (comments ? ` | ${comments}` : ""),
      updatedAt: arrivalDate,
      priority: priority,
      repairTasks: repairTasks,
      rakeId: trainNumber
    });
    toast({ title: "Wagon Added", description: `Wagon ${details.wagonNumber} added to register.` });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wagon Register</h1>
          <p className="text-sm text-muted-foreground">Comprehensive search, filter, and management of all wagons.</p>
        </div>
        <ExportButton wagons={filteredWagons} selectedWagons={[]} />
      </div>

      {/* Advanced Search & Filter Bar */}
      <Card className="border-primary/20 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <Input 
            placeholder="Search wagon number, type, owner, category..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sick">Sick Wagons</SelectItem>
              <SelectItem value="in-repair">In Repair</SelectItem>
              <SelectItem value="fit">Completed / Fit</SelectItem>
              <SelectItem value="today">Today Arrivals</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Open Wagon">Open Wagon</SelectItem>
              <SelectItem value="Covered Wagon">Covered Wagon</SelectItem>
              <SelectItem value="Tank Wagon">Tank Wagon</SelectItem>
              <SelectItem value="Flat Wagon">Flat Wagon</SelectItem>
              <SelectItem value="Hopper Wagon">Hopper Wagon</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="bg-slate-50"><CardContent className="p-3 text-center"><div className="text-xs text-muted-foreground">Total</div><div className="text-xl font-bold">{stats.total}</div></CardContent></Card>
        <Card className="bg-red-50"><CardContent className="p-3 text-center"><div className="text-xs text-red-600">In Repair</div><div className="text-xl font-bold text-red-700">{stats.sick}</div></CardContent></Card>
        <Card className="bg-green-50"><CardContent className="p-3 text-center"><div className="text-xs text-green-600">Completed</div><div className="text-xl font-bold text-green-700">{stats.fit}</div></CardContent></Card>
        
        {["Open Wagon", "Covered Wagon", "Tank Wagon", "Flat Wagon", "Hopper Wagon"].map(cat => (
          <Card key={cat}><CardContent className="p-3 text-center"><div className="text-xs text-muted-foreground truncate" title={cat}>{cat}</div><div className="text-lg font-bold">{stats.categories[cat] || 0}</div></CardContent></Card>
        ))}
      </div>

      <WagonInput onWagonParsed={handleWagonParsed} />

      <WagonTable 
        wagons={filteredWagons}
        filter="all"
        onComplete={(id) => { updateWagon(id, { status: "Fit For Loading" }); toast({title:"Marked Fit"}); }}
        onUndoComplete={(id) => { updateWagon(id, { status: "Cut Off" }); toast({title:"Undo Fit"}); }}
        onDelete={(id) => { removeWagon(id); toast({title:"Deleted"}); }}
        onUpdateSickLine={(id, sl) => updateWagon(id, { sickLine: sl } as any)}
        onEdit={(id, up) => updateWagon(id, { defect: up.comments })}
        isAdmin={isAdmin}
      />
    </div>
  );
}
