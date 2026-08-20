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

  const validTargets = getValidTargetColumns(wagon.status);
  const checklistProgress = useMemo(() => getChecklistProgress(wagon.inspectionChecklist), [wagon.inspectionChecklist]);

  const alerts = useMemo(() => {
    const wf = useAppStore.getState().workflows.find(w => w.wagonId === wagon.id);
    return evaluateWagonAlerts({ wagon, workflow: wf, now: new Date() });
  }, [wagon]);

  return (
    <Card 
      data-testid={`wagon-card-${wagon.wagonNo}`}
      className={`p-3 relative group transition-colors text-sm ${draggable ? "cursor-grab active:cursor-grabbing hover:border-primary" : "cursor-pointer"}`}
      draggable={draggable}
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
        <span className="font-bold cursor-pointer" onClick={() => navigate(`/wagon/${wagon.id}`)}>{wagon.wagonNo}</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{wagon.type}</Badge>
          {draggable && validTargets.length > 0 && onMoveRequest && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Open menu">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {validTargets.map(targetId => {
                  const targetCol = COLUMNS.find(c => c.id === targetId);
                  return (
                    <DropdownMenuItem key={targetId} onClick={() => onMoveRequest(wagon, targetId)}>
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
        <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
          Defect: {wagon.defect}
        </div>
      )}
      <WagonAlertBadge alerts={alerts} />
      {checklistProgress.total > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
          <div className="flex-1 bg-muted h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${checklistProgress.total > 0 ? (checklistProgress.completed / checklistProgress.total) * 100 : 0}%` }}
            />
          </div>
          <span className="shrink-0">{checklistProgress.completed}/{checklistProgress.total}</span>
        </div>
      )}
      <div className="flex justify-between items-center text-xs mt-2">
        <Badge className={priorityColor}>{wagon.priority || "Normal"}</Badge>
        {wagon.updatedAt && (
          <span className="text-muted-foreground text-[10px]">
            {formatDistanceToNow(new Date(wagon.updatedAt), { addSuffix: true })}
          </span>
        )}
      </div>
    </Card>
  );
}
