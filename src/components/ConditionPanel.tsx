import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { WagonRepair, DEFECT_LIBRARY } from "@/lib/wagonData";
import { RepairTask } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DefectTimeline } from "./DefectTimeline";
import { 
  AlertCircle, AlertTriangle, CheckCircle, Info, Search, 
  Filter, Calendar, Clock, MapPin, User, FileText, 
  Printer, Download, Wrench, FileImage, ImageIcon,
  CheckCircle2, AlertOctagon
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { EditConditionDialog } from "./EditConditionDialog";

interface ConditionPanelProps {
  wagon: WagonRepair;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defects?: RepairTask[];
  severityInfo?: { level: string, color: string, text: string, bg: string, icon: any };
}

export function ConditionPanel({ wagon, open, onOpenChange, defects: initialDefects, severityInfo: initialSeverityInfo }: ConditionPanelProps) {
  const updateWagon = useAppStore(state => state.updateWagon);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [editingDefect, setEditingDefect] = useState<RepairTask | null>(null);

  const handleSaveDefect = async (updatedDefect: RepairTask) => {
    if (updatedDefect.category === "Legacy") {
      const newTask = { ...updatedDefect, category: "Converted" };
      const newRepairTasks = [...((wagon as any).repairTasks || []), newTask];
      
      const newPrimary = wagon.primaryRepair === updatedDefect.subRepair ? undefined : wagon.primaryRepair;
      const newSecondary = wagon.secondaryRepairs?.filter(r => r !== updatedDefect.subRepair);

      await updateWagon(wagon.id, { 
        repairTasks: newRepairTasks,
        primaryRepair: newPrimary,
        secondaryRepairs: newSecondary
      } as any, "System");
    } else {
      const newRepairTasks = ((wagon as any).repairTasks || []).map((rt: RepairTask) => 
        (rt.id === updatedDefect.id || rt.subRepair === updatedDefect.subRepair) ? updatedDefect : rt
      );
      await updateWagon(wagon.id, { repairTasks: newRepairTasks } as any, "System");
    }
  };

  const defects = React.useMemo(() => {
    if (initialDefects) return initialDefects;
    const list: RepairTask[] = [];
    if ((wagon as any).repairTasks && (wagon as any).repairTasks.length > 0) {
      list.push(...(wagon as any).repairTasks);
    } else {
      if (wagon.primaryRepair) list.push({ id: crypto.randomUUID(), category: "Legacy", subRepair: wagon.primaryRepair, severity: "Normal" } as any);
      if (wagon.secondaryRepairs && wagon.secondaryRepairs.length > 0) {
        list.push(...wagon.secondaryRepairs.map(r => ({ id: crypto.randomUUID(), category: "Legacy", subRepair: r, severity: "Normal" } as any)));
      }
    }
    return list;
  }, [wagon, initialDefects]);

  const severityInfo = React.useMemo(() => {
    if (initialSeverityInfo) return initialSeverityInfo;
    let hasCritical = false;
    let hasUrgent = false;

    for (const defect of defects) {
      for (const group of DEFECT_LIBRARY) {
        const def = group.defects.find(d => d.name === defect.subRepair);
        if (def) {
          if (def.severity === "Safety Critical") hasCritical = true;
          if (def.severity === "Urgent") hasUrgent = true;
        }
      }
    }

    if ((wagon.status as any) === "FIT_READY" || (wagon.status as any) === "RELEASED" || wagon.status === "completed" || (wagon.status as string) === "fit") {
      return { level: "Resolved", color: "border-green-500", text: "text-green-700 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950", icon: CheckCircle };
    }

    if (hasCritical || wagon.status === "sick" || (wagon.status as string) === "SICK_LINE") {
      return { level: "Critical", color: "border-red-500", text: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950", icon: AlertCircle };
    }
    if (hasUrgent || wagon.status === "in-repair" || (wagon.status as any) === "REPAIR_IN_PROGRESS") {
      return { level: "Major", color: "border-orange-500", text: "text-orange-700 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950", icon: AlertTriangle };
    }
    
    return { level: "Minor", color: "border-blue-500", text: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950", icon: Info };
  }, [defects, wagon.status, initialSeverityInfo]);

  const total = defects.length || 1;
  const repaired = (wagon.status === "completed" || (wagon.status as string) === "fit" || (wagon.status as any) === "FIT_READY") ? total : 0;
  const pending = total - repaired;

  const groupedDefects = React.useMemo(() => {
    const groups: Record<string, RepairTask[]> = {};
    const others: RepairTask[] = [];
    
    if (defects.length === 0 && wagon.comments) {
      others.push({ id: crypto.randomUUID(), category: "Legacy", subRepair: wagon.comments, severity: "Normal" } as any);
    } else {
      defects.forEach(defect => {
        let found = false;
        for (const g of DEFECT_LIBRARY) {
          if (g.defects.some(d => d.name === defect.subRepair)) {
            if (!groups[g.groupName]) groups[g.groupName] = [];
            groups[g.groupName].push(defect);
            found = true;
            break;
          }
        }
        if (!found) others.push(defect);
      });
    }

    if (others.length > 0) {
      groups["Other / Remarks"] = others;
    }
    return groups;
  }, [defects, wagon.comments]);

  const getSeverityInfoForDefect = (defectName: string) => {
    for (const group of DEFECT_LIBRARY) {
      const def = group.defects.find(d => d.name === defectName);
      if (def) {
        if (def.severity === "Safety Critical") return { level: "Critical", color: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400" };
        if (def.severity === "Urgent") return { level: "Major", color: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400" };
      }
    }
    return { level: "Minor", color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400" };
  };

  const defectStatus = ((wagon.status as any) === "FIT_READY" || wagon.status === "completed" || (wagon.status as string) === "fit") ? "Completed" : "Pending";
  const defectStatusColor = defectStatus === "Completed" ? "text-green-600 bg-green-100" : "text-amber-600 bg-amber-100";

  const Content = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b shrink-0 bg-secondary/20">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold font-mono text-primary flex items-center gap-2">
              {wagon.wagonNumber}
              <Badge variant="outline" className={`ml-2 uppercase ${severityInfo.text} ${severityInfo.bg} ${severityInfo.color}`}>
                {severityInfo.level}
              </Badge>
            </h2>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-2 font-medium">
              <span>{wagon.details.typeName} ({wagon.details.category})</span>
              <span>•</span>
              <span>{wagon.details.railwayName}</span>
              <span>•</span>
              <span>Chk: {wagon.details.checkDigit}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-2 rounded-md bg-background border flex flex-col gap-1">
            <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Inspection Date</span>
            <span className="font-semibold">{wagon.arrivalDate ? new Date(wagon.arrivalDate).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="p-2 rounded-md bg-background border flex flex-col gap-1">
            <span className="text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Assigned Employee</span>
            <span className="font-semibold">SSE Mechanical</span>
          </div>
          <div className="p-2 rounded-md bg-background border flex flex-col gap-1">
            <span className="text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> Memo Number</span>
            <span className="font-semibold font-mono">{wagon.wagonNumber.slice(-4)}-M</span>
          </div>
          <div className="p-2 rounded-md bg-background border flex flex-col gap-1">
            <span className="text-muted-foreground flex items-center gap-1"><AlertOctagon className="w-3 h-3" /> Current Status</span>
            <span className="font-semibold">{wagon.status === 'in-repair' ? 'Under Repair' : wagon.status === 'sick' ? 'Sick Line' : 'Fit Ready'}</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
        <div className="px-4 md:px-6 pt-2 border-b shrink-0">
          <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 font-semibold">
              Overview
            </TabsTrigger>
            <TabsTrigger value="defects" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 font-semibold">
              Condition Details ({defects.length})
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 font-semibold">
              Media & Docs
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900/20">
          <TabsContent value="overview" className="m-0 space-y-6 animate-in fade-in-50 duration-300">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-card border rounded-lg p-3 shadow-sm flex flex-col justify-between">
                <span className="text-xs text-muted-foreground font-semibold">Total Defects</span>
                <span className="text-2xl font-bold mt-1">{total}</span>
              </div>
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg p-3 shadow-sm flex flex-col justify-between">
                <span className="text-xs text-red-600 dark:text-red-400 font-semibold">Critical</span>
                <span className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {defects.filter(d => getSeverityInfoForDefect(d.subRepair).level === "Critical").length}
                </span>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900 rounded-lg p-3 shadow-sm flex flex-col justify-between">
                <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">Major</span>
                <span className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {defects.filter(d => getSeverityInfoForDefect(d.subRepair).level === "Major").length}
                </span>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-lg p-3 shadow-sm flex flex-col justify-between">
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">Resolved</span>
                <span className="text-2xl font-bold text-green-700 dark:text-green-300">{repaired}</span>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
                <span>Repair Progress</span>
                <span className="text-xs text-muted-foreground font-normal">Est. Time: 4 Hrs</span>
              </h3>
              <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all" 
                  style={{ width: `${(repaired / total) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-2 font-medium">
                <span className="text-muted-foreground">{repaired} Repaired</span>
                <span className="text-primary">{pending} Pending</span>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <DefectTimeline wagon={wagon} />
            </div>
          </TabsContent>

          <TabsContent value="defects" className="m-0 space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex gap-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search defects..." 
                className="pl-9 h-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                <Filter className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {Object.entries(groupedDefects).map(([groupName, groupDefects]) => {
                const filtered = groupDefects.filter(d => d.subRepair.toLowerCase().includes(searchQuery.toLowerCase()));
                if (filtered.length === 0) return null;

                return (
                  <div key={groupName} className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b pb-1">
                      {groupName}
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{filtered.length}</Badge>
                    </h3>
                    
                    <div className="grid gap-3">
                      {filtered.map((defect, i) => {
                        const sev = getSeverityInfoForDefect(defect.subRepair);
                        const displayStatus = defect.status ? defect.status.replace("_", " ") : defectStatus;
                        const dColor = defect.status === "repaired" ? "text-green-600 bg-green-100" : (defect.status === "pending" ? "text-amber-600 bg-amber-100" : "text-blue-600 bg-blue-100");
                        
                        return (
                          <div key={defect.id || i} className="bg-card border rounded-lg p-3.5 shadow-sm hover:border-primary/30 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                  {defect.subRepair}
                                </h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Badge variant="outline" className={`text-[10px] font-bold ${sev.color}`}>
                                    {sev.level}
                                  </Badge>
                                  <Badge variant="outline" className={`text-[10px] font-bold ${dColor} border-transparent capitalize`}>
                                    {displayStatus}
                                  </Badge>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 text-xs font-medium shrink-0"
                                onClick={() => setEditingDefect(defect)}
                              >
                                <Wrench className="w-3.5 h-3.5 mr-1.5" />
                                Edit
                              </Button>
                            </div>
                            
                            {(defect.location || defect.inspector || defect.reportedAt || defect.remarks) && (
                              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 mt-4 py-2 border-t text-[11px]">
                                {defect.location && (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>Location: <span className="font-medium text-foreground">{defect.location}</span></span>
                                  </div>
                                )}
                                {defect.inspector && (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <User className="w-3.5 h-3.5" />
                                    <span>Insp: <span className="font-medium text-foreground">{defect.inspector}</span></span>
                                  </div>
                                )}
                                {defect.reportedAt && (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Reported: <span className="font-medium text-foreground">{new Date(defect.reportedAt).toLocaleString()}</span></span>
                                  </div>
                                )}
                                {defect.remarks && (
                                  <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                    <span>Remarks: <span className="font-medium text-foreground italic">{defect.remarks}</span></span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {Object.keys(groupedDefects).length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No defects found.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="media" className="m-0 space-y-6 animate-in fade-in-50 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer min-h-[160px]">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Before Repair Images</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Click to upload or capture</div>
                  </div>
                </div>
                <div className="border border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer min-h-[160px]">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FileImage className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">After Repair Images</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Click to upload or capture</div>
                  </div>
                </div>
                <div className="border border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer min-h-[160px] md:col-span-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Inspection Documents</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Upload JO, RS4, or other inspection notes</div>
                  </div>
                </div>
             </div>
          </TabsContent>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-background shrink-0 flex flex-wrap gap-2 items-center justify-between">
           <div className="flex gap-2">
             <Button variant="outline" size="sm" className="h-8 text-xs font-medium hidden sm:flex">
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Sheet
             </Button>
             <Button variant="outline" size="sm" className="h-8 text-xs font-medium hidden sm:flex">
                <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
             </Button>
           </div>
           <div className="flex gap-2 w-full sm:w-auto">
             <Button variant="outline" size="sm" className="h-9 flex-1 sm:flex-none">
                Assign Repair
             </Button>
             <Button size="sm" className="h-9 flex-1 sm:flex-none gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Mark Repaired
             </Button>
           </div>
        </div>
      </Tabs>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[100vw] sm:max-w-[600px] md:max-w-[700px] p-0 flex flex-col gap-0 border-l-0 sm:border-l shadow-2xl h-[100dvh]">
        <SheetHeader className="sr-only">
          <SheetTitle>Condition Panel for {wagon.wagonNumber}</SheetTitle>
        </SheetHeader>
        <Content />
      </SheetContent>

      <EditConditionDialog
        wagonId={wagon.id}
        wagonNumber={wagon.wagonNumber}
        defect={editingDefect}
        onClose={() => setEditingDefect(null)}
        onSave={handleSaveDefect}
      />
    </Sheet>
  );
}
