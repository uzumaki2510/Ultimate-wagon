import definitions from '../../shared/workflowDefinitions.json';
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

export const { GENERAL_FREIGHT_WORKFLOW, COVERED_WAGON_WORKFLOW, BRAKE_VAN_WORKFLOW, BTPN_LOCAL_TANK_WORKFLOW, BTPGLN_LOCAL_LPG_WORKFLOW } = definitions as Record<string, WorkflowDefinition>;

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
  if (["BTPN", "BTPNHS", "BTPFLN", "BTFLN"].includes(t)) return { supported: true, workflow: BTPN_LOCAL_TANK_WORKFLOW };
  if (["BTPGLN", "BTPGN"].includes(t)) return { supported: true, workflow: BTPGLN_LOCAL_LPG_WORKFLOW };

  // Covered Wagons
  if (["BCN", "BCNA", "BCNAHS", "BCNHL", "BCN-HL", "BCCNR", "BCNMI"].includes(t)) return { supported: true, workflow: COVERED_WAGON_WORKFLOW };

  // Brake Vans
  if (["BVCM", "BVZI", "BVZC"].includes(t)) return { supported: true, workflow: BRAKE_VAN_WORKFLOW };

  // Explicit Open/Flat/Hopper Freight (General Freight)
  if (["BOXN", "BOXNHL", "BOXNHS", "BOXNHA", "BOXNCR", "BOXNLW", "BOXNB", "BOXNF", "BOXNG", "BOY", "BOST", "BOXNAL", "BOXN-HL"].includes(t) ||
      ["BRNA", "BRNAHS", "BFNS", "BOMN", "BRSTH", "BFAT", "BLCA", "BLCB"].includes(t) ||
      ["BOBYN", "BOBYNHS", "BOBRN", "BOBRNHS", "BOBRAL"].includes(t)) {
    return { supported: true, workflow: GENERAL_FREIGHT_WORKFLOW };
  }

  // Unknown or unsupported types
  return { supported: true, workflow: GENERAL_FREIGHT_WORKFLOW };
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
export function normalizeStageKey(def: WorkflowDefinition, identifier: string): string | null {
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
    const selected = recordedStages.find(s => normalizeStageKey(def, s.stageName) === currentKey)?.selectedNextStage;
    const chosenStage = selected && stageInfo.nextStages.includes(selected) && !visited.has(selected) ? selected : stageInfo.nextStages.find(nextKey => {
      if (visited.has(nextKey)) return false;
      return recordedStages.some(s => {
        const norm = normalizeStageKey(def, s.stageName);
        return norm === nextKey && !["Pending", "Skipped"].includes(s.status);
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
    const pathVisited = new Set<string>(resolvedPath);
    
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
}
