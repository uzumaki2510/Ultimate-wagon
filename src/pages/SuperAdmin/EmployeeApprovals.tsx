import { useState, useEffect } from "react";
import { adminApi } from "@/api/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, CheckCircle2, XCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function EmployeeApprovals() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPendingUsers();
      if (res.success) setPending(res.data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load pending approvals", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await adminApi.approveUser(id);
      else await adminApi.rejectUser(id);

      toast({ 
        title: action === 'approve' ? "Approved" : "Rejected", 
        description: `User has been ${action}d.` 
      });
      fetchPending();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Action failed", variant: "destructive" });
    }
  };

  const filtered = pending.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.empCode?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employee Approvals</h1>
        <p className="text-sm text-muted-foreground">Review and action new employee registration requests.</p>
      </div>

      <Card className="border-amber-400/30">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" /> Pending Accounts
              </CardTitle>
              <CardDescription>All accounts awaiting admin approval.</CardDescription>
            </div>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search requests..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center animate-pulse">Loading requests...</div>
          ) : pending.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500/50" />
              <p>No pending requests — all caught up!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requested</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Emp Code</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(user => (
                  <TableRow key={user._id} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/20">
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.name}
                      <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.empCode}</TableCell>
                    <TableCell className="text-sm">{user.department}</TableCell>
                    <TableCell className="text-sm">{user.designation}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 gap-1" onClick={() => handleAction(user._id, 'approve')}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 h-8 gap-1" onClick={() => handleAction(user._id, 'reject')}>
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && pending.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No matches found for "{search}"</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
