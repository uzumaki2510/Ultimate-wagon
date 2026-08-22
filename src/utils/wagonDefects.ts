import { Wagon, RepairTask } from "@/types";
import { DEFECT_LIBRARY } from "@/lib/wagonData";

export interface ActiveDefect {
  defectName: string;
  isCritical: boolean;
}

export function getWagonDefects(wagon: Wagon): ActiveDefect[] {
  const defects: ActiveDefect[] = [];
  const added = new Set<string>();

  const isCriticalDefect = (name: string): boolean => {
    for (const group of DEFECT_LIBRARY) {
      const def = group.defects.find(d => d.name === name);
      if (def) {
        return def.severity === "Safety Critical" || def.severity === "Urgent";
      }
    }
    return false;
  };

  const addDefect = (name: string, isCritical?: boolean) => {
    if (!name) return;
    const normalized = name.trim().toLowerCase();
    if (normalized === 'fit wagon' || normalized === 'fit') return;
    
    if (!added.has(name)) {
      added.add(name);
      defects.push({ 
        defectName: name, 
        isCritical: isCritical !== undefined ? isCritical : isCriticalDefect(name) 
      });
    }
  };

  // 1. repairTasks
  if (wagon.repairTasks && wagon.repairTasks.length > 0) {
    wagon.repairTasks.forEach((task: RepairTask) => {
      const isCompleted = task.status === "repaired" || (task as any).status === "completed";
      if (!isCompleted && task.subRepair) {
        const isCritical = task.severity === "Urgent" || task.severity === "Safety Critical";
        addDefect(task.subRepair, isCritical);
      }
    });
  }

  // 2. repairTypes
  if (wagon.repairTypes && wagon.repairTypes.length > 0) {
    wagon.repairTypes.forEach(rt => {
      addDefect(rt);
    });
  }

  // 3. legacy defect
  if (wagon.defect && defects.length === 0) {
    addDefect(wagon.defect);
  }

  return defects;
}
