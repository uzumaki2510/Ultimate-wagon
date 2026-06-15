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
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlayCircle, CheckCircle, ArrowRight, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { REPAIR_TYPES } from "@/lib/wagonData";

interface EditWagonModalProps {
  wagonId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWagonModal({ wagonId, open, onOpenChange }: EditWagonModalProps) {
  const { user } = useAuth();
  const { workflows, wagons, upsertWorkflowForWagon, startStage, markStageDone, advanceWorkflow, markWagonFit, updateWagon } = useAppStore();
  
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

  const isWorkflowWagon = wagon && (wagon.type === "BTPN" || wagon.type === "BTPFLN" || wagon.type === "BTPNHS" || wagon.type === "BTPGLN");

  // Auto-create workflow if missing & initialize edit states
  useEffect(() => {
    if (open && wagon) {
      if (isWorkflowWagon && !wf) upsertWorkflowForWagon(wagon.id);
      
      setEditComments(wagon.comments || "");
      setEditRepairTypes(wagon.repairTypes || []);
      
      if (wagon.type === "BTPGLN") {
        setEditIsDegassed(wagon.defect?.includes("DG") || false);
      }
      if (wagon.type?.includes("BTPN")) {
        setEditIsSteamed(wagon.defect?.includes("Steam") || false);
      }
    }
  }, [open, wagon, wf, upsertWorkflowForWagon, isWorkflowWagon]);

  // Removed useEffect for session storage load, handled in openConfirmation now

  if (!wagon || (isWorkflowWagon && !wf)) return null;

  const currentStageObj = wf?.stages.find((s) => s.stageName === wf.currentStage);
  const isFinalStage = wf ? wf.stages.findIndex((s) => s.stageName === wf.currentStage) === wf.stages.length - 1 : false;

  const loggedInUserName = user?.name || user?.email || "Current User";

  const handleStartStage = (stageName: string) => {
    if (!wf) return;
    startStage(wf.id, stageName, loggedInUserName);
    toast({ title: "Stage Started", description: `${stageName} is now In Progress.` });
  };

  const openConfirmation = (stageName: string) => {
    setActiveStage(stageName);
    setRemarks(""); 

    // Auto-fill inspector from the first stage if available, else session
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
    if (!inspectorName.trim()) {
      toast({ title: "Validation Error", description: "Inspector Name is required.", variant: "destructive" });
      return;
    }
    
    if (activeStage) {
      const finalRemarks = remarks.trim() || `Stage ${activeStage} completed by ${loggedInUserName} and verified by ${inspectorName}.`;
      markStageDone(wf.id, activeStage, loggedInUserName, inspectorName, finalRemarks);
      sessionStorage.setItem("lastInspectorName", inspectorName);
      toast({ title: "Stage Marked Done", description: `${activeStage} has been confirmed done.` });
    }
    setConfirmModalOpen(false);
  };

  const handleNextStage = () => {
    if (!wf) return;
    const currentIndex = wf.stages.findIndex((s) => s.stageName === wf.currentStage);
    const currObj = wf.stages[currentIndex];
    
    if (currObj.status !== "Done") {
      toast({ title: "Action Blocked", description: "You must Mark Done before moving to the next stage.", variant: "destructive" });
      return;
    }

    if (currentIndex < wf.stages.length - 1) {
      const nextStage = wf.stages[currentIndex + 1].stageName;
      advanceWorkflow(wf.id, nextStage);
      toast({ title: "Moved to Next Stage", description: `Wagon moved to ${nextStage}.` });
    }
  };

  const handleMarkFit = () => {
    markWagonFit(wagonId);
    toast({ title: "Wagon Marked Fit", description: "The wagon is now Fit For Loading." });
    onOpenChange(false);
  };

  const handleSaveChanges = () => {
    const patch: any = { comments: editComments };
    if (!isWorkflowWagon) {
      patch.repairTypes = editRepairTypes;
    }
    updateWagon(wagonId, patch, loggedInUserName);
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

          {isWorkflowWagon && wf ? (
            <div className="space-y-4 mb-6">
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
                        <div className="text-xs text-muted-foreground mt-1">
                          Inspector: {st.inspectorName} | Remarks: {st.remarks}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <Badge variant="outline" className="bg-background">{st.status}</Badge>
                      {isCurrent && (
                        <div className="flex gap-2 mt-2">
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
                          {st.status === "Done" && !isFinalStage && (
                            <Button size="sm" className="bg-background text-primary hover:bg-muted" onClick={handleNextStage}>
                              Move to Next Stage <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                          {st.status === "Done" && isFinalStage && (
                            <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={handleMarkFit}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Mark Wagon Fit
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label>Repair Type</Label>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between sm:w-[300px]">
                        {editRepairTypes.length > 0 ? `${editRepairTypes.length} Selected` : "Select repair type"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[300px]">
                      {REPAIR_TYPES.map((rt) => (
                        <DropdownMenuCheckboxItem
                          key={rt.id}
                          checked={editRepairTypes.includes(rt.name)}
                          onCheckedChange={() => toggleRepairType(rt.name)}
                        >
                          {rt.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {editRepairTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {editRepairTypes.map(rt => (
                      <Badge key={rt} variant="secondary" className="text-xs">{rt}</Badge>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspector Confirmation Dialog */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="z-[60]">
          <DialogHeader>
            <DialogTitle>Inspector Confirmation</DialogTitle>
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
              <Label>Inspector Name <span className="text-red-500">*</span></Label>
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
