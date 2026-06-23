import { useState, useEffect } from "react";
import { adminApi } from "@/api/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListFilter, Search, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 }; // simple limit for now
      if (actionFilter) params.action = actionFilter;
      const res = await adminApi.getAuditLogs(params);
      if (res.success) setLogs(res.data);
    } catch (error: any) {
      const errMsg = error.response ? `${error.response.status} ${error.response.statusText}: ${error.response.data?.message || ''}` : error.message;
      toast({ title: "Failed to load audit logs", description: errMsg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchLogs();
    }, 400);
    return () => clearTimeout(delay);
  }, [actionFilter]);

  const getBadgeColor = (action: string) => {
    if (action.includes('Approved')) return 'bg-success/20 text-success';
    if (action.includes('Rejected') || action.includes('Deactivated')) return 'bg-destructive/20 text-destructive';
    if (action.includes('Admin')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader 
        title="Audit Logs"
        description="Immutable record of all administrative actions taken in the system."
        icon={ShieldAlert}
      />

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-secondary/20 pb-4 border-b border-border/50">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListFilter className="h-5 w-5 text-primary" /> System Activity
              </CardTitle>
              <CardDescription>Review who did what, and when.</CardDescription>
            </div>
            <div className="w-full sm:w-72">
              <SearchBar 
                value={actionFilter}
                onChange={setActionFilter}
                placeholder="Filter by action (e.g. 'Approved')..."
                className="w-full"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <LoadingState text="Loading logs..." />
          ) : logs.length === 0 ? (
            <EmptyState 
              icon={ListFilter} 
              title="No Logs Found" 
              description={actionFilter ? `No logs found matching "${actionFilter}"` : "System audit log is empty."}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold pl-6">Timestamp</TableHead>
                    <TableHead className="font-semibold">Action</TableHead>
                    <TableHead className="font-semibold">Performed By</TableHead>
                    <TableHead className="font-semibold">Target User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log._id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap pl-6">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold shadow-sm ${getBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.performedBy ? (
                          <div>
                            <span className="font-medium text-sm text-foreground">{log.performedBy.name}</span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-2">({log.role})</span>
                          </div>
                        ) : <span className="text-muted-foreground italic text-sm">System</span>}
                      </TableCell>
                      <TableCell>
                        {log.targetUser ? (
                          <div className="text-sm font-medium">
                            {log.targetUser.name} <span className="text-muted-foreground font-normal text-xs ml-1">({log.targetUser.email})</span>
                          </div>
                        ) : <span className="text-muted-foreground italic text-sm">-</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
