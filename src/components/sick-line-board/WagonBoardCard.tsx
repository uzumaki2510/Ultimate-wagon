import { Wagon, InspectionChecklist } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getValidTargetColumns, COLUMNS, BoardColumn } from "./statusMapping";
import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { evaluateWagonAlerts } from "@/features/wagon-alerts/wagonAlertRules";
import { WagonAlertBadge } from "@/features/wagon-alerts/WagonAlertBadge";

interface Props {
  wagon: Wagon;
  draggable?: boolean;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onMoveRequest?: (wagon: Wagon, targetColumn: BoardColumn) => void;
}

function getChecklistProgress(cl: InspectionChecklist | undefined): { completed: number; total: number } {
  if (!cl) return { completed: 0, total: 0 };
  const entries = Object.values(cl);
  const total = entries.length;
  const completed = entries.filter((v: any) => v?.checked).length;
  return { completed, total };
}

export function WagonBoardCard({ wagon, draggable, onDragStart, onDragEnd, onMoveRequest }: Props) {
  const navigate = useNavigate();

  const priorityColor = wagon.priority === "Urgent" ? "bg-red-500" :
                        wagon.priority === "Safety Critical" ? "bg-purple-500" : "bg-blue-500";

  const validTargets = getValidTargetColumns();
  const checklistProgress = useMemo(() => getChecklistProgress(wagon.inspectionChecklist), [wagon.inspectionChecklist]);

  const alerts = useMemo(() => {
    const wf = useAppStore.getState().workflows.find(w => w.wagonId === wagon.id);
    return evaluateWagonAlerts({ wagon, workflow: wf, now: new Date() });
  }, [wagon]);

  const wf = useAppStore(s => s.workflows.find(w => w.wagonId === wagon.id));
  const currentStageName = wf?.stages.find(s => s.status === "In Progress")?.stageName || "Not Started";
  const completedStages = wf?.stages.filter(s => s.status === "Done").length || 0;
  const totalStages = wf?.stages.length || 0;

  return (
    <Card 
      data-testid={`wagon-card-${wagon.wagonNo}`}
      className={`p-3 relative group transition-colors text-sm ${draggable ? "cursor-grab active:cursor-grabbing hover:border-primary" : "cursor-pointer"}`}
      draggable={draggable}
      onClick={() => navigate(`/wagon/${wagon.id}`)}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData("wagonId", wagon.id);
        if (onDragStart) onDragStart(wagon.id);
      }}
      onDragEnd={() => {
        if (onDragEnd) onDragEnd();
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-primary">{wagon.wagonNo}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase">{wagon.type}</span>
          {draggable && validTargets.length > 0 && onMoveRequest && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()} aria-label="Open menu">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {validTargets.map(targetId => {
                  const targetCol = COLUMNS.find(c => c.id === targetId);
                  return (
                    <DropdownMenuItem key={targetId} onClick={(e) => { e.stopPropagation(); onMoveRequest(wagon, targetId as BoardColumn); }}>
                      Move to {targetCol?.title || targetId}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      {wagon.defect && (
        <div className="text-xs text-foreground mb-2 line-clamp-2">
          {wagon.defect}
        </div>
      )}

      <div className="text-[11px] text-muted-foreground mb-2 flex items-center justify-between">
        <span className="truncate">Workflow: {currentStageName}</span>
      </div>

      <div className="flex justify-between items-center mt-2">
        <Badge className={priorityColor}>{wagon.priority || "Normal"}</Badge>
        {totalStages > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {completedStages} / {totalStages}
          </span>
        )}
      </div>
    </Card>
  );
}
