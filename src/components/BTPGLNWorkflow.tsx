import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WagonRepair } from "@/lib/wagonData";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Wrench,
  Fuel,
  Factory,
  ClipboardCheck,
  Train,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// BTPGLN Workflow stages based on flowchart
export const BTPGLN_STAGES = [
  { id: "sick_reason", name: "Sick Reason", icon: AlertTriangle },
  { id: "rrt_degassing", name: "RRT De-Gassing", icon: Fuel },
  { id: "hapa_examination", name: "HAPA Examination", icon: Factory },
  { id: "rrt_purging", name: "Purging", icon: RotateCcw },
  { id: "yard_examination", name: "Yard Examination", icon: ClipboardCheck },
  { id: "fit_for_loading", name: "Fit for Loading", icon: Train },
] as const;

export type BTPGLNStage = typeof BTPGLN_STAGES[number]["id"];

// Sick reasons as per flowchart
export const SICK_REASONS = [
  { id: "under_gear", name: "Under Gear Defect", requiresWorkshop: false, requiresADLW: false },
  { id: "upper_gear", name: "Upper Gear Defect", requiresWorkshop: true, requiresADLW: false },
  { id: "roh_due", name: "ROH Due", requiresWorkshop: false, requiresADLW: true },
  { id: "poh_due", name: "POH Due", requiresWorkshop: false, requiresADLW: true },
] as const;

export type SickReason = typeof SICK_REASONS[number]["id"];

// Rectification work types
export const RECTIFICATION_TYPES = [
  { id: "under_gear_hapa", name: "Under Gear by HAPA C&W Staff" },
  { id: "upper_gear_workshop", name: "Upper Gear by KOTA/AJMER Workshop Staff" },
  { id: "roh_poh_adlw", name: "ROH/POH at ADLW/KTTW" },
] as const;

// Import the type from wagonData
import { BTPGLNWorkflowData } from "@/lib/wagonData";

interface BTPGLNWorkflowProps {
  wagon: WagonRepair;
  workflowData?: BTPGLNWorkflowData;
  onUpdateWorkflow: (data: BTPGLNWorkflowData) => void;
  onClose: () => void;
}

export function BTPGLNWorkflow({ wagon, workflowData, onUpdateWorkflow, onClose }: BTPGLNWorkflowProps) {
  const initialData: BTPGLNWorkflowData = workflowData || {
    currentStage: "sick_reason",
    stageHistory: [],
    notes: {
      sick_reason: "",
      rrt_degassing: "",
      hapa_examination: "",
      rrt_purging: "",
      yard_examination: "",
      fit_for_loading: "",
    },
  };

  const [data, setData] = useState<BTPGLNWorkflowData>(initialData);
  const [currentNotes, setCurrentNotes] = useState(data.notes[data.currentStage] || "");
  const [markedSickDuringPurging, setMarkedSickDuringPurging] = useState(false);

  const currentStageIndex = BTPGLN_STAGES.findIndex((s) => s.id === data.currentStage);

  const isStageCompleted = (stageId: BTPGLNStage) => {
    return data.stageHistory.some((h) => h.stage === stageId);
  };

  const canUndo = () => {
    return data.stageHistory.length > 0;
  };

  const handleUndo = () => {
    if (!canUndo()) return;

    const newHistory = [...data.stageHistory];
    const lastEntry = newHistory.pop();
    
    if (lastEntry) {
      const previousNotes = data.notes[lastEntry.stage] || "";
      const newData: BTPGLNWorkflowData = {
        ...data,
        currentStage: lastEntry.stage as BTPGLNStage,
        stageHistory: newHistory,
      };
      
      setData(newData);
      setCurrentNotes(previousNotes);
      setMarkedSickDuringPurging(false);
      onUpdateWorkflow(newData);
    }
  };

  const canProceed = () => {
    if (data.currentStage === "sick_reason") {
      return !!data.sickReason && !!data.degassingOption;
    }
    return true;
  };

  const handleProceedToNext = () => {
    if (!canProceed()) return;

    const newHistory = [
      ...data.stageHistory,
      {
        stage: data.currentStage,
        completedAt: new Date().toISOString(),
        notes: currentNotes || undefined,
        markedSickDuringPurging: data.currentStage === "rrt_purging" ? markedSickDuringPurging : undefined,
      },
    ];

    let nextStage: BTPGLNStage;

    // Handle purging sick loop
    if (data.currentStage === "rrt_purging" && markedSickDuringPurging) {
      // Loop back to HAPA for examination
      nextStage = "hapa_examination";
    } else if (data.currentStage === "sick_reason" && data.degassingOption === "without_degassing") {
      // Skip degassing stage if "without degassing" is selected
      nextStage = "hapa_examination";
    } else if (data.currentStage === "hapa_examination" && data.degassingOption === "without_degassing") {
      // Skip purging stage if degassing was bypassed
      nextStage = "yard_examination";
    } else {
      // Get next stage in sequence
      const nextIndex = currentStageIndex + 1;
      if (nextIndex >= BTPGLN_STAGES.length) {
        // Workflow complete
        onUpdateWorkflow({
          ...data,
          currentStage: "fit_for_loading",
          stageHistory: newHistory,
          notes: { ...data.notes, [data.currentStage]: currentNotes },
        });
        return;
      }
      nextStage = BTPGLN_STAGES[nextIndex].id;
    }

    const newData: BTPGLNWorkflowData = {
      ...data,
      currentStage: nextStage,
      stageHistory: newHistory,
      notes: { ...data.notes, [data.currentStage]: currentNotes },
    };

    setData(newData);
    setCurrentNotes(newData.notes[nextStage] || "");
    setMarkedSickDuringPurging(false);
    onUpdateWorkflow(newData);
  };

  const getSickReasonInfo = () => {
    if (!data.sickReason) return null;
    return SICK_REASONS.find((r) => r.id === data.sickReason);
  };

  const getRectificationOptions = () => {
    const reason = getSickReasonInfo();
    if (!reason) return [];

    if (reason.requiresADLW) {
      return [RECTIFICATION_TYPES[2]];
    }
    if (reason.requiresWorkshop) {
      return [RECTIFICATION_TYPES[1]];
    }
    return [RECTIFICATION_TYPES[0]];
  };

  return (
    <Card className="glass border-2 border-primary/20 animate-fade-in">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-transparent">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Train className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-lg">BTPGLN Workflow</span>
              <p className="text-sm font-normal text-muted-foreground">
                Wagon: {wagon.wagonNumber}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Progress Steps */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            {BTPGLN_STAGES.map((stage, index) => {
              const Icon = stage.icon;
              const isCompleted = isStageCompleted(stage.id);
              const isCurrent = stage.id === data.currentStage;
              const isPending = !isCompleted && !isCurrent;

              return (
                <div key={stage.id} className="flex flex-col items-center flex-1">
                  <div className="relative flex items-center justify-center w-full">
                    {index > 0 && (
                      <div
                        className={cn(
                          "absolute left-0 right-1/2 h-1 -translate-y-0",
                          isCompleted || isCurrent ? "bg-primary" : "bg-muted"
                        )}
                      />
                    )}
                    {index < BTPGLN_STAGES.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-1/2 right-0 h-1 -translate-y-0",
                          isCompleted ? "bg-primary" : "bg-muted"
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                        isCompleted && "bg-primary border-primary text-primary-foreground",
                        isCurrent && "bg-background border-primary ring-4 ring-primary/20",
                        isPending && "bg-muted border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs text-center max-w-[70px] leading-tight",
                      isCurrent && "font-semibold text-primary",
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {stage.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Stage Content */}
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              Current Stage
            </Badge>
            <span className="font-semibold">
              {BTPGLN_STAGES.find((s) => s.id === data.currentStage)?.name}
            </span>
          </div>

          {/* Sick Reason Selection */}
          {data.currentStage === "sick_reason" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Sick Reason:</Label>
                <RadioGroup
                  value={data.sickReason || ""}
                  onValueChange={(value) => setData({ ...data, sickReason: value as SickReason })}
                  className="grid grid-cols-2 gap-3"
                >
                  {SICK_REASONS.map((reason) => (
                    <div key={reason.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={reason.id} id={reason.id} />
                      <Label
                        htmlFor={reason.id}
                        className="cursor-pointer text-sm flex-1 p-2 rounded hover:bg-secondary/50"
                      >
                        {reason.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Degassing Option */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">De-Gassing Requirement:</Label>
                <RadioGroup
                  value={data.degassingOption || ""}
                  onValueChange={(value) => setData({ ...data, degassingOption: value as "without_degassing" | "after_degassing" })}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="without_degassing" id="without_degassing" />
                    <Label
                      htmlFor="without_degassing"
                      className="cursor-pointer text-sm flex-1 p-2 rounded hover:bg-secondary/50"
                    >
                      Without De-Gassing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="after_degassing" id="after_degassing" />
                    <Label
                      htmlFor="after_degassing"
                      className="cursor-pointer text-sm flex-1 p-2 rounded hover:bg-secondary/50"
                    >
                      After De-Gassing
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {data.sickReason && (
                <div className="p-3 rounded-md bg-info/10 border border-info/30">
                  <p className="text-sm text-info">
                    {getSickReasonInfo()?.requiresADLW && (
                      <>ROH/POH wagon will be moved to ADLW/KTTW after De-Gassing.</>
                    )}
                    {getSickReasonInfo()?.requiresWorkshop && (
                      <>Staff from KOTA/AJMER workshop will rectify upper gear defects.</>
                    )}
                    {!getSickReasonInfo()?.requiresADLW && !getSickReasonInfo()?.requiresWorkshop && (
                      <>Under gear work will be rectified by HAPA C&W staff.</>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* RRT De-Gassing */}
          {data.currentStage === "rrt_degassing" && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-warning/10 border border-warning/30">
                <div className="flex items-start gap-2">
                  <Fuel className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">De-Gassing Process</p>
                    <p className="text-sm text-muted-foreground">
                      Wagon moved to RRT siding for De-Gassing process.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HAPA Examination */}
          {data.currentStage === "hapa_examination" && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-success/10 border border-success/30">
                <div className="flex items-start gap-2">
                  <Factory className="h-5 w-5 text-success mt-0.5" />
                <div>
                    <p className="font-medium text-success">HAPA Depot Examination</p>
                    <p className="text-sm text-muted-foreground">
                      After DG-completion, wagon moved to HAPA depot for examination work.
                    </p>
                  </div>
                </div>
              </div>
              {getRectificationOptions().length > 0 && (
                <Select
                  value={data.rectificationType || ""}
                  onValueChange={(value) => setData({ ...data, rectificationType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rectification type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getRectificationOptions().map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* RRT Purging */}
          {data.currentStage === "rrt_purging" && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-info/10 border border-info/30">
                <div className="flex items-start gap-2">
                  <RotateCcw className="h-5 w-5 text-info mt-0.5" />
                  <div>
                    <p className="font-medium text-info">Purging Process at RRT</p>
                    <p className="text-sm text-muted-foreground">
                      Wagon moved to RRT for Purging after marked fit at HAPA.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-md border border-destructive/30 bg-destructive/5">
                <input
                  type="checkbox"
                  id="markedSick"
                  checked={markedSickDuringPurging}
                  onChange={(e) => setMarkedSickDuringPurging(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="markedSick" className="text-sm cursor-pointer">
                  <span className="font-medium text-destructive">Wagon marked Sick during Purging</span>
                  <p className="text-xs text-muted-foreground">
                    If checked, wagon will be sent back to HAPA for rectification.
                  </p>
                </Label>
              </div>
            </div>
          )}

          {/* Yard Examination */}
          {data.currentStage === "yard_examination" && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-primary/10 border border-primary/30">
                <div className="flex items-start gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-primary">Yard Examination</p>
                    <p className="text-sm text-muted-foreground">
                      After completion of Purging, wagon moved to HAPA for yard examination.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fit for Loading */}
          {data.currentStage === "fit_for_loading" && (
            <div className="space-y-3">
              <div className="p-4 rounded-md bg-success/20 border border-success/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-success/20">
                    <Train className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="font-bold text-success text-lg">Fit for Loading!</p>
                    <p className="text-sm text-muted-foreground">
                      After completion of yard examination, Rake is fit for loading as per CC type BPC.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes for current stage */}
          <div className="space-y-2">
            <Label htmlFor="stageNotes">Notes (optional)</Label>
            <Textarea
              id="stageNotes"
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              placeholder="Add notes for this stage..."
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        {data.currentStage !== "fit_for_loading" && (
          <div className="flex justify-between gap-3">
            <Button 
              variant="outline" 
              onClick={handleUndo} 
              disabled={!canUndo()}
              className="gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Undo
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Save & Close
              </Button>
              <Button onClick={handleProceedToNext} disabled={!canProceed()}>
                {markedSickDuringPurging ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Send to HAPA
                  </>
                ) : (
                  <>
                    Proceed to Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Stage History */}
        {data.stageHistory.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Stage History</h4>
            <div className="space-y-2">
              {data.stageHistory.map((history, index) => {
                const stage = BTPGLN_STAGES.find((s) => s.id === history.stage);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-sm p-2 rounded bg-secondary/20"
                  >
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="font-medium">{stage?.name}</span>
                    <span className="text-muted-foreground">
                      {new Date(history.completedAt).toLocaleString("en-IN")}
                    </span>
                    {history.markedSickDuringPurging && (
                      <Badge variant="destructive" className="text-xs">
                        Marked Sick
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
