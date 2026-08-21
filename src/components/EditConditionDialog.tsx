import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RepairTask } from "@/types";

interface Props {
  wagonId: string;
  wagonNumber: string;
  defect: RepairTask | null;
  onClose: () => void;
  onSave: (updatedDefect: RepairTask) => Promise<void>;
}

export function EditConditionDialog({ wagonId, wagonNumber, defect, onClose, onSave }: Props) {
  const [status, setStatus] = useState("pending");
  const [location, setLocation] = useState("");
  const [inspector, setInspector] = useState("");
  const [reportedAt, setReportedAt] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defect) {
      setStatus(defect.status || "pending");
      setLocation(defect.location || "");
      setInspector(defect.inspector || "");
      setReportedAt(
        defect.reportedAt 
          ? new Date(defect.reportedAt).toISOString().slice(0, 16) 
          : new Date().toISOString().slice(0, 16)
      );
      setRemarks(defect.remarks || "");
    }
  }, [defect]);

  if (!defect) return null;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const updated: RepairTask = {
        ...defect,
        status: status as any,
        location: location || undefined,
        inspector: inspector || undefined,
        reportedAt: reportedAt ? new Date(reportedAt).toISOString() : undefined,
        remarks: remarks || undefined,
      };
      await onSave(updated);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to save condition details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!!defect} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Condition</DialogTitle>
          <div className="text-sm text-muted-foreground mt-1">
            <div>Wagon: <span className="font-semibold text-foreground">{wagonNumber}</span></div>
            <div className="truncate">Defect: <span className="font-semibold text-foreground">{defect.subRepair}</span></div>
          </div>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="repaired">Repaired</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Location / Side</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A-End">A-End</SelectItem>
                <SelectItem value="B-End">B-End</SelectItem>
                <SelectItem value="Left Side">Left Side</SelectItem>
                <SelectItem value="Right Side">Right Side</SelectItem>
                <SelectItem value="Underframe">Underframe</SelectItem>
                <SelectItem value="Bogie A">Bogie A</SelectItem>
                <SelectItem value="Bogie B">Bogie B</SelectItem>
                <SelectItem value="Tank / Barrel">Tank / Barrel</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="inspector">Inspector / Reported By</Label>
            <Input 
              id="inspector" 
              placeholder="e.g. SSE Mechanical"
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reportedAt">Reported Date & Time</Label>
            <Input 
              id="reportedAt" 
              type="datetime-local"
              value={reportedAt}
              onChange={(e) => setReportedAt(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea 
              id="remarks" 
              placeholder="Add remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
