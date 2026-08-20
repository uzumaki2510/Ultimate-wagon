import {
  ArrowRightCircle, CheckCircle2, PlayCircle, Clock, Wrench,
  Droplets, Wind, ShieldCheck, ClipboardCheck, Activity, AlertTriangle,
  MessageSquare, Truck, MapPin, type LucideIcon
} from "lucide-react";

export type EventCategory =
  | "arrival"
  | "placement"
  | "examination"
  | "defect"
  | "maintenance"
  | "assignment"
  | "status_transition"
  | "inspection"
  | "fit"
  | "release"
  | "comment"
  | "workflow"
  | "other";

export interface EventCategoryConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const EVENT_CATEGORY_CONFIG: Record<EventCategory, EventCategoryConfig> = {
  arrival: { label: "Arrival", icon: Truck, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  placement: { label: "Placement", icon: MapPin, color: "text-indigo-500", bgColor: "bg-indigo-50 dark:bg-indigo-950/30" },
  examination: { label: "Examination", icon: ClipboardCheck, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950/30" },
  defect: { label: "Defect", icon: AlertTriangle, color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-950/30" },
  maintenance: { label: "Maintenance", icon: Wrench, color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950/30" },
  assignment: { label: "Assignment", icon: PlayCircle, color: "text-cyan-500", bgColor: "bg-cyan-50 dark:bg-cyan-950/30" },
  status_transition: { label: "Status Change", icon: ArrowRightCircle, color: "text-purple-500", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
  inspection: { label: "Inspection", icon: ShieldCheck, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/30" },
  fit: { label: "Fit", icon: CheckCircle2, color: "text-emerald-500", bgColor: "bg-emerald-50 dark:bg-emerald-950/30" },
  release: { label: "Release", icon: ArrowRightCircle, color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-950/30" },
  comment: { label: "Comment", icon: MessageSquare, color: "text-gray-500", bgColor: "bg-gray-50 dark:bg-gray-950/30" },
  workflow: { label: "Workflow", icon: Activity, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  other: { label: "Other", icon: Clock, color: "text-gray-500", bgColor: "bg-gray-50 dark:bg-gray-950/30" },
};

/** Infer event category from stage name or action text */
export function inferCategoryFromStageName(stageName: string): EventCategory {
  const s = stageName.toLowerCase();
  if (s.includes("sick reason") || s.includes("sick_line") || s.includes("initial")) return "arrival";
  if (s.includes("steam") || s.includes("degass") || s.includes("purging") || s.includes("gas free")) return "maintenance";
  if (s.includes("mechanic") || s.includes("yard exam") || s.includes("placement") || s.includes("hapa")) return "examination";
  if (s.includes("repair") || s.includes("rectif")) return "maintenance";
  if (s.includes("test") || s.includes("hydro")) return "inspection";
  if (s.includes("fit")) return "fit";
  if (s.includes("releas")) return "release";
  return "workflow";
}

/** Infer event category from an audit action string */
export function inferCategoryFromAuditAction(action: string): EventCategory {
  const a = action.toLowerCase();
  if (a.includes("moved wagon") || a.includes("status")) return "status_transition";
  if (a.includes("repair")) return "maintenance";
  if (a.includes("fit") || a.includes("mark")) return "fit";
  if (a.includes("inspect")) return "inspection";
  if (a.includes("memo")) return "comment";
  if (a.includes("register") || a.includes("added")) return "arrival";
  return "other";
}

/** Parse "from X to Y" from audit detail strings */
export function parseStatusTransition(details: string | undefined): { from: string; to: string } | null {
  if (!details) return null;
  const match = details.match(/Status changed from (\S+) to (\S+)/i);
  if (match) return { from: match[1], to: match[2] };
  return null;
}

export const FILTER_OPTIONS: { value: EventCategory | "all"; label: string }[] = [
  { value: "all", label: "All Events" },
  { value: "workflow", label: "Workflow" },
  { value: "status_transition", label: "Status Changes" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inspection", label: "Inspection" },
  { value: "fit", label: "Fit / Ready" },
  { value: "comment", label: "Remarks" },
];
