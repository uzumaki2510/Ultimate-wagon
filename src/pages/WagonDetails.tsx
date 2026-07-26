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
import { Train, ArrowLeft, Clock, Info, ShieldCheck, Droplets, Wind, Wrench, CheckCircle2, FileStack } from "lucide-react";
import { DocumentManager } from "@/components/documents/DocumentManager";

export default function WagonDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { wagons, workflows, startStage, markStageDone } = useAppStore();
  
  const wagon = useMemo(() => wagons.find(w => w.id === id), [wagons, id]);
  const workflow = useMemo(() => workflows.find(w => w.wagonId === id), [workflows, id]);
  
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

  if (!wagon || !workflow) {
    return (
      <div className="p-8 text-center animate-fade-in">
        <Train className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
        <h2 className="text-xl font-bold">Wagon Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">The requested wagon could not be found or has no active workflow.</p>
        <Button onClick={() => navigate(-1)} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
      </div>
    );
  }

  const isTank = isTankWagonType(wagon.type);
  const activeStageIndex = workflow.stages.findIndex(s => s.stageName === workflow.currentStage);
  const activeStage = workflow.stages[activeStageIndex];
  
  const handleStartStage = async () => {
    if (!activeStage || isSubmitting) return;
    setIsSubmitting(true);
    await startStage(workflow.id, activeStage.stageName, user?.name || "Unknown");
    setIsSubmitting(false);
  };

  const handleCompleteStage = async (extraRemarks = "") => {
    if (!activeStage || isSubmitting) return;
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
    return workflow.stages.some(s => s.stageName.includes(stageNameMatch) && s.status === "Done");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageHeader 
            title={`Wagon ${wagon.wagonNo}`} 
            description="Complete wagon details, chronological timeline, and active workflow."
            icon={Train}
            actions={
              <Badge variant="outline" className={`px-3 py-1 text-sm font-semibold uppercase tracking-wider
                ${wagon.status === 'SICK_LINE' || wagon.status === 'REPAIR_IN_PROGRESS' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-success/10 text-success border-success/20'}
              `}>
                {wagon.status.replace(/_/g, ' ')}
              </Badge>
            }
          />
        </div>
        <div className="bg-white p-2 rounded-lg shadow-sm border">
          <QRCodeSVG value={window.location.href} size={64} level="L" includeMargin={false} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL: Details & Active Modules */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Wagon Information Card */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Wagon Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-x-4 gap-y-4">
              <InfoItem label="Type" value={wagon.type} />
              <InfoItem label="Owner" value={wagon.owner} />
              <InfoItem label="Location" value={wagon.bookedTo ? String(wagon.bookedTo).toUpperCase() : "Yard"} />
              <InfoItem label="Built Year" value={wagon.builtYear?.toString() || "Unknown"} />
              <div className="col-span-2 pt-2 border-t">
                <InfoItem label="Current Stage" value={workflow.currentStage} valueClassName="text-primary font-bold" />
              </div>
              <InfoItem label="Assigned To" value={activeStage?.staffName || activeStage?.sscJeName || "Unassigned"} />
              <InfoItem label="Check Number" value={wagon.rakeId || "N/A"} />
              <div className="col-span-2 pt-2 border-t">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 tracking-wider">Defects</p>
                <p className="text-sm font-medium text-destructive">{wagon.defect || "None recorded"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Progress Bar Mobile/Tablet */}
          <Card className="shadow-sm border-border/50 lg:hidden">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-lg">Workflow Progress</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <WorkflowProgressBar workflow={workflow} wagonType={wagon.type || ""} />
            </CardContent>
          </Card>

          {/* Dynamic Action Modules based on current stage */}
          {activeStage && activeStage.status !== "Skipped" && activeStage.status !== "Done" && (
            <Card className="shadow-sm border-primary/20 bg-primary/5">
              <CardHeader className="pb-3 border-b border-primary/10">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  {activeStage.stageName.includes("Steam") && <Droplets className="h-5 w-5" />}
                  {activeStage.stageName.includes("Degass") && <Wind className="h-5 w-5" />}
                  {activeStage.stageName.includes("Gas Free") && <ShieldCheck className="h-5 w-5" />}
                  {activeStage.stageName.includes("Repair") && <Wrench className="h-5 w-5" />}
                  {(!activeStage.stageName.includes("Steam") && !activeStage.stageName.includes("Degass") && !activeStage.stageName.includes("Gas Free") && !activeStage.stageName.includes("Repair")) && <Clock className="h-5 w-5" />}
                  Action: {activeStage.stageName}
                </CardTitle>
                <CardDescription>Update the status of the current workflow stage.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                {/* Duration Tracker (if in progress) */}
                {activeStage.status === "In Progress" && (
                  <div className="flex items-center justify-between bg-background border rounded-md p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">In Progress</span>
                    </div>
                    <div className="text-sm font-mono font-medium">
                      {Math.floor(elapsedMinutes / 60)}h {elapsedMinutes % 60}m
                    </div>
                  </div>
                )}

                {/* Module: Gas Free Certification specific inputs */}
                {activeStage.stageName.includes("Gas Free") && activeStage.status === "In Progress" && (
                  <div className="space-y-2 pb-2">
                    <Label className="text-sm font-semibold">Certificate Number <span className="text-destructive">*</span></Label>
                    <Input 
                      placeholder="e.g. GFC-2026-081" 
                      value={certNumber} 
                      onChange={e => setCertNumber(e.target.value)} 
                    />
                  </div>
                )}

                {/* Shared Inputs (Operator & Remarks) */}
                {activeStage.status === "In Progress" && (
                  <>
                    <div className="space-y-2 pb-2">
                      <Label className="text-sm font-semibold">Operator / Staff Name</Label>
                      <Input 
                        value={operator} 
                        onChange={e => setOperator(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Remarks</Label>
                      <Textarea 
                        placeholder="Enter bay number, observations, or constraints..." 
                        value={remarks} 
                        onChange={e => setRemarks(e.target.value)}
                        className="resize-none h-20"
                      />
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="pt-2 flex justify-end">
                  {activeStage.status === "Pending" ? (
                    <Button 
                      onClick={handleStartStage} 
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      Start {activeStage.stageName}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => {
                        let extra = "";
                        if (activeStage.stageName.includes("Gas Free") && certNumber) {
                          extra = `Cert: ${certNumber}`;
                        }
                        handleCompleteStage(extra);
                      }}
                      disabled={isSubmitting || (activeStage.stageName.includes("Gas Free") && !certNumber.trim())}
                      className="w-full sm:w-auto bg-success hover:bg-success/90 text-success-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete Stage
                    </Button>
                  )}
                </div>

                {/* Rules & Warnings */}
                {activeStage.stageName.includes("Gas Free") && activeStage.status === "In Progress" && (
                  <div className="text-xs text-muted-foreground bg-background/50 border rounded p-2 mt-2">
                    <strong>Rule:</strong> Mechanical Inspection cannot begin until Gas Free Certification is passed.
                  </div>
                )}
                {activeStage.stageName.includes("Mechanical Inspection") && isTank && !isStageCompleted("Gas Free") && (
                  <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded p-2 mt-2">
                    <strong>Warning:</strong> Gas Free Certification appears incomplete.
                  </div>
                )}

              </CardContent>
            </Card>
          )}

          {activeStage && activeStage.status === "Done" && (
            <Card className="shadow-sm border-success/20 bg-success/5 text-center py-6">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-2 opacity-80" />
              <h3 className="font-bold text-lg text-success-foreground">Workflow Completed</h3>
              <p className="text-sm text-success-foreground/70">All required stages have been finished.</p>
            </Card>
          )}

        </div>

        {/* RIGHT PANEL: Progress, Timeline & Documents */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="workflow" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50">
              <TabsTrigger value="workflow" className="text-sm">
                <Clock className="h-4 w-4 mr-2" /> Workflow & Timeline
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-sm">
                <FileStack className="h-4 w-4 mr-2" /> Documents & Gallery
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="workflow" className="space-y-6 mt-0 animate-fade-in">
              {/* Workflow Progress Bar Desktop */}
              <Card className="hidden lg:block shadow-sm border-border/50">
            <CardHeader className="pb-0 border-b bg-muted/20">
              <CardTitle className="text-lg py-2">Workflow Progress</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <WorkflowProgressBar workflow={workflow} wagonType={wagon.type || ""} />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Chronological Timeline
              </CardTitle>
              <CardDescription>Complete audit trail of all workflow transitions and actions.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <WagonTimeline workflow={workflow} />
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-0 animate-fade-in">
              <DocumentManager wagonId={wagon.id} />
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>
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
