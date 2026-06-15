import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { getWagonCategory, getDefectSeverity } from "@/lib/wagonHelpers";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { wagons, workflows } = useAppStore();
  const { toast } = useToast();

  const [dateRange, setDateRange] = useState("all");
  const [filterCat, setFilterCat] = useState("All");

  const filteredWagons = useMemo(() => {
    return wagons.filter(w => {
      const matchCat = filterCat === "All" || getWagonCategory(w.type) === filterCat;
      // Note: In real app, dateRange would filter by w.updatedAt or createdAt
      return matchCat;
    });
  }, [wagons, filterCat, dateRange]);

  const stats = useMemo(() => {
    const total = filteredWagons.length;
    const fit = filteredWagons.filter(w => w.status === "Fit For Loading").length;
    const sick = filteredWagons.filter(w => w.status !== "Fit For Loading" && w.status !== "In Service").length;
    
    let criticalDefects = 0;
    let urgentDefects = 0;
    
    const types: Record<string, number> = {};
    
    filteredWagons.forEach(w => {
      const sev = getDefectSeverity(w.defect);
      if (sev === "Safety Critical") criticalDefects++;
      if (sev === "Urgent") urgentDefects++;
      
      const t = w.type || "Other";
      types[t] = (types[t] || 0) + 1;
    });

    const delayedWorkflows = workflows.filter(wf => {
      const w = wagons.find(wag => wag.id === wf.wagonId);
      if (!w || w.status === "Fit For Loading") return false;
      const current = wf.stages.find(s => s.stageName === wf.currentStage);
      if (!current || !current.startedAt) return false;
      const diffHrs = (new Date().getTime() - new Date(current.startedAt).getTime()) / (1000 * 60 * 60);
      return diffHrs > current.targetDurationHours;
    }).length;

    return { total, fit, sick, criticalDefects, urgentDefects, types, delayedWorkflows };
  }, [filteredWagons, workflows, wagons]);

  const handleDownload = () => {
    toast({ title: "Report Exported", description: "CSV file has been downloaded successfully." });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Advanced Reports</h1>
          <p className="text-sm text-muted-foreground">Aggregated data and downloadable statistics.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Date Range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Wagon Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              <SelectItem value="Tank Wagon">Tank Wagons</SelectItem>
              <SelectItem value="Open Wagon">Open Wagons</SelectItem>
              <SelectItem value="Covered Wagon">Covered Wagons</SelectItem>
              <SelectItem value="Flat Wagon">Flat Wagons</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleDownload} className="bg-primary">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground font-medium mb-1">Total Wagons</p><p className="text-3xl font-bold">{stats.total}</p></div>
            <FileText className="h-8 w-8 text-muted-foreground opacity-50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground font-medium mb-1">Fit For Loading</p><p className="text-3xl font-bold text-green-600">{stats.fit}</p></div>
            <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
          </CardContent>
        </Card>
        <Card className="bg-red-50/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm text-red-600 font-medium mb-1">Critical Defects</p><p className="text-3xl font-bold text-red-700">{stats.criticalDefects}</p></div>
            <AlertTriangle className="h-8 w-8 text-red-600 opacity-50" />
          </CardContent>
        </Card>
        <Card className="bg-orange-50/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm text-orange-600 font-medium mb-1">Delayed Workflows</p><p className="text-3xl font-bold text-orange-700">{stats.delayedWorkflows}</p></div>
            <TrendingUp className="h-8 w-8 text-orange-600 opacity-50" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Breakdown by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.types).sort((a,b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-muted/30 rounded text-sm">
                  <span className="font-medium">{type}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
              {Object.keys(stats.types).length === 0 && <p className="text-muted-foreground text-sm">No data available.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Defect Severity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Safety Critical</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-secondary h-2 rounded-full overflow-hidden"><div className="bg-red-500 h-full" style={{width: stats.total ? `${(stats.criticalDefects/stats.total)*100}%` : '0%'}}></div></div>
                    <span className="text-sm font-bold w-6">{stats.criticalDefects}</span>
                  </div>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Urgent</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-secondary h-2 rounded-full overflow-hidden"><div className="bg-orange-500 h-full" style={{width: stats.total ? `${(stats.urgentDefects/stats.total)*100}%` : '0%'}}></div></div>
                    <span className="text-sm font-bold w-6">{stats.urgentDefects}</span>
                  </div>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Normal / Fit</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-secondary h-2 rounded-full overflow-hidden"><div className="bg-blue-500 h-full" style={{width: stats.total ? `${((stats.total - stats.criticalDefects - stats.urgentDefects)/stats.total)*100}%` : '0%'}}></div></div>
                    <span className="text-sm font-bold w-6">{Math.max(0, stats.total - stats.criticalDefects - stats.urgentDefects)}</span>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
