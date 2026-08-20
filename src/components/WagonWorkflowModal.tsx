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
  CheckCircle2, PlayCircle, Clock, Ban, AlertCircle, ChevronDown, ChevronUp, MapPin, Pencil, Train, Info, FileText
} from "lucide-react";
import { getWagonSubtypeDisplay, getRailwayShortName } from "@/lib/wagonDisplay";
import { getApplicableWorkflowPath } from "@/lib/wagonWorkflows";

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

  const path = useMemo(() => def ? getApplicableWorkflowPath(wagon) : [], [def, wagon]);
  const completedCount = path.filter(key => getWorkflowStageState(wagon, key) === "COMPLETED").length;
  const totalApplicableCount = path.length;

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
                <Train className="h-5 w-5 text-muted-foreground" />
                {wagon.wagonNumber}
                <Badge variant="outline">{wagon.details.typeName}</Badge>
                {wagon.details.category && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {wagon.details.category}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2 text-sm">
                <span>{wagon.details.typeName} Tank Wagon</span>
                <span>•</span>
                <span>{getRailwayShortName(wagon.details.railwayName).full}</span>
              </DialogDescription>
            </div>
            <div className="text-right text-sm space-y-1">
              <div className="text-muted-foreground flex items-center justify-end gap-1">
                <MapPin className="h-3 w-3" /> Location: {(wagon as any).bookedTo || (wagon as any).sickLine || "Unknown"}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-3 border rounded-lg bg-card shadow-sm flex flex-col justify-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Defect Summary</div>
            <div className="text-destructive font-semibold text-sm">
              {(wagon as any).defect || wagon.btpglnWorkflow?.sickReason || "Routine"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {wagon.status === "completed" ? "0 Pending" : "1 Pending"}
            </div>
          </div>
          <div className="p-3 border rounded-lg bg-card shadow-sm flex flex-col justify-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Current Stage</div>
            <div className="font-semibold text-blue-600 dark:text-blue-400 text-sm truncate">
              {currentStageKey ? def.stages[currentStageKey].label : "Completed"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {completedCount} / {totalApplicableCount} stages completed
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column: Workflow Checklist */}
          <div className="flex-1 md:w-2/3">
            <h3 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">Workflow Checklist</h3>

            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[19px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:to-transparent">
              {Object.values(def.stages).map((stage, index) => {
                const state = getWorkflowStageState(wagon, stage.key);
                const isSkipped = state === "SKIPPED";
                
                // Render SKIPPED steps differently
                if (isSkipped) {
                  return (
                    <div key={stage.key} className="relative flex items-center group is-active opacity-60" data-testid={`workflow-stage-${stage.key}`} data-stage-state="skipped">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 shadow-sm z-10 text-muted-foreground bg-secondary/50">
                        <Ban className="h-4 w-4" />
                      </div>
                      <div className="w-[calc(100%-3rem)] ml-2 p-3 rounded-xl border border-dashed bg-secondary/20 flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{index + 1}. {stage.label}</span>
                        <span className="text-xs text-muted-foreground italic">Not Applicable (Branch)</span>
                      </div>
                    </div>
                  );
                }

                const isCurrent = state === "CURRENT";
                const isCompleted = state === "COMPLETED";
                const isPending = state === "PENDING" || state === "BLOCKED";
                const isEditing = editingStageKey === stage.key;
                
                let StateIcon = Clock;
                let stateColor = "text-muted-foreground bg-secondary";
                if (isCompleted) {
                  StateIcon = CheckCircle2;
                  stateColor = "text-success bg-success/10 border-success/30";
                } else if (isCurrent) {
                  StateIcon = PlayCircle;
                  stateColor = "text-blue-500 bg-blue-500/10 border-blue-500/30";
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
                    className="relative flex items-center group is-active"
                    data-testid={`workflow-stage-${stage.key}`}
                    data-stage-state={state.toLowerCase()}
                  >
                    {/* Icon Marker */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 shadow-sm z-10 ${stateColor}`}>
                      <StateIcon className="h-5 w-5" />
                    </div>
                    
                    {/* Card */}
                    <div className={`w-[calc(100%-3rem)] ml-2 p-4 rounded-xl border shadow-sm transition-all ${isCurrent ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : 'bg-card'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={`font-semibold text-sm ${isCurrent ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                            {index + 1}. {stage.label}
                          </h4>
                          {isPending && <p className="text-xs text-muted-foreground mt-1">Pending</p>}
                        </div>
                        {isCompleted && !isEditing && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-success/5 text-success border-success/20">Done</Badge>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => handleStartEdit(stage.key, historyEntry)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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
                    <div className="mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {historyEntry.notes && <span className="font-medium">Remarks: {historyEntry.notes} •</span>}
                        <span>{new Date(historyEntry.completedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
            </div>
          </div>
          
          {/* Right Column: Branch Summary */}
          <div className="md:w-1/3 space-y-4" data-testid="workflow-branch-summary">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Branch Summary</h3>
            
            <div className="border rounded-xl p-4 bg-card shadow-sm">
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Active Path</div>
              <div className="text-sm font-medium">
                {def.id === "BTPGLN_BTPGN_WORKFLOW" && (btpglnReason ? btpglnReason.replace(/_/g, ' ') : wagon.btpglnWorkflow?.sickReason?.replace(/_/g, ' ') || "Pending Selection")}
                {def.id === "BTPN_BTPFLN_WORKFLOW" && (btpnPlacement ? btpnPlacement.replace(/_/g, ' ') : wagon.btpnWorkflow?.placementType?.replace(/_/g, ' ') || "Standard Workflow")}
                {!btpglnReason && !btpnPlacement && !wagon.btpglnWorkflow?.sickReason && !wagon.btpnWorkflow?.placementType && "Default Workflow Path"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently tracking {totalApplicableCount} applicable stages based on selected repair criteria.
              </p>
            </div>
            
            <div className="border rounded-xl p-4 bg-card shadow-sm">
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Alternative Branches</div>
              <div className="space-y-2">
                {Object.values(def.stages).filter(s => getWorkflowStageState(wagon, s.key) === "SKIPPED").map(skippedStage => (
                  <div key={skippedStage.key} className="p-2 bg-secondary/30 rounded border border-dashed flex justify-between items-center text-xs">
                    <span className="text-muted-foreground truncate mr-2" title={skippedStage.label}>{skippedStage.label}</span>
                    <Badge variant="secondary" className="font-normal text-[10px] whitespace-nowrap">Not Applicable</Badge>
                  </div>
                ))}
                {Object.values(def.stages).filter(s => getWorkflowStageState(wagon, s.key) === "SKIPPED").length === 0 && (
                  <div className="text-xs text-muted-foreground italic">No alternative branches skipped yet.</div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-900 text-xs">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Stages marked as Not Applicable are skipped based on the selected branch.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
