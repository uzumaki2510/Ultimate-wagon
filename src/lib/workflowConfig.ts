export interface StageConfig {
  name: string;
  targetDurationHours: number;
}

export interface WorkflowTemplate {
  stages: StageConfig[];
}

export const WORKFLOW_CONFIGS: Record<string, WorkflowTemplate> = {
  BTPGLN: {
    stages: [
      { name: "Sick Reason", targetDurationHours: 0 },
      { name: "RRT De-Gassing", targetDurationHours: 2 },
      { name: "HAPA Examination", targetDurationHours: 2 },
      { name: "Purging", targetDurationHours: 4 },
      { name: "Yard Examination", targetDurationHours: 1 },
      { name: "Fit For Loading", targetDurationHours: 0 },
    ]
  },
  BTPN: {
    stages: [
      { name: "Issue Marked", targetDurationHours: 0 },
      { name: "Steaming", targetDurationHours: 2 },
      { name: "Steam Point 24h", targetDurationHours: 24 },
      { name: "Rectification", targetDurationHours: 4 },
      { name: "Placement Decision", targetDurationHours: 1 },
      { name: "Hydro Testing", targetDurationHours: 3 },
      { name: "Fit For Use", targetDurationHours: 0 },
    ]
  },
  DEFAULT: {
    stages: [
      { name: "Issue Marked", targetDurationHours: 0 },
      { name: "Rectification", targetDurationHours: 4 },
      { name: "Inspection", targetDurationHours: 1 },
      { name: "Fit For Loading", targetDurationHours: 0 },
    ]
  }
};

export function getWorkflowTemplate(wagonType: string | undefined): WorkflowTemplate {
  if (!wagonType) return WORKFLOW_CONFIGS.DEFAULT;
  const t = wagonType.toUpperCase();
  
  if (t === "BTPGLN") return WORKFLOW_CONFIGS.BTPGLN;
  if (t === "BTPN" || t === "BTPFLN" || t === "BTPNHS") return WORKFLOW_CONFIGS.BTPN;
  
  return WORKFLOW_CONFIGS.DEFAULT;
}
