import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { ShieldAlert, ListFilter, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuditLogs from "./AuditLogs";
import DeletedRecords from "../Deleted";

export default function AuditSecurity() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read active tab from URL, fallback to logs
  const urlTab = searchParams.get("tab") || "logs";
  const isValidTab = ["logs", "deleted"].includes(urlTab);
  const activeTab = isValidTab ? urlTab : "logs";

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-[1600px] mx-auto">
      <PageHeader 
        title="Audit & Security"
        description="Immutable record of system activities and security operations."
        icon={ShieldAlert}
      />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4 h-auto p-1 bg-secondary/20 border">
          <TabsTrigger value="logs" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2 gap-2">
            <ListFilter className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="deleted" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2 gap-2">
            <Trash2 className="h-4 w-4" />
            Deleted Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-0 outline-none bg-card rounded-lg border shadow-sm p-4">
          <AuditLogs embedded={true} />
        </TabsContent>

        <TabsContent value="deleted" className="mt-0 outline-none bg-card rounded-lg border shadow-sm p-4">
          <DeletedRecords embedded={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
