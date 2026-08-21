import { WagonStatus, SICK_LINE_LOCATIONS, SickLineLocation } from "@/types";

export type BoardColumn = SickLineLocation;

export const COLUMNS: { id: BoardColumn; title: string }[] = [
  { id: "Yard", title: "Yard" },
  { id: "Steam Point", title: "Steam Point" },
  { id: "De-Gassing", title: "De-Gassing" },
  { id: "MV Shed", title: "MV Shed" },
  { id: "New ROH Shed", title: "New ROH Shed" },
  { id: "Old Sick Line", title: "Old Sick Line" },
  { id: "Booked for Purging", title: "Booked for Purging (Fit)" }
];

export const getBoardColumn = (currentLocation: SickLineLocation | string | undefined): BoardColumn => {
  if (currentLocation && SICK_LINE_LOCATIONS.includes(currentLocation as SickLineLocation)) {
    return currentLocation as BoardColumn;
  }
  return "Yard"; // Fallback safe rule
};

export const getValidTargetColumns = (): BoardColumn[] => {
  // Free movement rule as requested: "Do not invent restrictions... authorized staff may select an appropriate location"
  return [...SICK_LINE_LOCATIONS];
};

export const getTargetStatusForColumn = (currentStatus: WagonStatus, targetColumn: BoardColumn): WagonStatus | null => {
  // In the new operational design, location drag-and-drop only updates location. 
  // We return the same status so the technical status doesn't unintentionally advance.
  return currentStatus;
};

