import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { CorrectionDialog } from "@/components/ui/CorrectionDialog";
import { Edit2, History } from "lucide-react";
import { WagonTimeline } from "@/components/WagonTimeline";

interface Props {
  wagonId: string;
  onSave?: () => void;
}

export function WagonDetailsForm({ wagonId, onSave }: Props) {
  const { user, isSuperAdmin } = useAuth();
  const { wagons, workflows, memos, updateWagon, correctWagonNumber, log } = useAppStore();
  const wagon = wagons.find((w) => w.id === wagonId);
  const workflow = workflows.find((w) => w.wagonId === wagonId);
  const loggedInUserName = user?.name || user?.email || "Current User";

  const sickMemo = React.useMemo(() => {
    return memos.find(m => m.memoType === 'sick' && m.entries.some(e => e.wagonId === wagonId));
  }, [memos, wagonId]);

  const assignedTo = React.useMemo(() => {
    if (!workflow) return "Unassigned";
    const active = workflow.stages.find(s => s.status === "In Progress");
    return active?.staffName || workflow.sscJeName || workflow.fitterName || "Unassigned";
  }, [workflow]);

  const [isEditing, setIsEditing] = useState(false);
  const [comments, setComments] = useState("");
  const [isSteamed, setIsSteamed] = useState(false);
  const [isDegassed, setIsDegassed] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(wagon?.currentLocation || "Yard");
  const [builtYear, setBuiltYear] = useState(wagon?.builtYear?.toString() || "");
  const [pohDate, setPohDate] = useState(wagon?.pohDate || "");
  const [rohDate, setRohDate] = useState(wagon?.rohDate || "");
  const [bookedTo, setBookedTo] = useState(wagon?.bookedTo || "");
  const [defect, setDefect] = useState(wagon?.defect || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wagon No Correction
  const [isWagonNoDialogOpen, setIsWagonNoDialogOpen] = useState(false);
  const [newWagonNo, setNewWagonNo] = useState("");

  useEffect(() => {
    if (wagon) {
      setComments(wagon.comments || "");
      setCurrentLocation(wagon.currentLocation || "Yard");
      setBuiltYear(wagon.builtYear?.toString() || "");
      setPohDate(wagon.pohDate || "");
      setRohDate(wagon.rohDate || "");
      setBookedTo(wagon.bookedTo || "");
      setDefect(wagon.defect || "");
      if (wagon.type === "BTPGLN") {
        setIsDegassed(wagon.defect?.includes("DG") || wagon.isDegassed || false);
      }
      if (wagon.type?.includes("BTPN")) {
        setIsSteamed(wagon.defect?.includes("Steam") || wagon.isSteamed || false);
      }
    }
  }, [wagon]);

  if (!wagon) return null;

  const handleSave = () => {
    setIsSubmitting(true);
    try {
      const patch: any = { 
        comments,
        currentLocation,
        builtYear: builtYear ? parseInt(builtYear, 10) : undefined,
        pohDate,
        rohDate,
        bookedTo,
        defect
      };
      if (wagon.type?.includes("BTPN")) patch.isSteamed = isSteamed;
      if (wagon.type === "BTPGLN") patch.isDegassed = isDegassed;

      updateWagon(wagonId, patch, loggedInUserName);
      
      if (currentLocation !== wagon.currentLocation) {
         log({
           actor: loggedInUserName,
           action: "Location corrected",
           wagonId,
           details: `Placement corrected: ${wagon.currentLocation || "Yard"} → ${currentLocation}`
         });
      }

      if (comments !== (wagon.comments || "")) {
         log({
           actor: loggedInUserName,
           action: "Comment Edited",
           wagonId,
           details: `Wagon details comment was updated.`
         });
      }

      toast({ title: "Changes Saved", description: "Wagon details updated successfully." });
      setIsEditing(false);
      onSave?.();
    } catch (e) {
      toast({ title: "Error", description: "Failed to save details", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCorrectWagonNo = async (reason: string) => {
    if (!newWagonNo.trim()) throw new Error("Wagon number cannot be empty.");
    const result = correctWagonNumber(wagonId, newWagonNo.trim(), loggedInUserName, reason);
    if (!result.success) {
      throw new Error(result.error);
    }
    toast({ title: "Wagon Number Corrected", description: `Updated to ${newWagonNo.trim()}` });
  };

  return (
    <div className="space-y-6 mt-4 relative">
      {!isEditing && (
        <div className="absolute top-0 right-0 z-10">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Details
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="col-span-2 text-sm font-bold text-muted-foreground uppercase border-b pb-1 mb-2">Wagon Information</div>
        <div className="space-y-2">
          <Label>Wagon Number</Label>
          <div className="flex gap-2">
            <Input value={wagon.wagonNo} disabled className="bg-muted" />
            {isSuperAdmin && (
              <Button variant="outline" onClick={() => { setNewWagonNo(wagon.wagonNo); setIsWagonNoDialogOpen(true); }}>
                Correct
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Wagon Type</Label>
          <div className="flex gap-2">
            <Input value={wagon.type as string} disabled className="bg-muted flex-1" />
            {wagon.type?.includes("BTPN") && (
               <Badge variant="outline" className="flex items-center text-xs whitespace-nowrap">
                 {wagon.isSteamed ? "Steam" : "without Steam"}
               </Badge>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Railway</Label>
          <Input value={wagon.owner} disabled className="bg-muted" />
        </div>
        
        <div className="col-span-2 text-sm font-bold text-muted-foreground uppercase border-b pb-1 mt-4 mb-2">Maintenance Dates</div>
        <div className="space-y-2">
          <Label>Built Year</Label>
          <Input type="number" placeholder="YYYY" value={builtYear} onChange={e => setBuiltYear(e.target.value)} disabled={!isEditing} />
        </div>
        <div className="space-y-2">
          <Label>POH Date</Label>
          <Input type="date" value={pohDate} onChange={e => setPohDate(e.target.value)} disabled={!isEditing} />
        </div>
        <div className="space-y-2">
          <Label>ROH Date</Label>
          <Input type="date" value={rohDate} onChange={e => setRohDate(e.target.value)} disabled={!isEditing} />
        </div>

        <div className="col-span-2 text-sm font-bold text-muted-foreground uppercase border-b pb-1 mt-4 mb-2">Sick Information</div>
        <div className="space-y-2">
          <Label>Return Station / Booked To</Label>
          <Input placeholder="Destination" value={bookedTo} onChange={e => setBookedTo(e.target.value)} disabled={!isEditing} />
        </div>
        <div className="space-y-2">
          <Label>Sick Reason</Label>
          <Input placeholder="Defect/Reason" value={defect} onChange={e => setDefect(e.target.value)} disabled={!isEditing} />
        </div>
        <div className="space-y-2">
          <Label>Memo Number</Label>
          <Input value={sickMemo ? sickMemo.memoNo : "—"} disabled className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label>Date Marked Sick</Label>
          <Input value={sickMemo ? new Date(sickMemo.date).toLocaleDateString() : "—"} disabled className="bg-muted" />
        </div>

        <div className="col-span-2 text-sm font-bold text-muted-foreground uppercase border-b pb-1 mt-4 mb-2">Assignment</div>
        <div className="space-y-2 col-span-2">
          <Label>Assigned Employee / Team</Label>
          <Input value={assignedTo} disabled className="bg-muted" />
        </div>
      </div>

      <div className="space-y-2 mt-6">
        <Label className="text-sm font-bold text-muted-foreground uppercase border-b pb-1 block mb-2">Current Placement</Label>
        <select 
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={currentLocation}
          onChange={(e) => setCurrentLocation(e.target.value)}
          disabled={!isEditing}
        >
          <option value="Yard">Yard</option>
          <option value="Steam Point">Steam Point</option>
          <option value="De-Gassing">De-Gassing</option>
          <option value="MV Shed">MV Shed</option>
          <option value="New ROH Shed">New ROH Shed</option>
          <option value="Old Sick Line">Old Sick Line</option>
          <option value="Booked for Purging">Booked for Purging</option>
        </select>
      </div>

      <div className="space-y-2 mt-6">
        <Label className="text-sm font-bold text-muted-foreground uppercase border-b pb-1 block mb-2">General Comments</Label>
        <Textarea 
          placeholder="Enter any general remarks about the wagon..."
          value={comments} 
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          disabled={!isEditing}
        />
      </div>

      {(wagon.type?.includes("BTPN") || wagon.type === "BTPGLN") && (
        <div className="flex gap-6 border-t pt-4">
          {wagon.type?.includes("BTPN") && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="edit-steamed" 
                checked={isSteamed} 
                onCheckedChange={(c) => setIsSteamed(!!c)} 
                disabled={!isEditing}
              />
              <Label htmlFor="edit-steamed" className="cursor-pointer">Mark as Steamed</Label>
            </div>
          )}
          {wagon.type === "BTPGLN" && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="edit-degassed" 
                checked={isDegassed} 
                onCheckedChange={(c) => setIsDegassed(!!c)} 
                disabled={!isEditing}
              />
              <Label htmlFor="edit-degassed" className="cursor-pointer">Mark as De-gassed</Label>
            </div>
          )}
        </div>
      )}

      {wagon.fitConfirmation && (
        <div className="border-t pt-4 space-y-2">
          <Label className="text-emerald-600 font-semibold">Fitness Information</Label>
          <div className="text-sm bg-emerald-50 p-3 rounded-md text-emerald-800">
            {(() => {
              const employees = useAppStore.getState().employees;
              const fitByRaw = wagon.fitConfirmation.confirmedBy;
              const emp = employees.find(e => e.id === fitByRaw || e.name === fitByRaw);
              const displayName = emp ? emp.name : fitByRaw;
              const designation = emp ? emp.designation : (wagon.fitConfirmation as any).designation || "Unknown";
              return (
                <>
                  <div><strong>Fit By:</strong> {displayName}</div>
                  <div><strong>Designation:</strong> {designation}</div>
                  <div><strong>Fit At:</strong> {new Date(wagon.fitConfirmation.confirmedAt).toLocaleString()}</div>
                  {wagon.fitConfirmation.remarks && <div><strong>Remarks:</strong> {wagon.fitConfirmation.remarks}</div>}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {isEditing && (
        <div className="flex justify-end pt-4 border-t gap-2">
          <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Details"}
          </Button>
        </div>
      )}

      <div className="space-y-2 mt-6">
        <Label className="text-sm font-bold text-muted-foreground uppercase border-b pb-1 block mb-2 flex items-center gap-2">
          <History className="h-4 w-4" /> Operational History
        </Label>
        <div className="border rounded-md bg-muted/10 max-h-64 overflow-y-auto">
          <WagonTimeline workflow={workflow} wagonId={wagon.id} />
        </div>
      </div>

      <CorrectionDialog
        isOpen={isWagonNoDialogOpen}
        onOpenChange={setIsWagonNoDialogOpen}
        title="Correct Wagon Number"
        description="Modify the wagon number if it was registered incorrectly. Uniqueness will be verified."
        reasonRequired={true}
        onSave={handleCorrectWagonNo}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Wagon Number</Label>
            <Input value={wagon.wagonNo} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Corrected Wagon Number <span className="text-red-500">*</span></Label>
            <Input value={newWagonNo} onChange={e => setNewWagonNo(e.target.value)} placeholder="Enter correct number" />
          </div>
        </div>
      </CorrectionDialog>
    </div>
  );
}
