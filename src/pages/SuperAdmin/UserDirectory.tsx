import { useState, useEffect, useMemo } from "react";
import { adminApi } from "@/api/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Users, Shield, Building, Power, PowerOff, Archive, Trash2, Edit, CheckSquare, XSquare, Settings, Lock, FileText, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { LoadingState } from "@/components/shared/LoadingState";
import { useSearchParams } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UserDirectoryProps {
  embedded?: boolean;
}

export default function UserDirectory({ embedded }: UserDirectoryProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "all");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Drawer
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

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
      toast({ title: "Failed to load users", description: errMsg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchUsers();
      
      // Update URL params
      const newParams = new URLSearchParams(searchParams);
      if (q) newParams.set("q", q);
      if (roleFilter !== "all") newParams.set("role", roleFilter);
      if (statusFilter !== "all") newParams.set("status", statusFilter);
      setSearchParams(newParams, { replace: true });
    }, 300);
    return () => clearTimeout(delay);
  }, [q, roleFilter, statusFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map(u => u._id)));
    }
  };

  const toggleSelectUser = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const exportCSV = () => {
    if (users.length === 0) return;
    const itemsToExport = selectedIds.size > 0 ? users.filter(u => selectedIds.has(u._id)) : users;
    const headers = "Name,Email,Employee Code,Role,Status,Department,Designation,Joined Date\n";
    const csvContent = "data:text/csv;charset=utf-8," + headers + itemsToExport.map(u => {
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

  const DisabledApiButton = ({ icon: Icon, label, className = "" }: { icon: any, label: string, className?: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>
          <Button variant="outline" size="sm" className={`gap-1.5 h-8 text-xs font-medium cursor-not-allowed opacity-50 ${className}`} disabled>
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent className="bg-destructive text-destructive-foreground font-semibold">
        Backend API Required
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className={`space-y-4 animate-fade-in pb-24 max-w-[1600px] mx-auto ${embedded ? 'pt-2' : ''}`}>
      {!embedded && (
        <PageHeader 
          title="User Management Console"
          description="Comprehensive master list and operational controls."
          icon={Users}
          actions={
            <Button variant="outline" onClick={exportCSV} className="gap-2 shrink-0 shadow-sm bg-background hover:bg-muted font-medium h-9">
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export {selectedIds.size > 0 ? `(${selectedIds.size})` : 'All'}</span>
            </Button>
          }
        />
      )}

      <Card className="border-border shadow-sm overflow-hidden rounded-md">
        <CardHeader className="bg-secondary/10 pb-3 pt-3 border-b border-border/50 px-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold tracking-wide">
                Directory ({users.length})
              </CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <SearchBar 
                value={q}
                onChange={setQ}
                placeholder="Search name, code, email..."
                className="w-full sm:w-[220px] h-8 text-sm"
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[130px] h-8 shadow-sm bg-background text-xs font-medium">
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
                <SelectTrigger className="w-[130px] h-8 shadow-sm bg-background text-xs font-medium">
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
            <LoadingState text="Loading user directory..." />
          ) : (
            <div className="overflow-x-auto relative">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent h-10">
                    <TableHead className="w-[40px] pl-4">
                      <Checkbox 
                        checked={users.length > 0 && selectedIds.size === users.length}
                        onCheckedChange={toggleSelectAll}
                        className="translate-y-[2px]"
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">User Details</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">Code</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">Role</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">Department</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                        No users found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map(u => (
                      <TableRow 
                        key={u._id} 
                        className={`h-12 hover:bg-muted/30 cursor-pointer transition-colors ${selectedIds.has(u._id) ? 'bg-primary/5' : ''} ${u.isActive === false ? 'opacity-60' : ''}`}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
                          setSelectedUser(u);
                        }}
                      >
                        <TableCell className="pl-4 w-[40px]">
                          <Checkbox 
                            checked={selectedIds.has(u._id)}
                            onCheckedChange={() => toggleSelectUser(u._id)}
                            className="translate-y-[2px]"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold tracking-tight text-sm">{u.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{u.empCode || '-'}</TableCell>
                        <TableCell>
                          <span className={`text-[10px] px-1.5 py-0.5 border rounded-sm uppercase tracking-wider font-bold ${
                            u.role === 'super_admin' ? 'border-primary/50 text-primary bg-primary/5' :
                            u.role === 'admin' ? 'border-blue-500/50 text-blue-700 dark:text-blue-300 bg-blue-500/5' :
                            'border-muted-foreground/30 text-muted-foreground bg-muted/30'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{u.department || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              !u.isActive ? 'bg-muted-foreground' :
                              u.status === 'approved' ? 'bg-success' :
                              u.status === 'pending' ? 'bg-warning' : 'bg-destructive'
                            }`} />
                            <span className="text-xs font-semibold uppercase tracking-wider">{!u.isActive ? 'Inactive' : u.status}</span>
                          </div>
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

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in px-4 sm:px-0">
          <div className="bg-popover border border-border shadow-xl rounded-t-xl sm:rounded-full p-2 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-4xl mx-auto backdrop-blur-md bg-opacity-95">
            <div className="px-3 py-1 flex items-center gap-2 border-r border-border/50">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {selectedIds.size}
              </span>
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Selected</span>
            </div>
            
            <DisabledApiButton icon={Settings} label="Change Role" />
            <DisabledApiButton icon={Building} label="Assign Dept" />
            <DisabledApiButton icon={Power} label="Activate" className="text-success border-success/30" />
            <DisabledApiButton icon={PowerOff} label="Suspend" className="text-warning border-warning/30" />
            <DisabledApiButton icon={Trash2} label="Delete" className="text-destructive border-destructive/30" />
            
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="ml-auto h-8 text-xs gap-1 hover:bg-muted">
              <XSquare className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        </div>
      )}

      {/* User Details Drawer */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="w-full sm:max-w-md border-l border-border p-0 flex flex-col h-full bg-background">
          <SheetHeader className="p-4 sm:p-6 border-b border-border bg-secondary/5 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SheetTitle className="text-lg font-bold tracking-tight">{selectedUser?.name}</SheetTitle>
                <SheetDescription className="font-mono text-xs mt-1">{selectedUser?.email}</SheetDescription>
              </div>
              <span className={`text-[10px] px-2 py-1 border rounded-sm uppercase tracking-wider font-bold shrink-0 ${
                selectedUser?.role === 'super_admin' ? 'border-primary/50 text-primary bg-primary/5' :
                selectedUser?.role === 'admin' ? 'border-blue-500/50 text-blue-700 bg-blue-500/5' :
                'border-muted-foreground/30 text-muted-foreground bg-muted/30'
              }`}>
                {selectedUser?.role?.replace('_', ' ')}
              </span>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" /> Employee Information
                </h3>
                <DisabledApiButton icon={Edit} label="Edit" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md border border-border/50">
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Employee Code</div>
                  <div className="text-sm font-mono mt-0.5 font-medium">{selectedUser?.empCode || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Status</div>
                  <div className="text-sm font-medium mt-0.5 capitalize flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${!selectedUser?.isActive ? 'bg-muted-foreground' : selectedUser?.status === 'approved' ? 'bg-success' : 'bg-destructive'}`} />
                    {!selectedUser?.isActive ? 'Inactive' : selectedUser?.status}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Department</div>
                  <div className="text-sm font-medium mt-0.5">{selectedUser?.department || 'Unassigned'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Designation</div>
                  <div className="text-sm font-medium mt-0.5">{selectedUser?.designation || 'Unassigned'}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" /> Access & Permissions
              </h3>
              <div className="bg-muted/30 p-4 rounded-md border border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Workshop Access</div>
                  <div className="text-xs text-muted-foreground">{selectedUser?.workshopId || 'Global'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Created Date</div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {selectedUser && new Date(selectedUser.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" /> Administration
              </h3>
              <div className="flex flex-col gap-2">
                <DisabledApiButton icon={PowerOff} label="Suspend User Account" className="w-full justify-start border-border bg-background" />
                <DisabledApiButton icon={Archive} label="Archive User Records" className="w-full justify-start border-border bg-background" />
                <DisabledApiButton icon={Trash2} label="Permanently Delete User" className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/10 bg-background" />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
