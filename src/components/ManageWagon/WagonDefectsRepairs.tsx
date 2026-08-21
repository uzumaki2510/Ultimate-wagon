import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { DEFECT_LIBRARY } from "@/lib/wagonData";
import { InspectionChecklist } from "@/types";

interface Props {
  wagonId: string;
}

export function WagonDefectsRepairs({ wagonId }: Props) {
  const { user } = useAuth();
  const { wagons, updateWagon, updateInspectionChecklist, markWagonFit } = useAppStore();
  const wagon = wagons.find((w) => w.id === wagonId);
  const loggedInUserName = user?.name || user?.email || "Current User";

  const [editRepairTypes, setEditRepairTypes] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<InspectionChecklist>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (wagon) {
      setEditRepairTypes(wagon.repairTypes || []);
      setChecklist(wagon.inspectionChecklist || {});
    }
  }, [wagon]);

  if (!wagon) return null;

  const handleSave = () => {
    setIsSubmitting(true);
    try {
      updateWagon(wagonId, { repairTypes: editRepairTypes }, loggedInUserName);
      updateInspectionChecklist(wagonId, checklist);
      toast({ title: "Condition Updated", description: "Wagon defects and repairs saved." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to save condition", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkFit = () => {
    const res = markWagonFit(wagonId);
    if (res.success) {
      toast({ title: "Wagon Marked Fit", description: "The wagon is now Fit For Loading." });
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
  };

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

  const hasGroup = (groupName: string) => {
    const group = DEFECT_LIBRARY.find(g => g.groupName === groupName);
    if (!group) return false;
    return editRepairTypes.some(rt => group.defects.some(d => d.name === rt));
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
    <div className="space-y-6 mt-4">
      <div className="bg-destructive/5 border border-destructive/20 rounded-md p-4 mb-4">
        <h4 className="font-semibold text-destructive mb-1">Primary Defect Reason</h4>
        <p className="text-sm">{wagon.defect || "None specified"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-semibold mb-3 block">Inspection Checklist</Label>
          <div className="space-y-3 p-4 border rounded-md bg-secondary/10">
            <div className="flex items-center space-x-2">
              <Checkbox id="cl-underGear" checked={!!checklist.underGear?.checked} onCheckedChange={(c) => handleChecklistToggle("underGear", !!c)} />
              <Label htmlFor="cl-underGear" className="text-sm font-normal cursor-pointer">Under Gear Examined</Label>
              {checklist.underGear?.checkedBy && <span className="text-[10px] text-muted-foreground ml-auto">by {checklist.underGear.checkedBy}</span>}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="cl-upperGear" checked={!!checklist.upperGear?.checked} onCheckedChange={(c) => handleChecklistToggle("upperGear", !!c)} />
              <Label htmlFor="cl-upperGear" className="text-sm font-normal cursor-pointer">Upper Gear Examined</Label>
              {checklist.upperGear?.checkedBy && <span className="text-[10px] text-muted-foreground ml-auto">by {checklist.upperGear.checkedBy}</span>}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="cl-airBrake" checked={!!checklist.airBrake?.checked} onCheckedChange={(c) => handleChecklistToggle("airBrake", !!c)} />
              <Label htmlFor="cl-airBrake" className="text-sm font-normal cursor-pointer">Air Brake Tested</Label>
              {checklist.airBrake?.checkedBy && <span className="text-[10px] text-muted-foreground ml-auto">by {checklist.airBrake.checkedBy}</span>}
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-3 block">Assign Repair Tasks</Label>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {DEFECT_LIBRARY.map((group) => (
              <div key={group.groupName} className="space-y-2 border p-3 rounded-md bg-card">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{group.groupName}</Label>
                  {hasGroup(group.groupName) && <Badge variant="secondary" className="text-[10px]">Active</Badge>}
                </div>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {group.defects.map((def) => {
                    const isSelected = editRepairTypes.includes(def.name);
                    return (
                      <div 
                        key={def.name}
                        onClick={() => toggleRepairType(def.name)}
                        className={`flex items-start p-2 rounded cursor-pointer border transition-colors ${
                          isSelected ? getSeverityColor(def.name) : "hover:bg-muted border-transparent"
                        }`}
                      >
                        <Checkbox 
                          checked={isSelected} 
                          onCheckedChange={() => toggleRepairType(def.name)}
                          className="mt-0.5 mr-2"
                        />
                        <div>
                          <div className="text-sm font-medium">{def.name}</div>
                          {isSelected && <div className="text-xs opacity-80 mt-1">Est: {def.estHours}h</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t items-center mt-6">
        <div>
          {wagon.status === "FIT" ? (
            <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">Currently FIT</Badge>
          ) : (
            <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={handleMarkFit}>
              Mark Wagon FIT
            </Button>
          )}
        </div>
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Defects & Repairs"}
        </Button>
      </div>
    </div>
  );
}
