import React, { useMemo } from "react";
import { Wagon } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { 
  getResolvedWorkflowForWagon,
  formatWorkflowTimestamp
} from "@/lib/wagonWorkflows";
import { ChevronRight } from "lucide-react";

interface Props {
  wagon: any;
  onClick?: () => void;
}

export function WagonWorkflowStatus({ wagon, onClick }: Props) {
  const workflows = useAppStore(s => s.workflows);
  
  // Use the authoritative resolver
  const resolved = useMemo(() => {
    const workflowRecord = workflows.find(w => w.wagonId === wagon.id);
    return getResolvedWorkflowForWagon(wagon, workflowRecord);
  }, [wagon, workflows]);

  if (!resolved) {
    return (
      <div 
        className="flex flex-col p-2 border border-border/50 rounded-md bg-secondary/30 text-muted-foreground w-48 cursor-pointer hover:bg-secondary/50 transition-colors"
        onClick={onClick}
        data-testid={`wagon-workflow-status-${wagon.id}`}
        data-wagon-type={wagon.details?.typeName || wagon.type}
      >
        <div className="font-semibold text-xs mb-1">Unknown Type</div>
        <div className="text-[10px]">Workflow not configured</div>
      </div>
    );
  }

  const {
    definition,
    family,
    currentStageKey,
    resolvedPath,
    completedCount,
    totalCount,
    latestCompletedAt
  } = resolved;

  const currentStageDef = currentStageKey ? definition.stages[currentStageKey] : null;
  const currentStageLabel = currentStageDef ? (currentStageDef.shortLabel || currentStageDef.label) : "Not Started";

  return (
    <div 
      className="flex flex-col gap-1 cursor-pointer hover:bg-secondary/40 p-2.5 rounded-md transition-colors border border-transparent hover:border-border/50 w-52 group relative"
      onClick={onClick}
      data-testid={`wagon-workflow-status-${wagon.id}`}
      data-wagon-type={wagon.details?.typeName || wagon.type}
      data-current-stage={currentStageKey}
      title="Click to view workflow details"
    >
      <div className="flex justify-between items-start">
        <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
          {family}
        </span>
      </div>
      <div className="font-medium text-sm text-foreground truncate">
        {currentStageLabel}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {completedCount} / {totalCount} stages
      </div>
      
      <div className="flex items-center gap-1 mt-2 w-full pr-4 relative">
        {resolvedPath.map((stageKey, idx) => {
          let dotClass = "bg-gray-200 dark:bg-gray-700"; // Upcoming
          
          if (resolved.stageStates[stageKey] === "COMPLETED") {
            dotClass = "bg-green-500";
          } else if (resolved.stageStates[stageKey] === "CURRENT") {
            dotClass = "bg-blue-500";
          }

          const stageInfo = definition.stages[stageKey];

          return (
            <div 
              key={`${stageKey}-${idx}`} 
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass} transition-all`}
              title={`${stageInfo?.label} (${resolved.stageStates[stageKey]})`}
            />
          );
        })}
        <div className="absolute right-0 bottom-[-4px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      {latestCompletedAt && (
        <div 
          className="text-[10px] text-muted-foreground mt-1 truncate" 
          title={`Last completed: ${formatWorkflowTimestamp(latestCompletedAt)}`}
        >
          Last completed: {formatWorkflowTimestamp(latestCompletedAt)}
        </div>
      )}
    </div>
  );
}
