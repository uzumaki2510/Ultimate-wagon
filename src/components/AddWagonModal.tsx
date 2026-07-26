import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DefectMultiSelect } from "@/components/DefectMultiSelect";
import { parseWagonNumber, WagonDetails, SICK_LINES } from "@/lib/wagonData";
import { PriorityLevel, RepairTask, Wagon } from "@/types/index";
import {
  Search, Train, Calendar, Clock, Wrench, MessageSquare,
  ArrowRight, ArrowLeft, CheckCircle, AlertTriangle,
  ChevronRight, Info, ShieldAlert, Loader2
} from "lucide-react";
import { format } from "date-fns";

interface AddWagonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    details: WagonDetails,
    trainNumber: string,
    arrivalDate: string,
    arrivalTime: string,
    sickLine: string,
    repairTasks: RepairTask[],
    comments: string,
    priority: PriorityLevel,
    isDegassed?: boolean,
    isSteamed?: boolean
  ) => void;
  existingWagons: Wagon[];
}

const STEPS = [
  { id: 1, label: "Basic Info", icon: Train },
  { id: 2, label: "Inspection", icon: Calendar },
  { id: 3, label: "Defects", icon: Wrench },
  { id: 4, label: "Review", icon: CheckCircle },
];

const QUICK_REMARKS = [
  "Wheel alert received", "Sent to sick line", "Awaiting inspection",
  "Repair started", "Repair completed", "Fit certificate pending", "Staff informed"
];

const PriorityColors: Record<PriorityLevel, string> = {
  "Normal": "text-blue-600 bg-blue-50 border-blue-200",
  "Urgent": "text-orange-600 bg-orange-50 border-orange-200",
  "Safety Critical": "text-red-600 bg-red-50 border-red-200",
};

export function AddWagonModal({ open, onOpenChange, onSubmit, existingWagons }: AddWagonModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 — Basic Info
  const [wagonNumber, setWagonNumber] = useState("");
  const [parsedDetails, setParsedDetails] = useState<WagonDetails | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [trainNumber, setTrainNumber] = useState("");
  const [trainNumberError, setTrainNumberError] = useState<string | null>(null);

  // Step 2 — Inspection
  const [priority, setPriority] = useState<PriorityLevel>("Normal");
  const [sickLine, setSickLine] = useState("");
  const [arrivalDate, setArrivalDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [arrivalTime, setArrivalTime] = useState(format(new Date(), "HH:mm"));
  const [isDegassed, setIsDegassed] = useState(false);
  const [isSteamed, setIsSteamed] = useState(false);

  // Step 3 — Defects
  const [selectedRepairs, setSelectedRepairs] = useState<RepairTask[]>([]);
  const [comments, setComments] = useState("");

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setWagonNumber("");
        setParsedDetails(null);
        setParseError(null);
        setTrainNumber("");
        setTrainNumberError(null);
        setPriority("Normal");
        setSickLine("");
        setArrivalDate(format(new Date(), "yyyy-MM-dd"));
        setArrivalTime(format(new Date(), "HH:mm"));
        setIsDegassed(false);
        setIsSteamed(false);
        setSelectedRepairs([]);
        setComments("");
        setIsSubmitting(false);
      }, 200);
    }
  }, [open]);

  // Parse wagon number
  const handleParse = useCallback(() => {
    setParseError(null);
    const cleaned = wagonNumber.replace(/\D/g, "").slice(0, 11);
    if (cleaned.length !== 11) {
      setParseError("Please enter a valid 11-digit wagon number.");
      setParsedDetails(null);
      return;
    }
    // Duplicate check
    const isDuplicate = existingWagons.some(w => w.wagonNo === cleaned);
    if (isDuplicate) {
      setParseError(`Wagon ${cleaned} already exists in the register.`);
      setParsedDetails(null);
      return;
    }
    const details = parseWagonNumber(cleaned);
    if (!details) {
      setParseError("Invalid wagon number. Could not parse.");
      setParsedDetails(null);
      return;
    }
    setParsedDetails(details);
    setWagonNumber(cleaned);
    setArrivalTime(format(new Date(), "HH:mm"));
  }, [wagonNumber, existingWagons]);

  // Validate train number for duplicates (warn only)
  const handleTrainNumberChange = (value: string) => {
    const upper = value.toUpperCase();
    setTrainNumber(upper);
    // Check if this train number is already used today
    const todayStr = new Date().toISOString().split("T")[0];
    const duplicate = existingWagons.some(
      w => w.rakeId === upper && w.updatedAt?.startsWith(todayStr)
    );
    setTrainNumberError(duplicate ? `Train ${upper} already has wagons registered today.` : null);
  };

  const needsSteaming = parsedDetails && ["BTPN", "BTPFLN", "BTPGLN", "BTPNHS"].includes(parsedDetails.typeName);

  // Step validation
  const canAdvanceStep = (s: number): boolean => {
    switch (s) {
      case 1:
        return !!parsedDetails && !!trainNumber.trim();
      case 2:
        return !!sickLine;
      case 3:
        return true; // defects are optional
      default:
        return true;
    }
  };

  const getStepError = (s: number): string | null => {
    switch (s) {
      case 1:
        if (!parsedDetails) return "Please parse a valid wagon number.";
        if (!trainNumber.trim()) return "Train / Check number is required.";
        return null;
      case 2:
        if (!sickLine) return "Location / Sick Line is required.";
        return null;
      default:
        return null;
    }
  };

  const [stepError, setStepError] = useState<string | null>(null);

  const goNext = () => {
    const err = getStepError(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStep(s => Math.min(s + 1, 4));
  };

  const goPrev = () => {
    setStepError(null);
    setStep(s => Math.max(s - 1, 1));
  };

  const handleSubmit = () => {
    if (isSubmitting || !parsedDetails) return;
    setIsSubmitting(true);

    onSubmit(
      parsedDetails,
      trainNumber,
      arrivalDate,
      arrivalTime,
      sickLine,
      selectedRepairs,
      comments,
      priority,
      parsedDetails.typeName === "BTPGLN" ? isDegassed : undefined,
      ["BTPN", "BTPFLN", "BTPNHS"].includes(parsedDetails.typeName) ? isSteamed : undefined
    );

    onOpenChange(false);
  };

  const appendRemark = (remark: string) => {
    setComments(prev => prev ? `${prev}\n${remark}` : remark);
  };

  // Workflow preview
  const getWorkflowPreview = () => {
    if (!parsedDetails) return [];
    if (parsedDetails.typeName === "BTPGLN") return ["Sick Reason", "RRT De-Gassing", "HAPA Examination", "Purging", "Yard Examination", "FIT_READY"];
    if (["BTPN", "BTPFLN", "BTPNHS"].includes(parsedDetails.typeName)) return ["SICK_LINE", "Steaming", "Steam Point", "Placement Decision", "Hydro Testing", "Fit For Use"];
    return ["SICK_LINE", "Repair / Rectification", "Checklist / Testing", "FIT_READY"];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <Train className="h-5 w-5 text-primary" />
            Add New Wagon
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Complete all steps to register a wagon for repair
          </DialogDescription>

          {/* Step Indicator */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
            {STEPS.map((s, idx) => {
              const StepIcon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;

              return (
                <div key={s.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      // Only allow going back, or to completed steps
                      if (s.id < step) {
                        setStepError(null);
                        setStep(s.id);
                      }
                    }}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                      ${isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : isCompleted
                          ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                          : "bg-muted text-muted-foreground"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <StepIcon className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline whitespace-nowrap">{s.label}</span>
                    <span className="sm:hidden">{s.id}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className={`h-3.5 w-3.5 mx-0.5 shrink-0 ${isCompleted ? "text-primary" : "text-muted-foreground/40"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        {/* Step Content */}
        <ScrollArea className="flex-1 max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {/* ─── Step 1: Basic Info ─── */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Wagon Number <span className="text-destructive">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter 11-digit wagon number"
                      value={wagonNumber.replace(/\D/g, "").slice(0, 11)}
                      onChange={e => {
                        setWagonNumber(e.target.value.replace(/\D/g, "").slice(0, 11));
                        setParseError(null);
                        setParsedDetails(null);
                      }}
                      onKeyDown={e => { if (e.key === "Enter") handleParse(); }}
                      className="font-mono text-lg tracking-wider h-12 flex-1"
                    />
                    <Button onClick={handleParse} size="lg" className="h-12 px-5">
                      <Search className="h-5 w-5 mr-1.5" />
                      Parse
                    </Button>
                  </div>
                  {parseError && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm animate-in fade-in-0 duration-200">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {parseError}
                    </div>
                  )}
                </div>

                {parsedDetails && (
                  <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    {/* Parsed Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-muted/30 border">
                      <DetailItem label="Type" value={parsedDetails.typeName} />
                      <DetailItem label="Category" value={parsedDetails.category} />
                      <DetailItem label="Owner" value={parsedDetails.railwayName} />
                      <DetailItem label="Built Year" value={parsedDetails.yearOfManufacture} />
                    </div>

                    {/* Workflow Preview */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide text-sm">
                      <span className="font-semibold text-muted-foreground whitespace-nowrap">Auto Workflow:</span>
                      {getWorkflowPreview().map((wfStep, idx, arr) => (
                        <div key={idx} className="flex items-center gap-1.5 text-primary font-medium whitespace-nowrap">
                          <span className="text-xs">{wfStep}</span>
                          {idx < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                        </div>
                      ))}
                    </div>

                    {/* Train Number */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Train / Check Number <span className="text-destructive">*</span></Label>
                      <Input
                        value={trainNumber}
                        onChange={e => handleTrainNumberChange(e.target.value)}
                        className="font-mono h-10"
                        placeholder="e.g., BTPN-1234"
                      />
                      {trainNumberError && (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-orange-50 text-orange-700 text-xs">
                          <Info className="h-3.5 w-3.5 shrink-0" />
                          {trainNumberError}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── Step 2: Inspection ─── */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Priority */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Priority <span className="text-destructive">*</span></Label>
                    <Select value={priority} onValueChange={v => setPriority(v as PriorityLevel)}>
                      <SelectTrigger className={`h-10 border-2 ${PriorityColors[priority]}`}>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normal" className="text-blue-600 font-medium">Normal</SelectItem>
                        <SelectItem value="Urgent" className="text-orange-600 font-medium">Urgent</SelectItem>
                        <SelectItem value="Safety Critical" className="text-red-600 font-bold">Safety Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location / Sick Line */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Location / Sick Line <span className="text-destructive">*</span></Label>
                    <Select value={sickLine} onValueChange={setSickLine}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {SICK_LINES.map(line => (
                          <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Arrival Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Arrival Date
                    </Label>
                    <Input type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} className="h-10" />
                  </div>

                  {/* Arrival Time */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Arrival Time
                    </Label>
                    <Input type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} className="h-10" />
                  </div>

                  {/* Steaming (conditional) */}
                  {needsSteaming && (
                    <div className="space-y-2 animate-in fade-in-0 duration-200 sm:col-span-2">
                      <Label className="text-sm font-semibold">Steaming Status</Label>
                      <Select
                        value={isSteamed ? "Steam" : "without Steam"}
                        onValueChange={v => setIsSteamed(v === "Steam")}
                      >
                        <SelectTrigger className="h-10"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="without Steam">Without Steam</SelectItem>
                          <SelectItem value="Steam">Steam</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Step 3: Defects ─── */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Wrench className="h-4 w-4" /> Defects / Repair Work
                  </Label>
                  <DefectMultiSelect
                    selectedRepairs={selectedRepairs}
                    onChange={setSelectedRepairs}
                  />
                </div>

                {/* Remarks */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" /> Remarks / Comments
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REMARKS.map(rmk => (
                      <Badge
                        key={rmk}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground font-normal text-xs transition-colors"
                        onClick={() => appendRemark(rmk)}
                      >
                        + {rmk}
                      </Badge>
                    ))}
                  </div>
                  <Textarea
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Add detailed remarks..."
                  />
                </div>
              </div>
            )}

            {/* ─── Step 4: Review ─── */}
            {step === 4 && (
              <div className="space-y-5 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Review & Confirm
                </h3>

                {/* Wagon Summary */}
                <div className="rounded-xl border overflow-hidden">
                  <div className="bg-muted/30 px-4 py-2.5 border-b">
                    <h4 className="text-sm font-semibold text-muted-foreground">Wagon Details</h4>
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <DetailItem label="Wagon No" value={parsedDetails?.wagonNumber || ""} />
                    <DetailItem label="Type" value={parsedDetails?.typeName || ""} />
                    <DetailItem label="Category" value={parsedDetails?.category || ""} />
                    <DetailItem label="Owner" value={parsedDetails?.railwayName || ""} />
                    <DetailItem label="Built Year" value={parsedDetails?.yearOfManufacture || ""} />
                    <DetailItem label="Train No" value={trainNumber} />
                    <DetailItem label="Priority" value={priority} />
                    <DetailItem label="Sick Line" value={SICK_LINES.find(l => l.id === sickLine)?.name || sickLine} />
                  </div>
                </div>

                {/* Arrival Info */}
                <div className="rounded-xl border overflow-hidden">
                  <div className="bg-muted/30 px-4 py-2.5 border-b">
                    <h4 className="text-sm font-semibold text-muted-foreground">Arrival</h4>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <DetailItem label="Date" value={arrivalDate} />
                    <DetailItem label="Time" value={arrivalTime} />
                    {needsSteaming && (
                      <DetailItem label="Steaming" value={isSteamed ? "Steam" : "Without Steam"} />
                    )}
                  </div>
                </div>

                {/* Defects Summary */}
                {selectedRepairs.length > 0 && (
                  <div className="rounded-xl border overflow-hidden">
                    <div className="bg-muted/30 px-4 py-2.5 border-b flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-muted-foreground">Defects</h4>
                      <Badge variant="secondary" className="text-xs">{selectedRepairs.length}</Badge>
                    </div>
                    <div className="p-4 space-y-1.5">
                      {selectedRepairs.map((r, i) => {
                        const config = PriorityColors[r.severity];
                        return (
                          <div key={i} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/30">
                            <span>
                              <span className="font-medium">{r.category}</span>
                              <span className="text-muted-foreground mx-1.5">→</span>
                              {r.subRepair}
                            </span>
                            <Badge variant="outline" className={`text-[10px] uppercase border-transparent ${config}`}>
                              {r.severity}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Comments */}
                {comments && (
                  <div className="rounded-xl border overflow-hidden">
                    <div className="bg-muted/30 px-4 py-2.5 border-b">
                      <h4 className="text-sm font-semibold text-muted-foreground">Remarks</h4>
                    </div>
                    <div className="p-4 text-sm text-muted-foreground whitespace-pre-wrap">{comments}</div>
                  </div>
                )}
              </div>
            )}

            {/* Step Error */}
            {stepError && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm animate-in fade-in-0 duration-200">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {stepError}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Navigation */}
        <div className="border-t px-6 py-4 flex items-center justify-between bg-muted/20">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={goPrev} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2">
              Step {step} of {STEPS.length}
            </span>
            {step < 4 ? (
              <Button onClick={goNext} className="gap-1.5 min-w-[100px]">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-1.5 min-w-[140px] bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Submit Wagon
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">{label}</p>
      <p className="font-bold text-sm truncate">{value || "—"}</p>
    </div>
  );
}
