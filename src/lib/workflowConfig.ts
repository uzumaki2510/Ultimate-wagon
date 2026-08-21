import { getWorkflowDefinitionForWagon } from "./wagonWorkflows";

export interface StageConfig {
  name: string;
  targetDurationHours: number;
}

export interface WorkflowTemplate {
  stages: StageConfig[];
}

export const TANK_WAGON_TYPES = new Set([
  "BTPGLN", "BTPN", "BTPFLN", "BTPNHS", "BTALN", "BTCS", "BTPH", "BTAP", "BTFLN",
  "Petroleum Tank Wagons", "LPG Tank Wagons", "Bitumen Tank Wagons", "Molasses Tank Wagons"
]);

export function isTankWagonType(wagonType: string | undefined): boolean {
  if (!wagonType) return false;
  return TANK_WAGON_TYPES.has(wagonType.toUpperCase()) || wagonType.toUpperCase().includes("TANK") || wagonType.toUpperCase().includes("BTP");
}

export function getWorkflowTemplate(wagonType: string | undefined): WorkflowTemplate {
  const def = getWorkflowDefinitionForWagon(wagonType);
  if (!def) {
    return { stages: [] }; // No workflow configured
  }

  // Convert the graph definition into a linear array of stages for WorkflowItem initialization
  const stages: StageConfig[] = Object.values(def.stages).map(stage => ({
    name: stage.key,
    targetDurationHours: stage.targetDurationHours || 0
  }));

  return { stages };
}

import { 
  ClipboardCheck, Droplets, Wind, ShieldCheck, 
  Wrench, Activity, CheckCircle, ArrowRightCircle,
  Clock, AlertTriangle, LucideIcon 
} from "lucide-react";

export function getStageDisplayConfig(stageName: string): { icon: LucideIcon, color: string } {
  const s = stageName.toLowerCase();
  
  if (s.includes("initial") || s.includes("sick reason") || s.includes("sick_line")) 
    return { icon: ArrowRightCircle, color: "text-blue-500" };
  if (s.includes("steam")) 
    return { icon: Droplets, color: "text-cyan-500" };
  if (s.includes("degass") || s.includes("purging")) 
    return { icon: Wind, color: "text-indigo-500" };
  if (s.includes("gas free") || s.includes("hapa")) 
    return { icon: ShieldCheck, color: "text-green-600" };
  if (s.includes("mechanic") || s.includes("yard exam") || s.includes("placement")) 
    return { icon: ClipboardCheck, color: "text-amber-500" };
  if (s.includes("repair")) 
    return { icon: Wrench, color: "text-orange-500" };
  if (s.includes("test")) 
    return { icon: Activity, color: "text-purple-500" };
  if (s.includes("fit")) 
    return { icon: CheckCircle, color: "text-emerald-500" };
  if (s.includes("releas")) 
    return { icon: ArrowRightCircle, color: "text-green-500" };
    
  return { icon: Clock, color: "text-gray-500" };
}
