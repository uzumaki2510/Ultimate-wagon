import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { FileText, Wrench, Train, ClipboardCheck, AlertTriangle, PlusCircle, LayoutDashboard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { ActionCard } from "@/components/shared/ActionCard";

export default function Dashboard() {
  const navigate = useNavigate();
  const { wagons, workflows } = useAppStore();
  const { user } = useAuth();

  const totalWagons = wagons.length;
  let sickWagons = 0;
  let inRepair = 0;
  let completedFit = 0;
  let todayArrival = 0;

  const todayStr = new Date().toISOString().split("T")[0];

  wagons.forEach(w => {
    if (w.updatedAt?.startsWith(todayStr)) todayArrival++;

    const wf = workflows.find(wf => wf.wagonId === w.id);
    
    let isFit = w.status === "Fit For Loading" || (w.status as string) === "Completed";
    if (wf && wf.stages.length > 0) {
      const finalStage = wf.stages[wf.stages.length - 1];
      if (finalStage.status === "Done") isFit = true;
    }
    
    if (isFit) {
      completedFit++;
      return;
    }

    let isSick = w.status === "Cut Off" || w.status === "Sick Line" || (w.status as string) === "Sick";
    let isRepair = w.status === "Under Repair";

    if (wf && wf.stages.length > 0) {
      const isFirstStage = wf.currentStage === wf.stages[0].stageName;
      const isFirstStageDone = isFirstStage && wf.stages[0].status === "Done";
      
      if (isFirstStage && !isFirstStageDone) {
        isSick = true;
        isRepair = false;
      } else {
        isSick = false;
        isRepair = true;
      }
    }

    if (isRepair) inRepair++;
    else if (isSick) sickWagons++;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader 
        title="Dashboard" 
        description={`Welcome back, ${user?.name || "User"}. Here is the current status.`}
        icon={LayoutDashboard}
      />

      <div className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Key Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div onClick={() => navigate("/register")} className="cursor-pointer">
            <StatCard
              title="Total Wagons"
              value={totalWagons}
              icon={Train}
              className="hover:border-primary/50 transition-colors"
            />
          </div>
          <div onClick={() => navigate("/register?filterStatus=sick")} className="cursor-pointer">
            <StatCard
              title="Sick Wagons"
              value={sickWagons}
              icon={AlertTriangle}
              className="hover:border-destructive/50 transition-colors"
            />
          </div>
          <div onClick={() => navigate("/register?filterStatus=in-repair")} className="cursor-pointer">
            <StatCard
              title="In Repair"
              value={inRepair}
              icon={Wrench}
              className="hover:border-warning/50 transition-colors"
            />
          </div>
          <div onClick={() => navigate("/register?filterStatus=fit")} className="cursor-pointer">
            <StatCard
              title="Completed / Fit"
              value={completedFit}
              icon={CheckCircle2}
              className="hover:border-success/50 transition-colors"
            />
          </div>
          <div onClick={() => navigate("/register?filterStatus=today")} className="cursor-pointer">
            <StatCard
              title="Today Arrival"
              value={todayArrival}
              icon={ClipboardCheck}
              className="hover:border-info/50 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ActionCard
            title="Open Wagon Register"
            description="View and manage all wagon entries in the system."
            icon={LayoutDashboard}
            onClick={() => navigate("/register")}
            className="col-span-1 md:col-span-2 lg:col-span-1 bg-primary/5 border-primary/20"
          >
            <Button className="w-full shadow-sm" onClick={(e) => { e.stopPropagation(); navigate("/register"); }}>
              Go to Register
            </Button>
          </ActionCard>

          <ActionCard
            title="Add New Wagon"
            description="Create a new wagon entry into the register."
            icon={PlusCircle}
            onClick={() => navigate("/register")}
          />

          <ActionCard
            title="Create Sick Memo"
            description="Issue a new sick memo for a defective wagon."
            icon={FileText}
            onClick={() => navigate("/memos/new?type=sick")}
          />

          <ActionCard
            title="View Sick Line"
            description="Manage active workflows and SSE confirmations."
            icon={Wrench}
            onClick={() => navigate("/sickline")}
          />
        </div>
      </div>
    </div>
  );
}
