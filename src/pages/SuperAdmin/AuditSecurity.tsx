import { PageHeader } from "@/components/shared/PageHeader";
import { ShieldAlert } from "lucide-react";
import AuditLogs from "./AuditLogs";

export default function AuditSecurity() {
  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-[1600px] mx-auto">
      <PageHeader 
        title="Audit & Security"
        description="Immutable record of system activities and security operations."
        icon={ShieldAlert}
      />
      
      <div className="bg-card rounded-lg border shadow-sm p-4">
        <AuditLogs embedded={true} />
      </div>
    </div>
  );
}
