import { WagonRepair } from "@/lib/wagonData";
import { RepairTask } from "@/types";

interface WagonDiagramProps {
  wagon: WagonRepair;
  selectedLocation?: string;
  onSelectLocation?: (location: string) => void;
  defects?: RepairTask[];
}

export function WagonDiagram({ wagon, selectedLocation, onSelectLocation, defects = [] }: WagonDiagramProps) {
  // A simple visual illustration using HTML/CSS
  const locations = [
    { id: "roof", label: "ROOF", className: "col-span-3 h-8 rounded-t-md" },
    { id: "left", label: "LEFT SIDE", className: "row-span-2 col-span-1 h-24" },
    { id: "center", label: "CENTER", className: "row-span-2 col-span-1 h-24" },
    { id: "right", label: "RIGHT SIDE", className: "row-span-2 col-span-1 h-24" },
    { id: "underframe", label: "UNDERFRAME", className: "col-span-3 h-6 rounded-b-md" },
    { id: "bogie-a", label: "BOGIE A", className: "col-span-1 h-12 rounded-full mt-2 w-16 mx-auto" },
    { id: "bogie-b", label: "BOGIE B", className: "col-span-1 col-start-3 h-12 rounded-full mt-2 w-16 mx-auto" }
  ];

  // Map defects to their locations to determine severity coloring
  const locationSeverities: Record<string, "critical" | "warning" | "none"> = {};
  
  defects.forEach(d => {
    // Very rudimentary location mapping based on defect text for demo purposes
    let loc = "center";
    const text = (d.category + " " + d.subRepair).toLowerCase();
    
    if (text.includes("bogie") || text.includes("wheel") || text.includes("brake")) loc = text.includes("a") ? "bogie-a" : "bogie-b";
    else if (text.includes("roof")) loc = "roof";
    else if (text.includes("door") || text.includes("side")) loc = text.includes("left") ? "left" : "right";
    else if (text.includes("under") || text.includes("frame")) loc = "underframe";

    const isCritical = d.severity === "Safety Critical" || d.severity === "Urgent";
    
    if (isCritical) {
      locationSeverities[loc] = "critical";
    } else if (locationSeverities[loc] !== "critical") {
      locationSeverities[loc] = "warning";
    }
  });

  const getBaseColor = (id: string, severity?: string) => {
    if (severity === "critical") return "bg-destructive/80 text-white border-destructive";
    if (severity === "warning") return "bg-warning/80 text-black border-warning";
    
    // Default colors
    if (id === "roof") return "bg-slate-200 dark:bg-slate-800 border-transparent text-slate-700 dark:text-slate-300";
    if (id === "underframe") return "bg-slate-800 dark:bg-slate-900 border-transparent text-white";
    if (id.includes("bogie")) return "bg-slate-500 border-transparent text-white";
    if (id === "center") return "bg-slate-400 dark:bg-slate-600 border-transparent text-slate-800 dark:text-slate-200";
    return "bg-slate-300 dark:bg-slate-700 border-transparent text-slate-700 dark:text-slate-300";
  };

  return (
    <div className="w-full max-w-sm mx-auto my-6 select-none">
      <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
        {locations.map(loc => (
          <div
            key={loc.id}
            onClick={() => onSelectLocation?.(loc.id)}
            className={`
              flex items-center justify-center cursor-pointer transition-all border-2
              ${loc.className}
              ${getBaseColor(loc.id, locationSeverities[loc.id])}
              ${selectedLocation === loc.id ? 'shadow-[0_0_15px_rgba(var(--primary),0.6)] ring-2 ring-primary ring-offset-2 z-10 scale-105' : 'hover:brightness-110'}
            `}
          >
            {loc.label}
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-muted-foreground mt-4 italic">
        Select a section to filter defects by location
      </div>
    </div>
  );
}
