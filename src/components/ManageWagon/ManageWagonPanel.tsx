import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getResolvedWorkflowForWagon } from "@/lib/wagonWorkflows";

import { WorkflowChecklist } from "./WorkflowChecklist";
import { WagonDetailsForm } from "./WagonDetailsForm";
import { WagonDefectsRepairs } from "./WagonDefectsRepairs";

interface Props {
  wagonId: string;
  defaultTab?: "workflow" | "details" | "repairs";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageWagonPanel({ wagonId, defaultTab = "workflow", open, onOpenChange }: Props) {
  const { wagons, workflows } = useAppStore();
  const wagon = wagons.find((w) => w.id === wagonId);
  const workflowRecord = workflows.find((w) => w.wagonId === wagonId);
  
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  if (!wagon) return null;

  const resolved = getResolvedWorkflowForWagon(wagon, workflowRecord);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-bold">{wagon.wagonNumber}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Badge variant="outline">{wagon.details?.typeName || wagon.type}</Badge>
                <span>{wagon.railway}</span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <Badge 
                className={wagon.status === 'FIT' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}
              >
                {wagon.status === 'FIT' ? 'FIT' : 'SICK'}
              </Badge>
              {resolved && (
                <div className="text-xs font-medium mt-1">
                  {resolved.completedCount} / {resolved.totalCount} completed
                </div>
              )}
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-lg">
              <TabsTrigger value="workflow" className="flex-1 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">Workflow</TabsTrigger>
              <TabsTrigger value="details" className="flex-1 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">Details</TabsTrigger>
              <TabsTrigger value="repairs" className="flex-1 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">Defects & Repairs</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="px-6 pb-6">
          <Tabs value={activeTab} className="w-full outline-none">
            <TabsContent value="workflow" className="mt-0 outline-none">
              <WorkflowChecklist wagon={wagon} />
            </TabsContent>
            
            <TabsContent value="details" className="mt-0 outline-none">
              <WagonDetailsForm wagonId={wagon.id} />
            </TabsContent>
            
            <TabsContent value="repairs" className="mt-0 outline-none">
              <WagonDefectsRepairs wagonId={wagon.id} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
