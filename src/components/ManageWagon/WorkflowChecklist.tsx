import React, { useState, useEffect } from "react";
import { Wagon } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { getResolvedWorkflowForWagon, formatWorkflowTimestamp, getWorkflowDefinitionForWagon } from "@/lib/wagonWorkflows";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CorrectionDialog } from "@/components/ui/CorrectionDialog";
import { Input } from "@/components/ui/input";

interface Props {
  wagon: Wagon;
}

export function WorkflowChecklist({ wagon }: Props) {
  const { user } = useAuth();
  const { workflows, markStageDone, advanceWorkflow, upsertWorkflowForWagon } = useAppStore();
  
  // Safe initialization
  const workflowRecord = workflows.find((w) => w.wagonId === wagon.id);
  const def = getWorkflowDefinitionForWagon((wagon as any).details?.typeName || wagon.type);
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState("");

  useEffect(() => {
    // Only attempt initialization if definition is supported and no record exists
    if (!workflowRecord && def) {
      setIsInitializing(true);
      setInitError("");
      
      // In-flight guard inside useAppStore ensures idempotency even in StrictMode
      upsertWorkflowForWagon(wagon.id)
        .catch((e: any) => setInitError(e.message || "Unable to initialize workflow. Please try again."))
        .finally(() => setIsInitializing(false));
    }
  }, [wagon.id, workflowRecord, def, upsertWorkflowForWagon]);

  const resolved = getResolvedWorkflowForWagon(wagon, workflowRecord);
  const loggedInUserName = user?.name || user?.email || "Current User";

  const [remarks, setRemarks] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!def) {
    return <div className="p-8 text-center text-muted-foreground font-medium">Workflow not configured for this wagon type.</div>;
  }

  if (isInitializing) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-r-transparent animate-spin"></div>
        <p>Initializing workflow...</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-4 text-destructive">
        <p className="font-semibold text-lg">{initError}</p>
        <Button variant="outline" onClick={() => {
          setIsInitializing(true);
          setInitError("");
          upsertWorkflowForWagon(wagon.id)
            .catch((e: any) => setInitError(e.message || "Unable to initialize workflow. Please try again."))
            .finally(() => setIsInitializing(false));
        }}>
          Retry Initialization
        </Button>
      </div>
    );
  }

  if (!resolved || !workflowRecord) {
    return <div className="p-4 text-muted-foreground text-center">Workflow configuration missing.</div>;
  }

  const {
    definition,
    currentStageKey,
    resolvedPath,
    stageStates
  } = resolved;

  const currentStageDef = currentStageKey ? definition.stages[currentStageKey] : null;

  const handleCompleteCurrent = () => {
    if (!currentStageKey || !currentStageDef) return;

    if (currentStageDef.nextStages.length > 1 && !selectedBranch) {
      toast({ title: "Branch Selection Required", description: "Please select the next route.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalRemarks = remarks.trim() || `Completed by ${loggedInUserName}`;
      markStageDone(workflowRecord.id, currentStageDef.key, loggedInUserName, loggedInUserName, finalRemarks);
      
      const nextStageKey = currentStageDef.nextStages.length > 1 ? selectedBranch : currentStageDef.nextStages[0];
      if (nextStageKey) {
        advanceWorkflow(workflowRecord.id, nextStageKey);
        toast({ title: "Stage Completed", description: `Advanced to ${definition.stages[nextStageKey]?.label || nextStageKey}` });
      } else {
        toast({ title: "Workflow Completed", description: "All stages finished." });
      }

      setRemarks("");
      setSelectedBranch("");
    } catch (e) {
      toast({ title: "Error", description: "Failed to complete stage", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Correction State
  const [correctingStage, setCorrectingStage] = useState<any | null>(null);
  const [correctionStaff, setCorrectionStaff] = useState("");
  const [correctionRemarks, setCorrectionRemarks] = useState("");
  const [correctionBranch, setCorrectionBranch] = useState("");
  const [originalBranch, setOriginalBranch] = useState("");

  const handleOpenStageCorrection = (stageKey: string, stageDef: any, historyItem: any) => {
    setCorrectingStage({ ...stageDef, key: stageKey });
    setCorrectionStaff(historyItem?.staffName || historyItem?.inspectorName || loggedInUserName);
    setCorrectionRemarks(historyItem?.remarks || "");
    
    // Determine which branch was selected previously
    let selectedNext = "";
    if (stageDef.nextStages.length > 1) {
       // Look forward in the workflow to see which stage is active/completed
       const branchedTo = stageDef.nextStages.find((nxt: string) => workflowRecord.stages.some(s => s.stageName === nxt && s.status !== "Pending"));
       selectedNext = branchedTo || "";
    }
    setCorrectionBranch(selectedNext);
    setOriginalBranch(selectedNext);
  };

  const handleSaveStageCorrection = async (reason: string) => {
    if (!correctingStage) return;

    // Handle Branch Correction if changed
    if (correctingStage.nextStages.length > 1 && correctionBranch && correctionBranch !== originalBranch) {
       const res = useAppStore.getState().correctWorkflowBranch(workflowRecord.id, correctingStage.key, originalBranch, correctionBranch, loggedInUserName, reason);
       if (!res.success) {
         throw new Error(res.error || "Failed to change branch.");
       }
    }

    // Always update metadata
    const patch = { staffName: correctionStaff, inspectorName: correctionStaff, remarks: correctionRemarks };
    useAppStore.getState().correctWorkflowStage(workflowRecord.id, correctingStage.key, patch, loggedInUserName, reason);

    setCorrectingStage(null);
    toast({ title: "Stage Corrected", description: "Workflow metadata updated successfully." });
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Stages Container */}
      <div className="space-y-2">
        {Object.entries(definition.stages).map(([stageKey, stageDef]) => {
          const state = stageStates[stageKey];
          
          if (state === "NOT_APPLICABLE" && stageKey !== currentStageKey) {
            // Only show NOT_APPLICABLE if it's explicitly part of a past unresolved branch, 
            // but for simplicity we hide unselected parallel branches completely to save space,
            // or show them as grayed out if preferred. The instruction said: 
            // "After selection, unavailable alternatives become Not Applicable."
            // Let's render it compactly.
            return (
              <div key={stageKey} className="flex items-center gap-3 p-3 rounded-md bg-secondary/5 border border-border/30 opacity-60">
                <div className="w-1.5 h-6 bg-gray-300 rounded-full" />
                <div className="flex-1 text-sm font-medium text-muted-foreground strike-through">{stageDef.label}</div>
                <div className="text-xs text-muted-foreground">Not Applicable</div>
              </div>
            );
          }

          if (state === "COMPLETED") {
            // Look up the exact completion time from history
            const historyItem = workflowRecord.stages.find(s => s.stageName === stageDef.key || s.stageName === stageKey);
            const timeStr = historyItem?.completedAt ? formatWorkflowTimestamp(historyItem.completedAt) : "Completed";

            return (
              <div key={stageKey} className="flex items-center gap-3 p-3 rounded-md bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 group">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div className="flex-1 text-sm font-medium text-green-900 dark:text-green-400">
                  {stageDef.label}
                  {historyItem?.remarks && <div className="text-xs text-green-800/70 font-normal italic mt-1">{historyItem.remarks}</div>}
                </div>
                <div className="text-xs text-muted-foreground mr-2">{timeStr}</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-green-700 hover:text-green-900 hover:bg-green-100/50"
                  onClick={() => handleOpenStageCorrection(stageKey, stageDef, historyItem)}
                >
                  <span className="sr-only">Correct</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </Button>
              </div>
            );
          }

          if (state === "CURRENT" && stageKey === currentStageKey) {
            return (
              <div key={stageKey} className="flex flex-col gap-3 p-4 rounded-md border-2 border-primary bg-primary/5 my-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                  <div className="flex-1 font-bold text-primary text-base">{stageDef.label}</div>
                  <div className="text-xs font-bold px-2 py-1 bg-primary/20 rounded-md text-primary">CURRENT</div>
                </div>

                {stageDef.description && (
                  <p className="text-sm text-muted-foreground pl-6">{stageDef.description}</p>
                )}

                {/* Branch Selection UI inside the current stage */}
                {stageDef.nextStages.length > 1 && (
                  <div className="pl-6 pt-3 pb-2">
                    <Label className="font-semibold mb-3 block">Choose next route:</Label>
                    <RadioGroup value={selectedBranch} onValueChange={setSelectedBranch} className="space-y-2">
                      {stageDef.nextStages.map(branchKey => (
                        <div key={branchKey} className="flex items-center space-x-2">
                          <RadioGroupItem value={branchKey} id={branchKey} />
                          <Label htmlFor={branchKey} className="cursor-pointer">{definition.stages[branchKey]?.label || branchKey}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                <div className="pl-6 pt-2">
                  <Textarea 
                    placeholder="Add remarks..." 
                    value={remarks} 
                    onChange={e => setRemarks(e.target.value)}
                    className="bg-background min-h-[80px]"
                  />
                </div>

                <div className="pl-6 pt-2">
                  <Button onClick={handleCompleteCurrent} disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? "Saving..." : "Mark Complete & Continue"}
                  </Button>
                </div>
              </div>
            );
          }

          if (state === "PENDING") {
            return (
              <div key={stageKey} className="flex items-center gap-3 p-3 rounded-md border border-border/50 bg-card">
                <Circle className="h-5 w-5 text-muted-foreground/50" />
                <div className="flex-1 text-sm font-medium text-foreground">{stageDef.label}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            );
          }

          return null;
        })}
      </div>

      <CorrectionDialog
        isOpen={!!correctingStage}
        onOpenChange={(open) => !open && setCorrectingStage(null)}
        title="Correct Workflow Stage"
        description="Correct the metadata of this completed stage, or change the selected branch if work has not proceeded downstream."
        reasonRequired={true}
        onSave={handleSaveStageCorrection}
      >
        {correctingStage && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Stage</Label>
              <Input value={correctingStage.label} disabled className="bg-muted" />
            </div>
            
            {/* If it was a branching stage, allow changing branch */}
            {correctingStage.nextStages.length > 1 && (
              <div className="space-y-2 pt-2 pb-2">
                <Label className="text-red-600 font-semibold mb-2 block">Correct Branch Selection (Dangerous)</Label>
                <div className="text-xs text-muted-foreground mb-3">
                  Changing the selected route is only permitted if no downstream work has begun on the current branch.
                </div>
                <RadioGroup value={correctionBranch} onValueChange={setCorrectionBranch} className="space-y-2">
                  {correctingStage.nextStages.map(branchKey => (
                    <div key={branchKey} className="flex items-center space-x-2">
                      <RadioGroupItem value={branchKey} id={`corr-${branchKey}`} />
                      <Label htmlFor={`corr-${branchKey}`} className="cursor-pointer">
                        {definition.stages[branchKey]?.label || branchKey}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="space-y-2">
              <Label>Completed By (Staff/Inspector Name)</Label>
              <Input value={correctionStaff} onChange={e => setCorrectionStaff(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea 
                value={correctionRemarks} 
                onChange={e => setCorrectionRemarks(e.target.value)} 
                placeholder="Updated remarks..."
              />
            </div>
          </div>
        )}
      </CorrectionDialog>
    </div>
  );
}
