import { useState, useEffect } from "react";
import { adminApi } from "@/api/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, Clock, UserX, CheckCircle, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardMetrics {
  totalEmployees: number;
  totalAdmins: number;
  pendingApprovals: number;
  activeUsers: number;
  rejectedUsers: number;
  recentRegistrations: any[];
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await adminApi.getDashboardMetrics();
        if (res.success) {
          setMetrics(res.data);
        }
      } catch (error: any) {
        const errMsg = error.response ? `${error.response.status} ${error.response.statusText}: ${error.response.data?.message || ''}` : error.message;
        toast({ title: "Failed to load dashboard metrics", description: errMsg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [toast]);

  if (loading || !metrics) {
    return <div className="p-8 text-center animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">High-level overview of system users and registrations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEmployees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAdmins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingApprovals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Registrations</CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rejectedUsers}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> Recent Registrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.recentRegistrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent registrations.</p>
            ) : (
              metrics.recentRegistrations.map((user) => (
                <div key={user._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{user.role}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : user.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
