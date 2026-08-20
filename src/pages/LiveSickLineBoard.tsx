import { PageHeader } from "@/components/shared/PageHeader";
import { SickLineBoard } from "@/components/sick-line-board/SickLineBoard";

export default function LiveSickLineBoard() {
  return (
    <div className="p-6 h-full flex flex-col space-y-4">
      <PageHeader 
        title="Live Sick-Line Board" 
        description="Kanban view of all wagons currently active on the sick line."
      />
      <SickLineBoard />
    </div>
  );
}
