import { useState, useEffect } from "react";
import { adminApi } from "@/api/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListFilter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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
    if (action.includes('Approved')) return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (action.includes('Rejected') || action.includes('Deactivated')) return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
    if (action.includes('Admin')) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
    return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Immutable record of all administrative actions taken in the system.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListFilter className="h-5 w-5 text-primary" /> System Activity
              </CardTitle>
              <CardDescription>Review who did what, and when.</CardDescription>
            </div>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by action (e.g. 'Approved')..."
                className="pl-8"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center animate-pulse">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No audit logs found.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Target User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log._id}>
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-md border font-semibold ${getBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.performedBy ? (
                          <div>
                            <span className="font-medium text-sm">{log.performedBy.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">({log.role})</span>
                          </div>
                        ) : <span className="text-muted-foreground italic">System</span>}
                      </TableCell>
                      <TableCell>
                        {log.targetUser ? (
                          <div className="text-sm">
                            {log.targetUser.name} <span className="text-muted-foreground text-xs">({log.targetUser.email})</span>
                          </div>
                        ) : <span className="text-muted-foreground italic">-</span>}
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
