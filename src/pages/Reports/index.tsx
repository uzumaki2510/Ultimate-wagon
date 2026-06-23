import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Settings, ShieldCheck, Activity, Users, Truck, PlusCircle, PenTool } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { reportApi } from "@/api/reports";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function ReportsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await reportApi.getDashboardStats();
        setStats(data.data);
      } catch (error) {
        toast({ title: "Error", description: "Failed to load dashboard stats", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [toast]);

  if (loading || !stats) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Comprehensive system statistics and export tools.</p>
        </div>
        <Button onClick={() => navigate("/reports/generate")} className="bg-primary">
          <FileText className="h-4 w-4 mr-2" /> Report Generator
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Total Wagons</p>
              <p className="text-3xl font-bold">{stats.totalWagons}</p>
            </div>
            <Truck className="h-8 w-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Pending Repairs</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingRepairs}</p>
            </div>
            <PenTool className="h-8 w-8 text-orange-600 opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Completed Repairs</p>
              <p className="text-3xl font-bold text-green-600">{stats.completedRepairs}</p>
            </div>
            <ShieldCheck className="h-8 w-8 text-green-600 opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Sick Line Wagons</p>
              <p className="text-3xl font-bold text-red-600">{stats.sickLineWagons}</p>
            </div>
            <Activity className="h-8 w-8 text-red-600 opacity-80" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
         <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground font-medium mb-1">ROH Wagons</p><p className="text-2xl font-bold">{stats.rohWagons}</p></div>
            <Settings className="h-6 w-6 text-muted-foreground opacity-50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground font-medium mb-1">Inspections Due</p><p className="text-2xl font-bold">{stats.inspectionsDue}</p></div>
            <FileText className="h-6 w-6 text-muted-foreground opacity-50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground font-medium mb-1">Certs Expiring</p><p className="text-2xl font-bold">{stats.expiringCerts}</p></div>
            <ShieldCheck className="h-6 w-6 text-muted-foreground opacity-50" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Repairs Completed</CardTitle>
            <CardDescription>Repairs finished over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
             {stats.monthlyActivity && stats.monthlyActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="repairs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             ) : (
               <div className="flex items-center justify-center h-full text-muted-foreground">
                 No data available yet
               </div>
             )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
