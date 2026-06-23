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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff & Employees</h1>
        <p className="text-sm text-muted-foreground">Manage registrations, approve accounts, and maintain the roster.</p>
      </div>

      <Tabs defaultValue={pending.length > 0 ? "pending" : "users"} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Approval
            {pending.length > 0 && (
              <Badge className="ml-1 bg-amber-500 text-white text-[10px] h-4 px-1.5">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Registered Accounts ({systemUsers.length})
          </TabsTrigger>
          <TabsTrigger value="roster" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Approval Roster ({rosterEmployees.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Pending Approval Tab ── */}
        <TabsContent value="pending" className="space-y-4">
          <Card className="border-amber-400/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                Pending Account Requests
              </CardTitle>
              <CardDescription>
                Review new employee sign-up requests. Approved accounts can log in immediately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pending.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500/50" />
                  <p>No pending requests — all caught up!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map((emp) => (
                      <TableRow key={emp.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/20">
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell className="font-mono text-sm">{emp.empCode || "Not Assigned"}</TableCell>
                        <TableCell className="text-sm">{emp.email}</TableCell>
                        <TableCell className="text-sm">{emp.department}</TableCell>
                        <TableCell className="text-sm">{emp.designation}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(emp.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleApprove(emp)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10"
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Registered Accounts Tab ── */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered App Accounts</CardTitle>
              <CardDescription>Manage approved employee accounts. Deleted users will be blocked immediately.</CardDescription>
            </CardHeader>
            <CardContent>
              {systemUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No approved employee accounts yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemUsers.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell className="font-mono text-sm">{emp.empCode || "Not Assigned"}</TableCell>
                        <TableCell>{emp.email}</TableCell>
                        <TableCell>{emp.designation}</TableCell>
                        <TableCell className="text-right">
                          {!(emp.role === 'super_admin' || (!isSuperAdmin && emp.role === 'admin')) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10"
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Approval Roster Tab ── */}
        <TabsContent value="roster" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Staff Member</CardTitle>
              <CardDescription>Add employees to the roster for assigning memo approvals and signatures.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-5">
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
