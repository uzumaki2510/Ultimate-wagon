import { useState, useEffect } from "react";
import { adminApi } from "@/api/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { LoadingState } from "@/components/shared/LoadingState";

export default function UserDirectory() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (q) params.q = q;
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      
      const res = await adminApi.getAllUsers(params);
      if (res.success) setUsers(res.data);
    } catch (error: any) {
      const errMsg = error.response ? `${error.response.status} ${error.response.statusText}: ${error.response.data?.message || ''}` : error.message;
      toast({ title: "Failed to load users directory", description: errMsg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // debounce search
    const delay = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delay);
  }, [q, roleFilter, statusFilter]);

  const exportCSV = () => {
    if (users.length === 0) return;
    const headers = "Name,Email,Employee Code,Role,Status,Department,Designation,Joined Date\n";
    const csvContent = "data:text/csv;charset=utf-8," + headers + users.map(u => {
      return `"${u.name}","${u.email}","${u.empCode || ''}","${u.role}","${u.status}","${u.department || ''}","${u.designation || ''}","${new Date(u.createdAt).toISOString().split('T')[0]}"`;
    }).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wagon_users_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader 
        title="User Directory"
        description="Complete master list of all accounts in the system."
        icon={Users}
        actions={
          <Button variant="outline" onClick={exportCSV} className="gap-2 shrink-0 shadow-sm bg-background hover:bg-muted">
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export CSV</span>
          </Button>
        }
      />

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-secondary/20 pb-4 border-b border-border/50">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Directory ({users.length})</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <SearchBar 
                value={q}
                onChange={setQ}
                placeholder="Search name, email, code..."
                className="w-full sm:w-[250px]"
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] shadow-sm bg-background">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] shadow-sm bg-background">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <LoadingState text="Loading directory..." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold pl-6">User Details</TableHead>
                    <TableHead className="font-semibold">Emp Code</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Department</TableHead>
                    <TableHead className="font-semibold">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No users found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map(u => (
                      <TableRow key={u._id} className={`${u.isActive === false ? 'opacity-50 bg-muted/20' : ''} hover:bg-muted/50 transition-colors`}>
                        <TableCell className="pl-6">
                          <div className="font-semibold tracking-tight">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{u.empCode || '-'}</TableCell>
                        <TableCell>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                            u.role === 'super_admin' ? 'bg-primary/20 text-primary' :
                            u.role === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full shadow-sm ${
                              !u.isActive ? 'bg-gray-400' :
                              u.status === 'approved' ? 'bg-success' :
                              u.status === 'pending' ? 'bg-warning' : 'bg-destructive'
                            }`} />
                            <span className="text-sm font-medium capitalize">{!u.isActive ? 'Inactive' : u.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{u.department || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
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
