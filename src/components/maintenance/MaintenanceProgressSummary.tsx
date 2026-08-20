import { Wagon, WorkflowItem } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Wrench, Activity } from "lucide-react";
import { calculateMaintenanceProgress } from "./maintenanceProgress";
import { isTankWagonType } from "@/lib/workflowConfig";

interface Props {
  wagon: Wagon;
  workflow: WorkflowItem | undefined;
}

export function MaintenanceProgressSummary({ wagon, workflow }: Props) {
  const isTank = isTankWagonType(wagon.type);
  const progress = calculateMaintenanceProgress(wagon, workflow, isTank);

  return (
    <div data-testid="maintenance-progress">
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Maintenance Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Overall */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">Overall Progress</span>
              <span className="font-bold text-primary">{progress.overallPercentage}%</span>
            </div>
            <Progress value={progress.overallPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Workflow Stages */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Wrench className="h-3 w-3" />
                Workflow Stages
              </div>
              <div className="text-lg font-bold">
                {progress.completedStages} / {progress.totalStages}
              </div>
              <Progress value={progress.stagePercentage} className="h-1.5 mt-1" />
            </div>

            {/* Checklist Items */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <CheckCircle2 className="h-3 w-3" />
                Checklist Items
              </div>
              <div className="text-lg font-bold">
                {progress.completedChecklistItems} / {progress.totalChecklistItems}
              </div>
              <Progress value={progress.checklistPercentage} className="h-1.5 mt-1" />
            </div>
          </div>

          {/* Repair Tasks count */}
          {wagon.repairTasks && wagon.repairTasks.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
              <Clock className="h-3 w-3" />
              <span>{wagon.repairTasks.length} repair task{wagon.repairTasks.length !== 1 ? "s" : ""} identified</span>
              {wagon.repairTasks.filter(t => t.severity === "Safety Critical").length > 0 && (
                <span className="text-red-500 font-medium">
                  ({wagon.repairTasks.filter(t => t.severity === "Safety Critical").length} safety critical)
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
