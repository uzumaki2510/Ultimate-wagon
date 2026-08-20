import { Wagon, WorkflowItem } from "@/types";
import { WagonAlert, AlertSeverity, AlertCategory } from "./wagonAlertTypes";
import { calculateMaintenanceProgress } from "@/components/maintenance/maintenanceProgress";
import { isTankWagonType } from "@/lib/workflowConfig";
import { getValidTargetColumns } from "@/components/sick-line-board/statusMapping";

interface AlertContext {
  wagon: Wagon;
  workflow?: WorkflowItem;
  now: Date;
}

// Configuration thresholds
const THRESHOLDS = {
  STAGE_DELAY_HOURS: 24,
  MATERIAL_PENDING_HOURS: 4,
};

export function evaluateWagonAlerts({ wagon, workflow, now }: AlertContext): WagonAlert[] {
  const alerts: WagonAlert[] = [];
  const isTank = isTankWagonType(wagon.type);
  const maintProgress = calculateMaintenanceProgress(wagon, workflow, isTank);

  // 1. Rule - Stage Delay
  // We use `updatedAt` to check time in current status
  if (wagon.updatedAt && (wagon.status === "SICK_LINE" || wagon.status === "REPAIR_IN_PROGRESS" || wagon.status === "INSPECTION_PENDING" || wagon.status === "INSPECTION_COMPLETE")) {
    const statusDate = new Date(wagon.updatedAt);
    const diffHours = (now.getTime() - statusDate.getTime()) / (1000 * 60 * 60);
    if (diffHours > THRESHOLDS.STAGE_DELAY_HOURS) {
      alerts.push({
        id: "delay-stage",
        severity: "WARNING",
        category: "DELAY",
        title: "Work Delayed",
        description: `Wagon in ${wagon.status.replace(/_/g, " ")} for over ${Math.floor(diffHours)} hours.`,
        actionType: "VIEW_WORKFLOW",
      });
    }
  }

  // 2. Rule - Material Pending
  if (wagon.defect && wagon.defect.toLowerCase().includes("material")) {
    alerts.push({
      id: "material-pending",
      severity: "WARNING",
      category: "MATERIAL",
      title: "Material Pending",
      description: "Repair is waiting for material.",
      actionType: "VIEW_MAINTENANCE",
    });
  }

  // 3. Rule - Maintenance Incomplete
  if (wagon.status === "REPAIR_IN_PROGRESS") {
    if (maintProgress.completedChecklistItems < maintProgress.totalChecklistItems) {
      const pending = maintProgress.totalChecklistItems - maintProgress.completedChecklistItems;
      alerts.push({
        id: "maint-incomplete",
        severity: "INFO",
        category: "MAINTENANCE",
        title: "Maintenance Incomplete",
        description: `${pending} required checklist item${pending > 1 ? "s" : ""} pending.`,
        actionType: "VIEW_MAINTENANCE",
      });
    }
  }

  // 4. Rule - Inspection Pending
  if (wagon.status === "FIT_CERTIFICATE_PENDING" || wagon.status === "INSPECTION_PENDING") {
    alerts.push({
      id: "insp-pending",
      severity: "INFO",
      category: "INSPECTION",
      title: "Awaiting Inspection",
      description: "Wagon is ready for formal inspection.",
      actionType: "VIEW_INSPECTION",
    });
  }

  // 5. Rule - Failed Inspection
  if (wagon.fitConfirmation && !wagon.fitConfirmation.inspectorVerified && wagon.status !== "FIT_READY" && wagon.status !== "RELEASED") {
    alerts.push({
      id: "insp-failed",
      severity: "CRITICAL",
      category: "INSPECTION",
      title: "Inspection Failed",
      description: "Corrective work required.",
      actionType: "VIEW_INSPECTION",
    });
  }

  // 6. Rule - Ready For Next Action
  const validTargets = getValidTargetColumns(wagon.status);
  
  if (wagon.status === "REPAIR_COMPLETE" && validTargets.includes("INSPECTION")) {
    alerts.push({
      id: "ready-insp",
      severity: "INFO",
      category: "READY",
      title: "Ready for Inspection",
      description: "Maintenance completed.",
    });
  }

  if (wagon.status === "FIT_CERTIFICATE_PENDING" && wagon.fitConfirmation?.inspectorVerified && validTargets.includes("READY")) {
    alerts.push({
      id: "ready-fit",
      severity: "INFO",
      category: "READY",
      title: "Ready for Fit Certification",
      description: "Inspection passed successfully.",
    });
  }
  
  if (wagon.status === "FIT_READY" && validTargets.includes("RELEASED")) {
    alerts.push({
      id: "ready-release",
      severity: "INFO",
      category: "READY",
      title: "Ready for Release",
      description: "All conditions met for release.",
    });
  }

  // Prioritize alerts: CRITICAL > WARNING > INFO
  const severityOrder = { "CRITICAL": 0, "WARNING": 1, "INFO": 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}
