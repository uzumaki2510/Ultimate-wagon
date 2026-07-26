import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Droplets, Wind, ClipboardCheck, Wrench, Activity, CheckCircle, 
  Search, PlayCircle, PauseCircle, CheckCircle2, Clock, AlertTriangle 
} from "lucide-react";

// Line definitions mapping to stages
const LINE_CONFIG = {
  "steam": {
    name: "Steam Line",
    icon: Droplets,
    stages: ["Steam Cleaning", "Steaming", "Steam Point 24h"]
  },
  "degassing": {
    name: "Degassing Line",
    icon: Wind,
    stages: ["Degassing", "RRT De-Gassing", "Purging", "Gas Free Verification"]
  },
  "inspection": {
    name: "Inspection Line",
    icon: ClipboardCheck,
    stages: ["Initial Inspection", "Mechanical Inspection", "Yard Examination", "HAPA Examination", "Placement Decision", "SICK_LINE", "Sick Reason", "Final Inspection"]
  },
  "repair": {
    name: "Repair Line",
    icon: Wrench,
    stages: ["Repair / Rectification"]
  },
  "testing": {
    name: "Testing Line",
    icon: Activity,
    stages: ["Testing", "Checklist / Testing", "Hydro Testing"]
  },
  "fit": {
    name: "Fit Certificate Line",
    icon: CheckCircle,
    stages: ["Fit Certificate", "Fit For Use", "FIT_READY"]
  }
};

export default function WorkshopLine() {
  const { lineId } = useParams<{ lineId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wagons, workflows, startStage, markStageDone, pauseStage, resumeStage, advanceWorkflow } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [now, setNow] = useState(new Date());

  // Modals state
  const [activeWfId, setActiveWfId] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState("");

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [inspectorName, setInspectorName] = useState(user?.name || "");
  const [completeRemarks, setCompleteRemarks] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const config = LINE_CONFIG[lineId as keyof typeof LINE_CONFIG];

  // If invalid lineId, show error
  if (!config) {
    return <div className="p-8 text-center text-muted-foreground">Invalid Workshop Line</div>;
  }

  // Get workflows currently in this line
  const lineWorkflows = useMemo(() => {
    return workflows.filter(wf => config.stages.includes(wf.currentStage) && wf.stages.some(s => s.stageName === wf.currentStage && s.status !== "Done"));
  }, [workflows, config.stages]);

  // Derived metrics
  const metrics = useMemo(() => {
    let waiting = 0;
    let inProgress = 0;
    let completedToday = 0;
    let totalProcessingTimeMs = 0;
    let completedCount = 0;

    workflows.forEach(wf => {
      // Check current active stages in this line
      const currentObj = wf.stages.find(s => s.stageName === wf.currentStage);
      if (currentObj && config.stages.includes(currentObj.stageName)) {
        if (currentObj.status === "Pending") waiting++;
        if (currentObj.status === "In Progress" || currentObj.status === "Paused") inProgress++;
      }

      // Check for completed stages in this line
      wf.stages.forEach(st => {
        if (config.stages.includes(st.stageName) && st.status === "Done" && st.completedAt) {
          const completedDate = new Date(st.completedAt);
          if (completedDate.toDateString() === new Date().toDateString()) {
            completedToday++;
          }
          if (st.startedAt) {
            const start = new Date(st.startedAt).getTime();
            const end = completedDate.getTime();
            totalProcessingTimeMs += (end - start);
            completedCount++;
          }
        }
      });
    });

    const avgTimeMs = completedCount > 0 ? totalProcessingTimeMs / completedCount : 0;
    const avgHours = Math.floor(avgTimeMs / (1000 * 60 * 60));
    const avgMins = Math.floor((avgTimeMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      total: waiting + inProgress,
      waiting,
      inProgress,
      completedToday,
      avgTime: completedCount > 0 ? `${avgHours}h ${avgMins}m` : "N/A"
    };
  }, [workflows, config.stages]);

  // Apply Search & Filters
  const filteredWorkflows = useMemo(() => {
    return lineWorkflows.filter(wf => {
      const wagon = wagons.find(w => w.id === wf.wagonId);
      const stage = wf.stages.find(s => s.stageName === wf.currentStage);
      
      // Status filter
      if (statusFilter === "waiting" && stage?.status !== "Pending") return false;
      if (statusFilter === "in_progress" && stage?.status !== "In Progress") return false;
      if (statusFilter === "paused" && stage?.status !== "Paused") return false;

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const wNo = wf.wagonNo.toLowerCase();
        const rNo = (wagon?.rakeId || "").toLowerCase();
        const eNo = (stage?.staffName || "").toLowerCase();
        if (!wNo.includes(q) && !rNo.includes(q) && !eNo.includes(q)) return false;
      }
      return true;
    });
  }, [lineWorkflows, wagons, statusFilter, searchQuery]);

  const getTimeSpent = (startedAt?: string) => {
    if (!startedAt) return "0h 0m";
    const start = new Date(startedAt).getTime();
    const diffMs = now.getTime() - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const handleStart = (wfId: string, stageName: string) => {
    startStage(wfId, stageName, user?.name || "System");
  };

  const openPauseModal = (wfId: string, stageName: string) => {
    setActiveWfId(wfId);
    setActiveStage(stageName);
    setPauseReason("");
    setPauseModalOpen(true);
  };

  const handlePause = () => {
    if (activeWfId && activeStage) {
      pauseStage(activeWfId, activeStage, user?.name || "System", pauseReason);
    }
    setPauseModalOpen(false);
  };

  const handleResume = (wfId: string, stageName: string) => {
    resumeStage(wfId, stageName, user?.name || "System");
  };

  const openCompleteModal = (wfId: string, stageName: string) => {
    setActiveWfId(wfId);
    setActiveStage(stageName);
    setInspectorName(user?.name || "");
    setCompleteRemarks("");
    setCompleteModalOpen(true);
  };

  const handleComplete = () => {
    if (activeWfId && activeStage) {
      markStageDone(activeWfId, activeStage, user?.name || "System", inspectorName, completeRemarks);
      
      // Auto-advance
      const wf = workflows.find((w) => w.id === activeWfId);
      if (wf) {
        const currentIndex = wf.stages.findIndex(s => s.stageName === activeStage);
        if (currentIndex > -1 && currentIndex < wf.stages.length - 1) {
          const nextStage = wf.stages[currentIndex + 1].stageName;
          advanceWorkflow(wf.id, nextStage);
        }
      }
    }
    setCompleteModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader 
        title={config.name} 
        description={`Manage wagons currently in the ${config.name} queue.`}
        icon={config.icon}
      />

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Total Wagons" value={metrics.total} />
        <MetricCard label="Waiting" value={metrics.waiting} valueClass="text-muted-foreground" />
        <MetricCard label="In Progress" value={metrics.inProgress} valueClass="text-blue-500" />
        <MetricCard label="Completed Today" value={metrics.completedToday} valueClass="text-emerald-500" />
        <MetricCard label="Avg Process Time" value={metrics.avgTime} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by Wagon No, Check No, Employee..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="waiting">Waiting (Pending)</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Queue Cards */}
      {filteredWorkflows.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground bg-muted/10">
          No wagons currently found in this line matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWorkflows.map(wf => {
            const wagon = wagons.find(w => w.id === wf.wagonId);
            const stage = wf.stages.find(s => s.stageName === wf.currentStage)!;
            
            return (
              <Card key={wf.id} className={`shadow-sm border-l-4 transition-all hover:shadow-md
                ${stage.status === 'Pending' ? 'border-l-muted-foreground' : 
                  stage.status === 'In Progress' ? 'border-l-blue-500' : 
                  stage.status === 'Paused' ? 'border-l-warning' : 'border-l-border'}
              `}>
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-mono font-bold text-lg cursor-pointer hover:underline text-primary" onClick={() => navigate(`/wagon/${wagon?.id}`)}>
                        {wf.wagonNo}
                      </h3>
                      <p className="text-xs text-muted-foreground">Type: {wf.wagonType} {wagon?.rakeId ? `| Check: ${wagon.rakeId}` : ''}</p>
                    </div>
                    <Badge variant={
                      stage.status === 'Pending' ? 'outline' : 
                      stage.status === 'In Progress' ? 'default' : 
                      stage.status === 'Paused' ? 'destructive' : 'secondary'
                    } className={stage.status === 'In Progress' ? 'bg-blue-500 hover:bg-blue-600' : stage.status === 'Paused' ? 'bg-amber-500 hover:bg-amber-600 border-transparent text-white' : ''}>
                      {stage.status}
                    </Badge>
                  </div>
                  
                  <div className="bg-muted/30 p-2 rounded-md mb-4 text-sm mt-2">
                    <p className="font-semibold text-foreground mb-1">{stage.stageName}</p>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-muted-foreground">Staff:</span>
                      <span className="font-medium">{stage.staffName || "Unassigned"}</span>
                    </div>
                    {stage.status !== "Pending" && (
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-muted-foreground">Elapsed:</span>
                        <span className="font-medium font-mono">{getTimeSpent(stage.startedAt)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t">
                    {stage.status === "Pending" && (
                      <Button className="col-span-2 w-full text-blue-600 bg-blue-50 hover:bg-blue-100 border-none" variant="outline" onClick={() => handleStart(wf.id, stage.stageName)}>
                        <PlayCircle className="h-4 w-4 mr-2" /> Start Process
                      </Button>
                    )}
                    
                    {stage.status === "In Progress" && (
                      <>
                        <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => openPauseModal(wf.id, stage.stageName)}>
                          <PauseCircle className="h-4 w-4 mr-1" /> Pause
                        </Button>
                        <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => openCompleteModal(wf.id, stage.stageName)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Complete
                        </Button>
                      </>
                    )}

                    {stage.status === "Paused" && (
                      <Button className="col-span-2 w-full text-blue-600 bg-blue-50 hover:bg-blue-100 border-none" variant="outline" onClick={() => handleResume(wf.id, stage.stageName)}>
                        <PlayCircle className="h-4 w-4 mr-2" /> Resume Process
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pause Modal */}
      <Dialog open={pauseModalOpen} onOpenChange={setPauseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause Process</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Pause</Label>
              <Input 
                value={pauseReason} 
                onChange={e => setPauseReason(e.target.value)} 
                placeholder="e.g., Waiting for spares, shift end..." 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="bg-amber-500 hover:bg-amber-600" onClick={handlePause}>Pause Process</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Modal */}
      <Dialog open={completeModalOpen} onOpenChange={setCompleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Process</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Inspector Name <span className="text-red-500">*</span></Label>
              <Input value={inspectorName} onChange={e => setInspectorName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Remarks (Optional)</Label>
              <Input value={completeRemarks} onChange={e => setCompleteRemarks(e.target.value)} placeholder="Any observations..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteModalOpen(false)}>Cancel</Button>
            <Button onClick={handleComplete} className="bg-success hover:bg-success/90">Confirm Completion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ label, value, valueClass = "" }: { label: string, value: string | number, valueClass?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col justify-center items-center text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{label}</p>
        <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
