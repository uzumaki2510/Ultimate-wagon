import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { WorkflowProgressBar } from "@/components/WorkflowProgressBar";
import { WagonTimeline } from "@/components/WagonTimeline";
import { isTankWagonType } from "@/lib/workflowConfig";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Train, ArrowLeft, Clock, Info, ShieldCheck, Droplets, Wind, Wrench, CheckCircle2, FileStack, Printer, QrCode, Activity } from "lucide-react";
import { DocumentManager } from "@/components/documents/DocumentManager";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { PassportOverview } from "@/components/passport/PassportOverview";
import { DefectCentre } from "@/components/passport/DefectCentre";

export default function WagonDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { wagons, workflows, startStage, markStageDone } = useAppStore();
  
  const wagon = useMemo(() => wagons.find(w => w.id === id || w.wagonNo === id), [wagons, id]);
  const workflow = useMemo(() => wagon ? workflows.find(w => w.wagonId === wagon.id) : undefined, [workflows, wagon]);
  
  // States for interactive modules
  const [remarks, setRemarks] = useState("");
  const [operator, setOperator] = useState(user?.name || "");
  const [certNumber, setCertNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live timer for active stage duration
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Effect for live timer
  useEffect(() => {
    if (!workflow) return;
    
    const activeStage = workflow.stages.find(s => s.stageName === workflow.currentStage);
    if (activeStage && activeStage.status === "In Progress" && activeStage.startedAt) {
      const start = new Date(activeStage.startedAt).getTime();
      
      const updateTimer = () => {
        const now = new Date().getTime();
        setElapsedMinutes(Math.floor((now - start) / 60000));
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 60000); // update every minute
      return () => clearInterval(interval);
    } else {
      setElapsedMinutes(0);
    }
  }, [workflow]);

  if (!wagon) {
    return (
      <div className="p-8 text-center animate-fade-in">
        <Train className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
        <h2 className="text-xl font-bold">Wagon Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">The requested wagon could not be found in the registry.</p>
        <Button onClick={() => navigate(-1)} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
      </div>
    );
  }

  const isTank = isTankWagonType(wagon.type);
  const activeStageIndex = workflow ? workflow.stages.findIndex(s => s.stageName === workflow.currentStage) : -1;
  const activeStage = workflow && activeStageIndex >= 0 ? workflow.stages[activeStageIndex] : undefined;
  
  const handleStartStage = async () => {
    if (!activeStage || isSubmitting || !workflow) return;
    setIsSubmitting(true);
    await startStage(workflow.id, activeStage.stageName, user?.name || "Unknown");
    setIsSubmitting(false);
  };

  const handleCompleteStage = async (extraRemarks = "") => {
    if (!activeStage || isSubmitting || !workflow) return;
    setIsSubmitting(true);
    
    let finalRemarks = remarks;
    if (extraRemarks) {
      finalRemarks = finalRemarks ? `${finalRemarks} | ${extraRemarks}` : extraRemarks;
    }

    await markStageDone(workflow.id, activeStage.stageName, operator, user?.name || "Unknown", finalRemarks);
    
    // Reset forms
    setRemarks("");
    setCertNumber("");
    setIsSubmitting(false);
  };

  // Helper to check if a specific stage is completed
  const isStageCompleted = (stageNameMatch: string) => {
    if (!workflow) return false;
    return workflow.stages.some(s => s.stageName.includes(stageNameMatch) && s.status === "Done");
  };

  const passportHeader = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-[var(--density-spacing-lg,1.5rem)] animate-fade-in border-b pb-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-h1 font-bold tracking-tight flex items-center gap-2 text-foreground">
              {wagon.wagonNo}
            </h1>
            <Badge variant="outline" className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wider
              ${wagon.status === 'SICK_LINE' || wagon.status === 'REPAIR_IN_PROGRESS' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-success/10 text-success border-success/20'}
            `}>
              {wagon.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Digital Passport & Operational History</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="hidden sm:flex h-9">
          <Printer className="h-4 w-4 mr-2" /> Print Passport
        </Button>
        <div className="bg-white p-1 rounded-sm shadow-sm border cursor-pointer hover:scale-105 transition-transform" title="Scan to open passport">
          <QRCodeSVG value={window.location.href} size={36} level="L" includeMargin={false} />
        </div>
      </div>
    </div>
  );

  const handleCreateWorkflow = () => {
    const { upsertWorkflowForWagon } = useAppStore.getState();
    upsertWorkflowForWagon(wagon.id);
  };

  return (
    <WorkspaceLayout header={passportHeader}>
      <Tabs defaultValue="overview" className="flex flex-col md:flex-row h-full gap-6 pb-12 animate-fade-in">
        
        {/* Vertical Navigation Sidebar */}
        <div className="w-full md:w-56 shrink-0">
          <TabsList className="flex flex-row md:flex-col h-auto w-full justify-start bg-transparent space-y-0 md:space-y-2 space-x-2 md:space-x-0 overflow-x-auto p-0">
            <TabsTrigger value="overview" className="justify-start px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none border border-transparent data-[state=active]:border-primary/20 rounded-lg w-full text-left">
              <Info className="h-4 w-4 md:mr-2 shrink-0" /> <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="defects" className="justify-start px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none border border-transparent data-[state=active]:border-primary/20 rounded-lg w-full text-left">
              <Wrench className="h-4 w-4 md:mr-2 shrink-0" /> <span className="hidden md:inline">Defect Centre</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="justify-start px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none border border-transparent data-[state=active]:border-primary/20 rounded-lg w-full text-left">
              <Clock className="h-4 w-4 md:mr-2 shrink-0" /> <span className="hidden md:inline">Audit Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="justify-start px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none border border-transparent data-[state=active]:border-primary/20 rounded-lg w-full text-left">
              <FileStack className="h-4 w-4 md:mr-2 shrink-0" /> <span className="hidden md:inline">Documents & Gallery</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Quick Actions (only visible on desktop) */}
          <div className="hidden md:block mt-8 space-y-4">
            {!workflow ? (
              <Card className="shadow-sm border-warning/50 bg-warning/5">
                <CardHeader className="p-4 pb-2 border-b border-warning/20">
                  <CardTitle className="text-sm flex items-center gap-2 text-warning-foreground">
                    Workflow Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    No active workflow found. This wagon has not yet entered the workshop process.
                  </p>
                  <div className="space-y-2">
                    <Button onClick={handleCreateWorkflow} size="sm" className="w-full text-xs font-semibold">
                      Create Workflow
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/super-admin/wagons')} className="w-full text-xs bg-background">
                      Back to Register
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider px-2">Operator Actions</h3>
                {activeStage && activeStage.status !== "Skipped" && activeStage.status !== "Done" ? (
                  <Card className="shadow-sm border-primary/20 bg-primary/5">
                    <CardHeader className="p-4 pb-2 border-b border-primary/10">
                      <CardTitle className="text-sm flex items-center gap-2 text-primary">
                        <Activity className="h-4 w-4 shrink-0" />
                        {activeStage.stageName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-3 space-y-3">
                      
                      {/* Shared Inputs (Operator & Remarks) */}
                      {activeStage.status === "In Progress" && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">Operator Name</Label>
                            <Input size={1} className="h-8 text-xs" value={operator} onChange={e => setOperator(e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Remarks</Label>
                            <Textarea className="resize-none h-16 text-xs min-h-[4rem]" value={remarks} onChange={e => setRemarks(e.target.value)} />
                          </div>
                        </>
                      )}
    
                      {/* Actions */}
                      <div className="pt-2">
                        {activeStage.status === "Pending" ? (
                          <Button onClick={handleStartStage} disabled={isSubmitting} size="sm" className="w-full text-xs h-8">
                            Start Stage
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleCompleteStage()}
                            disabled={isSubmitting}
                            size="sm"
                            className="w-full text-xs h-8 bg-success hover:bg-success/90 text-success-foreground"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-xs text-muted-foreground px-2">No active stage awaiting action.</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Workspace Area */}
        <div className="flex-1 min-w-0">
          <TabsContent value="overview" className="h-full m-0">
            <PassportOverview wagon={wagon as any} activeStage={workflow.currentStage} defectCount={wagon.repairTasks?.length} />
          </TabsContent>
          
          <TabsContent value="defects" className="h-full m-0">
            <DefectCentre wagon={wagon as any} />
          </TabsContent>

          <TabsContent value="timeline" className="h-full m-0">
            <Card className="shadow-sm border-border/50 h-full">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Chronological Audit Timeline
                </CardTitle>
                <CardDescription>Immutable history of all workflow transitions and actions.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <WagonTimeline workflow={workflow} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="h-full m-0">
            <DocumentManager wagonId={wagon.id} />
          </TabsContent>
        </div>

      </Tabs>
    </WorkspaceLayout>
  );
}



function InfoItem({ label, value, valueClassName = "" }: { label: string, value: string, valueClassName?: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5 tracking-wider">{label}</p>
      <p className={`text-sm font-medium ${valueClassName}`}>{value || "—"}</p>
    </div>
  );
}
