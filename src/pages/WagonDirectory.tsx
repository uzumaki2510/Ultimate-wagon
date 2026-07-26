import { PageHeader } from "@/components/shared/PageHeader";
import { Folder } from "lucide-react";

export default function WagonDirectory() {
  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
      <PageHeader 
        title="Wagon Directory" 
        description="Complete directory of all registered wagons."
        icon={Folder}
      />
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        This module is under construction.
      </div>
    </div>
  );
}
