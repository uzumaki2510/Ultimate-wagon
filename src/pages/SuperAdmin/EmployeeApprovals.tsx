import { useState, useEffect } from "react";
import { adminApi } from "@/api/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, CheckCircle2, XCircle, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { LoadingState } from "@/components/shared/LoadingState";

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
    } catch (error: any) {
      const errMsg = error.response ? `${error.response.status} ${error.response.statusText}: ${error.response.data?.message || ''}` : error.message;
      toast({ title: "Failed to load pending approvals", description: errMsg, variant: "destructive" });
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
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader 
        title="Employee Approvals"
        description="Review and action new employee registration requests."
        icon={Users}
      />

      <Card className="border-warning/30 shadow-sm overflow-hidden">
        <CardHeader className="bg-warning/5 border-b border-warning/10 pb-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-warning-foreground">
                <ShieldAlert className="h-5 w-5" /> Pending Accounts
              </CardTitle>
              <CardDescription className="text-warning-foreground/80 mt-1">All accounts awaiting admin approval.</CardDescription>
            </div>
            <SearchBar 
              value={search}
              onChange={setSearch}
              placeholder="Search requests..."
              className="w-full sm:w-[250px]"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <LoadingState text="Loading requests..." />
          ) : pending.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
              <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <p className="font-medium text-foreground">No pending requests — all caught up!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Requested</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Emp Code</TableHead>
                    <TableHead className="font-semibold">Department</TableHead>
                    <TableHead className="font-semibold">Designation</TableHead>
                    <TableHead className="text-right font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(user => (
                    <TableRow key={user._id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium tracking-tight">
                        {user.name}
                        <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{user.empCode || "Not Assigned"}</TableCell>
                      <TableCell className="text-sm">{user.department}</TableCell>
                      <TableCell className="text-sm">{user.designation}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground h-8 gap-1 shadow-sm" onClick={() => handleAction(user._id, 'approve')}>
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
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No matches found for "{search}"</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
