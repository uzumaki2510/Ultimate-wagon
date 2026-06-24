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

export enum WagonWorkflowStatus {
  ARRIVED = "ARRIVED",
  INSPECTION_PENDING = "INSPECTION_PENDING",
  INSPECTION_COMPLETE = "INSPECTION_COMPLETE",
  SICK_LINE = "SICK_LINE",
  REPAIR_IN_PROGRESS = "REPAIR_IN_PROGRESS",
  REPAIR_COMPLETE = "REPAIR_COMPLETE",
  FIT_CERTIFICATE_PENDING = "FIT_CERTIFICATE_PENDING",
  FIT_READY = "FIT_READY",
  RELEASED = "RELEASED",
  IN_SERVICE = "IN_SERVICE"
}

export type WagonStatus = `${WagonWorkflowStatus}`;

export type PriorityLevel = "Normal" | "Urgent" | "Safety Critical";

export interface RepairTask {
  category: string;
  subRepair: string;
  severity: PriorityLevel;
}

export interface ChecklistItem {
  checked: boolean;
  checkedBy?: string;
  checkedAt?: string;
  remarks?: string;
}

export interface InspectionChecklist {
  // Wheel & Axle Check
  wheelCondition?: ChecklistItem;
  bearingCondition?: ChecklistItem;
  axleBox?: ChecklistItem;
  wheelProfile?: ChecklistItem;
  
  // Brake Check
  brakePipe?: ChecklistItem;
  brakeCylinder?: ChecklistItem;
  distributorValve?: ChecklistItem;
  brakeBinding?: ChecklistItem;
  airPressure?: ChecklistItem;

  // Coupler / CBC Check
  cbc?: ChecklistItem;
  knuckle?: ChecklistItem;
  draftGear?: ChecklistItem;
  buffer?: ChecklistItem;

  // Body / Structure Check
  bodyCondition?: ChecklistItem;
  doorHatch?: ChecklistItem;
  ladder?: ChecklistItem;
  floorRoofSideWall?: ChecklistItem;
  corrosion?: ChecklistItem;

  // Underframe Check
  headStockChecked?: ChecklistItem;
  soleBarChecked?: ChecklistItem;
  crossBarChecked?: ChecklistItem;
  floorPlateChecked?: ChecklistItem;
  derustingChecked?: ChecklistItem;

  // Bogie & Suspension Check
  springChecked?: ChecklistItem;
  snubberSpringChecked?: ChecklistItem;
  sideBearerChecked?: ChecklistItem;
  centrePivotChecked?: ChecklistItem;
  elastomericPadChecked?: ChecklistItem;
  suspensionChecked?: ChecklistItem;

  // Painting / Finishing Check
  surfacePrepared?: ChecklistItem;
  paintingCompleted?: ChecklistItem;
  markingCompleted?: ChecklistItem;
  finalFinishingChecked?: ChecklistItem;

  // Scheduled Maintenance Check
  rohPohStatusChecked?: ChecklistItem;
  yardExamCompleted?: ChecklistItem;
  periodicInspectionCompleted?: ChecklistItem;
  maintenanceFinalInspectionCompleted?: ChecklistItem;

  // Tank Wagon Safety Check
  masterValve?: ChecklistItem;
  bottomDischargeValve?: ChecklistItem;
  deliveryPipe?: ChecklistItem;
  tankBarrel?: ChecklistItem;
  leakage?: ChecklistItem;
  safetyFittings?: ChecklistItem;
  steamPurgeDegassing?: ChecklistItem;

  // Final Check
  defectRectified?: ChecklistItem;
  finalInspectionDone?: ChecklistItem;
  readyForFitMarking?: ChecklistItem;
}

export interface FitConfirmation {
  allStagesCompleted: boolean;
  defectRectified: boolean;
  repairChecklistCompleted?: boolean;
  finalInspectionCompleted: boolean;
  noSafetyCriticalDefectOpen: boolean;
  inspectorVerified: boolean;
  
  // Tank Wagon
  noLeakageFound?: boolean;
  masterValveChecked?: boolean;
  bottomDischargeValveChecked?: boolean;
  deliveryPipeChecked?: boolean;
  blankFlangeChecked?: boolean;
  tankBarrelChecked?: boolean;
  safetyFittingsChecked?: boolean;
  steamingPurgingDegassingCompleted?: boolean;
  hydroTestingCompleted?: boolean;

  inspectorName: string;
  remarks: string;
  confirmedAt: string;
  confirmedBy: string;
}

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
  comments?: string;
  status: WagonStatus;
  rakeId?: string;
  defect?: string;
  bookedTo?: string;
  updatedAt?: string;
  priority?: PriorityLevel;
  repairTasks?: RepairTask[];
  repairTypes?: string[];
  inspectionChecklist?: InspectionChecklist;
  fitConfirmation?: FitConfirmation;
  isSteamed?: boolean;
  isDegassed?: boolean;
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

export type WorkflowStageStatus = "Pending" | "In Progress" | "Done" | "Delayed" | "Skipped";

export interface WorkflowStageRecord {
  stageName: string;
  status: WorkflowStageStatus;
  startedAt?: string;
  completedAt?: string;
  durationHours?: number;
  targetDurationHours: number;
  staffName?: string;
  inspectorName?: string;
  sscJeName?: string;
  steamPointOperationName?: string;
  fitterName?: string;
  remarks?: string;
}

export interface WorkflowActionHistory {
  action: "START_STAGE" | "MARK_STAGE_DONE" | "ADVANCE_WORKFLOW" | "MARK_FIT";
  stageName: string;
  previousWorkflowSnapshot: string; // JSON stringified snapshot of the full WorkflowItem before action
  createdAt: string;
  userName: string;
  reason?: string;
}

export interface WorkflowItem {
  id: string;
  wagonId: string;
  memoId?: string;
  wagonNo: string;
  wagonType: string;
  currentStage: string;
  stages: WorkflowStageRecord[];
  updatedAt: string;
  sscJeName?: string;
  fitterName?: string;
  actionHistory?: WorkflowActionHistory[];
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
