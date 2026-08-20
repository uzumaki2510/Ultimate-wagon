import React, { useState, useMemo } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { WagonRepair, BTPNWorkflowData, BTPGLNWorkflowData } from "@/lib/wagonData";
import { useAppStore } from "@/store/useAppStore";
import { 
  getWorkflowDefinitionForWagon, 
  getWorkflowStageState,
  getCurrentWorkflowStage,
  getNextValidStage,
  BTPN_REVERSE_MAP,
  BTPGLN_REVERSE_MAP
} from "@/lib/wagonWorkflows";
import { 
  CheckCircle2, PlayCircle, Clock, Ban, AlertCircle, ChevronDown, ChevronUp, MapPin
} from "lucide-react";

interface Props {
  wagon: WagonRepair;
  onClose: () => void;
}

export function WagonWorkflowModal({ wagon, onClose }: Props) {
  const updateWagon = useAppStore(s => s.updateWagon);
  const def = useMemo(() => getWorkflowDefinitionForWagon(wagon), [wagon]);
  const currentStageKey = useMemo(() => getCurrentWorkflowStage(wagon), [wagon]);

  // Local state for the form at the current stage
  const [remarks, setRemarks] = useState("");
  const [btpnPlacement, setBtpnPlacement] = useState<"mv_shed" | "sick_line" | "">("");
  const [btpglnReason, setBtpglnReason] = useState<"under_gear" | "upper_gear" | "roh_due" | "poh_due" | "">("");
  const [btpglnPurgingOutcome, setBtpglnPurgingOutcome] = useState<"fit" | "sick" | "">("");
  
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [editingStageKey, setEditingStageKey] = useState<string | null>(null);

  if (!def) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Workflow Details</DialogTitle></DialogHeader>
          <p className="text-muted-foreground py-4">Workflow not configured for this wagon type.</p>
          <DialogFooter><Button onClick={onClose}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const toggleExpand = (stageKey: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(stageKey)) next.delete(stageKey);
      else next.add(stageKey);
      return next;
    });
  };

  const handleCompleteCurrent = () => {
    if (!currentStageKey) return;
    const stageConfig = def.stages[currentStageKey];
    
    // Ensure branching variables are selected if required
    if (def.id === "BTPN_BTPFLN_WORKFLOW" && stageConfig.branchConditionId === "upperGearOrSiding" && !btpnPlacement) {
      alert("Please select a placement location.");
      return;
    }
    if (def.id === "BTPGLN_BTPGN_WORKFLOW" && stageConfig.branchConditionId === "defectReason" && !btpglnReason) {
      alert("Please select a sick reason/defect type.");
      return;
    }
    if (def.id === "BTPGLN_BTPGN_WORKFLOW" && stageConfig.branchConditionId === "purgingStatus" && !btpglnPurgingOutcome) {
      alert("Please select the purging outcome.");
      return;
    }

    const nextGenericKey = getNextValidStage(wagon);

    if (def.id === "BTPN_BTPFLN_WORKFLOW") {
      const legacyKey = BTPN_REVERSE_MAP[currentStageKey] || currentStageKey;
      const nextLegacyKey = nextGenericKey ? (BTPN_REVERSE_MAP[nextGenericKey] || nextGenericKey) : "fit_for_use";

      const existingData = wagon.btpnWorkflow || {
        currentStage: legacyKey as any,
        stageHistory: [],
        notes: {}
      };

      const newHistory = [
        ...existingData.stageHistory,
        {
          stage: legacyKey,
          completedAt: new Date().toISOString(),
          notes: remarks || undefined,
        }
      ];

      const newData: BTPNWorkflowData = {
        ...existingData,
        currentStage: nextLegacyKey as any,
        stageHistory: newHistory,
        notes: { ...existingData.notes, [legacyKey]: remarks },
        placementType: (btpnPlacement as any) || (existingData as any).placementType,
      };

      updateWagon(wagon.id, { btpnWorkflow: newData } as any, "System");
    } else if (def.id === "BTPGLN_BTPGN_WORKFLOW") {
      const legacyKey = BTPGLN_REVERSE_MAP[currentStageKey] || currentStageKey;
      const nextLegacyKey = nextGenericKey ? (BTPGLN_REVERSE_MAP[nextGenericKey] || nextGenericKey) : "fit_for_loading";

      const existingData = wagon.btpglnWorkflow || {
        currentStage: legacyKey as any,
        stageHistory: [],
        notes: {}
      };

      const newHistory = [
        ...existingData.stageHistory,
        {
          stage: legacyKey,
          completedAt: new Date().toISOString(),
          notes: remarks || undefined,
          markedSickDuringPurging: btpglnPurgingOutcome === "sick" ? true : undefined,
        }
      ];

      const newData: BTPGLNWorkflowData = {
        ...existingData,
        currentStage: nextLegacyKey as any,
        stageHistory: newHistory,
        notes: { ...existingData.notes, [legacyKey]: remarks },
        sickReason: (btpglnReason as any) || (existingData as any).sickReason,
      };

      updateWagon(wagon.id, { btpglnWorkflow: newData } as any, "System");
    }

    // Reset local state
    setRemarks("");
    setBtpnPlacement("");
    setBtpglnReason("");
    setBtpglnPurgingOutcome("");
  };

  const handleUpdateCompletedStage = (stageKey: string) => {
    // Only updating notes/remarks and specific branch values without altering currentStage
    if (def.id === "BTPN_BTPFLN_WORKFLOW" && wagon.btpnWorkflow) {
      const legacyKey = BTPN_REVERSE_MAP[stageKey] || stageKey;
      const existingData = wagon.btpnWorkflow;
      const newHistory = existingData.stageHistory.map(h => {
        if (h.stage === legacyKey) {
          return { ...h, notes: remarks || undefined };
        }
        return h;
      });

      const newData: BTPNWorkflowData = {
        ...existingData,
        stageHistory: newHistory,
        notes: { ...existingData.notes, [legacyKey]: remarks },
      };
      updateWagon(wagon.id, { btpnWorkflow: newData } as any, "System");
    } else if (def.id === "BTPGLN_BTPGN_WORKFLOW" && wagon.btpglnWorkflow) {
      const legacyKey = BTPGLN_REVERSE_MAP[stageKey] || stageKey;
      const existingData = wagon.btpglnWorkflow;
      
      const newHistory = existingData.stageHistory.map(h => {
        if (h.stage === legacyKey) {
          return { ...h, notes: remarks || undefined };
        }
        return h;
      });

      const newData: BTPGLNWorkflowData = {
        ...existingData,
        stageHistory: newHistory,
        notes: { ...existingData.notes, [legacyKey]: remarks },
      };
      updateWagon(wagon.id, { btpglnWorkflow: newData } as any, "System");
    }
    setEditingStageKey(null);
    setRemarks("");
  };

  const handleStartEdit = (stageKey: string, historyEntry: any) => {
    setRemarks(historyEntry?.notes || "");
    setEditingStageKey(stageKey);
  };

  const handleCancelEdit = () => {
    setEditingStageKey(null);
    setRemarks("");
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="wagon-workflow-modal">
        <DialogHeader className="border-b pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {wagon.wagonNumber}
                <Badge variant="outline">{wagon.details.typeName}</Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                Workflow Configuration: {def.name}
              </DialogDescription>
            </div>
            <div className="text-right text-sm space-y-1">
              <div className="text-muted-foreground flex items-center justify-end gap-1">
                <MapPin className="h-3 w-3" /> Location: {(wagon as any).bookedTo || (wagon as any).sickLine || "Unknown"}
              </div>
              <div className="text-destructive font-medium">
                Defect: {(wagon as any).defect || wagon.btpglnWorkflow?.sickReason || "Routine"}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[19px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {Object.values(def.stages).map((stage) => {
            const state = getWorkflowStageState(wagon, stage.key);
            
            // Do not show skipped branches as pending normal steps
            if (state === "SKIPPED") return null;

            const isCurrent = state === "CURRENT";
            const isCompleted = state === "COMPLETED";
            const isPending = state === "PENDING";
            const isEditing = editingStageKey === stage.key;
            
            let StateIcon = Clock;
            let stateColor = "text-muted-foreground bg-secondary";
            if (isCompleted) {
              StateIcon = CheckCircle2;
              stateColor = "text-success bg-success/10 border-success/30";
            } else if (isCurrent) {
              StateIcon = PlayCircle;
              stateColor = "text-blue-500 bg-blue-500/10 border-blue-500/30";
            } else if (state === "BLOCKED") {
              StateIcon = Ban;
              stateColor = "text-destructive bg-destructive/10 border-destructive/30";
            }

            // Find completed historical data if available
            let historyEntry: any = null;
            if (isCompleted) {
               if (def.id === "BTPN_BTPFLN_WORKFLOW" && wagon.btpnWorkflow) {
                 const legacyKey = BTPN_REVERSE_MAP[stage.key];
                 historyEntry = wagon.btpnWorkflow.stageHistory.find(h => h.stage === legacyKey);
               } else if (def.id === "BTPGLN_BTPGN_WORKFLOW" && wagon.btpglnWorkflow) {
                 const legacyKey = BTPGLN_REVERSE_MAP[stage.key];
                 historyEntry = wagon.btpglnWorkflow.stageHistory.find(h => h.stage === legacyKey);
               }
            }

            return (
              <div 
                key={stage.key} 
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                data-testid={`workflow-stage-${stage.key}`}
                data-stage-state={state.toLowerCase()}
              >
                {/* Icon Marker */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 ${stateColor}`}>
                  <StateIcon className="h-5 w-5" />
                </div>
                
                {/* Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className={`font-semibold ${isCurrent ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        {stage.label}
                      </h4>
                      {stage.description && (
                        <p className="text-xs text-muted-foreground mt-1">{stage.description}</p>
                      )}
                    </div>
                    {isCompleted && !isEditing && (
                      <Badge variant="outline" className="bg-success/5 text-success border-success/20">
                        Done
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30" data-testid="workflow-current-stage">
                        Current
                      </Badge>
                    )}
                  </div>

                  {/* Edit Form for COMPLETED stage */}
                  {isEditing && (
                    <div className="mt-4 space-y-3" data-testid={`workflow-stage-edit-${stage.key}`}>
                      <Textarea 
                        placeholder="Update remarks..." 
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="text-sm h-16 resize-none"
                      />
                      {stage.branchConditionId && (
                        <div className="p-2 text-xs bg-warning/10 text-warning border border-warning/20 rounded">
                          Branch decisions cannot be safely changed after dependent stages exist. Cancel or save remarks only.
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1" 
                          onClick={() => handleUpdateCompletedStage(stage.key)}
                          data-testid="workflow-stage-save"
                        >
                          Save Update
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Branch Decisions Form for CURRENT stage */}
                  {isCurrent && stage.branchConditionId === "upperGearOrSiding" && (
                    <div className="mt-4 p-3 bg-secondary/50 rounded-md border" data-testid="workflow-branch-upperGearOrSiding">
                      <Label className="mb-2 block font-medium">Select Placement Location</Label>
                      <RadioGroup value={btpnPlacement} onValueChange={(val: any) => setBtpnPlacement(val)}>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="mv_shed" id="mv_shed" />
                          <Label htmlFor="mv_shed">MV Shed (Upper Gear/Valve)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sick_line" id="sick_line" />
                          <Label htmlFor="sick_line">Sick Line (ROH/Routine)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {isCurrent && stage.branchConditionId === "defectReason" && (
                    <div className="mt-4 p-3 bg-secondary/50 rounded-md border" data-testid="workflow-branch-defectReason">
                      <Label className="mb-2 block font-medium">Select Defect Reason</Label>
                      <RadioGroup value={btpglnReason} onValueChange={(val: any) => setBtpglnReason(val)}>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="under_gear" id="under_gear" />
                          <Label htmlFor="under_gear">Under Gear Defect</Label>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="upper_gear" id="upper_gear" />
                          <Label htmlFor="upper_gear">Upper Gear Defect</Label>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="roh_due" id="roh_due" />
                          <Label htmlFor="roh_due">ROH Due</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="poh_due" id="poh_due" />
                          <Label htmlFor="poh_due">POH Due</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {isCurrent && stage.branchConditionId === "purgingStatus" && (
                    <div className="mt-4 p-3 bg-secondary/50 rounded-md border" data-testid="workflow-branch-purgingStatus">
                      <Label className="mb-2 block font-medium">Purging Outcome</Label>
                      <RadioGroup value={btpglnPurgingOutcome} onValueChange={(val: any) => setBtpglnPurgingOutcome(val)}>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="fit" id="purging_fit" />
                          <Label htmlFor="purging_fit">Clear / Proceed to Yard Exam</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sick" id="purging_sick" />
                          <Label htmlFor="purging_sick">Marked Sick (Return to HAPA Depot)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Actions for CURRENT stage */}
                  {isCurrent && (
                    <div className="mt-4 space-y-3">
                      <Textarea 
                        placeholder="Add remarks for this stage..." 
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="text-sm h-16 resize-none"
                      />
                      <Button 
                        className="w-full" 
                        onClick={handleCompleteCurrent}
                        data-testid={`workflow-stage-action-${stage.key}`}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark Complete & Continue
                      </Button>
                    </div>
                  )}

                  {/* Details for COMPLETED stages */}
                  {isCompleted && historyEntry && !isEditing && (
                    <div className="mt-3 flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs px-2 flex-1 justify-between"
                        onClick={() => toggleExpand(stage.key)}
                      >
                        View Details
                        {expandedStages.has(stage.key) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => handleStartEdit(stage.key, historyEntry)}
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                  {isCompleted && historyEntry && !isEditing && expandedStages.has(stage.key) && (
                    <div className="mt-2 text-xs bg-secondary/30 p-2 rounded-md space-y-1">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Completed:</span>
                        <span className="font-medium text-foreground">
                          {new Date(historyEntry.completedAt).toLocaleString()}
                        </span>
                      </div>
                      {historyEntry.notes && (
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-muted-foreground block mb-1">Remarks:</span>
                          <span className="font-medium">{historyEntry.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
