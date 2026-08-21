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
  const [currentLocation, setCurrentLocation] = useState(wagon.currentLocation || "Yard");
  const [builtYear, setBuiltYear] = useState(wagon.builtYear?.toString() || "");
  const [pohDate, setPohDate] = useState(wagon.pohDate || "");
  const [rohDate, setRohDate] = useState(wagon.rohDate || "");
  const [bookedTo, setBookedTo] = useState(wagon.bookedTo || "");
  const [defect, setDefect] = useState(wagon.defect || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          <Label>Built Year</Label>
          <Input type="number" placeholder="YYYY" value={builtYear} onChange={e => setBuiltYear(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>POH Date</Label>
          <Input type="date" value={pohDate} onChange={e => setPohDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>ROH Date</Label>
          <Input type="date" value={rohDate} onChange={e => setRohDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Return Station / Booked To</Label>
          <Input placeholder="Destination" value={bookedTo} onChange={e => setBookedTo(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Sick Reason</Label>
          <Input placeholder="Defect/Reason" value={defect} onChange={e => setDefect(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label>Current Location (Sick Line)</Label>
        <select 
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={currentLocation}
          onChange={(e) => setCurrentLocation(e.target.value)}
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

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Details"}
        </Button>
      </div>
    </div>
  );
}
