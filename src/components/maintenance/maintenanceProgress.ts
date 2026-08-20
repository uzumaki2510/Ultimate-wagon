import { InspectionChecklist, ChecklistItem, WorkflowItem, Wagon } from "@/types";

export interface ChecklistSection {
  title: string;
  items: { key: string; label: string; item?: ChecklistItem }[];
}

const CHECKLIST_SECTIONS: { title: string; keys: { key: keyof InspectionChecklist; label: string }[] }[] = [
  {
    title: "Wheel & Axle Check",
    keys: [
      { key: "wheelCondition", label: "Wheel Condition" },
      { key: "bearingCondition", label: "Bearing Condition" },
      { key: "axleBox", label: "Axle Box" },
      { key: "wheelProfile", label: "Wheel Profile" },
    ],
  },
  {
    title: "Brake Check",
    keys: [
      { key: "brakePipe", label: "Brake Pipe" },
      { key: "brakeCylinder", label: "Brake Cylinder" },
      { key: "distributorValve", label: "Distributor Valve" },
      { key: "brakeBinding", label: "Brake Binding" },
      { key: "airPressure", label: "Air Pressure" },
    ],
  },
  {
    title: "Coupler / CBC Check",
    keys: [
      { key: "cbc", label: "CBC" },
      { key: "knuckle", label: "Knuckle" },
      { key: "draftGear", label: "Draft Gear" },
      { key: "buffer", label: "Buffer" },
    ],
  },
  {
    title: "Body / Structure Check",
    keys: [
      { key: "bodyCondition", label: "Body Condition" },
      { key: "doorHatch", label: "Door / Hatch" },
      { key: "ladder", label: "Ladder" },
      { key: "floorRoofSideWall", label: "Floor / Roof / Side Wall" },
      { key: "corrosion", label: "Corrosion" },
    ],
  },
  {
    title: "Underframe Check",
    keys: [
      { key: "headStockChecked", label: "Head Stock" },
      { key: "soleBarChecked", label: "Sole Bar" },
      { key: "crossBarChecked", label: "Cross Bar" },
      { key: "floorPlateChecked", label: "Floor Plate" },
      { key: "derustingChecked", label: "Derusting" },
    ],
  },
  {
    title: "Bogie & Suspension Check",
    keys: [
      { key: "springChecked", label: "Spring" },
      { key: "snubberSpringChecked", label: "Snubber Spring" },
      { key: "sideBearerChecked", label: "Side Bearer" },
      { key: "centrePivotChecked", label: "Centre Pivot" },
      { key: "elastomericPadChecked", label: "Elastomeric Pad" },
      { key: "suspensionChecked", label: "Suspension" },
    ],
  },
  {
    title: "Painting / Finishing",
    keys: [
      { key: "surfacePrepared", label: "Surface Preparation" },
      { key: "paintingCompleted", label: "Painting" },
      { key: "markingCompleted", label: "Marking" },
      { key: "finalFinishingChecked", label: "Final Finishing" },
    ],
  },
  {
    title: "Scheduled Maintenance",
    keys: [
      { key: "rohPohStatusChecked", label: "ROH/POH Status" },
      { key: "yardExamCompleted", label: "Yard Exam" },
      { key: "periodicInspectionCompleted", label: "Periodic Inspection" },
      { key: "maintenanceFinalInspectionCompleted", label: "Maintenance Final Inspection" },
    ],
  },
  {
    title: "Tank Wagon Safety",
    keys: [
      { key: "masterValve", label: "Master Valve" },
      { key: "bottomDischargeValve", label: "Bottom Discharge Valve" },
      { key: "deliveryPipe", label: "Delivery Pipe" },
      { key: "tankBarrel", label: "Tank Barrel" },
      { key: "leakage", label: "Leakage Check" },
      { key: "safetyFittings", label: "Safety Fittings" },
      { key: "steamPurgeDegassing", label: "Steam / Purge / Degassing" },
    ],
  },
  {
    title: "Final Check",
    keys: [
      { key: "defectRectified", label: "Defect Rectified" },
      { key: "finalInspectionDone", label: "Final Inspection Done" },
      { key: "readyForFitMarking", label: "Ready For Fit Marking" },
    ],
  },
];

export function getChecklistSections(checklist: InspectionChecklist | undefined, isTank: boolean): ChecklistSection[] {
  const cl = checklist || {};
  return CHECKLIST_SECTIONS
    .filter(section => {
      if (section.title === "Tank Wagon Safety" && !isTank) return false;
      return true;
    })
    .map(section => ({
      title: section.title,
      items: section.keys.map(k => ({
        key: k.key,
        label: k.label,
        item: cl[k.key],
      })),
    }));
}

export interface MaintenanceProgressResult {
  totalChecklistItems: number;
  completedChecklistItems: number;
  checklistPercentage: number;
  totalStages: number;
  completedStages: number;
  stagePercentage: number;
  overallPercentage: number;
}

export function calculateMaintenanceProgress(
  wagon: Wagon,
  workflow: WorkflowItem | undefined,
  isTank: boolean
): MaintenanceProgressResult {
  // Checklist progress
  const sections = getChecklistSections(wagon.inspectionChecklist, isTank);
  let totalChecklistItems = 0;
  let completedChecklistItems = 0;
  sections.forEach(section => {
    section.items.forEach(item => {
      totalChecklistItems++;
      if (item.item?.checked) completedChecklistItems++;
    });
  });
  const checklistPercentage = totalChecklistItems === 0 ? 0 : Math.round((completedChecklistItems / totalChecklistItems) * 100);

  // Stage progress
  const totalStages = workflow?.stages.length || 0;
  const completedStages = workflow?.stages.filter(s => s.status === "Done").length || 0;
  const stagePercentage = totalStages === 0 ? 0 : Math.round((completedStages / totalStages) * 100);

  // Overall = average of checklist and stage
  const overallPercentage = totalChecklistItems === 0 && totalStages === 0
    ? 0
    : Math.round(
        ((completedChecklistItems + completedStages) / (totalChecklistItems + totalStages)) * 100
      );

  return {
    totalChecklistItems,
    completedChecklistItems,
    checklistPercentage,
    totalStages,
    completedStages,
    stagePercentage,
    overallPercentage,
  };
}
