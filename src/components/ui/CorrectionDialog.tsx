import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  reasonRequired?: boolean;
  onSave: (reason: string) => Promise<void>;
}

export function CorrectionDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  reasonRequired = false,
  onSave,
}: Props) {
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (reasonRequired && !reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for this correction.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      await onSave(reason.trim());
      setReason("");
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Correction Failed",
        description: e.message || "An error occurred while saving the correction.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { if(!val) handleCancel(); else onOpenChange(val); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Custom form fields injected by parent */}
          {children}

          {/* Shared Correction Reason Field */}
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="correctionReason">
              Reason for Correction {reasonRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="correctionReason"
              placeholder="e.g. Wrong completion time entered"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Correction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
