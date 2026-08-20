import React, { useMemo } from "react";
import { WagonRepair } from "@/lib/wagonData";
import { getWorkflowForWagonType, WorkflowDefinition, WorkflowStage } from "@/lib/wagonWorkflows";
import { Badge } from "@/components/ui/badge";

interface Props {
  wagon: WagonRepair;
  onClick?: () => void;
}

// Maps existing frontend workflow keys to the new centralized workflow stage keys.
// This ensures we reuse existing data safely until Step 3 backend integration.
const BTPN_LEGACY_MAP: Record<string, string> = {
  "yard_issue": "YARD_INSPECTION",
  "steaming": "STEAMING",
  "yard_exam_sick": "YARD_INSPECTION",
  "steam_cleaning": "STEAM_CLEANING",
  "placement_decision": "STEAM_POINT_PLACEMENT",
  "rectification": "MAINTENANCE_REPAIR",
  "hydro_testing": "HYDRO_TESTING",
  "fit_for_use": "FIT_FOR_USE",
};

const BTPGLN_LEGACY_MAP: Record<string, string> = {
  "sick_reason": "RRT_SIDING",
  "rrt_degassing": "DE_GASSING",
  "hapa_examination": "HAPA_DEPOT",
  "rrt_purging": "PURGING",
  "yard_examination": "HAPA_YARD_EXAM",
  "fit_for_loading": "FIT_FOR_LOADING",
};

export function WagonWorkflowStatus({ wagon, onClick }: Props) {
  const workflowMapping = useMemo(() => getWorkflowForWagonType(wagon.details.typeName), [wagon.details.typeName]);

  if (!workflowMapping.supported) {
    return (
      <div 
        className="text-xs text-muted-foreground italic px-2 py-1 bg-secondary/30 rounded border border-border/50"
        data-testid={`wagon-workflow-status-${wagon.id}`}
        data-wagon-type={wagon.details.typeName}
      >
        Workflow not configured
      </div>
    );
  }

  const workflow = workflowMapping.workflow;
  const isBTPN = workflow.id === "BTPN_BTPFLN_WORKFLOW";
  const isBTPGLN = workflow.id === "BTPGLN_BTPGN_WORKFLOW";

  // Safely extract the active stage from existing data
  let activeStageKey = workflow.initialStage;
  if (isBTPN && wagon.btpnWorkflow?.currentStage) {
    activeStageKey = BTPN_LEGACY_MAP[wagon.btpnWorkflow.currentStage] || workflow.initialStage;
  } else if (isBTPGLN && wagon.btpglnWorkflow?.currentStage) {
    activeStageKey = BTPGLN_LEGACY_MAP[wagon.btpglnWorkflow.currentStage] || workflow.initialStage;
  }

  const activeStage = workflow.stages[activeStageKey];

  // Calculate branch-aware path.
  // We compute the longest path assuming the active stage is part of the path,
  // or we can just linearly traverse preferred nextStages to get a representative active count.
  // Because full branch evaluation requires historical selections not fully stored yet, 
  // we do a safe best-effort calculation for UI visualization.
  const path: string[] = [];
  const visited = new Set<string>();
  
  let currentKey: string | undefined = workflow.initialStage;
  
  // To keep it simple, we traverse taking the first nextStage until we hit the activeStage.
  // Then we continue taking the first nextStage to represent "Upcoming" steps in the active branch.
  // A perfect implementation would use historical branch conditions, which is limited by existing data.
  // Note: limitation documented here.
  while (currentKey && !visited.has(currentKey)) {
    visited.add(currentKey);
    path.push(currentKey);
    const stageInfo = workflow.stages[currentKey];
    
    // For visualization, if we are at a branch, and we know the active stage is down one of the paths,
    // we should ideally pick the branch that leads to activeStage.
    // Given the small graph, we will just pick the first nextStage, UNLESS the activeStage is explicitly one of the branches.
    let next: string | undefined = undefined;
    if (stageInfo.nextStages.length > 0) {
      if (stageInfo.nextStages.includes(activeStageKey)) {
        next = activeStageKey;
      } else {
        next = stageInfo.nextStages[0];
      }
    }
    currentKey = next;
  }

  const activeIndex = path.indexOf(activeStageKey);
  // Fallback if not found in path
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const totalStages = path.length;

  return (
    <div 
      className="flex flex-col gap-1 cursor-pointer hover:bg-secondary/40 p-2 rounded-md transition-colors border border-transparent hover:border-border/50"
      onClick={onClick}
      data-testid={`wagon-workflow-status-${wagon.id}`}
      data-wagon-type={wagon.details.typeName}
      data-current-stage={activeStageKey}
      title="Click to view workflow details"
    >
      <div className="flex justify-between items-center w-full">
        <span className="font-semibold text-xs text-foreground truncate max-w-[150px]">
          {activeStage?.label || "Unknown Stage"}
        </span>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
          {safeActiveIndex + 1} / {totalStages}
        </span>
      </div>
      
      <div className="flex gap-1 items-center mt-1 w-full max-w-[200px]">
        {path.map((stageKey, idx) => {
          let bgClass = "bg-gray-200 dark:bg-gray-700"; // Upcoming
          
          if (idx < safeActiveIndex) {
            bgClass = "bg-green-500"; // Completed
          } else if (idx === safeActiveIndex) {
            bgClass = "bg-blue-500"; // Current
          }

          const stageInfo = workflow.stages[stageKey];

          return (
            <div 
              key={`${stageKey}-${idx}`} 
              className={`h-1.5 flex-1 rounded-full ${bgClass} transition-all`}
              title={`${stageInfo?.label} ${idx < safeActiveIndex ? "(Completed)" : idx === safeActiveIndex ? "(Current)" : "(Upcoming)"}`}
            />
          );
        })}
      </div>
    </div>
  );
}
