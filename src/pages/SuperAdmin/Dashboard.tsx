import { useState, useEffect } from "react";
import { adminApi } from "@/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ShieldCheck, Clock, UserX, CheckCircle, Activity, LayoutDashboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingState } from "@/components/shared/LoadingState";
import { ActionCard } from "@/components/shared/ActionCard";

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
    return <LoadingState text="Loading super admin dashboard..." />;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <PageHeader 
        title="Super Admin Dashboard"
        description="High-level overview of system users and registrations."
        icon={LayoutDashboard}
      />

      <div className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">System Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Employees"
            value={metrics.totalEmployees}
            icon={Users}
          />
          <StatCard
            title="Total Admins"
            value={metrics.totalAdmins}
            icon={ShieldCheck}
          />
          <StatCard
            title="Active Accounts"
            value={metrics.activeUsers}
            icon={CheckCircle}
          />
          <StatCard
            title="Pending Approvals"
            value={metrics.pendingApprovals}
            icon={Clock}
            className={metrics.pendingApprovals > 0 ? "border-amber-200 bg-amber-50/30" : ""}
          />
          <StatCard
            title="Rejected"
            value={metrics.rejectedUsers}
            icon={UserX}
            className="border-destructive/10"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Recent Activity</h2>
        <ActionCard
          title="Recent Registrations"
          icon={Activity}
          className="bg-card"
        >
          <div className="space-y-4 mt-2">
            {metrics.recentRegistrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent registrations.</p>
            ) : (
              metrics.recentRegistrations.map((user) => (
                <div key={user._id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-sm sm:text-base tracking-tight text-foreground">{user.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{user.role}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${user.status === 'approved' ? 'bg-success/10 text-success' : user.status === 'pending' ? 'bg-warning/10 text-warning-foreground border border-warning/20' : 'bg-destructive/10 text-destructive'}`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ActionCard>
      </div>
    </div>
  );
}
