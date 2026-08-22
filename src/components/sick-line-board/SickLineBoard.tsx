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
import { getWagonDefects } from "@/utils/wagonDefects";
import { ManageWagonPanel } from "@/components/ManageWagon/ManageWagonPanel";

export function SickLineBoard() {
  const { wagons, updateWagon, log } = useAppStore();
  const { isAdmin, user } = useAuth();
  
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [alertFilter, setAlertFilter] = useState("all");

  const [draggedWagonId, setDraggedWagonId] = useState<string | null>(null);
  const [transitionConfirm, setTransitionConfirm] = useState<{ wagon: Wagon, targetColumn: BoardColumn } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Shared Manage Wagon Panel State
  const [manageWagonId, setManageWagonId] = useState<string | null>(null);
  const [manageWagonTab, setManageWagonTab] = useState<"workflow" | "details" | "repairs">("workflow");

  const draggedWagon = useMemo(() => wagons.find(w => w.id === draggedWagonId), [wagons, draggedWagonId]);

  const filteredWagons = useMemo(() => {
    const now = new Date();
    return wagons.filter(wagon => {
      if (search) {
        const q = search.toLowerCase();
        const wagonNoMatches = wagon.wagonNo.toLowerCase().includes(q);
        const defects = getWagonDefects(wagon);
        const defectMatches = defects.some(d => d.defectName.toLowerCase().includes(q));
        if (!wagonNoMatches && !defectMatches) return false;
      }
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
    const currentLoc = getBoardColumn(wagon.currentLocation);
    if (currentLoc === targetColumn) {
      toast({ title: "Invalid Transition", description: "This wagon is already in this stage.", variant: "destructive" });
      return;
    }

    // Check concurrency
    const latestWagon = wagons.find(w => w.id === wagon.id);
    if (latestWagon?.currentLocation !== wagon.currentLocation) {
      toast({ title: "Stale Data", description: "The wagon has been updated by another user. Board refreshed.", variant: "destructive" });
      return;
    }

    setTransitionConfirm({ wagon, targetColumn });
  };

  const handleDrop = (targetColumn: BoardColumn) => {
    if (!draggedWagon) return;
    
    if (getBoardColumn(draggedWagon.currentLocation) === targetColumn) {
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
      const { wagon, targetColumn } = transitionConfirm;
      
      // Request transition via existing mechanism
      updateWagon(wagon.id, { currentLocation: targetColumn }, user?.name || "system");
      
      log({ 
        actor: user?.name || "system", 
        action: `Moved wagon ${wagon.wagonNo} to ${targetColumn}`, 
        details: `Location changed from ${getBoardColumn(wagon.currentLocation)} to ${targetColumn}` 
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
              wagons={filteredWagons.filter(w => getBoardColumn(w.currentLocation) === col.id)} 
              isDragActive={!!draggedWagonId}
              isValidTarget={draggedWagon ? true : false}
              onDropColumn={handleDrop}
              onDragStartCard={handleDragStart}
              onDragEndCard={handleDragEnd}
              onMoveRequest={handleMoveRequest}
              onManageRequest={(wagonId, tab) => {
                setManageWagonId(wagonId);
                setManageWagonTab(tab);
              }}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </div>

      <Dialog open={!!transitionConfirm} onOpenChange={(open) => !open && !isTransitioning && setTransitionConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Location Move</DialogTitle>
            <DialogDescription>
              Are you sure you want to move Wagon <strong>{transitionConfirm?.wagon.wagonNo}</strong> from <strong>{getBoardColumn(transitionConfirm?.wagon.currentLocation)}</strong> to <strong>{transitionConfirm?.targetColumn}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransitionConfirm(null)} disabled={isTransitioning}>Cancel</Button>
            <Button onClick={confirmTransition} disabled={isTransitioning}>
              {isTransitioning ? "Moving..." : "Confirm Move"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unified Manage Wagon Panel */}
      {manageWagonId && (
        <ManageWagonPanel 
          key={manageWagonId}
          wagonId={manageWagonId} 
          defaultTab={manageWagonTab}
          open={!!manageWagonId} 
          onOpenChange={(open) => !open && setManageWagonId(null)} 
        />
      )}
    </div>
  );
}
