import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { WagonTable } from "@/components/WagonTable";
import { AddWagonModal } from "@/components/AddWagonModal";
import { FloatingAddWagonButton } from "@/components/FloatingAddWagonButton";
import { ExportButton } from "@/components/ExportButton";
import { Card, CardContent } from "@/components/ui/card";
import { WagonRepair, WagonDetails } from "@/lib/wagonData";
import { PriorityLevel, RepairTask } from "@/types/index";
import { Button } from "@/components/ui/button";
import { WagonCard } from "@/components/shared/WagonCard";
import { Train, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterBar } from "@/components/shared/FilterBar";
import { StatCard } from "@/components/shared/StatCard";

export default function WagonRegister() {
  const { wagons: zustandWagons, workflows, addWagon, updateWagon, removeWagon } = useAppStore();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("filterStatus") || "all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [addModalOpen, setAddModalOpen] = useState(searchParams.get("add") === "1");
  useEffect(() => { if (searchParams.get("add") === "1") setAddModalOpen(true); }, [searchParams]);

  const mappedWagons: WagonRepair[] = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    
    return zustandWagons.map(w => {
      const wf = workflows.find(wfItem => wfItem.wagonId === w.id);
      
      let mappedStatus = "all";
      if (w.status === "FIT_READY" || w.status === "RELEASED" || (w.status as string) === "completed") {
        mappedStatus = "fit";
      } else if (w.status === "FIT_CERTIFICATE_PENDING" || w.status === "REPAIR_COMPLETE") {
        mappedStatus = "pending-fit";
      } else if (w.status === "REPAIR_IN_PROGRESS" || (w.status as string) === "Under Repair") {
        mappedStatus = "in-repair";
      } else if (w.status === "SICK_LINE" || (w.status as string) === "Issue Marked" || (w.status as string) === "Cut Off" || (w.status as string) === "Sick Line" || (w.status as string) === "Sick") {
        mappedStatus = "sick";
      }
      
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
        repairTasks: w.repairTasks || [],
        arrivalDate: w.updatedAt || new Date().toISOString(),
        arrivalTime: "00:00",
        trainNumber: w.rakeId || "",
        sickLine: (w as any).sickLine || "line1",
        status: mappedStatus as any,
        isToday,
        comments: w.comments || w.defect,
        isSteamed: w.isSteamed,
        isDegassed: w.isDegassed,
        btpnWorkflow: (w as any).btpnWorkflow,
        btpglnWorkflow: (w as any).btpglnWorkflow,
      } as unknown as WagonRepair & { isToday: boolean };
    });
  }, [zustandWagons, workflows]);

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

    if (filterCategory !== "all") {
      result = result.filter(w => w.details.category === filterCategory);
    }

    return result;
  }, [mappedWagons, search, filterStatus, filterCategory]);

  const stats = useMemo(() => {
    const total = mappedWagons.length;
    const sick = mappedWagons.filter(w => w.status === "in-repair" || w.status === "sick").length;
    const fit = mappedWagons.filter(w => (w.status as string) === "fit" || w.status === "completed").length;
    
    const categories = mappedWagons.reduce((acc, w) => {
      const cat = w.details.category;
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, sick, fit, categories };
  }, [mappedWagons]);

  const handleWagonParsed = async (
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
    await addWagon({
      wagonNo: details.wagonNumber,
      type: details.typeName,
      owner: details.railwayName,
      builtYear: parseInt(details.yearOfManufacture) || new Date().getFullYear(),
      status: "SICK_LINE" as any,
      defect: repairTasks.map(r => r.subRepair).join(", ") + (comments ? ` | ${comments}` : ""),
      updatedAt: arrivalDate,
      priority: priority,
      repairTasks: repairTasks,
      rakeId: trainNumber,
      currentLocation: sickLine,
      isSteamed: isSteamed,
      isDegassed: isDegassed
    });
    toast({ title: "Wagon Added", description: `Wagon ${details.wagonNumber} added to register.` });
  };

  const statusOptions = [
    { label: "Sick Wagons", value: "sick" },
    { label: "In Repair", value: "in-repair" },
    { label: "Fit / Released", value: "fit" },
    { label: "Awaiting Fitness", value: "pending-fit" },
    { label: "Today Arrivals", value: "today" },
  ];

  const categoryOptions = [
    { label: "Open Wagon", value: "Open Wagon" },
    { label: "Covered Wagon", value: "Covered Wagon" },
    { label: "Tank Wagon", value: "Tank Wagon" },
    { label: "Flat Wagon", value: "Flat Wagon" },
    { label: "Hopper Wagon", value: "Hopper Wagon" },
  ];

  const filterBar = (
    <Card className="border-0 shadow-none md:border md:shadow-sm">
      <CardContent className="p-0 md:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar 
            value={search} 
            onChange={setSearch} 
            placeholder="Search wagon number, type, owner..." 
            className="flex-1" 
          />
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <FilterBar 
              value={filterStatus} 
              onChange={setFilterStatus} 
              options={statusOptions} 
              placeholder="Status" 
            />
            <FilterBar 
              value={filterCategory} 
              onChange={setFilterCategory} 
              options={categoryOptions} 
              placeholder="Category" 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <WorkspaceLayout 
      header={
        <PageHeader
          title="Wagons"
          description="Find a wagon, check its progress or register an arrival."
          icon={Train}
          actions={<><ExportButton wagons={filteredWagons} selectedWagons={[]} /><Button className="gap-2" onClick={() => setAddModalOpen(true)}><Plus className="h-4 w-4" />Add wagon</Button></>}
        />
      }
      filterBar={filterBar}
    >
      <div className="space-y-[var(--density-spacing-md,1rem)] animate-fade-in pb-12">
        <div className="hidden md:grid grid-cols-3 gap-[var(--density-spacing-sm,0.5rem)]">
        <StatCard title="Total" value={stats.total} className="bg-slate-50/50" />
        <StatCard title="In Repair" value={stats.sick} className="bg-red-50/50 text-red-700" />
        <StatCard title="Completed" value={stats.fit} className="bg-green-50/50 text-green-700" />
        

      </div>

      <p className="md:hidden text-sm text-muted-foreground" aria-live="polite">{filteredWagons.length} wagons · {stats.sick} in repair · {stats.fit} fit / released</p>
      <div className="md:hidden space-y-3">{filteredWagons.map(w => { const wagon = zustandWagons.find(record => record.id === w.id)!; return <WagonCard key={w.id} wagon={wagon} workflow={workflows.find(f => f.wagonId === w.id)} />; })}{!filteredWagons.length && <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">No matching wagons. Try clearing your filters.</p>}</div>
      <div className="hidden md:block"><WagonTable
        showSearch={false}
        wagons={filteredWagons}
        filter="all"
        onComplete={(id) => { window.location.assign(`/wagon/${id}?tab=defects`); }}
        onUndoComplete={async (id) => { await updateWagon(id, { status: "SICK_LINE" }); toast({title:"Wagon reopened"}); }}
        onDelete={async (id) => { await removeWagon(id); toast({title:"Deleted"}); }}
        onUpdateSickLine={(id, sl) => updateWagon(id, { currentLocation: sl })}
        onEdit={(id, up) => updateWagon(id, { defect: up.comments })}
        isAdmin={isAdmin}
      /></div>

      {/* Floating Action Button + Modal */}

      <AddWagonModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSubmit={handleWagonParsed}
        existingWagons={zustandWagons}
      />
      </div>
    </WorkspaceLayout>
  );
}
