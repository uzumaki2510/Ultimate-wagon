import { useState, useEffect } from "react";
import { adminApi } from "@/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ShieldCheck, Clock, UserX, CheckCircle, Activity, LayoutDashboard, UserPlus, Shield, Database, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingState } from "@/components/shared/LoadingState";
import { ActionCard } from "@/components/shared/ActionCard";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, logsRes] = await Promise.all([
          adminApi.getDashboardMetrics(),
          adminApi.getAuditLogs({ limit: 8 })
        ]);
        
        if (metricsRes.success) setMetrics(metricsRes.data);
        if (logsRes.success) setAuditLogs(logsRes.data || []);
      } catch (error: any) {
        const errMsg = error.response ? `${error.response.status} ${error.response.statusText}: ${error.response.data?.message || ''}` : error.message;
        toast({ title: "Failed to load dashboard data", description: errMsg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  if (loading || !metrics) {
    return <LoadingState text="Loading operational dashboard..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-[1400px] mx-auto">
      <PageHeader 
        title="Super Admin Control Center"
        description="Operational overview of system users and activities."
        icon={LayoutDashboard}
      />

      <div className="space-y-3">
        <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">System Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            title="Total Employees"
            value={metrics.totalEmployees}
            icon={Users}
            onClick={() => navigate('/super-admin/users?role=employee')}
          />
          <StatCard
            title="Total Admins"
            value={metrics.totalAdmins}
            icon={ShieldCheck}
            onClick={() => navigate('/super-admin/users?role=admin')}
          />
          <StatCard
            title="Active Accounts"
            value={metrics.activeUsers}
            icon={CheckCircle}
            onClick={() => navigate('/super-admin/users?status=approved')}
          />
          <StatCard
            title="Pending Approvals"
            value={metrics.pendingApprovals}
            icon={Clock}
            className={metrics.pendingApprovals > 0 ? "border-warning/50 bg-warning/5" : ""}
            onClick={() => navigate('/super-admin/approvals?status=pending')}
          />
          <StatCard
            title="Rejected"
            value={metrics.rejectedUsers}
            icon={UserX}
            className="border-destructive/30 bg-destructive/5"
            onClick={() => navigate('/super-admin/users?status=rejected')}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Operational Quick Actions</h2>
        <Card className="p-1.5 shadow-none border-border/50 bg-secondary/10">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" className="h-8 gap-2 bg-background hover:bg-muted font-medium border border-border" disabled>
              <UserPlus className="h-3.5 w-3.5" /> Add Employee
            </Button>
            <Button variant="secondary" size="sm" className="h-8 gap-2 bg-background hover:bg-muted font-medium border border-border" disabled>
              <Shield className="h-3.5 w-3.5" /> Add Admin
            </Button>
            <Button variant="secondary" size="sm" className="h-8 gap-2 bg-background hover:bg-muted font-medium border border-border" onClick={() => navigate('/super-admin/approvals')}>
              <CheckCircle className="h-3.5 w-3.5" /> Employee Approvals
            </Button>
            <Button variant="secondary" size="sm" className="h-8 gap-2 bg-background hover:bg-muted font-medium border border-border" onClick={() => navigate('/super-admin/users')}>
              <Users className="h-3.5 w-3.5" /> User Directory
            </Button>
            <Button variant="secondary" size="sm" className="h-8 gap-2 bg-background hover:bg-muted font-medium border border-border" onClick={() => navigate('/super-admin/master-data')}>
              <Database className="h-3.5 w-3.5" /> Master Data
            </Button>
            <Button variant="secondary" size="sm" className="h-8 gap-2 bg-background hover:bg-muted font-medium border border-border" onClick={() => navigate('/super-admin/logs')}>
              <List className="h-3.5 w-3.5" /> Audit Logs
            </Button>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Recent Activity</h2>
        <Card className="shadow-none border-border/50">
          <CardContent className="p-0">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No recent activity found.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {auditLogs.map((log) => (
                  <div 
                    key={log._id || Math.random().toString()} 
                    onClick={() => navigate(`/super-admin/logs?action=${log.action}`)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-xs font-mono text-muted-foreground shrink-0 w-[120px]">
                        {new Date(log.timestamp || log.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm font-medium tracking-tight">
                        {log.actor?.name || log.user?.name || "System"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 sm:mt-0">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-secondary text-secondary-foreground rounded-sm uppercase tracking-wider">
                        {log.action?.replace(/_/g, ' ') || "Action"}
                      </span>
                      <div className="text-xs text-muted-foreground max-w-[200px] truncate hidden md:block">
                        {log.details || log.description || ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
