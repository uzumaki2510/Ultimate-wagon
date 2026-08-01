import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Save, Settings2, Clock, Users, ShieldCheck, AlertCircle } from "lucide-react";

interface StageConfiguratorProps {
  nodeId: string | null;
  onClose: () => void;
}

export function StageConfigurator({ nodeId, onClose }: StageConfiguratorProps) {
  if (!nodeId) return null;

  return (
    <div className="flex flex-col h-full bg-background border-l w-full max-w-sm shrink-0 shadow-[-4px_0_15px_rgba(0,0,0,0.05)] animate-in slide-in-from-right-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/10">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Stage Configuration</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">Close</Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Stage Name</Label>
          <Input defaultValue={nodeId.replace(/-/g, ' ')} className="font-semibold capitalize" />
        </div>

        {/* SLA Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold border-b pb-1">
            <Clock className="h-4 w-4" /> SLAs (Service Level Agreements)
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Target (Hours)</Label>
              <Input type="number" defaultValue={24} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Critical (Hours)</Label>
              <Input type="number" defaultValue={48} className="border-destructive/30 focus-visible:ring-destructive" />
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold border-b pb-1">
            <Users className="h-4 w-4" /> Assignments
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Default Department</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option>C&W (Carriage & Wagon)</option>
              <option>Mechanical</option>
              <option>Electrical</option>
              <option>Inspection</option>
            </select>
          </div>
          <div className="flex items-center justify-between bg-muted/20 p-3 rounded-md border">
            <div className="space-y-0.5">
              <Label className="text-sm">Auto-Assign</Label>
              <p className="text-xs text-muted-foreground">Round-robin assignment</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>

        {/* Rules & Validations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold border-b pb-1">
            <ShieldCheck className="h-4 w-4" /> Transition Rules
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm cursor-pointer" htmlFor="req-photo">Require Photos</Label>
              <Switch id="req-photo" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm cursor-pointer" htmlFor="req-cert">Require Certificate</Label>
              <Switch id="req-cert" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm cursor-pointer" htmlFor="req-sup">Supervisor Approval</Label>
              <Switch id="req-sup" defaultChecked />
            </div>
          </div>
        </div>
        
        {/* Dependencies warning */}
        <div className="bg-warning/10 border border-warning/20 p-3 rounded-md flex items-start gap-2 text-warning-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="text-xs">Modifying these rules will affect all future wagons entering this stage.</p>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/10">
        <Button className="w-full">
          <Save className="h-4 w-4 mr-2" /> Save Configuration
        </Button>
      </div>
    </div>
  );
}
