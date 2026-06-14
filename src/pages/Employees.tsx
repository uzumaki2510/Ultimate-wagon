import { useState } from "react";
import { useAuth, User } from "@/contexts/AuthContext";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Trash2, Plus, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Employees() {
  const { listEmployees, deleteEmployee } = useAuth();
  const { toast } = useToast();
  const [systemUsers, setSystemUsers] = useState<User[]>(listEmployees());
  const [toRemove, setToRemove] = useState<User | null>(null);

  const { employees: rosterEmployees, addEmployee, updateEmployee, removeEmployee } = useAppStore();
  const [form, setForm] = useState({ name: "", designation: "", role: "", empCode: "" });

  const confirmDelete = () => {
    if (!toRemove) return;
    deleteEmployee(toRemove.email);
    setSystemUsers(listEmployees());
    toast({ title: "Employee removed", description: `${toRemove.name} has been removed.` });
    setToRemove(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff & Employees</h1>
        <p className="text-sm text-muted-foreground">Manage registered accounts and signature rosters.</p>
      </div>

      <Tabs defaultValue="roster" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="roster" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Approval Roster ({rosterEmployees.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Registered Accounts ({systemUsers.length})
          </TabsTrigger>
        </TabsList>

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
            <CardHeader>
              <CardTitle>Approval Staff Roster</CardTitle>
            </CardHeader>
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

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered App Accounts</CardTitle>
              <CardDescription>Manage user accounts registered with the app. Deleted users will be instantly logged out and blocked.</CardDescription>
            </CardHeader>
            <CardContent>
              {systemUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No employee accounts registered yet.</p>
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
                        <TableCell className="font-mono text-sm">{emp.employeeId}</TableCell>
                        <TableCell>{emp.email}</TableCell>
                        <TableCell>{emp.designation}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setToRemove(emp)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
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
