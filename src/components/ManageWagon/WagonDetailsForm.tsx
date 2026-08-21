import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { WagonRepair } from "@/lib/wagonData";

interface Props {
  wagonId: string;
  onSave?: () => void;
}

export function WagonDetailsForm({ wagonId, onSave }: Props) {
  const { user } = useAuth();
  const { wagons, updateWagon } = useAppStore();
  const wagon = wagons.find((w) => w.id === wagonId);
  const loggedInUserName = user?.name || user?.email || "Current User";

  const [comments, setComments] = useState("");
  const [isSteamed, setIsSteamed] = useState(false);
  const [isDegassed, setIsDegassed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (wagon) {
      setComments(wagon.comments || "");
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
      const patch: any = { comments };
      if (wagon.type?.includes("BTPN")) patch.isSteamed = isSteamed;
      if (wagon.type === "BTPGLN") patch.isDegassed = isDegassed;

      // Note: As per requirements, we DO NOT auto-advance workflows from details save.
      updateWagon(wagonId, patch, loggedInUserName);

      toast({ title: "Changes Saved", description: "Wagon details updated successfully." });
      onSave?.();
    } catch (e) {
      toast({ title: "Error", description: "Failed to save details", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Wagon Number</Label>
          <Input value={wagon.wagonNo} disabled className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label>Wagon Type</Label>
          <Input value={wagon.type as string} disabled className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label>Railway</Label>
          <Input value={wagon.owner} disabled className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label>Pool Type</Label>
          <Input value={(wagon as any).poolType || "N/A"} disabled className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label>Inspection Date</Label>
          <Input value={(wagon as any).date ? new Date((wagon as any).date).toLocaleDateString() : ""} disabled className="bg-muted" />
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label>General Comments</Label>
        <Textarea 
          placeholder="Enter any general remarks about the wagon..."
          value={comments} 
          onChange={(e) => setComments(e.target.value)}
          rows={3}
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
              />
              <Label htmlFor="edit-degassed" className="cursor-pointer">Mark as De-gassed</Label>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Details"}
        </Button>
      </div>
    </div>
  );
}
