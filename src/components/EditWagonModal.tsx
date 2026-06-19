import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlayCircle, CheckCircle, ArrowRight, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DEFECT_LIBRARY } from "@/lib/wagonData";
import { InspectionChecklist, ChecklistItem, FitConfirmation } from "@/types";

interface EditWagonModalProps {
  wagonId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWagonModal({ wagonId, open, onOpenChange }: EditWagonModalProps) {
  const { user } = useAuth();
  const { workflows, wagons, upsertWorkflowForWagon, startStage, markStageDone, advanceWorkflow, markWagonFit, updateWagon, updateInspectionChecklist } = useAppStore();
  
  const wagon = wagons.find((w) => w.id === wagonId);
  const wf = workflows.find((w) => w.wagonId === wagonId);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [inspectorName, setInspectorName] = useState("");
  const [remarks, setRemarks] = useState("");

  const [editComments, setEditComments] = useState("");
  const [editIsDegassed, setEditIsDegassed] = useState<boolean>(false);
  const [editIsSteamed, setEditIsSteamed] = useState<boolean>(false);
  const [editRepairTypes, setEditRepairTypes] = useState<string[]>([]);
  
  // Inspection Checklist state
  const [checklist, setChecklist] = useState<InspectionChecklist>({});

  const [placementDecision, setPlacementDecision] = useState<string>("sick_line");

  const isTankWagon = wagon && ["BTPN", "BTPFLN", "BTPNHS", "BTPGLN"].includes((wagon.type || "").toUpperCase());
  const isWorkflowWagon = true; // All wagons now use workflows

  useEffect(() => {
    if (open && wagon) {
      if (!wf) upsertWorkflowForWagon(wagon.id);
      
      setEditComments(wagon.comments || "");
      setEditRepairTypes(wagon.repairTypes || []);
      setChecklist(wagon.inspectionChecklist || {});
      
      if (wagon.type === "BTPGLN") {
        setEditIsDegassed(wagon.defect?.includes("DG") || false);
      }
      if (wagon.type?.includes("BTPN")) {
        setEditIsSteamed(wagon.defect?.includes("Steam") || false);
      }
    }
  }, [open, wagon, wf, upsertWorkflowForWagon]);

  if (!wagon || !wf) return null;

  const currentStageObj = wf?.stages.find((s) => s.stageName === wf.currentStage);
  const isFinalStage = wf ? wf.stages.findIndex((s) => s.stageName === wf.currentStage) === wf.stages.length - 1 : false;
  const isFinalStageDone = isFinalStage && currentStageObj?.status === "Done";

  const loggedInUserName = user?.name || user?.email || "Current User";

  const handleStartStage = (stageName: string) => {
    if (!wf) return;
    startStage(wf.id, stageName, loggedInUserName);
    toast({ title: "Stage Started", description: `${stageName} is now In Progress.` });
  };

  const openConfirmation = (stageName: string) => {
    setActiveStage(stageName);
    setRemarks(""); 

    let initialInspector = "";
    if (wf && wf.stages.length > 0 && wf.stages[0].inspectorName) {
      initialInspector = wf.stages[0].inspectorName;
    } else {
      initialInspector = sessionStorage.getItem("lastInspectorName") || "";
    }
    setInspectorName(initialInspector);

    setConfirmModalOpen(true);
  };

  const submitConfirmation = () => {
    if (!wf) return;
    if (!inspectorName.trim() && !sessionStorage.getItem("lastInspectorName")) {
      toast({ title: "Required", description: "Please enter Inspector/SSC/JE Name", variant: "destructive" });
      return;
    }
    
    if (activeStage) {
      const pRemarks = activeStage === "Placement Decision" ? `Routed to ${placementDecision === "mv_shed" ? "MV Shed" : "Sick Line"}. ` : "";
      const finalRemarks = remarks.trim() || `${pRemarks}Stage ${activeStage} completed by ${loggedInUserName} and verified by ${inspectorName}.`;
      markStageDone(wf.id, activeStage, loggedInUserName, inspectorName, finalRemarks);
      sessionStorage.setItem("lastInspectorName", inspectorName);
      
      const currentIndex = wf.stages.findIndex((s) => s.stageName === activeStage);
      if (currentIndex > -1 && currentIndex < wf.stages.length - 1) {
        const nextStage = wf.stages[currentIndex + 1].stageName;
        advanceWorkflow(wf.id, nextStage);
        toast({ title: "Stage Completed", description: `Advanced to ${nextStage}.` });
      } else {
        toast({ title: "Stage Marked Done", description: `${activeStage} has been confirmed done.` });
      }
    }
    setConfirmModalOpen(false);
  };

  const hasGroup = (groupName: string) => {
    const group = DEFECT_LIBRARY.find(g => g.groupName === groupName);
    if (!group) return false;
    return editRepairTypes.some(rt => group.defects.some(d => d.name === rt));
  };

  const handleMarkFit = () => {
    const res = markWagonFit(wagonId);
    if (res.success) {
      toast({ title: "Wagon Marked Fit", description: "The wagon is now Fit For Loading." });
      onOpenChange(false);
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
  };

  const handleSaveChanges = () => {
    const patch: any = { comments: editComments };
    if (!isWorkflowWagon) {
      patch.repairTypes = editRepairTypes;
    }
    
    if (wagon?.type?.includes("BTPN")) patch.isSteamed = editIsSteamed;
    if (wagon?.type === "BTPGLN") patch.isDegassed = editIsDegassed;

    updateWagon(wagonId, patch, loggedInUserName);
    updateInspectionChecklist(wagonId, checklist);

    // Auto-complete workflow stages if toggled
    if (isWorkflowWagon && wf) {
      if (patch.isSteamed) {
        const steamStage = wf.stages.find(s => s.stageName === "Steaming");
        if (steamStage && steamStage.status !== "Done") {
          markStageDone(wf.id, "Steaming", loggedInUserName, loggedInUserName, "Auto-completed via Steaming toggle.");
        }
      }
      if (patch.isDegassed) {
        const dgStage = wf.stages.find(s => s.stageName === "RRT De-Gassing");
        if (dgStage && dgStage.status !== "Done") {
          markStageDone(wf.id, "RRT De-Gassing", loggedInUserName, loggedInUserName, "Auto-completed via Degassing toggle.");
        }
      }
    }

    toast({ title: "Changes Saved", description: "Wagon details updated successfully." });
    onOpenChange(false);
  };

  const showSteaming = isWorkflowWagon && wf && 
                       (wf.currentStage === "Steaming" || wf.currentStage === "Steam Point 24h" || wf.currentStage === "Purging" || wf.currentStage === "RRT De-Gassing");

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

  const renderChecklistItem = (label: string, key: keyof InspectionChecklist) => {
    const item = checklist[key];
    return (
      <div className="flex items-center space-x-2">
        <Checkbox 
          id={`cl-${key}`} 
          checked={!!item?.checked} 
          onCheckedChange={(c) => handleChecklistToggle(key, !!c)} 
        />
        <Label htmlFor={`cl-${key}`} className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </Label>
        {item?.checkedBy && <span className="text-[10px] text-muted-foreground ml-auto">by {item.checkedBy}</span>}
      </div>
    );
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Wagon - {wagon.wagonNo}</DialogTitle>
          </DialogHeader>

          <div className="flex justify-between items-start mb-6 border-b pb-4">
            <div>
              <div className="font-bold text-lg">{wagon.wagonNo}</div>
              <Badge variant="outline" className="mt-1">{wagon.type}</Badge>
            </div>
            {isWorkflowWagon && wf && (
              <div className="text-right text-sm space-y-1">
                <div><span className="text-muted-foreground">Defect:</span> {wagon.defect || "N/A"}</div>
                <div><span className="text-muted-foreground">Current Stage:</span> <span className="font-medium text-primary">{wf.currentStage}</span></div>
              </div>
            )}
          </div>

          <Tabs defaultValue="workflow" className="w-full">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="workflow">Workflow & Repairs</TabsTrigger>
              <TabsTrigger value="more">More Options</TabsTrigger>
            </TabsList>
            
            <TabsContent value="workflow" className="space-y-6">
              {isWorkflowWagon && wf ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Workflow Progress</h3>
                  {wf.stages.map((st, i) => {
                    const isCurrent = st.stageName === wf.currentStage;
                    let bg = "bg-muted";
                    let text = "text-muted-foreground";
                    if (st.status === "Done") { bg = "bg-green-100 dark:bg-green-900/30"; text = "text-green-800 dark:text-green-400 font-medium"; }
                    else if (st.status === "In Progress") { bg = "bg-blue-100 dark:bg-blue-900/30"; text = "text-blue-800 dark:text-blue-400 font-bold"; }
                    else if (st.status === "Delayed") { bg = "bg-red-100 dark:bg-red-900/30"; text = "text-red-800 dark:text-red-400 font-bold"; }

                    return (
                      <div key={i} className={`p-3 rounded border ${isCurrent ? 'ring-2 ring-primary border-primary' : 'border-border'} flex justify-between items-center ${bg}`}>
                        <div>
                          <div className={text}>{st.stageName}</div>
                          {st.status === "Done" && (
                            <div className="text-xs text-muted-foreground mt-1 space-y-1">
                              <div>SSE/JE: {st.inspectorName} | Remarks: {st.remarks}</div>
                              {st.completedAt && (
                                <div className="text-[10px] text-muted-foreground/80">
                                  Completed At: {new Date(st.completedAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <Badge variant="outline" className="bg-background">{st.status}</Badge>
                          {isCurrent && (
                            <div className="flex flex-col items-end gap-2 mt-2 w-full">
                              {st.stageName === "Placement Decision" && (
                                <div className="mt-4 mb-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md border text-sm w-full text-left">
                                  <Label className="font-semibold mb-2 block">Placement Routing Decision</Label>
                                  <RadioGroup value={placementDecision} onValueChange={setPlacementDecision} className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="mv_shed" id="mv_shed" />
                                      <Label htmlFor="mv_shed">MV Shed (Master Valve)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="sick_line" id="sick_line" />
                                      <Label htmlFor="sick_line">Sick Line (ROH)</Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                              )}
                              <div className="flex gap-2">
                                {st.status === "Pending" && (
                                <Button size="sm" variant="outline" className="text-blue-600 bg-background hover:bg-blue-50" onClick={() => handleStartStage(st.stageName)}>
                                  <PlayCircle className="h-3 w-3 mr-1" /> Start
                                </Button>
                              )}
                              {st.status === "In Progress" && (
                                <Button size="sm" variant="outline" className="text-orange-600 bg-background hover:bg-orange-50" onClick={() => openConfirmation(st.stageName)}>
                                  <CheckCircle className="h-3 w-3 mr-1" /> Mark Done
                                </Button>
                              )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Fit Button */}
                  {isFinalStageDone && (
                    <div className="pt-4 flex justify-end">
                      <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white" onClick={handleMarkFit}>
                        <CheckCircle className="h-5 w-5 mr-2" /> Mark Wagon Fit
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Repair Defect Selection</Label>
                    <div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {editRepairTypes.length > 0 ? `${editRepairTypes.length} Defects Selected` : "Select defects"}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full sm:w-[400px] max-h-[300px] overflow-y-auto">
                          {DEFECT_LIBRARY.map((group) => (
                            <DropdownMenuGroup key={group.groupName}>
                              <DropdownMenuLabel className="bg-muted/50 mt-1">{group.groupName}</DropdownMenuLabel>
                              {group.defects.map(def => (
                                <DropdownMenuCheckboxItem
                                  key={def.name}
                                  checked={editRepairTypes.includes(def.name)}
                                  onCheckedChange={() => toggleRepairType(def.name)}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>{def.name}</span>
                                    {def.severity !== "Normal" && (
                                      <Badge variant="outline" className={`ml-2 text-[10px] py-0 h-4 ${def.severity === 'Safety Critical' ? 'text-red-600 border-red-200 bg-red-50' : 'text-orange-600 border-orange-200 bg-orange-50'}`}>
                                        {def.severity}
                                      </Badge>
                                    )}
                                  </div>
                                </DropdownMenuCheckboxItem>
                              ))}
                              <DropdownMenuSeparator />
                            </DropdownMenuGroup>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {editRepairTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {editRepairTypes.map(rt => (
                          <Badge key={rt} variant="secondary" className={`px-2 py-1 ${getSeverityColor(rt)}`}>{rt}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4 py-4 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Wagon Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    value={editComments}
                    onChange={(e) => setEditComments(e.target.value)}
                    placeholder="Add any general wagon comments here..."
                    rows={3}
                  />
                </div>

                {showSteaming && wagon.type === "BTPGLN" && (
                  <div className="space-y-2">
                    <Label htmlFor="editDegassedStatus">Degassing Status</Label>
                    <Select value={editIsDegassed ? "DG" : "NON-DG"} onValueChange={(v) => setEditIsDegassed(v === "DG")}>
                      <SelectTrigger id="editDegassedStatus">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DG">DG (Degassed)</SelectItem>
                        <SelectItem value="NON-DG">NON-DG (Non-Degassed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {showSteaming && wagon.type?.includes("BTPN") && (
                  <div className="space-y-2">
                    <Label htmlFor="editSteamedStatus">Steaming Status</Label>
                    <Select value={editIsSteamed ? "Steam" : "without Steam"} onValueChange={(v) => setEditIsSteamed(v === "Steam")}>
                      <SelectTrigger id="editSteamedStatus">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Steam">Steam</SelectItem>
                        <SelectItem value="without Steam">without Steam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="more" className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Inspection Checklist</h3>
                <p className="text-xs text-muted-foreground">This checklist is for maintaining detailed inspection records.</p>
                
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {(!editRepairTypes.length || hasGroup("Wheel & Axle")) && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-xs text-slate-700 dark:text-slate-300 border-b pb-1">Wheel & Axle Check</h4>
                        {renderChecklistItem("Wheel condition checked", "wheelCondition")}
                        {renderChecklistItem("Bearing condition checked", "bearingCondition")}
                        {renderChecklistItem("Axle box checked", "axleBox")}
                        {renderChecklistItem("Wheel profile checked", "wheelProfile")}
                      </div>
                    )}

                    {(!editRepairTypes.length || hasGroup("Brake System")) && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-xs text-slate-700 dark:text-slate-300 border-b pb-1">Brake Check</h4>
                        {renderChecklistItem("Brake pipe checked", "brakePipe")}
                        {renderChecklistItem("Brake cylinder checked", "brakeCylinder")}
                        {renderChecklistItem("Distributor valve checked", "distributorValve")}
                        {renderChecklistItem("Brake binding checked", "brakeBinding")}
                        {renderChecklistItem("Air pressure checked", "airPressure")}
                      </div>
                    )}

                    {(!editRepairTypes.length || hasGroup("Coupler / CBC / Draft Gear")) && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-xs text-slate-700 dark:text-slate-300 border-b pb-1">Coupler / CBC Check</h4>
                        {renderChecklistItem("CBC checked", "cbc")}
                        {renderChecklistItem("Knuckle checked", "knuckle")}
                        {renderChecklistItem("Draft gear checked", "draftGear")}
                        {renderChecklistItem("Buffer checked", "buffer")}
                      </div>
                    )}

                    {(!editRepairTypes.length || hasGroup("Body & Structure")) && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-xs text-slate-700 dark:text-slate-300 border-b pb-1">Body / Structure Check</h4>
                        {renderChecklistItem("Body condition checked", "bodyCondition")}
                        {renderChecklistItem("Door / hatch checked", "doorHatch")}
                        {renderChecklistItem("Ladder checked", "ladder")}
                        {renderChecklistItem("Floor / roof / side wall checked", "floorRoofSideWall")}
                        {renderChecklistItem("Corrosion checked", "corrosion")}
                      </div>
                    )}

                    {(!editRepairTypes.length || hasGroup("Underframe")) && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-xs text-slate-700 dark:text-slate-300 border-b pb-1">Underframe Check</h4>
                        {renderChecklistItem("Head stock checked", "headStockChecked")}
                        {renderChecklistItem("Sole bar checked", "soleBarChecked")}
                        {renderChecklistItem("Cross bar checked", "crossBarChecked")}
                        {renderChecklistItem("Floor plate checked", "floorPlateChecked")}
                        {renderChecklistItem("De-rusting completed", "derustingChecked")}
                      </div>
                    )}

                    {(!editRepairTypes.length || hasGroup("Bogie & Suspension")) && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-xs text-slate-700 dark:text-slate-300 border-b pb-1">Bogie & Suspension Check</h4>
                        {renderChecklistItem("Spring checked", "springChecked")}
                        {renderChecklistItem("Snubber spring checked", "snubberSpringChecked")}
                        {renderChecklistItem("Side bearer checked", "sideBearerChecked")}
                        {renderChecklistItem("Centre pivot checked", "centrePivotChecked")}
                        {renderChecklistItem("Elastomeric pad checked", "elastomericPadChecked")}
                        {renderChecklistItem("Suspension checked", "suspensionChecked")}
                      </div>
                    )}

                    {(!editRepairTypes.length || hasGroup("Painting / Finishing")) && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-xs text-slate-700 dark:text-slate-300 border-b pb-1">Painting / Finishing Check</h4>
                        {renderChecklistItem("Surface prepared", "surfacePrepared")}
                        {renderChecklistItem("Painting completed", "paintingCompleted")}
                        {renderChecklistItem("Marking completed", "markingCompleted")}
                        {renderChecklistItem("Final finishing checked", "finalFinishingChecked")}
                      </div>
                    )}

                    {(!editRepairTypes.length || hasGroup("Scheduled Maintenance")) && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-xs text-slate-700 dark:text-slate-300 border-b pb-1">Scheduled Maintenance Check</h4>
                        {renderChecklistItem("ROH / POH status checked", "rohPohStatusChecked")}
                        {renderChecklistItem("Yard examination completed", "yardExamCompleted")}
                        {renderChecklistItem("Periodic inspection completed", "periodicInspectionCompleted")}
                        {renderChecklistItem("Final inspection completed", "maintenanceFinalInspectionCompleted")}
                      </div>
                    )}

                  {isTankWagon && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-xs text-slate-700 dark:text-slate-300 border-b pb-1">Tank Wagon Safety Check</h4>
                      {renderChecklistItem("Master valve checked", "masterValve")}
                      {renderChecklistItem("Bottom discharge valve checked", "bottomDischargeValve")}
                      {renderChecklistItem("Delivery pipe checked", "deliveryPipe")}
                      {renderChecklistItem("Tank barrel checked", "tankBarrel")}
                      {renderChecklistItem("Leakage checked", "leakage")}
                      {renderChecklistItem("Safety fittings checked", "safetyFittings")}
                      {renderChecklistItem("Steam cleaning / purging / de-gassing checked", "steamPurgeDegassing")}
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-medium text-xs text-slate-700 dark:text-slate-300 border-b pb-1">Final Check</h4>
                    {renderChecklistItem("Defect rectified", "defectRectified")}
                    {renderChecklistItem("Final inspection done", "finalInspectionDone")}
                    {renderChecklistItem("Ready for fit marking", "readyForFitMarking")}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SSE/JE Confirmation Dialog */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="z-[60]">
          <DialogHeader>
            <DialogTitle>SSE/JE Confirmation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Stage</Label>
              <Input value={activeStage || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Staff Name</Label>
              <Input value={loggedInUserName} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>SSE/JE Name <span className="text-red-500">*</span></Label>
              <Input value={inspectorName} onChange={e => setInspectorName(e.target.value)} placeholder="Required" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Workflow Remarks</Label>
              <Input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional. Stage-specific remarks..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
            <Button onClick={submitConfirmation}>Confirm Stage Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
