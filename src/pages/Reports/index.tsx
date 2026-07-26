import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, TrendingUp, AlertTriangle, Activity, BarChart2, CheckCircle2, Maximize2, Minimize2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { PageHeader } from "@/components/shared/PageHeader";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7'];

export default function ReportsDashboard() {
  const navigate = useNavigate();
  const { wagons, workflows, audit } = useAppStore();
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);

  const analytics = useMemo(() => {
    let totalSteamTime = 0, steamCount = 0;
    let totalRepairTime = 0, repairCount = 0;
    let defectsMap: Record<string, number> = {};
    const monthlyThroughput: Record<string, number> = {};
    
    let totalDelays = 0, totalCompletedStages = 0;
    let completedToday = 0;
    const processingTimes: number[] = [];
    
    let fastestWagon: { no: string, time: number } = { no: "None", time: Infinity };
    let slowestWagon: { no: string, time: number } = { no: "None", time: 0 };
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Shift Productivity Analysis (Morning 6-14, Evening 14-22, Night 22-6)
    const shiftData = { Morning: 0, Evening: 0, Night: 0 };
    
    // Dept comparison
    const deptStats = { Steam: 0, Degassing: 0, Inspection: 0, Repair: 0 };

    workflows.forEach(wf => {
      let wfTotalTime = 0;
      let wfDoneStages = 0;

      wf.stages.forEach(st => {
        if (st.status === "Done" && st.durationHours !== undefined) {
          totalCompletedStages++;
          wfTotalTime += st.durationHours;
          wfDoneStages++;
          processingTimes.push(st.durationHours);

          if (st.stageName.includes("Steam")) { totalSteamTime += st.durationHours; steamCount++; deptStats.Steam++; }
          if (st.stageName.includes("Degass")) deptStats.Degassing++;
          if (st.stageName.includes("Inspection")) deptStats.Inspection++;
          if (st.stageName.includes("Repair")) { totalRepairTime += st.durationHours; repairCount++; deptStats.Repair++; }
          
          if (st.targetDurationHours && st.durationHours > st.targetDurationHours) {
            totalDelays++;
          }

          if (st.completedAt) {
            const date = new Date(st.completedAt);
            const monthKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            monthlyThroughput[monthKey] = (monthlyThroughput[monthKey] || 0) + 1;
            
            const hour = date.getHours();
            if (hour >= 6 && hour < 14) shiftData.Morning++;
            else if (hour >= 14 && hour < 22) shiftData.Evening++;
            else shiftData.Night++;
          }
        }
      });

      if (wfDoneStages > 0) {
        if (wfTotalTime < fastestWagon.time) fastestWagon = { no: wf.wagonNo, time: wfTotalTime };
        if (wfTotalTime > slowestWagon.time) slowestWagon = { no: wf.wagonNo, time: wfTotalTime };
      }
    });

    const released = wagons.filter(w => ["RELEASED", "FIT_READY"].includes(w.status));
    released.forEach(w => {
      const wf = workflows.find(wf => wf.wagonId === w.id);
      const finalStage = wf?.stages.find(st => st.stageName.includes("Final") && st.status === "Done");
      if (finalStage && finalStage.completedAt?.startsWith(todayStr)) {
        completedToday++;
      }
    });

    wagons.forEach(w => {
      if (w.repairTasks) {
        w.repairTasks.forEach(task => defectsMap[task.subRepair] = (defectsMap[task.subRepair] || 0) + 1);
      }
      if (w.defect) {
        w.defect.split(',').forEach(d => defectsMap[d.trim()] = (defectsMap[d.trim()] || 0) + 1);
      }
    });

    const topDefects = Object.entries(defectsMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([name, count]) => ({ name: name.length > 15 ? name.substring(0, 15) + '...' : name, count }));

    const monthlyData = Object.entries(monthlyThroughput).map(([month, count]) => ({ month, count })).slice(-6);
    
    const shiftChartData = Object.entries(shiftData).map(([shift, count]) => ({ shift, count }));
    const deptChartData = Object.entries(deptStats).map(([dept, count]) => ({ dept, count }));

    processingTimes.sort((a, b) => a - b);
    const medianTime = processingTimes.length > 0 ? (processingTimes.length % 2 === 0 ? (processingTimes[processingTimes.length / 2 - 1] + processingTimes[processingTimes.length / 2]) / 2 : processingTimes[Math.floor(processingTimes.length / 2)]) : 0;
    const avgTime = processingTimes.length > 0 ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length : 0;

    const totalWorkshopWagons = wagons.filter(w => !["ARRIVED", "RELEASED", "FIT_READY"].includes(w.status)).length;
    const activeWagons = workflows.filter(w => w.stages.some(s => s.status === "In Progress")).length;
    const utilisationPct = totalWorkshopWagons > 0 ? Math.round((activeWagons / totalWorkshopWagons) * 100) : 0;

    const topDept = Object.entries(deptStats).sort((a, b) => b[1] - a[1])[0] || ["None", 0];

    return {
      avgSteamDuration: steamCount > 0 ? (totalSteamTime / steamCount).toFixed(1) : "0",
      avgRepairDuration: repairCount > 0 ? (totalRepairTime / repairCount).toFixed(1) : "0",
      delayPercentage: totalCompletedStages > 0 ? Math.round((totalDelays / totalCompletedStages) * 100) : 0,
      utilisationPct,
      totalWorkshopWagons,
      topDefects,
      monthlyData: monthlyData.length > 0 ? monthlyData : [{ month: 'Current', count: 0 }],
      completedToday,
      pending: totalWorkshopWagons,
      avgProcessingTime: avgTime.toFixed(1),
      medianProcessingTime: medianTime.toFixed(1),
      fastestWagon: fastestWagon.time === Infinity ? "-" : `${fastestWagon.no} (${fastestWagon.time.toFixed(1)}h)`,
      slowestWagon: slowestWagon.time === 0 ? "-" : `${slowestWagon.no} (${slowestWagon.time.toFixed(1)}h)`,
      mostCommonDefect: topDefects[0]?.name || "None",
      topDept: topDept[0],
      shiftChartData,
      deptChartData
    };
  }, [wagons, workflows]);

  const toggleFullscreen = (id: string) => {
    setFullscreenChart(fullscreenChart === id ? null : id);
  };

  const ChartContainer = ({ id, title, children }: { id: string, title: string, children: React.ReactNode }) => {
    const isFullscreen = fullscreenChart === id;
    
    return (
      <Card className={isFullscreen ? "fixed inset-4 z-50 flex flex-col" : "h-full flex flex-col"}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => toggleFullscreen(id)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent className="flex-1 min-h-[300px]">
          {children}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <PageHeader 
          title="Executive Dashboard" 
          description="High-level advanced analytics and operational management metrics."
          icon={BarChart2}
        />
        <Button onClick={() => navigate("/reports/generate")} className="bg-primary shrink-0">
          <FileText className="h-4 w-4 mr-2" /> Advanced Report Generator
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground font-medium mb-1">Completed Today</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-emerald-600">{analytics.completedToday}</p>
              <span className="text-xs text-muted-foreground">wagons</span>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground font-medium mb-1">Pending in Workshop</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-blue-600">{analytics.pending}</p>
              <span className="text-xs text-muted-foreground">wagons</span>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground font-medium mb-1">Delay Percentage</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-red-600">{analytics.delayPercentage}%</p>
              <span className="text-xs text-muted-foreground">tasks</span>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground font-medium mb-1">Workshop Utilisation</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-primary">{analytics.utilisationPct}%</p>
              <span className="text-xs text-muted-foreground">capacity</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
         <Card className="col-span-2 lg:col-span-1 p-4 bg-muted/30">
           <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Process Time</p>
           <p className="font-semibold">{analytics.avgProcessingTime} hrs</p>
         </Card>
         <Card className="col-span-2 lg:col-span-1 p-4 bg-muted/30">
           <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Median Time</p>
           <p className="font-semibold">{analytics.medianProcessingTime} hrs</p>
         </Card>
         <Card className="col-span-2 lg:col-span-1 p-4 bg-muted/30">
           <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fastest Wagon</p>
           <p className="font-semibold text-emerald-600 truncate">{analytics.fastestWagon}</p>
         </Card>
         <Card className="col-span-2 lg:col-span-1 p-4 bg-muted/30">
           <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Slowest Wagon</p>
           <p className="font-semibold text-red-600 truncate">{analytics.slowestWagon}</p>
         </Card>
         <Card className="col-span-2 lg:col-span-1 p-4 bg-muted/30">
           <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Top Dept</p>
           <p className="font-semibold">{analytics.topDept}</p>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer id="monthly" title="Monthly Throughput Trends">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r: 4, fill: 'hsl(var(--primary))'}} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer id="dept" title="Department Comparison (Tasks)">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analytics.deptChartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="dept" tick={{fill: '#6b7280', fontSize: 12}} />
              <PolarRadiusAxis />
              <Radar name="Tasks" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
              <RechartsTooltip />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer id="defects" title="Top Defects Analysis">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={analytics.topDefects} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count">
                {analytics.topDefects.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
            </PieChart>
          </ResponsiveContainer>
          {analytics.topDefects.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center pb-4">
              {analytics.topDefects.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {d.name} ({d.count})
                </div>
              ))}
            </div>
          )}
        </ChartContainer>

        <ChartContainer id="shifts" title="Shift Productivity">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.shiftChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
              <XAxis type="number" allowDecimals={false} tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} />
              <YAxis dataKey="shift" type="category" tick={{fill: '#6b7280', fontSize: 12}} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={40}>
                {analytics.shiftChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.shift === 'Night' ? '#6366f1' : entry.shift === 'Morning' ? '#f59e0b' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      
      {fullscreenChart && (
         <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setFullscreenChart(null)} />
      )}
    </div>
  );
}
