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
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  stages: Record<string, WorkflowStage>;
  initialStage: string;
}

export const btpnWorkflow: WorkflowDefinition = {
  id: "BTPN_BTPFLN_WORKFLOW",
  name: "BTPN / BTPFLN Workflow",
  initialStage: "YARD_INSPECTION",
  stages: {
    "YARD_INSPECTION": {
      key: "YARD_INSPECTION",
      label: "Initial / Yard Inspection",
      completionRequired: true,
      nextStages: ["STEAMING"],
    },
    "STEAMING": {
      key: "STEAMING",
      label: "Steaming",
      completionRequired: true,
      nextStages: ["STEAM_CLEANING"],
    },
    "STEAM_CLEANING": {
      key: "STEAM_CLEANING",
      label: "Steam Cleaning",
      completionRequired: true,
      nextStages: ["STEAM_POINT_PLACEMENT"],
    },
    "STEAM_POINT_PLACEMENT": {
      key: "STEAM_POINT_PLACEMENT",
      label: "Placement at Steaming Point",
      description: "Wagon kept open 24 hrs",
      completionRequired: true,
      nextStages: ["RECTIFICATION_DECISION"],
    },
    "RECTIFICATION_DECISION": {
      key: "RECTIFICATION_DECISION",
      label: "Rectification Decision",
      completionRequired: true,
      branchConditionId: "upperGearOrSiding",
      nextStages: ["MAINTENANCE_REPAIR", "SIDING_PLACEMENT"],
    },
    "MAINTENANCE_REPAIR": {
      key: "MAINTENANCE_REPAIR",
      label: "Repair / Rectification (Maintenance)",
      description: "Upper gear / ladder / barrel / valve etc.",
      completionRequired: true,
      nextStages: ["HYDRO_TESTING"],
    },
    "SIDING_PLACEMENT": {
      key: "SIDING_PLACEMENT",
      label: "Conditional Placement",
      description: "Wagon placement at siding/sick line",
      completionRequired: true,
      nextStages: ["HYDRO_TESTING"],
    },
    "HYDRO_TESTING": {
      key: "HYDRO_TESTING",
      label: "Hydro Testing",
      completionRequired: true,
      nextStages: ["FIT_FOR_USE"],
    },
    "FIT_FOR_USE": {
      key: "FIT_FOR_USE",
      label: "Fit for Use",
      completionRequired: true,
      nextStages: [],
    }
  }
};

export const btpglnWorkflow: WorkflowDefinition = {
  id: "BTPGLN_BTPGN_WORKFLOW",
  name: "BTPGLN / BTPGN Workflow",
  initialStage: "RRT_SIDING",
  stages: {
    "RRT_SIDING": {
      key: "RRT_SIDING",
      label: "Wagon moved to RRT siding",
      completionRequired: true,
      nextStages: ["DE_GASSING"],
    },
    "DE_GASSING": {
      key: "DE_GASSING",
      label: "De-Gassing",
      completionRequired: true,
      nextStages: ["DG_COMPLETION"],
    },
    "DG_COMPLETION": {
      key: "DG_COMPLETION",
      label: "DG Completion",
      completionRequired: true,
      nextStages: ["HAPA_DEPOT"],
    },
    "HAPA_DEPOT": {
      key: "HAPA_DEPOT",
      label: "Wagon moved to HAPA depot for rectification",
      completionRequired: true,
      branchConditionId: "defectReason",
      nextStages: ["UNDER_GEAR_RECTIFICATION", "UPPER_GEAR_RECTIFICATION", "ROH_POH_RECTIFICATION"],
    },
    "UNDER_GEAR_RECTIFICATION": {
      key: "UNDER_GEAR_RECTIFICATION",
      label: "Under Gear Rectification",
      description: "Rectification by HAPA C&W staff",
      completionRequired: true,
      nextStages: ["MARKED_FIT_HAPA"],
    },
    "UPPER_GEAR_RECTIFICATION": {
      key: "UPPER_GEAR_RECTIFICATION",
      label: "Upper Gear Rectification",
      description: "Staff from KOTA/AJMER workshop rectify upper gear defect",
      completionRequired: true,
      nextStages: ["MARKED_FIT_HAPA"],
    },
    "ROH_POH_RECTIFICATION": {
      key: "ROH_POH_RECTIFICATION",
      label: "ROH / POH Rectification",
      description: "Wagon moved to ADLW/KTTW",
      completionRequired: true,
      nextStages: ["MARKED_FIT_HAPA"],
    },
    "MARKED_FIT_HAPA": {
      key: "MARKED_FIT_HAPA",
      label: "Marked fit at HAPA",
      completionRequired: true,
      nextStages: ["RRT_MOVE"],
    },
    "RRT_MOVE": {
      key: "RRT_MOVE",
      label: "Wagon moved to RRT",
      completionRequired: true,
      nextStages: ["PURGING"],
    },
    "PURGING": {
      key: "PURGING",
      label: "Purging process",
      completionRequired: true,
      branchConditionId: "purgingStatus",
      nextStages: ["HAPA_DEPOT", "HAPA_YARD_EXAM"],
    },
    "HAPA_YARD_EXAM": {
      key: "HAPA_YARD_EXAM",
      label: "Wagon moved to HAPA for yard examination",
      completionRequired: true,
      nextStages: ["YARD_EXAM_COMPLETED"],
    },
    "YARD_EXAM_COMPLETED": {
      key: "YARD_EXAM_COMPLETED",
      label: "Yard examination completed",
      completionRequired: true,
      nextStages: ["FIT_FOR_LOADING"],
    },
    "FIT_FOR_LOADING": {
      key: "FIT_FOR_LOADING",
      label: "Rake/Wagon fit for loading",
      completionRequired: true,
      nextStages: [],
    }
  }
};

export type WorkflowMappingResult = 
  | { supported: true; workflow: WorkflowDefinition }
  | { supported: false; reason: string };

export function getWorkflowForWagonType(wagonType: string): WorkflowMappingResult {
  if (!wagonType) {
    return { supported: false, reason: "No configured workflow for this wagon type." };
  }

  const normalized = wagonType.toUpperCase().trim();

  // BTPN / BTPFLN Workflow mapping
  if (normalized === "BTPN" || normalized === "BTPFLN") {
    return { supported: true, workflow: btpnWorkflow };
  }

  // BTPGLN / BTPGN Workflow mapping
  if (normalized === "BTPGLN" || normalized === "BTPGN") {
    return { supported: true, workflow: btpglnWorkflow };
  }

  // Unknown or unsupported types
  return { supported: false, reason: "No configured workflow for this wagon type." };
}

// ----------------------------------------------------
// LEGACY WAGON WORKFLOW ADAPTERS (Step 3)
// ----------------------------------------------------

import { WagonRepair, BTPNWorkflowData, BTPGLNWorkflowData } from "./wagonData";

export const BTPN_LEGACY_MAP: Record<string, string> = {
  "yard_issue": "YARD_INSPECTION",
  "steaming": "STEAMING",
  "yard_exam_sick": "YARD_INSPECTION",
  "steam_cleaning": "STEAM_CLEANING",
  "rectification": "MAINTENANCE_REPAIR",
  "placement_decision": "STEAM_POINT_PLACEMENT",
  "hydro_testing": "HYDRO_TESTING",
  "fit_for_use": "FIT_FOR_USE",
};

export const BTPN_REVERSE_MAP: Record<string, BTPNWorkflowData["currentStage"]> = {
  "YARD_INSPECTION": "yard_issue",
  "STEAMING": "steaming",
  "STEAM_CLEANING": "steam_cleaning",
  "STEAM_POINT_PLACEMENT": "placement_decision",
  "MAINTENANCE_REPAIR": "rectification",
  "SIDING_PLACEMENT": "placement_decision", // Maps to same legacy screen logic
  "HYDRO_TESTING": "hydro_testing",
  "FIT_FOR_USE": "fit_for_use",
};

export const BTPGLN_LEGACY_MAP: Record<string, string> = {
  "sick_reason": "RRT_SIDING", // or HAPA_DEPOT
  "rrt_degassing": "DE_GASSING",
  "hapa_examination": "HAPA_DEPOT",
  "rrt_purging": "PURGING",
  "yard_examination": "HAPA_YARD_EXAM",
  "fit_for_loading": "FIT_FOR_LOADING",
};

export const BTPGLN_REVERSE_MAP: Record<string, BTPGLNWorkflowData["currentStage"]> = {
  "RRT_SIDING": "sick_reason",
  "DE_GASSING": "rrt_degassing",
  "DG_COMPLETION": "rrt_degassing", // Folded into legacy degassing stage
  "HAPA_DEPOT": "hapa_examination",
  "UNDER_GEAR_RECTIFICATION": "hapa_examination",
  "UPPER_GEAR_RECTIFICATION": "hapa_examination",
  "ROH_POH_RECTIFICATION": "hapa_examination",
  "MARKED_FIT_HAPA": "hapa_examination",
  "RRT_MOVE": "rrt_purging",
  "PURGING": "rrt_purging",
  "HAPA_YARD_EXAM": "yard_examination",
  "YARD_EXAM_COMPLETED": "yard_examination",
  "FIT_FOR_LOADING": "fit_for_loading",
};

export function getWorkflowDefinitionForWagon(wagon: WagonRepair): WorkflowDefinition | null {
  const result = getWorkflowForWagonType(wagon.details.typeName);
  return result.supported ? result.workflow : null;
}

export function getCurrentWorkflowStage(wagon: WagonRepair): string | null {
  const def = getWorkflowDefinitionForWagon(wagon);
  if (!def) return null;

  if (def.id === "BTPN_BTPFLN_WORKFLOW" && wagon.btpnWorkflow?.currentStage) {
    return BTPN_LEGACY_MAP[wagon.btpnWorkflow.currentStage] || def.initialStage;
  }
  if (def.id === "BTPGLN_BTPGN_WORKFLOW" && wagon.btpglnWorkflow?.currentStage) {
    // Determine exact branch current stage
    const legacy = wagon.btpglnWorkflow.currentStage;
    if (legacy === "sick_reason") return "RRT_SIDING";
    if (legacy === "rrt_degassing") return "DE_GASSING";
    if (legacy === "hapa_examination") return "HAPA_DEPOT";
    if (legacy === "rrt_purging") return "PURGING";
    if (legacy === "yard_examination") return "HAPA_YARD_EXAM";
    if (legacy === "fit_for_loading") return "FIT_FOR_LOADING";
    return BTPGLN_LEGACY_MAP[legacy] || def.initialStage;
  }
  return def.initialStage;
}

export function getApplicableWorkflowPath(wagon: WagonRepair): string[] {
  const def = getWorkflowDefinitionForWagon(wagon);
  if (!def) return [];

  const path: string[] = [];
  const visited = new Set<string>();
  let currentKey: string | undefined = def.initialStage;
  
  while (currentKey && !visited.has(currentKey)) {
    visited.add(currentKey);
    path.push(currentKey);
    
    const stageInfo = def.stages[currentKey];
    if (stageInfo.nextStages.length === 0) break;
    if (stageInfo.nextStages.length === 1) {
      currentKey = stageInfo.nextStages[0];
      continue;
    }
    
    // Branch logic
    if (stageInfo.branchConditionId === "upperGearOrSiding") {
      const placement = wagon.btpnWorkflow?.placementType;
      if (placement === "mv_shed") currentKey = "MAINTENANCE_REPAIR";
      else if (placement === "sick_line") currentKey = "SIDING_PLACEMENT";
      else currentKey = stageInfo.nextStages[0]; // fallback
    } else if (stageInfo.branchConditionId === "defectReason") {
      const reason = wagon.btpglnWorkflow?.sickReason;
      if (reason === "under_gear") currentKey = "UNDER_GEAR_RECTIFICATION";
      else if (reason === "upper_gear") currentKey = "UPPER_GEAR_RECTIFICATION";
      else if (reason === "roh_due" || reason === "poh_due") currentKey = "ROH_POH_RECTIFICATION";
      else currentKey = stageInfo.nextStages[0];
    } else if (stageInfo.branchConditionId === "purgingStatus") {
      const markedSick = wagon.btpglnWorkflow?.stageHistory.find(h => h.stage === "rrt_purging")?.markedSickDuringPurging;
      if (markedSick) currentKey = "HAPA_DEPOT";
      else currentKey = "HAPA_YARD_EXAM";
    } else {
      currentKey = stageInfo.nextStages[0];
    }
  }
  return path;
}

export function isStageApplicable(wagon: WagonRepair, stageKey: string): boolean {
  const path = getApplicableWorkflowPath(wagon);
  return path.includes(stageKey);
}

export type StageState = "COMPLETED" | "CURRENT" | "PENDING" | "SKIPPED" | "BLOCKED";

export function getWorkflowStageState(wagon: WagonRepair, stageKey: string): StageState {
  const path = getApplicableWorkflowPath(wagon);
  
  if (!path.includes(stageKey)) {
    return "SKIPPED";
  }

  const current = getCurrentWorkflowStage(wagon);
  if (!current) return "PENDING";
  
  const currentIndex = path.indexOf(current);
  const targetIndex = path.indexOf(stageKey);

  if (targetIndex < currentIndex) return "COMPLETED";
  if (targetIndex === currentIndex) return "CURRENT";
  return "PENDING";
}

export function getNextValidStage(wagon: WagonRepair): string | null {
  const path = getApplicableWorkflowPath(wagon);
  const current = getCurrentWorkflowStage(wagon);
  if (!current) return null;
  const idx = path.indexOf(current);
  if (idx >= 0 && idx < path.length - 1) return path[idx + 1];
  return null;
}

export function getLatestCompletionTimestamp(wagon: WagonRepair): string | null {
  const workflow = getWorkflowDefinitionForWagon(wagon);
  if (!workflow) return null;

  let history: { completedAt?: string }[] = [];
  if (workflow.id === "BTPN_BTPFLN_WORKFLOW" && wagon.btpnWorkflow) {
    history = wagon.btpnWorkflow.stageHistory;
  } else if (workflow.id === "BTPGLN_BTPGN_WORKFLOW" && wagon.btpglnWorkflow) {
    history = wagon.btpglnWorkflow.stageHistory;
  }

  let latestTimestamp: string | null = null;
  for (const entry of history) {
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

