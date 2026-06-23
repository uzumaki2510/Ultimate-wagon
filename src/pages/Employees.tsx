import { useState, useEffect } from "react";
import { useAuth, User } from "@/contexts/AuthContext";
import { useAppStore } from "@/store/useAppStore";
import { adminApi } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Trash2, Plus, UserCheck, Clock, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";

export default function Employees() {
  const { listEmployees, listPendingEmployees, approveEmployee, deleteEmployee, isSuperAdmin, user } = useAuth();
  const { toast } = useToast();

  const [systemUsers, setSystemUsers] = useState<User[]>([]);
  const [pending, setPending] = useState<User[]>([]);
  const [toRemove, setToRemove] = useState<User | null>(null);

  const { employees: rosterEmployees, addEmployee, updateEmployee, removeEmployee } = useAppStore();
  const [form, setForm] = useState({ name: "", designation: "", role: "", empCode: "" });
  

  const refresh = async () => {
    const users = await listEmployees();
    const pend = await listPendingEmployees();
    setSystemUsers(users);
    setPending(pend);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleApprove = async (emp: User) => {
    try {
      await approveEmployee(emp.id, "approved");
      await refresh();
      toast({ title: "Account Approved", description: `${emp.name} can now log in.` });
    } catch (e) {
      toast({ title: "Error", description: "Failed to approve account", variant: "destructive" });
    }
  };

  const handleReject = async (emp: User) => {
    try {
      await approveEmployee(emp.id, "rejected");
      await refresh();
      toast({
        title: "Account Rejected",
        description: `${emp.name}'s registration was rejected.`,
        variant: "destructive",
      });
    } catch (e) {
      toast({ title: "Error", description: "Failed to reject account", variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!toRemove) return;
    try {
      await deleteEmployee(toRemove.id);
      await refresh();
      toast({ title: "Employee removed", description: `${toRemove.name} has been removed.` });
      setToRemove(null);
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete account", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader 
        title="Staff & Employees"
        description="Manage registrations, approve accounts, and maintain the roster."
        icon={Users}
      />

      <Tabs defaultValue={pending.length > 0 ? "pending" : "users"} className="w-full">
        <TabsList className="mb-4 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="pending" className="gap-2 rounded-md">
            <Clock className="h-4 w-4" />
            Pending Approval
            {pending.length > 0 && (
              <Badge className="ml-1 bg-amber-500 text-white text-[10px] h-4 px-1.5 shadow-sm">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 rounded-md">
            <Users className="h-4 w-4" />
            Registered Accounts ({systemUsers.length})
          </TabsTrigger>
          <TabsTrigger value="roster" className="gap-2 rounded-md">
            <UserCheck className="h-4 w-4" />
            Approval Roster ({rosterEmployees.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Pending Approval Tab ── */}
        <TabsContent value="pending" className="space-y-4">
          <Card className="border-warning/30 shadow-sm overflow-hidden">
            <CardHeader className="bg-warning/5 border-b border-warning/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-warning-foreground">
                <ShieldAlert className="h-5 w-5" />
                Pending Account Requests
              </CardTitle>
              <CardDescription className="text-warning-foreground/80">
                Review new employee sign-up requests. Approved accounts can log in immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {pending.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
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
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Employee ID</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Department</TableHead>
                        <TableHead className="font-semibold">Designation</TableHead>
                        <TableHead className="font-semibold">Requested</TableHead>
                        <TableHead className="text-right font-semibold">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {pending.map((emp) => (
                      <TableRow key={emp.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium tracking-tight">{emp.name}</TableCell>
                        <TableCell className="font-mono text-xs">{emp.empCode || "Not Assigned"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{emp.email}</TableCell>
                        <TableCell className="text-sm">{emp.department}</TableCell>
                        <TableCell className="text-sm">{emp.designation}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(emp.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground shadow-sm h-8"
                              onClick={() => handleApprove(emp)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 h-8"
                              onClick={() => handleReject(emp)}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
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
        </TabsContent>

        {/* ── Registered Accounts Tab ── */}
        <TabsContent value="users" className="space-y-4">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-secondary/20 pb-4 border-b border-border/50">
              <CardTitle>Registered App Accounts</CardTitle>
              <CardDescription>Manage approved employee accounts. Deleted users will be blocked immediately.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {systemUsers.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p>No approved employee accounts yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-secondary/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Employee ID</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Designation</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemUsers.map((emp) => (
                        <TableRow key={emp.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium tracking-tight">{emp.name}</TableCell>
                          <TableCell className="font-mono text-xs">{emp.empCode || "Not Assigned"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{emp.email}</TableCell>
                          <TableCell className="text-sm">{emp.designation}</TableCell>
                          <TableCell className="text-right">
                            {!(emp.role === 'super_admin' || (!isSuperAdmin && emp.role === 'admin')) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                onClick={() => setToRemove(emp)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Approval Roster Tab ── */}
        <TabsContent value="roster" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-secondary/20 pb-4 border-b border-border/50">
              <CardTitle>Add Staff Member</CardTitle>
              <CardDescription>Add employees to the roster for assigning memo approvals and signatures.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 grid gap-4 md:grid-cols-5">
              <Input placeholder="Emp Code" value={form.empCode} onChange={(e) => setForm({ ...form, empCode: e.target.value })} />
              <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              <Input placeholder="Role (e.g. SSE / JE)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              <Button onClick={() => { if (form.name) { addEmployee(form); setForm({ name: "", designation: "", role: "", empCode: "" }); } }}>
                <Plus className="h-4 w-4 mr-1" /> Add to Roster
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Approval Staff Roster</CardTitle></CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rosterEmployees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Input value={e.empCode ?? ""} onChange={(ev) => updateEmployee(e.id, { empCode: ev.target.value })} className="h-8 font-mono" />
                    </TableCell>
                    <TableCell>
                      <Input value={e.name} onChange={(ev) => updateEmployee(e.id, { name: ev.target.value })} className="h-8 font-medium" />
                    </TableCell>
                    <TableCell>
                      <Input value={e.designation} onChange={(ev) => updateEmployee(e.id, { designation: ev.target.value })} className="h-8" />
                    </TableCell>
                    <TableCell>
                      <Input value={e.role} onChange={(ev) => updateEmployee(e.id, { role: ev.target.value })} className="h-8" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => removeEmployee(e.id)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rosterEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No staff members added to the roster yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>


      </Tabs>

      <AlertDialog open={!!toRemove} onOpenChange={(o) => !o && setToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove employee account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {toRemove?.name}'s account. They will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remove Account</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
