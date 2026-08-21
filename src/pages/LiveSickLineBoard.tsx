import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SickLineBoard } from "@/components/sick-line-board/SickLineBoard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddWagonModal } from "@/components/AddWagonModal";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/hooks/use-toast";

export default function LiveSickLineBoard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { wagons, addWagon } = useAppStore();

  return (
    <div className="p-6 h-full flex flex-col space-y-4">
      <PageHeader 
        title="Live Sick-Line Board" 
        description="Kanban view of all wagons currently active on the sick line."
        actions={
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Wagon
          </Button>
        }
      />
      <SickLineBoard />
      
      <AddWagonModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen}
        existingWagons={wagons}
        onSubmit={(details, train, arrDate, arrTime, location, tasks, comments, priority, isDegassed, isSteamed) => {
          try {
            addWagon({
              wagonNo: details.wagonNumber,
              type: details.typeName,
              owner: details.railwayName,
              builtYear: details.yearOfManufacture,
              status: "ARRIVED",
              currentLocation: location || "Yard", // Use default Yard if none provided
              priority: priority,
              repairTasks: tasks,
              comments: comments,
              isDegassed,
              isSteamed
            });
            setIsAddModalOpen(false);
            toast({ title: "Success", description: "Wagon added successfully" });
          } catch (e) {
            toast({ title: "Error", description: "Failed to add wagon", variant: "destructive" });
          }
        }}
      />
    </div>
  );
}
