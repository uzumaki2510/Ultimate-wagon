import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { WagonRepair, BTPNWorkflowData } from "@/lib/wagonData";
import {
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Factory,
  ClipboardCheck,
  Train,
  Undo2,
  Droplets,
  ThermometerSun,
  FlaskConical,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";

// BTPN/BTPFLN Workflow stages based on flowchart
export const BTPN_STAGES = [
  { id: "yard_issue", name: "Issue Marked", icon: AlertTriangle },
  { id: "steaming", name: "Steaming", icon: ThermometerSun },
  { id: "steam_cleaning", name: "Steam Point (24h)", icon: Timer },
  { id: "rectification", name: "Rectification", icon: Wrench },
  { id: "placement_decision", name: "Placement", icon: Factory },
  { id: "hydro_testing", name: "Hydro Testing", icon: FlaskConical },
  { id: "fit_for_use", name: "Fit for Use", icon: Train },
] as const;

export type BTPNStage = typeof BTPN_STAGES[number]["id"];

// MV Shed work types as per flowchart
export const MV_SHED_WORK_TYPES = [
  { id: "upper_gear", name: "Upper Gear" },
  { id: "ladder", name: "Ladder" },
  { id: "barrel", name: "Barrel" },
  { id: "valve", name: "Valve" },
  { id: "delivery_pipe", name: "Delivery Pipe" },
  { id: "master_valve", name: "Master Valve" },
  { id: "auodco_valve", name: "Auodco Valve" },
] as const;

interface BTPNWorkflowProps {
  wagon: WagonRepair;
  workflowData?: BTPNWorkflowData;
  onUpdateWorkflow: (data: BTPNWorkflowData) => void;
  onClose: () => void;
}

export function BTPNWorkflow({ wagon, workflowData, onUpdateWorkflow, onClose }: BTPNWorkflowProps) {
  const initialData: BTPNWorkflowData = workflowData || {
    currentStage: "yard_issue",
    stageHistory: [],
    notes: {
      yard_issue: "",
      steaming: "",
      steam_cleaning: "",
      rectification: "",
      placement_decision: "",
      hydro_testing: "",
      fit_for_use: "",
    },
  };

  const [data, setData] = useState<BTPNWorkflowData>(initialData);
  const [currentNotes, setCurrentNotes] = useState(data.notes[data.currentStage] || "");
  const [selectedMvShedWorkTypes, setSelectedMvShedWorkTypes] = useState<string[]>(data.mvShedWorkTypes || []);

  const currentStageIndex = BTPN_STAGES.findIndex((s) => s.id === data.currentStage);

  const isStageCompleted = (stageId: BTPNStage) => {
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
      const newData: BTPNWorkflowData = {
        ...data,
        currentStage: lastEntry.stage as BTPNStage,
        stageHistory: newHistory,
      };
      
      setData(newData);
      setCurrentNotes(previousNotes);
      onUpdateWorkflow(newData);
    }
  };

  const canProceed = () => {
    if (data.currentStage === "placement_decision") {
      return !!data.placementType;
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
      },
    ];

    let nextStage: BTPNStage;

    // Get next stage in sequence
    const nextIndex = currentStageIndex + 1;
    if (nextIndex >= BTPN_STAGES.length) {
      // Workflow complete
      onUpdateWorkflow({
        ...data,
        currentStage: "fit_for_use",
        stageHistory: newHistory,
        notes: { ...data.notes, [data.currentStage]: currentNotes },
        mvShedWorkTypes: data.placementType === "mv_shed" ? selectedMvShedWorkTypes : undefined,
      });
      return;
    }
    nextStage = BTPN_STAGES[nextIndex].id;

    const newData: BTPNWorkflowData = {
      ...data,
      currentStage: nextStage,
      stageHistory: newHistory,
      notes: { ...data.notes, [data.currentStage]: currentNotes },
      mvShedWorkTypes: data.placementType === "mv_shed" ? selectedMvShedWorkTypes : undefined,
    };

    setData(newData);
    setCurrentNotes(newData.notes[nextStage] || "");
    onUpdateWorkflow(newData);
  };

  const toggleMvShedWorkType = (typeId: string) => {
    setSelectedMvShedWorkTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  return (
    <Card className="glass border-2 border-primary/20 animate-fade-in">
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-500/10 to-transparent">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500/20">
              <Droplets className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <span className="text-lg">BTPN/BTPFLN Workflow</span>
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
        <div className="relative overflow-x-auto pb-2">
          <div className="flex items-center justify-between mb-2 min-w-[600px]">
            {BTPN_STAGES.map((stage, index) => {
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
                          isCompleted || isCurrent ? "bg-blue-500" : "bg-muted"
                        )}
                      />
                    )}
                    {index < BTPN_STAGES.length - 1 && (
                      <div
                        className={cn(
                          "absolute left-1/2 right-0 h-1 -translate-y-0",
                          isCompleted ? "bg-blue-500" : "bg-muted"
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        "relative z-10 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all",
                        isCompleted && "bg-blue-500 border-blue-500 text-white",
                        isCurrent && "bg-background border-blue-500 ring-4 ring-blue-500/20",
                        isPending && "bg-muted border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-[10px] sm:text-xs text-center max-w-[60px] sm:max-w-[70px] leading-tight",
                      isCurrent && "font-semibold text-blue-500",
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
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
              Current Stage
            </Badge>
            <span className="font-semibold">
              {BTPN_STAGES.find((s) => s.id === data.currentStage)?.name}
            </span>
          </div>

          {/* Yard Issue Marked */}
          {data.currentStage === "yard_issue" && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-warning/10 border border-warning/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Issue Marked in Yard</p>
                    <p className="text-sm text-muted-foreground">
                      BTPN/BTPFLN wagon issue has been marked in the yard. Proceed to steaming.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Steaming */}
          {data.currentStage === "steaming" && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-orange-500/10 border border-orange-500/30">
                <div className="flex items-start gap-2">
                  <ThermometerSun className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-500">Steaming Process</p>
                    <p className="text-sm text-muted-foreground">
                      Wagon is being steamed for initial treatment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Steam Cleaning at Steam Point */}
          {data.currentStage === "steam_cleaning" && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-cyan-500/10 border border-cyan-500/30">
                <div className="flex items-start gap-2">
                  <Timer className="h-5 w-5 text-cyan-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-cyan-500">Placement at Steam Point for Steam Cleaning</p>
                    <p className="text-sm text-muted-foreground">
                      Wagon placed at steaming point for steam cleaning. <strong>Wagon kept open for 24 hours.</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rectification */}
          {data.currentStage === "rectification" && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-success/10 border border-success/30">
                <div className="flex items-start gap-2">
                  <Wrench className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium text-success">Rectification of Wagon</p>
                    <p className="text-sm text-muted-foreground">
                      Wagon rectification work in progress.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Placement Decision */}
          {data.currentStage === "placement_decision" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Placement Location:</Label>
                <RadioGroup
                  value={data.placementType || ""}
                  onValueChange={(value) => setData({ ...data, placementType: value as "mv_shed" | "sick_line" })}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <div className="flex items-start space-x-2 p-3 rounded-md border border-border/50 hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="mv_shed" id="mv_shed" className="mt-1" />
                    <Label
                      htmlFor="mv_shed"
                      className="cursor-pointer text-sm flex-1"
                    >
                      <span className="font-medium">MV Shed</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        For Upper Gear, Ladder, Barrel, Valve, Delivery Pipe, Master Valve, Auodco Valve work
                      </p>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2 p-3 rounded-md border border-border/50 hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="sick_line" id="sick_line" className="mt-1" />
                    <Label
                      htmlFor="sick_line"
                      className="cursor-pointer text-sm flex-1"
                    >
                      <span className="font-medium">Sick Line (ROH)</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Wagon placement for sick line routine overhaul
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* MV Shed Work Types Selection */}
              {data.placementType === "mv_shed" && (
                <div className="space-y-3 p-3 rounded-md bg-purple-500/10 border border-purple-500/30">
                  <Label className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    Select Work Types at MV Shed:
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MV_SHED_WORK_TYPES.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.id}
                          checked={selectedMvShedWorkTypes.includes(type.id)}
                          onCheckedChange={() => toggleMvShedWorkType(type.id)}
                        />
                        <Label
                          htmlFor={type.id}
                          className="cursor-pointer text-sm"
                        >
                          {type.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.placementType === "sick_line" && (
                <div className="p-3 rounded-md bg-info/10 border border-info/30">
                  <p className="text-sm text-info">
                    Wagon will be placed in sick line for ROH (Routine Overhaul).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Hydro Testing */}
          {data.currentStage === "hydro_testing" && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-2">
                  <FlaskConical className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-500">Hydro Testing</p>
                    <p className="text-sm text-muted-foreground">
                      Wagon undergoing hydro testing to ensure tank integrity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fit for Use */}
          {data.currentStage === "fit_for_use" && (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-success/10 border border-success/30">
                <div className="flex items-start gap-2">
                  <Train className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium text-success">Wagon Fit for Use</p>
                    <p className="text-sm text-muted-foreground">
                      All checks passed. Wagon is ready for loading and operation.
                    </p>
                  </div>
                </div>
              </div>
              {data.placementType && (
                <div className="p-3 rounded-md bg-secondary/50">
                  <p className="text-sm">
                    <span className="font-medium">Placement: </span>
                    {data.placementType === "mv_shed" ? "MV Shed" : "Sick Line (ROH)"}
                  </p>
                  {data.mvShedWorkTypes && data.mvShedWorkTypes.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Work done: </span>
                      {data.mvShedWorkTypes.map(t => MV_SHED_WORK_TYPES.find(m => m.id === t)?.name).filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes for this stage (optional):
            </Label>
            <Textarea
              id="notes"
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              placeholder="Add any observations or notes..."
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        {/* Stage History */}
        {data.stageHistory.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Completed Stages:
            </Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {data.stageHistory.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm p-2 rounded bg-secondary/30"
                >
                  <span className="font-medium">
                    {BTPN_STAGES.find((s) => s.id === entry.stage)?.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.completedAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {data.currentStage !== "fit_for_use" && (
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
              <Button onClick={handleProceedToNext} disabled={!canProceed()} className="bg-blue-500 hover:bg-blue-600">
                Proceed to Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {data.currentStage === "fit_for_use" && (
          <div className="flex justify-end gap-3">
            <Button onClick={onClose} className="bg-success hover:bg-success/90">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Workflow
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
