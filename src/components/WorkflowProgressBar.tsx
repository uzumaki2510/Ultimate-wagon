import { useMemo } from "react";
import { WorkflowItem, WorkflowStageRecord } from "@/types";
import { getStageDisplayConfig, isTankWagonType } from "@/lib/workflowConfig";
import { CheckCircle2, Clock, AlertTriangle, PlayCircle } from "lucide-react";

interface WorkflowProgressBarProps {
  workflow: WorkflowItem;
  wagonType: string;
}

export function WorkflowProgressBar({ workflow, wagonType }: WorkflowProgressBarProps) {
  const isTank = isTankWagonType(wagonType);

  const stages = useMemo(() => {
    // If the workflow is empty, we don't have much to show
    if (!workflow || !workflow.stages) return [];

    return workflow.stages.map((stage, index) => {
      const isCurrent = workflow.currentStage === stage.stageName && stage.status !== "Done";
      const isDone = stage.status === "Done";
      const isSkipped = stage.status === "Skipped";
      const isPending = !isCurrent && !isDone && !isSkipped;
      
      const config = getStageDisplayConfig(stage.stageName);
      const Icon = config.icon;

      let statusColor = "text-muted-foreground border-muted-foreground/30";
      let bgColor = "bg-muted/30";
      let iconColor = "text-muted-foreground/50";
      let StatusIcon = Clock;

      if (isDone) {
        statusColor = "text-emerald-700 border-emerald-500 dark:text-emerald-400";
        bgColor = "bg-emerald-50 dark:bg-emerald-950/30";
        iconColor = "text-emerald-500";
        StatusIcon = CheckCircle2;
      } else if (isCurrent || stage.status === "In Progress") {
        statusColor = "text-blue-700 border-blue-500 shadow-sm dark:text-blue-400";
        bgColor = "bg-blue-50 dark:bg-blue-950/30";
        iconColor = "text-blue-500 animate-pulse";
        StatusIcon = PlayCircle;
      } else if (isSkipped) {
        statusColor = "text-muted-foreground/50 border-muted-foreground/20 border-dashed";
        bgColor = "bg-transparent";
        iconColor = "text-muted-foreground/30";
      }

      return {
        ...stage,
        index,
        isCurrent,
        isDone,
        isPending,
        isSkipped,
        statusColor,
        bgColor,
        iconColor,
        Icon,
        StatusIcon,
      };
    });
  }, [workflow]);

  if (!stages.length) {
    return <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/10 border-dashed">No workflow stages initialized.</div>;
  }

  return (
    <div className="w-full">
      {/* Desktop Horizontal View */}
      <div className="hidden md:block relative px-4 py-6 overflow-x-auto no-scrollbar">
        <div className="flex items-start min-w-max">
          {stages.map((stage, i) => (
            <div key={stage.stageName} className="flex flex-col items-center relative" style={{ width: '140px' }}>
              {/* Connecting Line */}
              {i < stages.length - 1 && (
                <div 
                  className={`absolute top-5 left-[50%] right-[-50%] h-0.5 z-0 transition-colors duration-500
                    ${stage.isDone ? "bg-emerald-500" : stage.isSkipped ? "bg-border border-dashed border-t" : "bg-border"}
                  `} 
                />
              )}
              
              {/* Node */}
              <div className={`
                relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background transition-all duration-300
                ${stage.statusColor}
              `}>
                {stage.isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <stage.Icon className={`h-4 w-4 ${stage.iconColor}`} />
                )}
                
                {stage.isCurrent && (
                  <span className="absolute -inset-1.5 rounded-full border-2 border-blue-500 opacity-20 animate-ping" />
                )}
              </div>

              {/* Label */}
              <div className="mt-3 text-center px-2">
                <p className={`text-xs font-semibold leading-tight ${stage.isCurrent ? "text-foreground" : stage.isSkipped ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
                  {stage.stageName}
                </p>
                {stage.isSkipped && (
                  <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-bold text-muted-foreground/50 bg-muted px-1.5 py-0.5 rounded">
                    Skipped
                  </span>
                )}
                {stage.isDone && stage.completedAt && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(stage.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Vertical View */}
      <div className="md:hidden space-y-0 py-4 px-2">
        {stages.map((stage, i) => (
          <div key={stage.stageName} className="relative pl-8 pb-6 last:pb-0">
            {/* Connecting Line */}
            {i < stages.length - 1 && (
              <div 
                className={`absolute left-[15px] top-[24px] bottom-[-8px] w-0.5 z-0
                  ${stage.isDone ? "bg-emerald-500" : stage.isSkipped ? "bg-border border-dashed border-l" : "bg-border"}
                `} 
              />
            )}
            
            {/* Node */}
            <div className={`
              absolute left-0 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background
              ${stage.statusColor}
            `}>
              {stage.isDone ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <stage.Icon className={`h-3.5 w-3.5 ${stage.iconColor}`} />
              )}
            </div>

            {/* Content */}
            <div className={`
              rounded-lg border p-3 ml-2
              ${stage.bgColor} ${stage.isSkipped ? "border-dashed opacity-60" : "border-border/50"}
            `}>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h4 className={`text-sm font-semibold ${stage.isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                    {stage.stageName}
                  </h4>
                  {stage.isSkipped && (
                    <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 bg-background px-1.5 py-0.5 rounded border">
                      Skipped
                    </span>
                  )}
                </div>
                {stage.isDone && (
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                    Done
                  </span>
                )}
                {stage.isCurrent && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded animate-pulse">
                    In Progress
                  </span>
                )}
              </div>
              
              {stage.isDone && stage.completedAt && (
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed {new Date(stage.completedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
