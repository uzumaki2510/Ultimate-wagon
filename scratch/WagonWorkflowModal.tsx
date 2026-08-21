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
import { WagonRepair } from "@/lib/wagonData";
import { useAppStore } from "@/store/useAppStore";
import { 
  getWorkflowDefinitionForWagon, 
  getWorkflowStageState,
  getCurrentWorkflowStage,
  getNextValidStage,
  getApplicableWorkflowPath,
  formatWorkflowTimestamp
} from "@/lib/wagonWorkflows";
import { 
  CheckCircle2, PlayCircle, Clock, Ban, AlertCircle, ChevronDown, ChevronUp, MapPin, Pencil, Train, Info, FileText
} from "lucide-react";
import { getRailwayShortName } from "@/lib/wagonDisplay";

interface Props {
  wagon: WagonRepair;
  onClose: () => void;
}

export function WagonWorkflowModal({ wagon, onClose }: Props) {
  const { workflows, markStageDone, advanceWorkflow } = useAppStore();
  const workflow = useMemo(() => workflows.find(w => w.wagonId === wagon.id), [workflows, wagon.id]);
  const def = useMemo(() => getWorkflowDefinitionForWagon(wagon.details.typeName), [wagon]);
  
  const currentStageKey = useMemo(() => def ? getCurrentWorkflowStage(workflow, def) : null, [workflow, def]);

  // Local state for the form at the current stage
  const [remarks, setRemarks] = useState("");
  const [btpnPlacement, setBtpnPlacement] = useState<"mv_shed" | "sick_line" | "">("");
  const [btpglnReason, setBtpglnReason] = useState<"under_gear" | "upper_gear" | "roh_due" | "poh_due" | "">("");
  const [btpglnPurgingOutcome, setBtpglnPurgingOutcome] = useState<"fit" | "sick" | "">("");
  
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [editingStageKey, setEditingStageKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const path = useMemo(() => def ? getApplicableWorkflowPath(workflow, def) : [], [def, workflow]);
  const completedCount = path.filter(key => getWorkflowStageState(workflow, key) === "COMPLETED").length;
  const totalApplicableCount = path.length;

  if (!def || !workflow) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Workflow Details</DialogTitle></DialogHeader>
          <p className="text-muted-foreground py-4">Workflow not initialized or not configured for this wagon type.</p>
          <DialogFooter><Button onClick={onClose}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const currentStageDef = currentStageKey ? def.stages[currentStageKey] : null;

  const toggleStageExpand = (key: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getNextStageKeyForBranch = (): string | null => {
    if (!currentStageDef) return null;
    if (currentStageDef.nextStages.length === 0) return null;
    if (currentStageDef.nextStages.length === 1) return currentStageDef.nextStages[0];

    // Evaluate branch conditions
    if (currentStageDef.branchConditionId === "upperGearOrSiding") {
      if (btpnPlacement === "mv_shed") return "MAINTENANCE_REPAIR";
      if (btpnPlacement === "sick_line") return "SIDING_PLACEMENT";
    }
    if (currentStageDef.branchConditionId === "defectReason") {
      if (btpglnReason === "under_gear") return "UNDER_GEAR_RECTIFICATION";
      if (btpglnReason === "upper_gear") return "UPPER_GEAR_RECTIFICATION";
      if (btpglnReason === "roh_due" || btpglnReason === "poh_due") return "ROH_POH_RECTIFICATION";
    }
    if (currentStageDef.branchConditionId === "purgingStatus") {
      if (btpglnPurgingOutcome === "sick") return "HAPA_DEPOT";
      if (btpglnPurgingOutcome === "fit") return "HAPA_YARD_EXAM";
    }
    
    return null;
  };

  const isFormValid = () => {
    if (!currentStageDef) return false;
    if (currentStageDef.branchConditionId === "upperGearOrSiding" && !btpnPlacement) return false;
    if (currentStageDef.branchConditionId === "defectReason" && !btpglnReason) return false;
    if (currentStageDef.branchConditionId === "purgingStatus" && !btpglnPurgingOutcome) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!currentStageKey || !isFormValid() || !workflow) return;
    setIsSubmitting(true);
    
    try {
      const nextStageKey = getNextStageKeyForBranch();
      
      // Append branch choices to remarks for history
      let finalRemarks = remarks;
      if (btpnPlacement) finalRemarks = `Placement: ${btpnPlacement} ${remarks ? '- ' + remarks : ''}`;
      if (btpglnReason) finalRemarks = `Reason: ${btpglnReason} ${remarks ? '- ' + remarks : ''}`;
      if (btpglnPurgingOutcome) finalRemarks = `Outcome: ${btpglnPurgingOutcome} ${remarks ? '- ' + remarks : ''}`;

      markStageDone(workflow.id, currentStageKey, "User", "Inspector", finalRemarks);
      if (nextStageKey) {
        advanceWorkflow(workflow.id, nextStageKey);
      }
      
      // Reset local state
      setRemarks("");
      setBtpnPlacement("");
      setBtpglnReason("");
      setBtpglnPurgingOutcome("");
    } catch (e) {
      console.error(e);
      alert("Failed to update workflow stage.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCompletedStage = (stageKey: string) => {
    // We would need an API to update remarks for a completed stage in WorkflowItem
    // Since we don't have it exposed in store, we'll just skip this or alert
    alert("Editing completed stages requires admin intervention in this version.");
    setEditingStageKey(null);
    setRemarks("");
  };

  const handleStartEdit = (stageKey: string, historyEntry: any) => {
    setRemarks(historyEntry?.remarks || "");
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
                <span>{wagon.details.typeName} Wagon</span>
                <span>•</span>
                <span>{getRailwayShortName(wagon.details.railwayName).full}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-3 border rounded-lg bg-card shadow-sm flex flex-col justify-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Defect Summary</div>
            <div className="font-medium text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              {wagon.defect || "Unknown defect"}
            </div>
          </div>
          <div className="p-3 border rounded-lg bg-card shadow-sm flex flex-col justify-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Progress</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${(completedCount / (totalApplicableCount || 1)) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium">{completedCount}/{totalApplicableCount}</span>
            </div>
          </div>
        </div>

        {/* Current Active Stage Actions */}
        {currentStageDef && getWorkflowStageState(workflow, currentStageKey!) === "CURRENT" && (
          <div className="mb-6 p-4 border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20 rounded-xl shadow-sm">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-1 text-blue-900 dark:text-blue-100">
              <PlayCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {currentStageDef.label}
            </h3>
            {currentStageDef.description && (
              <p className="text-sm text-blue-700/80 dark:text-blue-300 mb-4">{currentStageDef.description}</p>
            )}

            <div className="space-y-4">
              {/* Branch UI */}
              {currentStageDef.branchConditionId === "upperGearOrSiding" && (
                <div className="space-y-2 p-3 bg-white dark:bg-black/20 rounded border">
                  <Label className="text-sm font-semibold">Select Rectification Location:</Label>
                  <RadioGroup value={btpnPlacement} onValueChange={(v: any) => setBtpnPlacement(v)} className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mv_shed" id="mv_shed" />
                      <Label htmlFor="mv_shed">MV Shed (Maintenance / Repair)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sick_line" id="sick_line" />
                      <Label htmlFor="sick_line">Sick Line Siding</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {currentStageDef.branchConditionId === "defectReason" && (
                <div className="space-y-2 p-3 bg-white dark:bg-black/20 rounded border">
                  <Label className="text-sm font-semibold">Select Rectification Type:</Label>
                  <RadioGroup value={btpglnReason} onValueChange={(v: any) => setBtpglnReason(v)} className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="under_gear" id="under_gear" />
                      <Label htmlFor="under_gear">Under Gear Defect (HAPA C&W)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upper_gear" id="upper_gear" />
                      <Label htmlFor="upper_gear">Upper Gear Defect (KOTA/AJMER staff)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="roh_due" id="roh_due" />
                      <Label htmlFor="roh_due">ROH / POH Due (Move to ADLW/KTTW)</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {currentStageDef.branchConditionId === "purgingStatus" && (
                <div className="space-y-2 p-3 bg-white dark:bg-black/20 rounded border">
                  <Label className="text-sm font-semibold">Purging Outcome:</Label>
                  <RadioGroup value={btpglnPurgingOutcome} onValueChange={(v: any) => setBtpglnPurgingOutcome(v)} className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fit" id="fit" />
                      <Label htmlFor="fit">Marked Fit (Proceed to Yard Exam)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sick" id="sick" />
                      <Label htmlFor="sick">Found Sick during Purging (Return to HAPA Depot)</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Action Notes */}
              <div>
                <Label htmlFor="remarks" className="text-sm font-medium mb-1 block">Notes / Remarks</Label>
                <Textarea 
                  id="remarks"
                  placeholder="Enter completion remarks..." 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button 
                  className="w-full sm:w-auto font-medium" 
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isSubmitting}
                >
                  Mark Complete & Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Workflow Path List */}
        <div>
          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Workflow Stages</h4>
          <div className="space-y-2 relative before:absolute before:inset-y-0 before:left-[19px] before:w-[2px] before:bg-muted ml-2">
            {path.map((stageKey, index) => {
              const stageDef = def.stages[stageKey];
              if (!stageDef) return null;
              
              const state = getWorkflowStageState(workflow, stageKey);
              const isCompleted = state === "COMPLETED";
              const isCurrent = state === "CURRENT";
              
              const stageRecord = workflow.stages.find(s => s.stageName === stageKey);
              const timestamp = stageRecord?.completedAt;
              const savedRemarks = stageRecord?.remarks;

              const isEditing = editingStageKey === stageKey;

              let icon = <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />;
              let wrapperClass = "border-transparent opacity-60";
              let headerClass = "text-muted-foreground";

              if (isCompleted) {
                icon = <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />;
                wrapperClass = "border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-900/10";
                headerClass = "text-foreground";
              } else if (isCurrent) {
                icon = <div className="h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900 animate-pulse" />;
                wrapperClass = "border-blue-200 bg-white dark:bg-black shadow-sm ring-1 ring-blue-500/20";
                headerClass = "text-blue-900 dark:text-blue-100 font-medium";
              }

              return (
                <div key={stageKey} className={`relative pl-10 transition-all ${isEditing ? 'z-10' : ''}`}>
                  <div className="absolute left-0 top-3 -translate-x-[2px] bg-background z-10 flex h-6 w-6 items-center justify-center">
                    {icon}
                  </div>
                  <div className={`rounded-lg border p-3 ${wrapperClass}`}>
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleStageExpand(stageKey)}
                    >
                      <div>
                        <h4 className={`text-sm ${headerClass}`}>{stageDef.label}</h4>
                        {isCompleted && timestamp && (
                          <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                            <Clock className="h-3 w-3" />
                            {formatWorkflowTimestamp(timestamp)}
                          </div>
                        )}
                        {!isCompleted && !isCurrent && stageDef.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {stageDef.description}
                          </div>
                        )}
                      </div>
                      
                      {isCompleted && !isEditing && (
                        <div className="flex items-center gap-2">
                          {savedRemarks && (
                            <Badge variant="outline" className="bg-white/50 text-[10px] h-5 px-1.5 flex gap-1 items-center">
                              <FileText className="h-3 w-3" /> Note attached
                            </Badge>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(stageKey, stageRecord);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Edit Form for Completed Stage */}
                    {isEditing && (
                      <div className="mt-3 pt-3 border-t space-y-3" onClick={e => e.stopPropagation()}>
                        <div>
                          <Label className="text-xs mb-1 block">Update Remarks</Label>
                          <Textarea 
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="text-sm resize-none h-16"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                          <Button size="sm" onClick={() => handleUpdateCompletedStage(stageKey)}>Save Update</Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Read-only notes display */}
                    {isCompleted && savedRemarks && !isEditing && expandedStages.has(stageKey) && (
                      <div className="mt-3 pt-3 border-t text-sm text-muted-foreground italic bg-black/5 dark:bg-white/5 p-2 rounded">
                        "{savedRemarks}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
