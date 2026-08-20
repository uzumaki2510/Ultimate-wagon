export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";
export type AlertCategory = "DELAY" | "MATERIAL" | "MAINTENANCE" | "INSPECTION" | "WORKFLOW" | "READY";

export interface WagonAlert {
  id: string; // Unique key for the condition, e.g., "delay-sick-line"
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description?: string;
  actionType?: "VIEW_MAINTENANCE" | "VIEW_INSPECTION" | "VIEW_WORKFLOW";
}
