import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { 
  FileText, Wrench, Train, ClipboardCheck, AlertTriangle, 
  PlusCircle, LayoutDashboard, CheckCircle2, Droplets, Wind, Activity 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { ActionCard } from "@/components/shared/ActionCard";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export default function Dashboard() {
  const navigate = useNavigate();
  const { wagons, workflows } = useAppStore();
  const { user } = useAuth();

  const todayStr = new Date().toISOString().split("T")[0];

  // Operations Metrics
  let totalWagons = wagons.length;
  let inWorkshop = 0;
  let waitingInspection = 0;
  let underRepair = 0;
  let steamQueue = 0;
  let degassingQueue = 0;
  let readyForTesting = 0;
  let readyForRelease = 0;
  let releasedToday = 0;

  wagons.forEach(w => {
    const isReleased = w.status === "RELEASED";
    const isFitReady = w.status === "FIT_READY";
    
    // Released Today
    if ((isReleased || isFitReady) && w.updatedAt?.startsWith(todayStr)) {
      releasedToday++;
    }

    // Wagons in Workshop
    if (!isReleased && !isFitReady) {
      inWorkshop++;
    }

    // Ready for Release (Fit Ready but not Released)
    if (isFitReady && !isReleased) {
      readyForRelease++;
    }

    // Workflow based metrics
    const wf = workflows.find(wf => wf.wagonId === w.id);
    if (wf) {
      const currentStageName = wf.currentStage;
      const currentStageObj = wf.stages.find(s => s.stageName === currentStageName);
      const status = currentStageObj?.status;

      // Waiting for Inspection
      if ((currentStageName.includes("Initial Inspection") || currentStageName.includes("Mechanical Inspection")) && status === "Pending") {
        waitingInspection++;
      }

      // Under Repair
      if (currentStageName.includes("Repair") && (status === "In Progress" || status === "Paused")) {
        underRepair++;
      }

      // Steam Queue
      if (currentStageName.includes("Steam") && (status === "Pending" || status === "In Progress" || status === "Paused")) {
        steamQueue++;
      }

      // Degassing Queue
      if ((currentStageName.includes("Degass") || currentStageName.includes("Purging") || currentStageName.includes("Gas Free")) && (status === "Pending" || status === "In Progress" || status === "Paused")) {
        degassingQueue++;
      }

      // Ready for Testing
      if (currentStageName.includes("Test") && status === "Pending") {
        readyForTesting++;
      }
    }
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <PageHeader 
          title="Operations Dashboard" 
          description={`Welcome back, ${user?.name || "User"}. Live workshop status.`}
          icon={LayoutDashboard}
        />
        <div className="w-full md:w-auto md:min-w-[350px]">
          <GlobalSearch />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Column: Metrics & Actions */}
        <div className="xl:col-span-3 space-y-8">
          
          {/* Main Metrics */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <Activity className="h-4 w-4" /> Live Operations Counters
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div onClick={() => navigate("/register")} className="cursor-pointer">
                <StatCard title="Total Wagons" value={totalWagons} icon={Train} className="hover:border-primary/50 transition-colors" />
              </div>
              <div onClick={() => navigate("/register")} className="cursor-pointer">
                <StatCard title="In Workshop" value={inWorkshop} icon={Wrench} className="hover:border-primary/50 transition-colors" />
              </div>
              <div onClick={() => navigate("/workshop/inspection")} className="cursor-pointer">
                <StatCard title="Waiting Inspection" value={waitingInspection} icon={ClipboardCheck} className="hover:border-amber-500/50 transition-colors" />
              </div>
              <div onClick={() => navigate("/workshop/repair")} className="cursor-pointer">
                <StatCard title="Under Repair" value={underRepair} icon={AlertTriangle} className="hover:border-destructive/50 transition-colors" />
              </div>
              <div onClick={() => navigate("/workshop/steam")} className="cursor-pointer">
                <StatCard title="Steam Queue" value={steamQueue} icon={Droplets} className="hover:border-cyan-500/50 transition-colors" />
              </div>
              <div onClick={() => navigate("/workshop/degassing")} className="cursor-pointer">
                <StatCard title="Degassing Queue" value={degassingQueue} icon={Wind} className="hover:border-indigo-500/50 transition-colors" />
              </div>
              <div onClick={() => navigate("/workshop/testing")} className="cursor-pointer">
                <StatCard title="Ready for Testing" value={readyForTesting} icon={Activity} className="hover:border-purple-500/50 transition-colors" />
              </div>
              <div onClick={() => navigate("/workshop/fit")} className="cursor-pointer">
                <StatCard title="Ready for Release" value={readyForRelease} icon={CheckCircle2} className="hover:border-success/50 transition-colors" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 mt-4">
              <div onClick={() => navigate("/register")} className="cursor-pointer">
                <StatCard title="Released Today" value={releasedToday} icon={CheckCircle2} className="bg-success/5 border-success/20 hover:border-success/50 transition-colors" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ActionCard
                title="Add New Wagon"
                description="Create a new wagon entry into the register."
                icon={PlusCircle}
                onClick={() => navigate("/register")}
                className="bg-primary/5 border-primary/20"
              />
              <ActionCard
                title="Create Sick Memo"
                description="Issue a new sick memo for a defective wagon."
                icon={FileText}
                onClick={() => navigate("/memos/new?type=sick")}
              />
              <ActionCard
                title="Wagon Directory"
                description="View all master wagon records."
                icon={Train}
                onClick={() => navigate("/wagon-directory")}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="xl:col-span-1 h-[600px] xl:h-auto">
          <ActivityFeed />
        </div>

      </div>
    </div>
  );
}
