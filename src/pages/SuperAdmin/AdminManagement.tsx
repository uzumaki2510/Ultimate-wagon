import { useState, useEffect } from "react";
import { adminApi } from "@/api/admin";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldCheck, Plus, Power, KeyRound, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";

export default function AdminManagement() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", empCode: "", designation: "", department: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAllUsers({ role: 'admin' });
      if (res.success) setAdmins(res.data);
    } catch (error: any) {
      const errMsg = error.response ? `${error.response.status} ${error.response.statusText}: ${error.response.data?.message || ''}` : error.message;
      toast({ title: "Failed to load admins", description: errMsg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminApi.createAdmin(form);
      toast({ title: "Admin Created", description: `${form.name} is now an admin.` });
      setForm({ name: "", email: "", password: "", empCode: "", designation: "", department: "", phone: "" });
      setIsCreateOpen(false);
      fetchAdmins();
    } catch (error: any) {
      toast({ title: "Creation Failed", description: error.response?.data?.message || "Failed to create admin.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (admin: any) => {
    try {
      if (admin.isActive) {
        await adminApi.deactivateUser(admin._id);
        toast({ title: "Deactivated", description: `${admin.name} has been deactivated.` });
      } else {
        await adminApi.reactivateUser(admin._id);
        toast({ title: "Reactivated", description: `${admin.name} has been reactivated.` });
      }
      fetchAdmins();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Action failed", variant: "destructive" });
    }
  };

  const handleResetPassword = async (adminId: string) => {
    const newPass = prompt("Enter new temporary password:");
    if (!newPass) return;
    try {
      await adminApi.resetAdminPassword(adminId, newPass);
      toast({ title: "Password Reset", description: "Password updated successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to reset password", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader 
        title="Admin Management"
        description="Manage system administrators and elevated access accounts."
        icon={ShieldCheck}
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" /> Create Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Admin</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="grid gap-4 py-4">
                <Input required placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <Input required type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                <Input required type="password" placeholder="Temporary Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <Input required placeholder="Emp Code" value={form.empCode} onChange={e => setForm({...form, empCode: e.target.value})} />
                  <Input required placeholder="Designation" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} />
                </div>
                <Input required placeholder="Department" value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
                <Input placeholder="Phone (Optional)" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                <Button type="submit" disabled={isSubmitting} className="w-full mt-2 shadow-sm">
                  {isSubmitting ? "Creating..." : "Create Admin"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-secondary/20 pb-4 border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Active & Deactivated Admins
          </CardTitle>
          <CardDescription>All users with the 'admin' role.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <LoadingState text="Loading admins..." />
          ) : admins.length === 0 ? (
            <EmptyState 
              icon={ShieldCheck} 
              title="No Admins Found" 
              description="Click 'Create Admin' to add a new administrator."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold pl-6">Name</TableHead>
                    <TableHead className="font-semibold">Emp Code</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right pr-6 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map(admin => (
                    <TableRow key={admin._id} className={`${!admin.isActive ? "opacity-60 bg-muted/20" : ""} hover:bg-muted/50 transition-colors`}>
                      <TableCell className="font-medium pl-6">{admin.name}</TableCell>
                      <TableCell className="font-mono text-xs">{admin.empCode || '-'}</TableCell>
                      <TableCell className="text-sm">{admin.email}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full shadow-sm ${admin.isActive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                          {admin.isActive ? "Active" : "Deactivated"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-8 px-2.5 gap-1.5 shadow-sm text-muted-foreground hover:text-foreground" onClick={() => handleResetPassword(admin._id)}>
                            <KeyRound className="h-3.5 w-3.5" /> Reset Pass
                          </Button>
                          <Button 
                            size="sm" 
                            variant={admin.isActive ? "outline" : "default"} 
                            className={`h-8 px-2.5 gap-1.5 shadow-sm ${admin.isActive ? "text-destructive hover:bg-destructive/10 border-destructive/20" : ""}`}
                            onClick={() => handleToggleActive(admin)}
                          >
                            {admin.isActive ? <Ban className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                            {admin.isActive ? "Deactivate" : "Reactivate"}
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
