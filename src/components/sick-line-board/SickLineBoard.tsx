import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { SickLineColumn } from "./SickLineColumn";
import { SickLineBoardFilters } from "./SickLineBoardFilters";
import { SickLineBoardSummary } from "./SickLineBoardSummary";
import { COLUMNS, getBoardColumn, getTargetStatusForColumn, BoardColumn } from "./statusMapping";
import { Wagon, WagonStatus } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { evaluateWagonAlerts } from "@/features/wagon-alerts/wagonAlertRules";

export function SickLineBoard() {
  const { wagons, updateWagon, log } = useAppStore();
  const { isAdmin, user } = useAuth();
  
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [alertFilter, setAlertFilter] = useState("all");

  const [draggedWagonId, setDraggedWagonId] = useState<string | null>(null);
  const [transitionConfirm, setTransitionConfirm] = useState<{ wagon: Wagon, targetColumn: BoardColumn, targetStatus: WagonStatus } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const draggedWagon = useMemo(() => wagons.find(w => w.id === draggedWagonId), [wagons, draggedWagonId]);

  const filteredWagons = useMemo(() => {
    const now = new Date();
    return wagons.filter(wagon => {
      if (search && !wagon.wagonNo.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== "all" && wagon.type !== typeFilter) return false;
      if (priorityFilter !== "all" && (wagon.priority || "Normal") !== priorityFilter) return false;
      
      if (alertFilter !== "all") {
        const wf = useAppStore.getState().workflows.find(w => w.wagonId === wagon.id);
        const alerts = evaluateWagonAlerts({ wagon, workflow: wf, now });
        if (alertFilter === "has_alerts" && alerts.length === 0) return false;
        if (alertFilter === "CRITICAL" && !alerts.some(a => a.severity === "CRITICAL")) return false;
        if (alertFilter === "DELAY" && !alerts.some(a => a.category === "DELAY")) return false;
        if (alertFilter === "MATERIAL" && !alerts.some(a => a.category === "MATERIAL")) return false;
        if (alertFilter === "INSPECTION" && !alerts.some(a => a.category === "INSPECTION")) return false;
      }
      return true;
    });
  }, [wagons, search, typeFilter, priorityFilter, alertFilter]);

  const onClear = () => {
    setSearch("");
    setTypeFilter("all");
    setPriorityFilter("all");
    setAlertFilter("all");
  };

  const handleDragStart = (wagonId: string) => {
    if (!isAdmin) return;
    setDraggedWagonId(wagonId);
  };

  const handleDragEnd = () => {
    setDraggedWagonId(null);
  };

  const handleMoveRequest = (wagon: Wagon, targetColumn: BoardColumn) => {
    if (!isAdmin) {
      toast({ title: "Permission Denied", description: "You don't have permission to move wagons.", variant: "destructive" });
      return;
    }
    const currentStatus = wagon.status;
    const targetStatus = getTargetStatusForColumn(currentStatus, targetColumn);
    
    if (!targetStatus) {
      toast({ title: "Invalid Transition", description: "This wagon cannot be moved to this stage.", variant: "destructive" });
      return;
    }

    // Check concurrency
    const latestWagon = wagons.find(w => w.id === wagon.id);
    if (latestWagon?.status !== currentStatus) {
      toast({ title: "Stale Data", description: "The wagon has been updated by another user. Board refreshed.", variant: "destructive" });
      return;
    }

    setTransitionConfirm({ wagon, targetColumn, targetStatus });
  };

  const handleDrop = (targetColumn: BoardColumn) => {
    if (!draggedWagon) return;
    
    const currentStatus = draggedWagon.status;
    if (getBoardColumn(currentStatus) === targetColumn) {
      setDraggedWagonId(null);
      return; // Dropped in same column
    }

    handleMoveRequest(draggedWagon, targetColumn);
    setDraggedWagonId(null);
  };

  const confirmTransition = async () => {
    if (!transitionConfirm) return;
    setIsTransitioning(true);
    
    try {
      const { wagon, targetStatus, targetColumn } = transitionConfirm;
      
      // Request transition via existing mechanism
      updateWagon(wagon.id, { status: targetStatus }, user?.name || "system");
      
      log({ 
        actor: user?.name || "system", 
        action: `Moved wagon ${wagon.wagonNo} to ${targetColumn}`, 
        details: `Status changed from ${wagon.status} to ${targetStatus}` 
      });
      
      toast({ title: "Transition Successful", description: `Wagon ${wagon.wagonNo} moved to ${targetColumn}.` });
    } catch (error) {
      toast({ title: "Transition Failed", description: "An error occurred while moving the wagon.", variant: "destructive" });
    } finally {
      setIsTransitioning(false);
      setTransitionConfirm(null);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
      <SickLineBoardSummary wagons={filteredWagons} />
      
      <div className="bg-card p-4 rounded-lg border">
        <SickLineBoardFilters 
          search={search} setSearch={setSearch}
          typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter}
          alertFilter={alertFilter} setAlertFilter={setAlertFilter}
          onClear={onClear}
        />
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-4 h-full">
          {COLUMNS.map(col => (
            <SickLineColumn 
              key={col.id} 
              id={col.id}
              title={col.title} 
              wagons={filteredWagons.filter(w => getBoardColumn(w.status) === col.id)} 
              isDragActive={!!draggedWagonId}
              isValidTarget={draggedWagon ? !!getTargetStatusForColumn(draggedWagon.status, col.id) : false}
              onDropColumn={handleDrop}
              onDragStartCard={handleDragStart}
              onDragEndCard={handleDragEnd}
              onMoveRequest={handleMoveRequest}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </div>

      <Dialog open={!!transitionConfirm} onOpenChange={(open) => !open && !isTransitioning && setTransitionConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Workflow Transition</DialogTitle>
            <DialogDescription>
              Are you sure you want to move Wagon <strong>{transitionConfirm?.wagon.wagonNo}</strong> from <strong>{getBoardColumn(transitionConfirm?.wagon.status || "ARRIVED")}</strong> to <strong>{transitionConfirm?.targetColumn}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransitionConfirm(null)} disabled={isTransitioning}>Cancel</Button>
            <Button onClick={confirmTransition} disabled={isTransitioning}>
              {isTransitioning ? "Moving..." : "Confirm Transition"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
