export const REASONS = [
  "Wheel Alert", "Bearing Alert", "Under Gear Defect", "Upper Gear Defect",
  "ROH Due", "POH Due", "Brake Binding", "Air Leakage", "CBC Defect",
  "Valve Defect", "Barrel Defect", "Ladder Defect", "Delivery Pipe Defect",
  "Master Valve Defect", "Other",
] as const;
export type Reason = typeof REASONS[number];

export const BOOKED_TO = [
  "HAPA SL", "HAPA YD", "MV Shed", "TXR Point",
  "Yard Examination", "Fit For Loading", "Other",
] as const;
export type BookedTo = typeof BOOKED_TO[number];

export const WAGON_TYPES = ["BTPGLN", "BTPN", "BTPFLN", "BTPNHS", "BCNMI", "BOXN", "Other"] as const;
export type WagonType = typeof WAGON_TYPES[number];

export type WagonStatus =
  | "In Service"
  | "Cut Off"
  | "Sick Line"
  | "Under Repair"
  | "Awaiting Inspection"
  | "Fit For Loading";

export interface Wagon {
  id: string;
  wagonNo: string;
  type: WagonType | string;
  owner: string;
  builtYear: number | string;
  pohStation?: string;
  pohDate?: string;
  rohStation?: string;
  rohDate?: string;
  returnDate?: string;
  status: WagonStatus;
  rakeId?: string;
}

export interface Rake {
  id: string;
  rakeId: string;
  rakeName: string;
  yard: string;
  createdAt: string;
  wagonIds: string[];
}

export interface WagonMemoEntry {
  id: string;
  sno: number;
  position: string;
  wagonId: string; // ref Wagon
  reason: Reason | string;
  bookedTo: BookedTo | string;
  defects: string;
  status: WagonStatus;
}

export type ApprovalRole = "SSE / JE" | "TXR Staff" | "Yard Master" | "Operating Department";
export const APPROVAL_ROLES: ApprovalRole[] = ["SSE / JE", "TXR Staff", "Yard Master", "Operating Department"];

export interface Approval {
  role: ApprovalRole;
  name: string;
  designation: string;
  signature: string;
  approvedAt?: string;
  status: "Pending" | "Approved" | "Rejected";
}

export interface UnitMemo {
  id: string;
  memoNo: string;
  memoType?: "sick" | "fit";
  date: string;
  time: string;
  rakeId: string;
  rakeName: string;
  yard: string;
  lineNo: string;
  createdBy: string;
  remarks: string;
  entries: WagonMemoEntry[];
  approvals: Approval[];
  archived?: boolean;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  designation: string;
  role: ApprovalRole | string;
  empCode?: string;
}

export type WorkflowStage =
  // BTPGLN
  | "Sick Reason" | "RRT De-Gassing" | "HAPA Examination" | "Purging" | "Yard Examination" | "Fit For Loading"
  // BTPN / BTPFLN
  | "Issue Marked" | "Steaming" | "Steam Point 24h" | "Rectification" | "Placement Decision" | "Hydro Testing" | "Fit For Use";

export const WORKFLOW_TEMPLATES: Record<string, WorkflowStage[]> = {
  BTPGLN: ["Sick Reason", "RRT De-Gassing", "HAPA Examination", "Purging", "Yard Examination", "Fit For Loading"],
  BTPN: ["Issue Marked", "Steaming", "Steam Point 24h", "Rectification", "Placement Decision", "Hydro Testing", "Fit For Use"],
  BTPFLN: ["Issue Marked", "Steaming", "Steam Point 24h", "Rectification", "Placement Decision", "Hydro Testing", "Fit For Use"],
  DEFAULT: ["Sick Reason", "Yard Examination", "Rectification", "Fit For Loading"],
};

export interface WorkflowItem {
  id: string;
  wagonId: string;
  memoId: string;
  wagonNo: string;
  wagonType: string;
  currentStage: WorkflowStage;
  stages: WorkflowStage[];
  completedStages: WorkflowStage[];
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  wagonId?: string;
  memoId?: string;
  action: string;
  details?: string;
}

export interface LoginRecord {
  userId: string;
  email: string;
  name: string;
  role: string;
  lastLogin: string;
  loginCount: number;
}
