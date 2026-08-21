import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { LayoutDashboard, Users, ShieldAlert, Database, ShieldCheck, ListFilter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

// Import existing super admin components
import SuperAdminDashboard from "./Dashboard";
import UserDirectory from "./UserDirectory";
import EmployeeApprovals from "./EmployeeApprovals";
import MasterData from "./MasterData";
import AdminManagement from "./AdminManagement";

const TAB_OPTIONS = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "users", label: "Users", icon: Users },
  { value: "approvals", label: "Approvals", icon: ShieldAlert },
  { value: "master-data", label: "Master Data", icon: Database },
  { value: "roles-access", label: "Roles & Access", icon: ShieldCheck }
];

export default function AdminCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Read active tab from URL, fallback to overview
  const urlTab = searchParams.get("tab") || "overview";
  const isValidTab = TAB_OPTIONS.some(t => t.value === urlTab);
  const activeTab = isValidTab ? urlTab : "overview";

  // Redirect invalid tab to overview to fix URL
  useEffect(() => {
    if (!isValidTab && searchParams.has("tab")) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", "overview");
      setSearchParams(newParams, { replace: true });
    }
  }, [isValidTab, searchParams, setSearchParams]);

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    // Push state so back/forward works
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-[1600px] mx-auto">
      <PageHeader 
        title="Admin Center"
        description="Users, approvals, master data and access management"
        icon={LayoutDashboard}
      />

      <div className="bg-card rounded-lg border shadow-sm p-4">
        {isMobile ? (
          <div className="mb-4">
            <Select value={activeTab} onValueChange={handleTabChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select tab" />
              </SelectTrigger>
              <SelectContent>
                {TAB_OPTIONS.map((tab) => (
                  <SelectItem key={tab.value} value={tab.value}>
                    <div className="flex items-center gap-2">
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-4 h-auto p-1 bg-secondary/20 border">
              {TAB_OPTIONS.map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value}
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2 gap-2"
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="overview" className="mt-0 outline-none">
              <SuperAdminDashboard embedded={true} />
            </TabsContent>
            
            <TabsContent value="users" className="mt-0 outline-none">
              <UserDirectory embedded={true} />
            </TabsContent>
            
            <TabsContent value="approvals" className="mt-0 outline-none">
              <EmployeeApprovals embedded={true} />
            </TabsContent>
            
            <TabsContent value="master-data" className="mt-0 outline-none">
              <MasterData embedded={true} />
            </TabsContent>
            
            <TabsContent value="roles-access" className="mt-0 outline-none">
              <AdminManagement embedded={true} />
            </TabsContent>
          </Tabs>
        )}
        
        {/* Mobile rendering of content (since Tabs is hidden) */}
        {isMobile && (
          <div className="mt-4">
            {activeTab === "overview" && <SuperAdminDashboard embedded={true} />}
            {activeTab === "users" && <UserDirectory embedded={true} />}
            {activeTab === "approvals" && <EmployeeApprovals embedded={true} />}
            {activeTab === "master-data" && <MasterData embedded={true} />}
            {activeTab === "roles-access" && <AdminManagement embedded={true} />}
          </div>
        )}
      </div>
    </div>
  );
}
