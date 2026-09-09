import { isAxiosError } from 'axios';
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RepairTask } from "@/types";

interface Props {
  creating?: boolean;
  wagonId: string;
  wagonNumber: string;
  defect: RepairTask | null;
  onClose: () => void;
  onSave: (updatedDefect: RepairTask) => Promise<void>;
}

export function EditConditionDialog({ creating = false, wagonNumber, defect, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState<RepairTask["severity"]>("Normal");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("pending");
  const [location, setLocation] = useState("");
  const [inspector, setInspector] = useState("");
  const [reportedAt, setReportedAt] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defect) {
      setName(defect.subRepair); setSeverity(defect.severity); setError("");
      setStatus(defect.status || "pending");
      setLocation(defect.location || "");
      setInspector(defect.inspector || "");
      setReportedAt(
        defect.reportedAt
          ? localDateTime(defect.reportedAt)
          : localDateTime(new Date().toISOString())
      );
      setRemarks(defect.remarks || "");
    }
  }, [defect]);

  if (!defect) return null;

  const handleSave = async () => {
    if (!name.trim()) { setError("Enter a repair description."); return; }
    setError("");
    setIsSubmitting(true);
    try {
      const updated: RepairTask = {
        ...defect,
        subRepair: name.trim(), severity,
        status: status as RepairTask["status"],
        location: location || undefined,
        inspector: inspector || undefined,
        reportedAt: reportedAt ? new Date(reportedAt).toISOString() : undefined,
        remarks: remarks || undefined,
      };
      await onSave(updated);
      onClose();
    } catch (e) {
      setError(isAxiosError(e) ? e.response?.data?.message || e.message : e instanceof Error ? e.message : "Failed to save condition details. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!!defect} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{creating ? "Add repair" : "Update repair"}</DialogTitle>
          <div className="text-sm text-muted-foreground mt-1">
            <div>Wagon: <span className="font-semibold text-foreground">{wagonNumber}</span></div>
            <div className="truncate">Defect: <span className="font-semibold text-foreground">{defect.subRepair}</span></div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="grid gap-2"><Label htmlFor="repair-description">Repair description</Label><Input id="repair-description" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="grid gap-2"><Label htmlFor="repair-severity">Severity</Label><select id="repair-severity" className="rounded-md border bg-background p-2" value={severity} onChange={e => setSeverity(e.target.value as RepairTask["severity"])}><option>Normal</option><option>Urgent</option><option>Safety Critical</option></select></div>
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

function localDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
