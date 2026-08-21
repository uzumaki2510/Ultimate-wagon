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
  expectedTotalStages: number;
}

// ----------------------------------------------------------------------------
// WORKFLOW FAMILIES
// ----------------------------------------------------------------------------

export const GENERAL_FREIGHT_WORKFLOW: WorkflowDefinition = {
  id: "GENERAL_FREIGHT_WORKFLOW",
  name: "General Freight Workflow",
  initialStage: "YARD_EXAM",
  expectedTotalStages: 7,
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
  expectedTotalStages: 7,
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
  expectedTotalStages: 8,
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
  expectedTotalStages: 9,
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
  expectedTotalStages: 11,
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
// AUTHORITATIVE WORKFLOW RESOLVER
// ----------------------------------------------------------------------------

export type StageState = "COMPLETED" | "CURRENT" | "PENDING" | "SKIPPED" | "BLOCKED" | "NOT_APPLICABLE";

export interface ResolvedWorkflow {
  definition: WorkflowDefinition;
  family: string;
  currentStageKey: string | null;
  completedStageKeys: string[];
  stageStates: Record<string, StageState>;
  resolvedPath: string[];
  branchState: "UNRESOLVED" | "RESOLVED" | "NONE";
  completedCount: number;
  totalCount: number;
  latestCompletedAt: string | null;
}

// Maps legacy/dirty stage names to actual config keys
function normalizeStageKey(def: WorkflowDefinition, identifier: string): string | null {
  if (!identifier) return null;
  if (def.stages[identifier]) return identifier;
  const upperId = identifier.toUpperCase().trim();
  for (const [key, stage] of Object.entries(def.stages)) {
    if (key === upperId || stage.label.toUpperCase() === upperId || (stage.shortLabel && stage.shortLabel.toUpperCase() === upperId)) {
      return key;
    }
    // Legacy fallbacks
    if (upperId.includes("DEGASSING") && key === "DE_GASSING") return key;
    if (upperId.includes("DE-GASSING") && key === "DE_GASSING") return key;
    if (upperId.includes("INITIAL INSPECTION") && key === "YARD_INSPECTION") return key;
    if (upperId.includes("STEAMING") && key === "STEAMING") return key;
    if (upperId.includes("STEAM CLEANING") && key === "STEAM_CLEANING") return key;
  }
  return null;
}

export function getResolvedWorkflowForWagon(wagon: Wagon | any, workflowRecord?: WorkflowItem): ResolvedWorkflow | null {
  const def = getWorkflowDefinitionForWagon(wagon?.details?.typeName || wagon?.type);
  if (!def) return null;

  // 1. Map completed stages from persisted record
  const completedStageKeys: string[] = [];
  let latestCompletedAt: string | null = null;
  const recordedStages = workflowRecord?.stages || [];
  
  for (const st of recordedStages) {
    if (st.status === "Done" || st.status === "Skipped") {
      const normalizedKey = normalizeStageKey(def, st.stageName);
      if (normalizedKey && !completedStageKeys.includes(normalizedKey)) {
        completedStageKeys.push(normalizedKey);
        if (st.completedAt) {
          if (!latestCompletedAt || new Date(st.completedAt) > new Date(latestCompletedAt)) {
            latestCompletedAt = st.completedAt;
          }
        }
      }
    }
  }

  // 2. Compute Path & Branch State
  const resolvedPath: string[] = [];
  const visited = new Set<string>();
  let currentKey: string | undefined = def.initialStage;
  let branchState: "UNRESOLVED" | "RESOLVED" | "NONE" = "NONE";
  
  while (currentKey && !visited.has(currentKey)) {
    visited.add(currentKey);
    resolvedPath.push(currentKey);
    
    const stageInfo = def.stages[currentKey];
    if (!stageInfo || stageInfo.nextStages.length === 0) break;
    if (stageInfo.nextStages.length === 1) {
      currentKey = stageInfo.nextStages[0];
      continue;
    }
    
    // We hit a branch!
    branchState = "UNRESOLVED";
    // Check if any next branch has been started or completed
    const chosenStage = stageInfo.nextStages.find(nextKey => {
      return recordedStages.some(s => {
        const norm = normalizeStageKey(def, s.stageName);
        return norm === nextKey && s.status !== "Pending";
      });
    });

    if (chosenStage) {
      branchState = "RESOLVED";
      currentKey = chosenStage;
      continue;
    }
    
    // Branch is unresolved. We stop adding stages to the resolved path.
    // The UI will handle displaying the branch choice at `currentKey`.
    break; 
  }

  // 3. Determine Current Stage Key
  let computedCurrentStageKey: string | null = null;
  if (workflowRecord?.currentStage) {
    computedCurrentStageKey = normalizeStageKey(def, workflowRecord.currentStage);
  }
  
  if (!computedCurrentStageKey || !def.stages[computedCurrentStageKey]) {
    // If not explicitly recorded or invalid, infer from path
    computedCurrentStageKey = def.initialStage;
    for (const key of resolvedPath) {
      if (!completedStageKeys.includes(key)) {
        computedCurrentStageKey = key;
        break;
      }
    }
    // If all are completed, the last one is effectively the "current" (final) state
    if (completedStageKeys.length >= resolvedPath.length && resolvedPath.length > 0) {
      computedCurrentStageKey = resolvedPath[resolvedPath.length - 1];
    }
  }

  // 4. Calculate states
  const stageStates: Record<string, StageState> = {};
  for (const key of Object.keys(def.stages)) {
    if (completedStageKeys.includes(key)) {
      stageStates[key] = "COMPLETED";
    } else if (key === computedCurrentStageKey) {
      stageStates[key] = "CURRENT";
    } else if (resolvedPath.includes(key)) {
      stageStates[key] = "PENDING";
    } else {
      stageStates[key] = "NOT_APPLICABLE"; // Not in the active path (either unselected branch or alternative branch)
    }
  }

  // 5. Total Count and Completed Count
  
  // Calculate applicable total stages by finding the maximum path length from the end of the resolved path.
  let totalCount = resolvedPath.length;
  const lastResolvedKey = resolvedPath.length > 0 ? resolvedPath[resolvedPath.length - 1] : def.initialStage;
  const nextStages = def.stages[lastResolvedKey]?.nextStages || [];
  
  if (nextStages.length > 0) {
    let maxExtra = 0;
    const pathVisited = new Set<string>();
    
    const traverse = (key: string, depth: number) => {
      if (pathVisited.has(key)) return;
      pathVisited.add(key);
      maxExtra = Math.max(maxExtra, depth);
      
      const futureStages = def.stages[key]?.nextStages || [];
      for (const next of futureStages) {
        traverse(next, depth + 1);
      }
      pathVisited.delete(key);
    };

    for (const next of nextStages) {
      traverse(next, 1);
    }
    totalCount = resolvedPath.length + maxExtra;
  }

  const completedCount = completedStageKeys.filter(k => resolvedPath.includes(k)).length;

  return {
    definition: def,
    family: def.name,
    currentStageKey: computedCurrentStageKey,
    completedStageKeys,
    stageStates,
    resolvedPath,
    branchState,
    completedCount,
    totalCount,
    latestCompletedAt
  };
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
  } catch (e) {
    return "";
  }
}}
