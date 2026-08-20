import { WagonStatus } from "@/types";

export type BoardColumn = 
  | "REQUESTED"
  | "SICK_LINE"
  | "EXAMINATION"
  | "WORK_NOT_STARTED"
  | "WORK_IN_PROGRESS"
  | "WAITING"
  | "INSPECTION"
  | "READY"
  | "RELEASED";

export const getBoardColumn = (status: WagonStatus): BoardColumn => {
  switch (status) {
    case "ARRIVED": return "REQUESTED";
    case "SICK_LINE": return "SICK_LINE";
    case "INSPECTION_PENDING": return "EXAMINATION";
    case "INSPECTION_COMPLETE": return "WAITING"; 
    case "REPAIR_IN_PROGRESS": return "WORK_IN_PROGRESS";
    case "REPAIR_COMPLETE": return "INSPECTION"; 
    case "FIT_CERTIFICATE_PENDING": return "INSPECTION";
    case "FIT_READY": return "READY";
    case "RELEASED": return "RELEASED";
    case "IN_SERVICE": return "RELEASED";
    default: return "WAITING";
  }
};

export const COLUMNS: { id: BoardColumn; title: string }[] = [
  { id: "REQUESTED", title: "Placement Requested" },
  { id: "SICK_LINE", title: "Placed / Sick Line" },
  { id: "EXAMINATION", title: "Examination" },
  { id: "WORK_IN_PROGRESS", title: "Work In Progress" },
  { id: "WAITING", title: "Waiting / Pending" },
  { id: "INSPECTION", title: "Inspection" },
  { id: "READY", title: "Fit / Ready" },
  { id: "RELEASED", title: "Released" }
];

export const getValidTargetColumns = (currentStatus: WagonStatus): BoardColumn[] => {
  switch (currentStatus) {
    case "ARRIVED": return ["SICK_LINE"];
    case "SICK_LINE": return ["EXAMINATION", "WORK_IN_PROGRESS"];
    case "INSPECTION_PENDING": return ["WAITING", "WORK_IN_PROGRESS"];
    case "INSPECTION_COMPLETE": return ["WORK_IN_PROGRESS", "READY"];
    case "REPAIR_IN_PROGRESS": return ["INSPECTION", "READY"];
    case "REPAIR_COMPLETE": return ["INSPECTION", "READY"];
    case "FIT_CERTIFICATE_PENDING": return ["READY"];
    case "FIT_READY": return ["RELEASED"];
    case "RELEASED": return [];
    case "IN_SERVICE": return ["SICK_LINE"];
    default: return [];
  }
};

export const getTargetStatusForColumn = (currentStatus: WagonStatus, targetColumn: BoardColumn): WagonStatus | null => {
  // If the target column is invalid for the current status, return null
  if (!getValidTargetColumns(currentStatus).includes(targetColumn)) return null;

  switch (targetColumn) {
    case "SICK_LINE": return "SICK_LINE";
    case "EXAMINATION": return "INSPECTION_PENDING";
    case "WAITING": return "INSPECTION_COMPLETE";
    case "WORK_IN_PROGRESS": return "REPAIR_IN_PROGRESS";
    case "INSPECTION": return "FIT_CERTIFICATE_PENDING"; // or REPAIR_COMPLETE depending on flow
    case "READY": return "FIT_READY";
    case "RELEASED": return "RELEASED";
    default: return null;
  }
};
