import { WorkflowItem, Wagon } from "@/types";

export interface WorkflowStage {
  key: string;
  label: string;
  shortLabel?: string;
  sequence?: number;
  stageCategory?: string;
  description?: string;
  completionRequired: boolean;
  nextStages: string[];
  branchConditionId?: string;
  targetDurationHours?: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  stages: Record<string, WorkflowStage>;
  initialStage: string;
}

// ----------------------------------------------------------------------------
// WORKFLOW FAMILIES
// ----------------------------------------------------------------------------

export const GENERAL_FREIGHT_WORKFLOW: WorkflowDefinition = {
  id: "GENERAL_FREIGHT_WORKFLOW",
  name: "General Freight Workflow",
  initialStage: "YARD_EXAM",
  stages: {
    "YARD_EXAM": { key: "YARD_EXAM", label: "Yard / Initial Examination", completionRequired: true, nextStages: ["SICK_MARKING"], targetDurationHours: 1 },
    "SICK_MARKING": { key: "SICK_MARKING", label: "Sick Marking & Defect Classification", completionRequired: true, nextStages: ["REPAIR_ASSIGNMENT"], targetDurationHours: 0 },
    "REPAIR_ASSIGNMENT": { key: "REPAIR_ASSIGNMENT", label: "Repair Assignment / Placement", completionRequired: true, nextStages: ["RECTIFICATION"], targetDurationHours: 1 },
    "RECTIFICATION": { key: "RECTIFICATION", label: "Repair / Rectification", completionRequired: true, nextStages: ["POST_REPAIR_EXAM"], targetDurationHours: 8 },
    "POST_REPAIR_EXAM": { key: "POST_REPAIR_EXAM", label: "Post-Repair Examination", completionRequired: true, nextStages: ["AIR_BRAKE_TEST"], targetDurationHours: 1 },
    "AIR_BRAKE_TEST": { key: "AIR_BRAKE_TEST", label: "Air Brake / Single Wagon Test", completionRequired: true, nextStages: ["FIT_RELEASE"], targetDurationHours: 1 },
    "FIT_RELEASE": { key: "FIT_RELEASE", label: "Fit / Release", completionRequired: true, nextStages: [], targetDurationHours: 0 },
  }
};

export const COVERED_WAGON_WORKFLOW: WorkflowDefinition = {
  id: "COVERED_WAGON_WORKFLOW",
  name: "Covered Wagon Workflow",
  initialStage: "YARD_EXAM",
  stages: {
    "YARD_EXAM": { key: "YARD_EXAM", label: "Yard / Initial Examination", completionRequired: true, nextStages: ["SICK_MARKING"], targetDurationHours: 1 },
    "SICK_MARKING": { key: "SICK_MARKING", label: "Sick Marking & Defect Classification", completionRequired: true, nextStages: ["REPAIR_ASSIGNMENT"], targetDurationHours: 0 },
    "REPAIR_ASSIGNMENT": { key: "REPAIR_ASSIGNMENT", label: "Repair Assignment / Placement", completionRequired: true, nextStages: ["COVERED_RECTIFICATION"], targetDurationHours: 1 },
    "COVERED_RECTIFICATION": { key: "COVERED_RECTIFICATION", label: "Covered Wagon Rectification", description: "Doors, panels, roof, watertightness", completionRequired: true, nextStages: ["POST_REPAIR_EXAM"], targetDurationHours: 8 },
    "POST_REPAIR_EXAM": { key: "POST_REPAIR_EXAM", label: "Post-Repair Examination", completionRequired: true, nextStages: ["AIR_BRAKE_TEST"], targetDurationHours: 1 },
    "AIR_BRAKE_TEST": { key: "AIR_BRAKE_TEST", label: "Air Brake / Single Wagon Test", completionRequired: true, nextStages: ["FIT_RELEASE"], targetDurationHours: 1 },
    "FIT_RELEASE": { key: "FIT_RELEASE", label: "Fit / Release", completionRequired: true, nextStages: [], targetDurationHours: 0 },
  }
};

export const BRAKE_VAN_WORKFLOW: WorkflowDefinition = {
  id: "BRAKE_VAN_WORKFLOW",
  name: "Brake Van Workflow",
  initialStage: "YARD_SAFETY_EXAM",
  stages: {
    "YARD_SAFETY_EXAM": { key: "YARD_SAFETY_EXAM", label: "Yard / Safety Examination", completionRequired: true, nextStages: ["SICK_MARKING"], targetDurationHours: 1 },
    "SICK_MARKING": { key: "SICK_MARKING", label: "Sick Marking", completionRequired: true, nextStages: ["REPAIR_ASSIGNMENT"], targetDurationHours: 0 },
    "REPAIR_ASSIGNMENT": { key: "REPAIR_ASSIGNMENT", label: "Repair Assignment", completionRequired: true, nextStages: ["BRAKE_VAN_RECTIFICATION"], targetDurationHours: 1 },
    "BRAKE_VAN_RECTIFICATION": { key: "BRAKE_VAN_RECTIFICATION", label: "Brake Van Rectification", completionRequired: true, nextStages: ["SAFETY_CHECKS"], targetDurationHours: 8 },
    "SAFETY_CHECKS": { key: "SAFETY_CHECKS", label: "Brake / Running Gear Safety Checks", completionRequired: true, nextStages: ["AIR_BRAKE_TEST"], targetDurationHours: 2 },
    "AIR_BRAKE_TEST": { key: "AIR_BRAKE_TEST", label: "Air-Brake Functional Test", completionRequired: true, nextStages: ["FINAL_SAFETY_EXAM"], targetDurationHours: 1 },
    "FINAL_SAFETY_EXAM": { key: "FINAL_SAFETY_EXAM", label: "Final Safety Examination", completionRequired: true, nextStages: ["FIT_RELEASE"], targetDurationHours: 1 },
    "FIT_RELEASE": { key: "FIT_RELEASE", label: "Fit / Release", completionRequired: true, nextStages: [], targetDurationHours: 0 },
  }
};

export const BTPN_LOCAL_TANK_WORKFLOW: WorkflowDefinition = {
  id: "BTPN_LOCAL_TANK_WORKFLOW",
  name: "BTPN Local Tank Workflow",
  initialStage: "YARD_INSPECTION",
  stages: {
    "YARD_INSPECTION": { key: "YARD_INSPECTION", label: "Initial / Yard Inspection", completionRequired: true, nextStages: ["STEAMING"], targetDurationHours: 1 },
    "STEAMING": { key: "STEAMING", label: "Steaming", completionRequired: true, nextStages: ["STEAM_CLEANING"], targetDurationHours: 4 },
    "STEAM_CLEANING": { key: "STEAM_CLEANING", label: "Steam Cleaning", completionRequired: true, nextStages: ["STEAM_POINT_PLACEMENT"], targetDurationHours: 2 },
    "STEAM_POINT_PLACEMENT": { key: "STEAM_POINT_PLACEMENT", label: "Placement at Steaming Point", description: "Wagon kept open 24 hrs", completionRequired: true, nextStages: ["RECTIFICATION_DECISION"], targetDurationHours: 24 },
    "RECTIFICATION_DECISION": { key: "RECTIFICATION_DECISION", label: "Rectification Decision", completionRequired: true, branchConditionId: "upperGearOrSiding", nextStages: ["MAINTENANCE_REPAIR", "SIDING_PLACEMENT"], targetDurationHours: 1 },
    "MAINTENANCE_REPAIR": { key: "MAINTENANCE_REPAIR", label: "Repair / Rectification (Maintenance)", description: "Upper gear / ladder / barrel / valve etc.", completionRequired: true, nextStages: ["HYDRO_TESTING"], targetDurationHours: 8 },
    "SIDING_PLACEMENT": { key: "SIDING_PLACEMENT", label: "Conditional Placement", description: "Wagon placement at siding/sick line", completionRequired: true, nextStages: ["HYDRO_TESTING"], targetDurationHours: 2 },
    "HYDRO_TESTING": { key: "HYDRO_TESTING", label: "Hydro Testing", completionRequired: true, nextStages: ["FIT_FOR_USE"], targetDurationHours: 2 },
    "FIT_FOR_USE": { key: "FIT_FOR_USE", label: "Fit for Use", completionRequired: true, nextStages: [], targetDurationHours: 0 }
  }
};

export const BTPGLN_LOCAL_LPG_WORKFLOW: WorkflowDefinition = {
  id: "BTPGLN_LOCAL_LPG_WORKFLOW",
  name: "BTPGLN Local LPG Workflow",
  initialStage: "RRT_SIDING",
  stages: {
    "RRT_SIDING": { key: "RRT_SIDING", label: "Wagon moved to RRT siding", completionRequired: true, nextStages: ["DE_GASSING"], targetDurationHours: 1 },
    "DE_GASSING": { key: "DE_GASSING", label: "De-Gassing", completionRequired: true, nextStages: ["DG_COMPLETION"], targetDurationHours: 4 },
    "DG_COMPLETION": { key: "DG_COMPLETION", label: "DG Completion", completionRequired: true, nextStages: ["HAPA_DEPOT"], targetDurationHours: 0 },
    "HAPA_DEPOT": { key: "HAPA_DEPOT", label: "Wagon moved to HAPA depot for rectification", completionRequired: true, branchConditionId: "defectReason", nextStages: ["UNDER_GEAR_RECTIFICATION", "UPPER_GEAR_RECTIFICATION", "ROH_POH_RECTIFICATION"], targetDurationHours: 2 },
    "UNDER_GEAR_RECTIFICATION": { key: "UNDER_GEAR_RECTIFICATION", label: "Under Gear Rectification", description: "Rectification by HAPA C&W staff", completionRequired: true, nextStages: ["MARKED_FIT_HAPA"], targetDurationHours: 8 },
    "UPPER_GEAR_RECTIFICATION": { key: "UPPER_GEAR_RECTIFICATION", label: "Upper Gear Rectification", description: "Staff from KOTA/AJMER workshop rectify upper gear defect", completionRequired: true, nextStages: ["MARKED_FIT_HAPA"], targetDurationHours: 8 },
    "ROH_POH_RECTIFICATION": { key: "ROH_POH_RECTIFICATION", label: "ROH / POH Rectification", description: "Wagon moved to ADLW/KTTW", completionRequired: true, nextStages: ["MARKED_FIT_HAPA"], targetDurationHours: 24 },
    "MARKED_FIT_HAPA": { key: "MARKED_FIT_HAPA", label: "Marked fit at HAPA", completionRequired: true, nextStages: ["RRT_MOVE"], targetDurationHours: 0 },
    "RRT_MOVE": { key: "RRT_MOVE", label: "Wagon moved to RRT", completionRequired: true, nextStages: ["PURGING"], targetDurationHours: 2 },
    "PURGING": { key: "PURGING", label: "Purging process", completionRequired: true, branchConditionId: "purgingStatus", nextStages: ["HAPA_DEPOT", "HAPA_YARD_EXAM"], targetDurationHours: 4 },
    "HAPA_YARD_EXAM": { key: "HAPA_YARD_EXAM", label: "Wagon moved to HAPA for yard examination", completionRequired: true, nextStages: ["YARD_EXAM_COMPLETED"], targetDurationHours: 1 },
    "YARD_EXAM_COMPLETED": { key: "YARD_EXAM_COMPLETED", label: "Yard examination completed", completionRequired: true, nextStages: ["FIT_FOR_LOADING"], targetDurationHours: 0 },
    "FIT_FOR_LOADING": { key: "FIT_FOR_LOADING", label: "Rake/Wagon fit for loading", completionRequired: true, nextStages: [], targetDurationHours: 0 }
  }
};

// ----------------------------------------------------------------------------
// REGISTRY MAPPING
// ----------------------------------------------------------------------------

export type WorkflowMappingResult = 
  | { supported: true; workflow: WorkflowDefinition }
  | { supported: false; reason: string };

export function getWorkflowForWagonType(wagonType: string | undefined): WorkflowMappingResult {
  if (!wagonType) {
    return { supported: false, reason: "No configured workflow for this wagon type." };
  }
  const t = wagonType.toUpperCase().trim();

  // Tank Wagons (Local SOPs)
  if (["BTPN", "BTPFLN", "BTFLN"].includes(t)) return { supported: true, workflow: BTPN_LOCAL_TANK_WORKFLOW };
  if (["BTPGLN", "BTPGN"].includes(t)) return { supported: true, workflow: BTPGLN_LOCAL_LPG_WORKFLOW };

  // Covered Wagons
  if (["BCN", "BCNA", "BCNAHS", "BCNHL", "BCCNR", "BCNMI"].includes(t)) return { supported: true, workflow: COVERED_WAGON_WORKFLOW };

  // Brake Vans
  if (["BVCM", "BVZI", "BVZC"].includes(t)) return { supported: true, workflow: BRAKE_VAN_WORKFLOW };

  // Explicit Open/Flat/Hopper Freight (General Freight)
  if (["BOXN", "BOXNHL", "BOXNHS", "BOXNHA", "BOXNCR", "BOXNLW", "BOXNB", "BOXNF", "BOXNG", "BOY", "BOST", "BOXNAL", "BOXN-HL"].includes(t) ||
      ["BRNA", "BRNAHS", "BFNS", "BOMN", "BRSTH", "BFAT", "BLCA", "BLCB"].includes(t) ||
      ["BOBYN", "BOBYNHS", "BOBRN", "BOBRNHS", "BOBRAL"].includes(t)) {
    return { supported: true, workflow: GENERAL_FREIGHT_WORKFLOW };
  }

  // Unknown or unsupported types
  return { supported: false, reason: "Workflow not configured" };
}

export function getWorkflowDefinitionForWagon(wagonType: string | undefined): WorkflowDefinition | null {
  const result = getWorkflowForWagonType(wagonType);
  return result.supported ? result.workflow : null;
}

// ----------------------------------------------------------------------------
// STATE HELPERS (Reading from WorkflowItem)
// ----------------------------------------------------------------------------

export function getCurrentWorkflowStage(workflow: WorkflowItem | undefined, def: WorkflowDefinition): string | null {
  if (!workflow || !def) return null;
  return workflow.currentStage || def.initialStage;
}

// Extract branch choices from action history
function getBranchChoiceFromHistory(workflow: WorkflowItem, branchConditionId: string): string | null {
  // We need to figure out what was chosen. The action history might contain the choice.
  // Actually, the simplest way is to see which of the next stages actually exists in the stage history and is completed/in progress.
  return null;
}

export function getApplicableWorkflowPath(workflow: WorkflowItem | undefined, def: WorkflowDefinition): string[] {
  if (!def) return [];

  const path: string[] = [];
  const visited = new Set<string>();
  let currentKey: string | undefined = def.initialStage;
  
  while (currentKey && !visited.has(currentKey)) {
    visited.add(currentKey);
    path.push(currentKey);
    
    const stageInfo = def.stages[currentKey];
    if (!stageInfo || stageInfo.nextStages.length === 0) break;
    if (stageInfo.nextStages.length === 1) {
      currentKey = stageInfo.nextStages[0];
      continue;
    }
    
    // Branch logic - resolve based on what is in the workflow stages list
    if (workflow) {
      // Find which of the nextStages is present in the WorkflowItem's stages array and has been started/completed
      // Wait, we need to know the *chosen* path. If the current stage is completed, the NEXT stage will be in the WorkflowItem's stages list.
      // In the new architecture, when a branch is taken, the next stage is dynamically added or updated in the WorkflowItem.
      // Let's just check which of the nextStages exists in workflow.stages with status != Pending (or exists at all if we add them dynamically).
      const chosenStage = stageInfo.nextStages.find(nextKey => 
        workflow.stages.some(s => s.stageName === nextKey && s.status !== "Pending")
      );
      if (chosenStage) {
        currentKey = chosenStage;
        continue;
      }

      // If we haven't reached this branch yet, we might not know the choice. Just pick the first one as a placeholder or break.
      // The modal can handle rendering possible branches. For path calculation, let's just break if unresolved.
      break;
    } else {
      break;
    }
  }
  return path;
}

export type StageState = "COMPLETED" | "CURRENT" | "PENDING" | "SKIPPED" | "BLOCKED";

export function getWorkflowStageState(workflow: WorkflowItem | undefined, stageKey: string): StageState {
  if (!workflow) return "PENDING";
  
  const stageRecord = workflow.stages.find(s => s.stageName === stageKey);
  if (!stageRecord) return "SKIPPED"; // Or pending if it's a future branch

  if (stageRecord.status === "Done" || stageRecord.status === "Skipped") return "COMPLETED";
  if (workflow.currentStage === stageKey) return "CURRENT";
  return "PENDING";
}

export function getLatestCompletionTimestamp(workflow: WorkflowItem | undefined): string | null {
  if (!workflow || !workflow.stages) return null;

  let latestTimestamp: string | null = null;
  for (const entry of workflow.stages) {
    if (entry.completedAt) {
      if (!latestTimestamp || new Date(entry.completedAt) > new Date(latestTimestamp)) {
        latestTimestamp = entry.completedAt;
      }
    }
  }

  return latestTimestamp;
}

export function formatWorkflowTimestamp(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const time = d.toLocaleString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
    
    return `${day} ${month} ${year} · ${time}`;
  } catch {
    return "";
  }
}
