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

export const WORKFLOW_CONFIGS: Record<string, WorkflowTemplate> = {
  TANK: {
    stages: [
      { name: "Initial Inspection", targetDurationHours: 1 },
      { name: "Steam Cleaning", targetDurationHours: 4 },
      { name: "Degassing", targetDurationHours: 4 },
      { name: "Gas Free Verification", targetDurationHours: 1 },
      { name: "Mechanical Inspection", targetDurationHours: 2 },
      { name: "Repair / Rectification", targetDurationHours: 8 },
      { name: "Testing", targetDurationHours: 2 },
      { name: "Fit Certificate", targetDurationHours: 0 },
      { name: "Released", targetDurationHours: 0 },
    ]
  },
  GENERAL: {
    stages: [
      { name: "Initial Inspection", targetDurationHours: 1 },
      { name: "Mechanical Inspection", targetDurationHours: 2 },
      { name: "Repair / Rectification", targetDurationHours: 8 },
      { name: "Testing", targetDurationHours: 2 },
      { name: "Fit Certificate", targetDurationHours: 0 },
      { name: "Released", targetDurationHours: 0 },
    ]
  },
  // Keep older ones for backward compatibility when fetching template, 
  // though we will use the new ones for newly added wagons.
  BTPGLN: {
    stages: [
      { name: "Sick Reason", targetDurationHours: 0 },
      { name: "RRT De-Gassing", targetDurationHours: 2 },
      { name: "HAPA Examination", targetDurationHours: 2 },
      { name: "Purging", targetDurationHours: 4 },
      { name: "Yard Examination", targetDurationHours: 1 },
      { name: "FIT_READY", targetDurationHours: 0 },
    ]
  },
  BTPN: {
    stages: [
      { name: "SICK_LINE", targetDurationHours: 0 },
      { name: "Steaming", targetDurationHours: 2 },
      { name: "Steam Point 24h", targetDurationHours: 24 },
      { name: "Placement Decision", targetDurationHours: 1 },
      { name: "Hydro Testing", targetDurationHours: 3 },
      { name: "Fit For Use", targetDurationHours: 0 },
    ]
  },
};

export function getWorkflowTemplate(wagonType: string | undefined): WorkflowTemplate {
  if (isTankWagonType(wagonType)) {
    return WORKFLOW_CONFIGS.TANK;
  }
  return WORKFLOW_CONFIGS.GENERAL;
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
