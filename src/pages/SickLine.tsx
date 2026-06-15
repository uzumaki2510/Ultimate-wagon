import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, AlertTriangle, PlayCircle, ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { WorkflowStageRecord } from "@/types";

export default function SickLine() {
  const { workflows, wagons, markWagonFit, advanceWorkflow, startStage, markStageDone } = useAppStore();
  const nav = useNavigate();
  const [now, setNow] = useState(new Date());

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [activeWfId, setActiveWfId] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  
  const [staffName, setStaffName] = useState("");
  const [inspectorName, setInspectorName] = useState("");
  const [remarks, setRemarks] = useState("");

  // Force re-render every minute for live time tracking
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const activeWorkflows = workflows.filter(wf => {
    const wagon = wagons.find(w => w.id === wf.wagonId);
    return wagon && wagon.status !== "Fit For Loading";
  });

  const handleMarkFit = (wagonId: string) => {
    markWagonFit(wagonId);
    toast({ title: "Wagon Marked Fit", description: "The wagon is now Fit For Loading." });
    nav("/memos/new?type=fit");
  };

  const handleStartStage = (wfId: string, stageName: string) => {
    startStage(wfId, stageName, "User Staff"); // Should pull from auth context
    toast({ title: "Stage Started", description: `${stageName} is now In Progress.` });
  };

  const openConfirmation = (wfId: string, stageName: string) => {
    setActiveWfId(wfId);
    setActiveStage(stageName);
    setStaffName("User Staff");
    setInspectorName("");
    setRemarks("");
    setConfirmModalOpen(true);
  };

  const submitConfirmation = () => {
    if (!inspectorName.trim() || !remarks.trim()) {
      toast({ title: "Validation Error", description: "Inspector Name and Remarks are required.", variant: "destructive" });
      return;
    }
    if (activeWfId && activeStage) {
      markStageDone(activeWfId, activeStage, staffName, inspectorName, remarks);
      toast({ title: "Stage Marked Done", description: `${activeStage} has been confirmed done.` });
    }
    setConfirmModalOpen(false);
  };

  const handleNextStage = (wf: any) => {
    const currentIndex = wf.stages.findIndex((s: any) => s.stageName === wf.currentStage);
    const currentObj = wf.stages[currentIndex];
    
    if (currentObj.status !== "Done") {
      toast({ title: "Action Blocked", description: "You must Mark Done before moving to the next stage.", variant: "destructive" });
      return;
    }

    if (currentIndex < wf.stages.length - 1) {
      const nextStage = wf.stages[currentIndex + 1].stageName;
      advanceWorkflow(wf.id, nextStage);
      toast({ title: "Moved to Next Stage", description: `Wagon moved to ${nextStage}.` });
    }
  };

  const isDelayed = (stage: WorkflowStageRecord) => {
    if (!stage.startedAt || stage.status === "Done") return false;
    const started = new Date(stage.startedAt);
    const diffHours = (now.getTime() - started.getTime()) / (1000 * 60 * 60);
    return diffHours > stage.targetDurationHours;
  };

  const getTimeSpent = (stage: WorkflowStageRecord) => {
    if (!stage.startedAt) return "Not started";
    const end = stage.completedAt ? new Date(stage.completedAt) : now;
    const start = new Date(stage.startedAt);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const renderWagonCards = (filterFn: (wf: any) => boolean) => {
    const wfs = activeWorkflows.filter(filterFn);
    if (wfs.length === 0) return <div className="p-8 text-center text-muted-foreground bg-card border rounded-lg shadow-sm">No wagons in this category.</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wfs.map(wf => {
          const wagon = wagons.find(w => w.id === wf.wagonId);
          const currentStageObj = wf.stages.find((s: any) => s.stageName === wf.currentStage);
          const isCurrentDelayed = currentStageObj ? isDelayed(currentStageObj) : false;
          const isFinalStage = wf.stages.findIndex((s: any) => s.stageName === wf.currentStage) === wf.stages.length - 1;

          return (
            <Card key={wf.id} className={`shadow-sm transition-all hover:shadow-md border-l-4 ${isCurrentDelayed ? 'border-l-red-500' : 'border-l-primary'}`}>
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-mono font-bold text-lg">{wf.wagonNo}</h3>
                    <Badge variant="outline" className="text-[10px] mt-1">{wf.wagonType}</Badge>
                  </div>
                  {isCurrentDelayed && (
                    <Badge variant="destructive" className="animate-pulse flex gap-1 items-center">
                      <AlertTriangle className="h-3 w-3" /> Delayed
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground mb-4 flex-1">
                  <div className="flex justify-between"><span>Defect:</span> <span className="font-medium text-foreground truncate max-w-[150px]">{wagon?.defect || "N/A"}</span></div>
                  <div className="flex justify-between"><span>Booked To:</span> <span className="font-medium text-foreground">{wagon?.bookedTo || "-"}</span></div>
                </div>

                {/* Progress Bar Visuals */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-primary truncate">{wf.currentStage}</span>
                    <span className={isCurrentDelayed ? 'text-red-600' : 'text-muted-foreground'}>{getTimeSpent(currentStageObj!)}</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden flex">
                    {wf.stages.map((st: any, i: number) => {
                      let color = "bg-secondary";
                      if (st.status === "Done") color = "bg-green-500";
                      else if (st.stageName === wf.currentStage) color = isCurrentDelayed ? "bg-red-500" : "bg-primary";
                      return <div key={i} className={`h-full ${color} flex-1 border-r border-background/50 last:border-0`} title={st.stageName} />
                    })}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-right mt-1">Target: {currentStageObj?.targetDurationHours}h</div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t flex flex-col gap-2 mt-auto">
                  {currentStageObj?.status === "Pending" && (
                    <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleStartStage(wf.id, wf.currentStage)}>
                      <PlayCircle className="h-4 w-4 mr-2" /> Start Stage
                    </Button>
                  )}
                  {currentStageObj?.status === "In Progress" && (
                    <Button variant="outline" className="w-full text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => openConfirmation(wf.id, wf.currentStage)}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Mark Done
                    </Button>
                  )}
                  {currentStageObj?.status === "Done" && !isFinalStage && (
                    <Button className="w-full" onClick={() => handleNextStage(wf)}>
                      Move to Next Stage <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                  {isFinalStage && currentStageObj?.status === "Done" && (
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleMarkFit(wf.wagonId)}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Mark Wagon Fit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const delayedWagons = activeWorkflows.filter(wf => {
    const currentObj = wf.stages.find((s: any) => s.stageName === wf.currentStage);
    return currentObj && isDelayed(currentObj);
  });

  const fitReadyWagons = activeWorkflows.filter(wf => {
    const isFinal = wf.stages.findIndex((s: any) => s.stageName === wf.currentStage) === wf.stages.length - 1;
    const finalStage = wf.stages[wf.stages.length - 1];
    return isFinal && finalStage.status === "Done";
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" /> Sick Line Workflows
        </h1>
        <p className="text-sm text-muted-foreground">Manual stage management requiring Inspector Confirmation.</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto bg-transparent justify-start gap-2 border-b w-full rounded-none px-0">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border rounded-t-lg">All Active ({activeWorkflows.length})</TabsTrigger>
          <TabsTrigger value="btpgln" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border rounded-t-lg">BTPGLN ({activeWorkflows.filter(wf => wf.wagonType === "BTPGLN").length})</TabsTrigger>
          <TabsTrigger value="btpn" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border rounded-t-lg">BTPN / BTPFLN ({activeWorkflows.filter(wf => wf.wagonType.includes("BTPN") || wf.wagonType.includes("BTPFLN")).length})</TabsTrigger>
          <TabsTrigger value="delayed" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700 border border-red-200 rounded-t-lg">Delayed ({delayedWagons.length})</TabsTrigger>
          <TabsTrigger value="fit" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 border border-green-200 rounded-t-lg">Fit Ready ({fitReadyWagons.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">{renderWagonCards(() => true)}</TabsContent>
        <TabsContent value="btpgln" className="mt-0">{renderWagonCards(wf => wf.wagonType === "BTPGLN")}</TabsContent>
        <TabsContent value="btpn" className="mt-0">{renderWagonCards(wf => wf.wagonType.includes("BTPN") || wf.wagonType.includes("BTPFLN"))}</TabsContent>
        <TabsContent value="delayed" className="mt-0">
          {renderWagonCards(wf => {
             const currentObj = wf.stages.find((s: any) => s.stageName === wf.currentStage);
             return !!(currentObj && isDelayed(currentObj));
          })}
        </TabsContent>
        <TabsContent value="fit" className="mt-0">
          {renderWagonCards(wf => {
            const isFinal = wf.stages.findIndex((s: any) => s.stageName === wf.currentStage) === wf.stages.length - 1;
            return isFinal && wf.stages[wf.stages.length - 1].status === "Done";
          })}
        </TabsContent>
      </Tabs>

      {/* Inspector Confirmation Dialog */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inspector Confirmation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Stage</Label>
              <Input value={activeStage || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Staff Name</Label>
              <Input value={staffName} onChange={e => setStaffName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Inspector Name <span className="text-red-500">*</span></Label>
              <Input value={inspectorName} onChange={e => setInspectorName(e.target.value)} placeholder="Required" />
            </div>
            <div className="space-y-2">
              <Label>Remarks <span className="text-red-500">*</span></Label>
              <Input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Required" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
            <Button onClick={submitConfirmation}>Confirm Stage Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
