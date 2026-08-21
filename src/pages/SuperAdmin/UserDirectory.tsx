import { useState, useEffect } from "react";
import { adminApi } from "@/api/admin";
import { authApi } from "@/api/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Users, MoreHorizontal, Pencil, CheckCircle2, XCircle, RotateCcw, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { LoadingState } from "@/components/shared/LoadingState";
import { useSearchParams } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

interface UserDirectoryProps {
  embedded?: boolean;
}

export default function UserDirectory({ embedded }: UserDirectoryProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  
  // Filters
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "all");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Edit State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  
  // Add User State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addFormData, setAddFormData] = useState<any>({ name: "", email: "", password: "", empCode: "", department: "" });

  const [isSaving, setIsSaving] = useState(false);

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
      const errMsg = error.response ? `${error.response.status}: ${error.response.data?.message || ''}` : error.message;
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
    const headers = "Name,Email,Employee Code,Role,Status,Department\n";
    const csvContent = "data:text/csv;charset=utf-8," + headers + itemsToExport.map(u => {
      return `"${u.name}","${u.email}","${u.empCode || ''}","${u.role}","${u.status}","${u.department || ''}"`;
    }).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wagon_users_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const decodeHTML = (html: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      empCode: user.empCode || "",
      department: user.department ? decodeHTML(user.department) : "",
      role: user.role,
      status: user.status
    });
  };

  const handleEditSave = async () => {
    setIsSaving(true);
    try {
      await adminApi.updateUser(editingUser._id, editFormData);
      toast({ title: "User updated successfully" });
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message;
      toast({ title: "Failed to update user", description: errMsg, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddUser = async () => {
    setIsSaving(true);
    try {
      await authApi.register(addFormData);
      toast({ title: "User created successfully", description: "The new user is pending approval." });
      setIsAddingUser(false);
      setAddFormData({ name: "", email: "", password: "", empCode: "", department: "" });
      fetchUsers();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message;
      toast({ title: "Failed to create user", description: errMsg, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAction = async (id: string, actionName: string, actionFn: (id: string) => Promise<any>) => {
    try {
      await actionFn(id);
      toast({ title: `User ${actionName} successfully` });
      fetchUsers();
    } catch (error: any) {
      toast({ title: `Failed to ${actionName} user`, description: error.response?.data?.message || error.message, variant: "destructive" });
    }
  };

  const handleResetPassword = async (id: string) => {
    const newPass = prompt("Enter new password for this user:");
    if (!newPass) return;
    try {
      await adminApi.resetAdminPassword(id, newPass);
      toast({ title: "Password reset successfully" });
    } catch (error: any) {
      toast({ title: "Failed to reset password", description: error.response?.data?.message || error.message, variant: "destructive" });
    }
  };

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
              <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
                Directory ({users.length})
                <Button size="sm" variant="default" className="h-7 px-2 ml-2" onClick={() => setIsAddingUser(true)}>
                  <UserPlus className="h-3.5 w-3.5 mr-1" /> Add User
                </Button>
              </CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {embedded && (
                <Button variant="outline" size="sm" className="h-8" onClick={exportCSV}>
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              )}
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
              <Table className="min-w-[900px]">
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
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
                        No users found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map(u => (
                      <TableRow 
                        key={u._id} 
                        className={`h-12 hover:bg-muted/30 transition-colors ${selectedIds.has(u._id) ? 'bg-primary/5' : ''} ${u.isActive === false ? 'opacity-60' : ''}`}
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
                        <TableCell className="text-sm">{u.department ? decodeHTML(u.department) : '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              !u.isActive ? 'bg-muted-foreground' :
                              u.status === 'approved' ? 'bg-green-500' :
                              u.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className="text-xs font-semibold uppercase tracking-wider">{!u.isActive ? 'Inactive' : u.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => handleEditClick(u)}>
                              <Pencil className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {u.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleAction(u._id, "approve", adminApi.approveUser)}>
                                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleAction(u._id, "reject", adminApi.rejectUser)}>
                                      <XCircle className="h-4 w-4 mr-2 text-red-500" /> Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {u.isActive ? (
                                  <DropdownMenuItem onClick={() => handleAction(u._id, "deactivate", adminApi.deactivateUser)}>
                                    <XCircle className="h-4 w-4 mr-2 text-red-500" /> Deactivate
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleAction(u._id, "reactivate", adminApi.reactivateUser)}>
                                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Reactivate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleResetPassword(u._id)}>
                                  <RotateCcw className="h-4 w-4 mr-2" /> Reset Password
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      <Sheet open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit User Profile</SheetTitle>
            <SheetDescription>
              Update account details for {editingUser?.name}.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={editFormData.name} 
                onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email" 
                value={editFormData.email} 
                onChange={e => setEditFormData({...editFormData, email: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Employee Code</Label>
              <Input 
                value={editFormData.empCode} 
                onChange={e => setEditFormData({...editFormData, empCode: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input 
                value={editFormData.department} 
                onChange={e => setEditFormData({...editFormData, department: e.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                disabled={currentUser?.id === editingUser?._id}
                value={editFormData.role} 
                onValueChange={v => setEditFormData({...editFormData, role: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              {currentUser?.id === editingUser?._id && (
                <p className="text-xs text-muted-foreground">You cannot change your own role.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Account Status</Label>
              <Select 
                disabled={currentUser?.id === editingUser?._id}
                value={editFormData.status} 
                onValueChange={v => setEditFormData({...editFormData, status: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isAddingUser} onOpenChange={setIsAddingUser}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add User</SheetTitle>
            <SheetDescription>
              Register a new employee. The account will require approval.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={addFormData.name} 
                onChange={e => setAddFormData({...addFormData, name: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email" 
                value={addFormData.email} 
                onChange={e => setAddFormData({...addFormData, email: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input 
                type="password" 
                value={addFormData.password} 
                onChange={e => setAddFormData({...addFormData, password: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Employee Code</Label>
              <Input 
                value={addFormData.empCode} 
                onChange={e => setAddFormData({...addFormData, empCode: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input 
                value={addFormData.department} 
                onChange={e => setAddFormData({...addFormData, department: e.target.value})} 
              />
            </div>
          </div>
          <SheetFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAddingUser(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={isSaving || !addFormData.name || !addFormData.email || !addFormData.password}>
              {isSaving ? "Creating..." : "Create User"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
