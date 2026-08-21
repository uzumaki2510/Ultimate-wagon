import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getResolvedWorkflowForWagon } from "@/lib/wagonWorkflows";

import { WorkflowChecklist } from "./WorkflowChecklist";
import { WagonDetailsForm } from "./WagonDetailsForm";
import { WagonDefectsRepairs } from "./WagonDefectsRepairs";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  wagonId: string;
  defaultTab?: "workflow" | "details" | "repairs";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
}

import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

export function ManageWagonPanel({ wagonId, defaultTab = "workflow", open, onOpenChange, onDelete }: Props) {
  const { wagons, workflows, memos } = useAppStore();
  const { isAdmin } = useAuth();
  const nav = useNavigate();
  const wagon = wagons.find((w) => w.id === wagonId);
  const workflowRecord = workflows.find((w) => w.wagonId === wagonId);
  
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  const linkedMemoCount = useMemo(() => {
    if (!wagon) return 0;
    return (memos || []).reduce((count, memo) => {
      const hasWagon = memo.entries.some(e => e.wagonId === wagon.id);
      return count + (hasWagon ? 1 : 0);
    }, 0);
  }, [memos, wagon]);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  if (!wagon) return null;

  const resolved = getResolvedWorkflowForWagon(wagon, workflowRecord);

  const isFit = wagon.status === "FIT_READY" || wagon.status === "RELEASED" || wagon.status === "IN_SERVICE";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {wagon.wagonNo}
                {linkedMemoCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 py-0 px-2 text-xs text-muted-foreground hover:bg-muted ml-2"
                    title={`${linkedMemoCount} Linked Memo(s)`}
                    onClick={() => nav("/operations/unit-memos")}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    {linkedMemoCount}
                  </Button>
                )}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Badge variant="outline">{wagon.type as string}</Badge>
                <span>{wagon.owner}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 relative">
              <div className="flex items-center gap-2">
                <Badge 
                  className={isFit ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}
                >
                  {isFit ? 'FIT' : 'SICK'}
                </Badge>
                
                {isAdmin && onDelete && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive cursor-pointer">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Wagon</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              {resolved && (
                <div className="text-xs font-medium mt-1 pr-[32px]">
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
