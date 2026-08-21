import { useState, useEffect } from "react";
import { adminApi } from "@/api/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, CheckCircle2, XCircle, Users, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { LoadingState } from "@/components/shared/LoadingState";
import { useSearchParams, useNavigate } from "react-router-dom";

type TabStatus = "pending" | "approved" | "rejected";

interface EmployeeApprovalsProps {
  embedded?: boolean;
}

export default function EmployeeApprovals({ embedded }: EmployeeApprovalsProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = (searchParams.get("status") as TabStatus) || "pending";
  
  const [activeTab, setActiveTab] = useState<TabStatus>(initialTab);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchData = async (status: TabStatus) => {
    try {
      setLoading(true);
      let res;
      if (status === "pending") {
        res = await adminApi.getPendingUsers();
      } else {
        res = await adminApi.getAllUsers({ status });
      }
      
      if (res?.success) {
        setUsers(res.data);
      }
    } catch (error: any) {
      const errMsg = error.response ? `${error.response.status} ${error.response.statusText}: ${error.response.data?.message || ''}` : error.message;
      toast({ title: `Failed to load ${status} accounts`, description: errMsg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
    
    // Update URL params without reloading
    const newParams = new URLSearchParams(searchParams);
    newParams.set("status", activeTab);
    setSearchParams(newParams, { replace: true });
  }, [activeTab]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await adminApi.approveUser(id);
      else await adminApi.rejectUser(id);

      toast({ 
        title: action === 'approve' ? "Approved" : "Rejected", 
        description: `User has been ${action}d.` 
      });
      fetchData(activeTab);
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Action failed", variant: "destructive" });
    }
  };

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.empCode?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`space-y-6 animate-fade-in pb-12 max-w-[1400px] mx-auto ${embedded ? 'pt-4' : ''}`}>
      {!embedded && (
        <PageHeader 
          title="Employee Approvals"
          description="Review and manage pending account access requests."
          icon={ShieldAlert}
          actions={
            <Button variant="outline" onClick={() => navigate('/super-admin/users')} className="gap-2 shrink-0 shadow-sm">
              <Users className="h-4 w-4" /> <span className="hidden sm:inline">Go to Directory</span>
            </Button>
          }
        />
      )}

      <div className="flex gap-1 border-b border-border/50 pb-px">
        {(["pending", "approved", "rejected"] as TabStatus[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition-colors border-b-2 ${
              activeTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card className="border-border shadow-sm overflow-hidden rounded-md">
        <CardHeader className="bg-secondary/10 pb-3 pt-3 border-b border-border/50 px-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="flex items-center gap-2">
              {activeTab === 'pending' ? <ShieldAlert className="h-4 w-4 text-warning" /> : 
               activeTab === 'approved' ? <CheckCircle2 className="h-4 w-4 text-success" /> : 
               <XCircle className="h-4 w-4 text-destructive" />}
              <CardTitle className="text-sm font-semibold tracking-wide capitalize">
                {activeTab} Accounts ({filtered.length})
              </CardTitle>
            </div>
            <SearchBar 
              value={search}
              onChange={setSearch}
              placeholder="Search by name, email..."
              className="w-full sm:w-[220px] h-8 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <LoadingState text={`Loading ${activeTab} requests...`} />
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {users.length === 0 ? `No ${activeTab} requests found.` : `No matches found for "${search}"`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent h-10">
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground pl-4">Date</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">Employee</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">Department</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">Requested Role</TableHead>
                    <TableHead className="text-right font-semibold text-xs tracking-wider uppercase text-muted-foreground pr-4">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(user => (
                    <TableRow key={user._id} className="h-12 hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs text-muted-foreground font-mono pl-4 w-[100px]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold tracking-tight text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{user.email}</div>
                      </TableCell>
                      <TableCell className="text-sm">{user.department || "-"}</TableCell>
                      <TableCell>
                        <span className="text-[10px] px-1.5 py-0.5 border border-muted-foreground/30 text-muted-foreground bg-muted/30 rounded-sm uppercase tracking-wider font-bold">
                          {user.role?.replace('_', ' ') || "Employee"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap pr-4">
                        <div className="flex justify-end gap-2">
                          {activeTab === 'pending' && (
                            <>
                              <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground h-7 text-xs px-2 shadow-none gap-1" onClick={() => handleAction(user._id, 'approve')}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 h-7 text-xs px-2 shadow-none gap-1 bg-background" onClick={() => handleAction(user._id, 'reject')}>
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground" onClick={() => navigate(`/super-admin/users?q=${user.email}`)}>
                            <ExternalLink className="h-3.5 w-3.5" /> View Profile
                          </Button>
                        </div>
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
