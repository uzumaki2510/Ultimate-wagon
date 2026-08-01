import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DEFECT_LIBRARY, WagonRepair } from "@/lib/wagonData";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { ConditionPanel } from "./ConditionPanel";

interface ConditionSummaryProps {
  wagon: WagonRepair;
}

export function ConditionSummary({ wagon }: ConditionSummaryProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  const defects = useMemo(() => {
    const list: string[] = [];
    if (wagon.primaryRepair) list.push(wagon.primaryRepair);
    if (wagon.secondaryRepairs && wagon.secondaryRepairs.length > 0) {
      list.push(...wagon.secondaryRepairs);
    }
    return list;
  }, [wagon.primaryRepair, wagon.secondaryRepairs]);

  const severityInfo = useMemo(() => {
    let hasCritical = false;
    let hasUrgent = false;

    for (const defectName of defects) {
      for (const group of DEFECT_LIBRARY) {
        const def = group.defects.find(d => d.name === defectName);
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
  }, [defects, wagon.status]);

  const topDefect = defects.length > 0 ? defects[0] : (wagon.comments || "No specific defects listed");
  const additionalCount = defects.length > 1 ? defects.length - 1 : 0;
  
  // Calculate mock repair progress based on workflow status
  const total = defects.length || 1;
  const repaired = (wagon.status === "completed" || (wagon.status as string) === "fit" || (wagon.status as any) === "FIT_READY") ? total : 0;
  const pending = total - repaired;

  const getCategoryIcon = (defectName: string) => {
    for (const group of DEFECT_LIBRARY) {
      if (group.defects.some(d => d.name === defectName)) {
        if (group.groupName.includes("Wheel")) return "🛞";
        if (group.groupName.includes("Brake")) return "🛑";
        if (group.groupName.includes("Coupler")) return "🔗";
        if (group.groupName.includes("Body") || group.groupName.includes("Underframe")) return "🚪";
        if (group.groupName.includes("Bogie")) return "⚙";
        if (group.groupName.includes("Tank")) return "🧯";
      }
    }
    return "🔧";
  };

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              onClick={() => setPanelOpen(true)}
              className={`flex flex-col gap-1 p-2 rounded-md border-l-4 ${severityInfo.color} ${severityInfo.bg} cursor-pointer hover:brightness-95 transition-all max-w-[220px] overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${severityInfo.text}`}>
                  <severityInfo.icon className="w-3.5 h-3.5" />
                  {severityInfo.level}
                </div>
                <div className="text-[10px] font-medium text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded">
                  {defects.length} Defect{defects.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="text-xs font-semibold truncate flex items-center gap-1.5 text-foreground">
                <span>{getCategoryIcon(topDefect)}</span>
                <span className="truncate">{topDefect}</span>
              </div>
              
              <div className="flex items-center justify-between text-[10px] mt-0.5">
                <span className="text-muted-foreground font-medium">
                  {repaired} Repaired | {pending} Pending
                </span>
                {additionalCount > 0 && (
                  <span className="text-primary font-bold">+{additionalCount} More</span>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="p-3 shadow-lg max-w-[250px]">
            <div className="font-bold text-sm mb-2 border-b pb-1">Condition Preview</div>
            <div className="flex flex-col gap-1.5">
              {defects.slice(0, 5).map((d, i) => (
                <div key={i} className="text-xs flex items-center gap-2">
                  <span>{getCategoryIcon(d)}</span>
                  <span>{d}</span>
                </div>
              ))}
              {defects.length === 0 && wagon.comments && (
                <div className="text-xs">{wagon.comments}</div>
              )}
              {defects.length > 5 && (
                <div className="text-xs text-muted-foreground font-semibold mt-1">
                  +{defects.length - 5} More Defects
                </div>
              )}
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground italic text-center">
              Click to open Condition Panel
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {panelOpen && (
        <ConditionPanel 
          wagon={wagon} 
          open={panelOpen} 
          onOpenChange={setPanelOpen} 
          defects={defects}
          severityInfo={severityInfo}
        />
      )}
    </>
  );
}
