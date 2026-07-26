import { PageHeader } from "@/components/shared/PageHeader";
import { Trash2 } from "lucide-react";

export default function DeletedRegister() {
  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
      <PageHeader 
        title="Deleted Register" 
        description="View a register of all deleted records."
        icon={Trash2}
      />
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        This module is under construction.
      </div>
    </div>
  );
}
