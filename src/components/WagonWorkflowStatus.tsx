import React, { useMemo } from "react";
import { WagonRepair } from "@/lib/wagonData";
import { 
  getWorkflowDefinitionForWagon, 
  getCurrentWorkflowStage, 
  getApplicableWorkflowPath,
  getLatestCompletionTimestamp,
  formatWorkflowTimestamp
} from "@/lib/wagonWorkflows";
import { ChevronRight } from "lucide-react";

interface Props {
  wagon: WagonRepair;
  onClick?: () => void;
}

export function WagonWorkflowStatus({ wagon, onClick }: Props) {
  const workflow = getWorkflowDefinitionForWagon(wagon);

  if (!workflow) {
    return (
      <div 
        className="flex flex-col p-2 border border-border/50 rounded-md bg-secondary/30 text-muted-foreground w-48 cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={onClick}
        data-testid={`wagon-workflow-status-${wagon.id}`}
        data-wagon-type={wagon.details.typeName}
      >
        <div className="font-semibold text-xs mb-1">Unknown Type</div>
        <div className="text-[10px]">Workflow not configured</div>
      </div>
    );
  }

  const activeStageKey = getCurrentWorkflowStage(wagon);
  const activeStage = activeStageKey ? workflow.stages[activeStageKey] : null;

  // Calculate branch-aware path.
  const path = getApplicableWorkflowPath(wagon);

  const activeIndex = activeStageKey ? path.indexOf(activeStageKey) : -1;
  // If activeIndex is -1, it means not started (0 / total).
  // If activeIndex >= 0, it means it's progressed (activeIndex + 1 / total).
  const currentProgressCount = activeIndex >= 0 ? activeIndex + 1 : 0;
  const totalStages = path.length;

  return (
    <div 
      className="flex flex-col gap-1 cursor-pointer hover:bg-secondary/40 p-2.5 rounded-md transition-colors border border-transparent hover:border-border/50 w-52 group relative"
      onClick={onClick}
      data-testid={`wagon-workflow-status-${wagon.id}`}
      data-wagon-type={wagon.details.typeName}
      data-current-stage={activeStageKey}
      title="Click to view workflow details"
    >
      <div className="flex justify-between items-start">
        <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
          {workflow.name}
        </span>
      </div>
      <div className="font-medium text-sm text-foreground truncate">
        {activeStage?.label || "Not Started"}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {currentProgressCount} / {totalStages} stages
      </div>
      
      <div className="flex items-center gap-1 mt-2 w-full pr-4 relative">
        {path.map((stageKey, idx) => {
          let dotClass = "bg-gray-200 dark:bg-gray-700"; // Upcoming
          
          if (activeIndex >= 0) {
            if (idx < activeIndex) {
              dotClass = "bg-green-500"; // Completed
            } else if (idx === activeIndex) {
              dotClass = "bg-blue-500"; // Current
            }
          }

          const stageInfo = workflow.stages[stageKey];

          return (
            <div 
              key={`${stageKey}-${idx}`} 
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass} transition-all`}
              title={`${stageInfo?.label} ${activeIndex >= 0 && idx < activeIndex ? "(Completed)" : activeIndex >= 0 && idx === activeIndex ? "(Current)" : "(Upcoming)"}`}
            />
          );
        })}
        <div className="absolute right-0 bottom-[-4px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      {(() => {
        const latestTimestamp = getLatestCompletionTimestamp(wagon);
        if (!latestTimestamp) return null;
        const formatted = formatWorkflowTimestamp(latestTimestamp);
        if (!formatted) return null;
        return (
          <div 
            className="text-[10px] text-muted-foreground mt-1.5"
            data-testid="workflow-last-completed"
          >
            Last: {formatted}
          </div>
        );
      })()}
    </div>
  );
}
