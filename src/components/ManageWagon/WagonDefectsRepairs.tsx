import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { DEFECT_LIBRARY } from "@/lib/wagonData";
import { InspectionChecklist, RepairTask, FitConfirmation } from "@/types";
import { CorrectionDialog } from "@/components/ui/CorrectionDialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  wagonId: string;
}

export function WagonDefectsRepairs({ wagonId }: Props) {
  const { user } = useAuth();
  const { wagons, updateWagon, updateInspectionChecklist, markWagonFit, updateRepairTask, log } = useAppStore();
  const wagon = wagons.find((w) => w.id === wagonId);
  const loggedInUserName = user?.name || user?.email || "Current User";

  const [editRepairTypes, setEditRepairTypes] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<InspectionChecklist>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Correction state
  const [correctingTask, setCorrectingTask] = useState<RepairTask | null>(null);
  const [correctingTaskRemarks, setCorrectingTaskRemarks] = useState("");
  const [isFitCorrectionOpen, setIsFitCorrectionOpen] = useState(false);
  const [fitCorrectionData, setFitCorrectionData] = useState<Partial<FitConfirmation>>({ confirmedBy: "", remarks: "" });

  useEffect(() => {
    if (wagon) {
      setEditRepairTypes(wagon.repairTypes || []);
      setChecklist(wagon.inspectionChecklist || {});
      if (wagon.fitConfirmation) {
        setFitCorrectionData({
          confirmedBy: wagon.fitConfirmation.confirmedBy || "",
          remarks: wagon.fitConfirmation.remarks || ""
        });
      }
    }
  }, [wagon]);

  if (!wagon) return null;

  const handleOpenTaskCorrection = (task: RepairTask) => {
    setCorrectingTask(task);
    setCorrectingTaskRemarks(task.remarks || "");
  };

  const handleSaveTaskCorrection = async (reason: string) => {
    if (!correctingTask) return;
    const patch = { remarks: correctingTaskRemarks };
    
    updateRepairTask(wagon.id, correctingTask.id || correctingTask.subRepair, patch, loggedInUserName);
    
    // Log explicit correction audit event
    log({
      actor: loggedInUserName,
      action: "Work Done Corrected",
      wagonId: wagon.id,
      details: `Task '${correctingTask.subRepair}' remarks corrected. Reason: ${reason}`
    });

    setCorrectingTask(null);
    toast({ title: "Task Corrected", description: "Work Done details have been updated." });
  };

  const handleSaveFitCorrection = async (reason: string) => {
    if (!wagon.fitConfirmation) return;
    
    // Bypass markWagonFit, just patch the metadata directly
    const patchedFit = { ...wagon.fitConfirmation, ...fitCorrectionData };
    updateWagon(wagon.id, { fitConfirmation: patchedFit }, loggedInUserName);

    log({
      actor: loggedInUserName,
      action: "Fit Information Corrected",
      wagonId: wagon.id,
      details: `Fit metadata corrected. Reason: ${reason}`
    });

    setIsFitCorrectionOpen(false);
    toast({ title: "Fit Corrected", description: "Fitness metadata updated." });
  };

  const handleSave = () => {
    setIsSubmitting(true);
    try {
      updateWagon(wagonId, { repairTypes: editRepairTypes }, loggedInUserName);
      updateInspectionChecklist(wagonId, checklist);
      toast({ title: "Condition Updated", description: "Wagon defects and repairs saved." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to save condition", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkFit = () => {
    const res = markWagonFit(wagonId);
    if (res.success) {
      toast({ title: "Wagon Marked Fit", description: "The wagon is now Fit For Loading." });
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
  };

  const toggleRepairType = (typeName: string) => {
    setEditRepairTypes(prev => 
      prev.includes(typeName) ? prev.filter(t => t !== typeName) : [...prev, typeName]
    );
  };

  const handleChecklistToggle = (key: keyof InspectionChecklist, val: boolean) => {
    setChecklist(prev => ({
      ...prev,
      [key]: val ? {
        checked: true,
        checkedBy: loggedInUserName,
        checkedAt: new Date().toISOString()
      } : undefined
    }));
  };

  const hasGroup = (groupName: string) => {
    const group = DEFECT_LIBRARY.find(g => g.groupName === groupName);
    if (!group) return false;
    return editRepairTypes.some(rt => group.defects.some(d => d.name === rt));
  };

  const getSeverityColor = (defectName: string) => {
    for (const group of DEFECT_LIBRARY) {
      const def = group.defects.find(d => d.name === defectName);
      if (def) {
        if (def.severity === "Safety Critical") return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400";
        if (def.severity === "Urgent") return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400";
        return "bg-primary/10 text-primary border-primary/20";
      }
    }
    return "bg-primary/10 text-primary border-primary/20";
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="bg-destructive/5 border border-destructive/20 rounded-md p-4 mb-4">
        <h4 className="font-semibold text-destructive mb-1">Primary Defect Reason</h4>
        <p className="text-sm">{wagon.defect || "None specified"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-semibold mb-3 block">Inspection Checklist</Label>
          <div className="space-y-3 p-4 border rounded-md bg-secondary/10">
            <div className="flex items-center space-x-2">
              <Checkbox id="cl-underGear" checked={!!(checklist as any).underGear?.checked} onCheckedChange={(c) => handleChecklistToggle("underGear" as any, !!c)} />
              <Label htmlFor="cl-underGear" className="text-sm font-normal cursor-pointer">Under Gear Examined</Label>
              {(checklist as any).underGear?.checkedBy && <span className="text-[10px] text-muted-foreground ml-auto">by {(checklist as any).underGear.checkedBy}</span>}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="cl-upperGear" checked={!!(checklist as any).upperGear?.checked} onCheckedChange={(c) => handleChecklistToggle("upperGear" as any, !!c)} />
              <Label htmlFor="cl-upperGear" className="text-sm font-normal cursor-pointer">Upper Gear Examined</Label>
              {(checklist as any).upperGear?.checkedBy && <span className="text-[10px] text-muted-foreground ml-auto">by {(checklist as any).upperGear.checkedBy}</span>}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="cl-airBrake" checked={!!(checklist as any).airBrake?.checked} onCheckedChange={(c) => handleChecklistToggle("airBrake" as any, !!c)} />
              <Label htmlFor="cl-airBrake" className="text-sm font-normal cursor-pointer">Air Brake Tested</Label>
              {(checklist as any).airBrake?.checkedBy && <span className="text-[10px] text-muted-foreground ml-auto">by {(checklist as any).airBrake.checkedBy}</span>}
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-3 block">Pending / Repair Tasks</Label>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {DEFECT_LIBRARY.map((group) => (
              <div key={group.groupName} className="space-y-2 border p-3 rounded-md bg-card">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{group.groupName}</Label>
                  {hasGroup(group.groupName) && <Badge variant="secondary" className="text-[10px]">Active</Badge>}
                </div>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {group.defects.map((def) => {
                    const isSelected = editRepairTypes.includes(def.name);
                    return (
                      <div 
                        key={def.name}
                        onClick={() => toggleRepairType(def.name)}
                        className={`flex items-start p-2 rounded cursor-pointer border transition-colors ${
                          isSelected ? getSeverityColor(def.name) : "hover:bg-muted border-transparent"
                        }`}
                      >
                        <Checkbox 
                          checked={isSelected} 
                          onCheckedChange={() => toggleRepairType(def.name)}
                          className="mt-0.5 mr-2"
                        />
                        <div>
                          <div className="text-sm font-medium">{def.name}</div>
                          {isSelected && <div className="text-xs opacity-80 mt-1">Est: {(def as any).estHours}h</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t pt-6 mt-6">
        <Label className="text-sm font-semibold mb-3 block text-emerald-600">Work Done</Label>
        <div className="space-y-2 p-4 border border-emerald-100 rounded-md bg-emerald-50/50">
          {(() => {
            const wf = useAppStore.getState().workflows.find(w => w.wagonId === wagon.id);
            const doneStages = wf?.stages.filter(s => s.status === "Done") || [];
            const doneTasks = wagon.repairTasks?.filter(t => t.status === "repaired" || (t as any).status === "completed") || [];
            
            if (doneStages.length === 0 && doneTasks.length === 0) {
              return <div className="text-sm text-muted-foreground italic">No work recorded as completed yet.</div>;
            }

            return (
              <ul className="space-y-2">
                {doneTasks.map((t) => (
                  <li key={`task-${t.id || t.subRepair}`} className="flex items-center justify-between text-sm group">
                    <div>
                      <span className="text-emerald-500 mr-2">✓</span>
                      <span>{t.subRepair} <span className="text-muted-foreground text-xs">(Repair)</span></span>
                      {t.remarks && <div className="text-xs text-muted-foreground ml-6 italic">{t.remarks}</div>}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => handleOpenTaskCorrection(t)}
                    >
                      <span className="sr-only">Correct</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </Button>
                  </li>
                ))}
                {doneStages.map((s, i) => (
                  <li key={`stage-${i}`} className="flex items-center text-sm">
                    <span className="text-emerald-500 mr-2">✓</span>
                    <span>{s.stageName} <span className="text-muted-foreground text-xs">(Workflow)</span></span>
                    {/* Workflow stages are corrected from the Workflow tab */}
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t items-center mt-6">
        <div className="flex items-center gap-2">
          {wagon.status === "FIT_READY" || wagon.status === "RELEASED" || wagon.status === "IN_SERVICE" ? (
            <>
              <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">Currently FIT</Badge>
              <Button variant="outline" size="sm" onClick={() => setIsFitCorrectionOpen(true)}>Correct Fit Info</Button>
            </>
          ) : (
            <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={handleMarkFit}>
              Mark Wagon FIT
            </Button>
          )}
        </div>
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Defects & Repairs"}
        </Button>
      </div>

      <CorrectionDialog
        isOpen={!!correctingTask}
        onOpenChange={(open) => !open && setCorrectingTask(null)}
        title="Correct Repair Task"
        description="Correct the remarks or details of this completed work."
        reasonRequired={true}
        onSave={handleSaveTaskCorrection}
      >
        {correctingTask && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Task / Defect</Label>
              <Input value={correctingTask.subRepair} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea 
                value={correctingTaskRemarks} 
                onChange={e => setCorrectingTaskRemarks(e.target.value)} 
                placeholder="Updated remarks..."
              />
            </div>
          </div>
        )}
      </CorrectionDialog>

      <CorrectionDialog
        isOpen={isFitCorrectionOpen}
        onOpenChange={setIsFitCorrectionOpen}
        title="Correct Fit Information"
        description="Correct the metadata for this Fit confirmation. This will not change the wagon's current status."
        reasonRequired={true}
        onSave={handleSaveFitCorrection}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Fit Confirmed By (Name / ID)</Label>
            <Input 
              value={fitCorrectionData.confirmedBy} 
              onChange={e => setFitCorrectionData(prev => ({...prev, confirmedBy: e.target.value}))} 
            />
          </div>
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea 
              value={fitCorrectionData.remarks} 
              onChange={e => setFitCorrectionData(prev => ({...prev, remarks: e.target.value}))} 
            />
          </div>
        </div>
      </CorrectionDialog>
    </div>
  );
}
