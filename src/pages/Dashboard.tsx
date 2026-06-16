import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { FileText, Wrench, Train, ClipboardCheck, AlertTriangle, PlusCircle, LayoutDashboard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

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
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user?.name || "User"}. Here is the current status.
          </p>
        </div>
      </div>

      {/* Main Counts (Moved to Top) */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Train className="h-5 w-5 text-muted-foreground" />
          Main Counts
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card 
            className="bg-slate-50/50 border-slate-200 shadow-sm transition-all hover:shadow-md cursor-pointer hover:border-slate-300"
            onClick={() => navigate("/register")}
          >
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-slate-600 font-medium text-xs">Total Wagons</CardDescription>
              <CardTitle className="text-3xl text-slate-800">{totalWagons}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Train className="h-4 w-4 text-slate-500 opacity-50" />
            </CardContent>
          </Card>

          <Card 
            className="bg-red-50/50 border-red-100 shadow-sm transition-all hover:shadow-md cursor-pointer hover:border-red-300"
            onClick={() => navigate("/register?filterStatus=sick")}
          >
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-red-600 font-medium text-xs">Sick Wagons</CardDescription>
              <CardTitle className="text-3xl text-red-700">{sickWagons}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <AlertTriangle className="h-4 w-4 text-red-500 opacity-50" />
            </CardContent>
          </Card>
          
          <Card 
            className="bg-orange-50/50 border-orange-100 shadow-sm transition-all hover:shadow-md cursor-pointer hover:border-orange-300"
            onClick={() => navigate("/register?filterStatus=in-repair")}
          >
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-orange-600 font-medium text-xs">In Repair</CardDescription>
              <CardTitle className="text-3xl text-orange-700">{inRepair}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Wrench className="h-4 w-4 text-orange-500 opacity-50" />
            </CardContent>
          </Card>

          <Card 
            className="bg-green-50/50 border-green-100 shadow-sm transition-all hover:shadow-md cursor-pointer hover:border-green-300"
            onClick={() => navigate("/register?filterStatus=fit")}
          >
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-green-600 font-medium text-xs">Completed / Fit</CardDescription>
              <CardTitle className="text-3xl text-green-700">{completedFit}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CheckCircle2 className="h-4 w-4 text-green-500 opacity-50" />
            </CardContent>
          </Card>

          <Card 
            className="bg-blue-50/50 border-blue-100 shadow-sm transition-all hover:shadow-md cursor-pointer hover:border-blue-300"
            onClick={() => navigate("/register?filterStatus=today")}
          >
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-blue-600 font-medium text-xs">Today Arrival</CardDescription>
              <CardTitle className="text-3xl text-blue-700">{todayArrival}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ClipboardCheck className="h-4 w-4 text-blue-500 opacity-50" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t">
        <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Quick Actions</h2>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Big Open Wagon Register Button */}
          <Button 
            variant="default" 
            className="flex-1 h-32 flex flex-col items-center justify-center gap-3 text-xl font-bold shadow-lg bg-primary hover:bg-primary/90 transition-all hover:scale-[1.01]"
            onClick={() => navigate("/register")}
          >
            <LayoutDashboard className="h-10 w-10" />
            OPEN WAGON REGISTER
          </Button>

          {/* Small Secondary Buttons */}
          <div className="flex flex-col gap-3 md:w-64">
            <Button 
              variant="outline" 
              className="flex-1 justify-start gap-3 shadow-sm border-primary/20 hover:bg-primary/5"
              onClick={() => navigate("/register")} // You may want to navigate specifically to the add dialog, but leaving as is for now
            >
              <PlusCircle className="h-5 w-5 text-primary" />
              Add Wagon
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1 justify-start gap-3 shadow-sm"
              onClick={() => navigate("/memos/new?type=sick")}
            >
              <FileText className="h-5 w-5" />
              Create Sick Memo
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 justify-start gap-3 shadow-sm border-orange-500/20 hover:bg-orange-500/5 text-orange-600"
              onClick={() => navigate("/sickline")}
            >
              <Wrench className="h-5 w-5" />
              View Sick Line
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
