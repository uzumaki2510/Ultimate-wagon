import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Database, Plus, Search, Edit2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { id: "WAGON_TYPE", label: "Wagon Types" },
  { id: "ZONE", label: "Railway Zones" },
  { id: "WORKSHOP", label: "Workshops" },
  { id: "DEPARTMENT", label: "Departments" },
  { id: "DEFECT", label: "Defect Categories" },
  { id: "INSPECTION_TYPE", label: "Inspection Types" },
  { id: "WORKSHOP_LINE", label: "Workshop Lines" },
  { id: "ROLE", label: "User Roles" }
];

export default function MasterData() {
  const { masterData, addMasterData, updateMasterData } = useAppStore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState(CATEGORIES[0].id);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ value: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredData = masterData.filter(d => 
    d.category === activeTab && 
    (d.value.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingId(item._id);
      setFormData({ value: item.value, description: item.description || "" });
    } else {
      setEditingId(null);
      setFormData({ value: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.value.trim()) {
      toast({ title: "Validation Error", description: "Value is required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateMasterData(editingId, { value: formData.value, description: formData.description });
        toast({ title: "Success", description: "Record updated successfully." });
      } else {
        await addMasterData({ category: activeTab, value: formData.value, description: formData.description });
        toast({ title: "Success", description: "Record created successfully." });
      }
      setIsModalOpen(false);
    } catch (err) {
      toast({ title: "Error", description: "Operation failed.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateMasterData(id, { isActive: !currentStatus });
      toast({ title: "Success", description: `Record ${!currentStatus ? 'activated' : 'deactivated'}.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to toggle status.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <PageHeader 
        title="Master Data Management" 
        description="Centralized configuration for system-wide dropdowns and categories."
        icon={Database}
      />

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <CardTitle>System Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 mb-6 h-auto p-1 bg-muted/50">
              {CATEGORIES.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id} className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search records..." 
                  className="pl-9" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={() => handleOpenModal()} className="shrink-0 w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" /> Add Record
              </Button>
            </div>

            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-muted/30 text-sm">
                <div className="col-span-4 md:col-span-3">Value</div>
                <div className="col-span-4 md:col-span-5 hidden md:block">Description</div>
                <div className="col-span-4 md:col-span-2 text-center">Status</div>
                <div className="col-span-4 md:col-span-2 text-right">Actions</div>
              </div>
              
              <div className="divide-y max-h-[500px] overflow-auto">
                {filteredData.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No records found for this category.
                  </div>
                ) : (
                  filteredData.map(record => (
                    <div key={record._id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-muted/10 transition-colors">
                      <div className="col-span-4 md:col-span-3 font-medium">{record.value}</div>
                      <div className="col-span-4 md:col-span-5 hidden md:block text-muted-foreground truncate">{record.description || "—"}</div>
                      <div className="col-span-4 md:col-span-2 text-center">
                        <Badge variant="outline" className={record.isActive ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                          {record.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="col-span-4 md:col-span-2 flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(record)}>
                          <Edit2 className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(record._id, record.isActive)}>
                          {record.isActive ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Record" : "Add New Record"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={CATEGORIES.find(c => c.id === activeTab)?.label} disabled />
            </div>
            <div className="space-y-2">
              <Label>Value <span className="text-destructive">*</span></Label>
              <Input 
                placeholder="e.g. BTPGLN" 
                value={formData.value} 
                onChange={e => setFormData({ ...formData, value: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                placeholder="Optional description..." 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
