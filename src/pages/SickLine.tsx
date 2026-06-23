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
import { PageHeader } from "@/components/shared/PageHeader";

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
    if (!inspectorName.trim() && !sessionStorage.getItem("lastInspectorName")) {
      toast({ title: "Validation Error", description: "SSC/JE Name is required.", variant: "destructive" });
      return;
    }
    if (activeWfId && activeStage) {
      const finalRemarks = remarks.trim() || `Stage ${activeStage} completed successfully by ${inspectorName}.`;
      markStageDone(activeWfId, activeStage, staffName, inspectorName, finalRemarks);
      sessionStorage.setItem("lastInspectorName", inspectorName);

      const wf = workflows.find((w) => w.id === activeWfId);
      if (wf) {
        const currentIndex = wf.stages.findIndex((s: any) => s.stageName === activeStage);
        if (currentIndex > -1 && currentIndex < wf.stages.length - 1) {
          const nextStage = wf.stages[currentIndex + 1].stageName;
          advanceWorkflow(wf.id, nextStage);
          toast({ title: "Stage Completed", description: `Advanced to ${nextStage}.` });
        } else {
          toast({ title: "Stage Marked Done", description: `${activeStage} has been confirmed done.` });
        }
      }
    }
    setConfirmModalOpen(false);
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
    if (wfs.length === 0) return <div className="p-8 text-center text-muted-foreground bg-card border border-border/50 rounded-lg shadow-sm">No wagons in this category.</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wfs.map(wf => {
          const wagon = wagons.find(w => w.id === wf.wagonId);
          const currentStageObj = wf.stages.find((s: any) => s.stageName === wf.currentStage);
          const isCurrentDelayed = currentStageObj ? isDelayed(currentStageObj) : false;
          const isFinalStage = wf.stages.findIndex((s: any) => s.stageName === wf.currentStage) === wf.stages.length - 1;

          return (
            <Card key={wf.id} className={`shadow-sm transition-all hover:shadow-modern border-l-4 bg-card ${isCurrentDelayed ? 'border-l-destructive border-y-border/50 border-r-border/50' : 'border-l-primary border-y-border/50 border-r-border/50'}`}>
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-mono font-bold text-lg tracking-tight">{wf.wagonNo}</h3>
                    <Badge variant="outline" className="text-[10px] mt-1 shadow-sm">{wf.wagonType}</Badge>
                  </div>
                  {isCurrentDelayed && (
                    <Badge variant="destructive" className="animate-pulse flex gap-1 items-center shadow-sm">
                      <AlertTriangle className="h-3 w-3" /> Delayed
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5 text-sm text-muted-foreground mb-5 flex-1 bg-secondary/30 p-3 rounded-lg border border-border/50">
                  <div className="flex justify-between items-center"><span className="text-xs uppercase tracking-wider font-medium">Defect:</span> <span className="font-semibold text-foreground truncate max-w-[150px]">{wagon?.defect || "N/A"}</span></div>
                  <div className="flex justify-between items-center"><span className="text-xs uppercase tracking-wider font-medium">Booked To:</span> <span className="font-semibold text-foreground">{wagon?.bookedTo || "-"}</span></div>
                </div>

                {/* Progress Bar Visuals */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="text-primary truncate pr-2">{wf.currentStage}</span>
                    {currentStageObj?.inspectorName && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">SSE/JE: {currentStageObj.inspectorName}</span>}
                    <span className={`${isCurrentDelayed ? 'text-destructive font-bold' : 'text-muted-foreground'} whitespace-nowrap ml-auto`}>{getTimeSpent(currentStageObj!)}</span>
                  </div>
                  <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden flex shadow-inner">
                    {wf.stages.map((st: any, i: number) => {
                      let color = "bg-secondary";
                      if (st.status === "Done") color = "bg-success";
                      else if (st.stageName === wf.currentStage) color = isCurrentDelayed ? "bg-destructive" : "bg-primary";
                      return <div key={i} className={`h-full ${color} flex-1 border-r border-background/50 last:border-0 transition-colors`} title={st.stageName} />
                    })}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-right mt-1 font-medium">Target: {currentStageObj?.targetDurationHours}h</div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-border/50 flex flex-col gap-2 mt-auto">
                  {currentStageObj?.status === "Pending" && (
                    <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 shadow-sm transition-colors" onClick={() => handleStartStage(wf.id, wf.currentStage)}>
                      <PlayCircle className="h-4 w-4 mr-2" /> Start Stage
                    </Button>
                  )}
                  {currentStageObj?.status === "In Progress" && (
                    <Button variant="outline" className="w-full text-warning border-warning/30 hover:bg-warning/10 hover:text-warning shadow-sm transition-colors" onClick={() => openConfirmation(wf.id, wf.currentStage)}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Mark Done
                    </Button>
                  )}
                  {/* Move to Next Stage removed since it auto-advances */}
                  {isFinalStage && currentStageObj?.status === "Done" && (
                    <Button className="w-full bg-success hover:bg-success/90 text-success-foreground shadow-sm transition-colors" onClick={() => handleMarkFit(wf.wagonId)}>
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
      <PageHeader 
        title="Sick Line Workflows"
        description="Manual stage management requiring Inspector Confirmation."
        icon={Wrench}
      />

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

      {/* SSE/JE Confirmation Dialog */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="z-[60]">
          <DialogHeader>
            <DialogTitle>SSE/JE Confirmation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Stage</Label>
              <Input value={activeStage || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Staff Name</Label>
              <Input value={staffName} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>SSE/JE Name <span className="text-red-500">*</span></Label>
              <Input value={inspectorName} onChange={e => setInspectorName(e.target.value)} placeholder="Required" />
            </div>
            <div className="space-y-2">
              <Label>Remarks (Optional)</Label>
              <Input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Auto-generated if empty" />
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
