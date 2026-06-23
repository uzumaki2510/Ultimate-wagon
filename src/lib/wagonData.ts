// Wagon Type Codes (C1, C2)
export const WAGON_TYPE_CODES: Record<string, { name: string; category: string }> = {
  // Open Wagons
  "10": { name: "BOXN", category: "Open Wagon" },
  "11": { name: "BOXNHA", category: "Open Wagon" },
  "12": { name: "BOXNHS", category: "Open Wagon" },
  "13": { name: "BOXNCR", category: "Open Wagon" },
  "14": { name: "BOXNLW", category: "Open Wagon" },
  "15": { name: "BOXNB", category: "Open Wagon" },
  "16": { name: "BOXNF", category: "Open Wagon" },
  "17": { name: "BOXNG", category: "Open Wagon" },
  "18": { name: "BOY", category: "Open Wagon" },
  "19": { name: "BOST", category: "Open Wagon" },
  "20": { name: "BOXNAL", category: "Open Wagon" },
  "22": { name: "BOXN-HL", category: "Open Wagon" },
  // Covered Wagons
  "30": { name: "BCNA", category: "Covered Wagon" },
  "31": { name: "BCNAHS", category: "Covered Wagon" },
  "32": { name: "BCCNR", category: "Covered Wagon" },
  "33": { name: "BCN-HL", category: "Covered Wagon" },
  // Tank Wagons
  "40": { name: "BTPN", category: "Tank Wagon" },
  "41": { name: "BTPNHS", category: "Tank Wagon" },
  "42": { name: "BTPGLN", category: "Tank Wagon" },
  "43": { name: "BTALN", category: "Tank Wagon" },
  "44": { name: "BTCS", category: "Tank Wagon" },
  "45": { name: "BTPH", category: "Tank Wagon" },
  "46": { name: "BTAP", category: "Tank Wagon" },
  "47": { name: "BTFLN", category: "Tank Wagon" },
  // Flat Wagons
  "55": { name: "BRNA", category: "Flat Wagon" },
  "56": { name: "BRNAHS", category: "Flat Wagon" },
  "57": { name: "BFNS", category: "Flat Wagon" },
  "58": { name: "BOMN", category: "Flat Wagon" },
  "59": { name: "BRSTH", category: "Flat Wagon" },
  "60": { name: "BFAT", category: "Flat Wagon" },
  "61": { name: "BLCA", category: "Flat Wagon" },
  "62": { name: "BLCB", category: "Flat Wagon" },
  // Hopper Wagons
  "70": { name: "BOBYN", category: "Hopper Wagon" },
  "71": { name: "BOBYNHS", category: "Hopper Wagon" },
  "72": { name: "BOBRN", category: "Hopper Wagon" },
  "73": { name: "BOBRNHS", category: "Hopper Wagon" },
  "74": { name: "BOBRAL", category: "Hopper Wagon" },
  // Well Wagon
  "80": { name: "BWTB", category: "Well Wagon" },
  // Brake Van
  "85": { name: "BVZC", category: "Brake Van" },
  "86": { name: "BVZI", category: "Brake Van" },
  "87": { name: "BVCM", category: "Brake Van" },
};

// Railway Ownership Codes (C3, C4)
export const RAILWAY_CODES: Record<string, string> = {
  "01": "Central Railway",
  "02": "Eastern Railway",
  "03": "Northern Railway",
  "04": "North East Railway",
  "05": "Northeast Frontier Railway",
  "06": "Southern Railway",
  "07": "South Eastern Railway",
  "08": "Western Railway",
  "09": "South Central Railway",
  "10": "East Central Railway",
  "11": "North Western Railway",
  "12": "East Coast Railway",
  "13": "North Central Railway",
  "14": "South East Central Railway",
  "15": "South Western Railway",
  "16": "West Central Railway",
  "25": "CONCOR",
  "26": "Private Parties",
};

// Sick Line options
export const SICK_LINES = [
  { id: "line1", name: "Line 1" },
  { id: "line2", name: "Line 2" },
  { id: "line3", name: "Line 3" },
  { id: "line4", name: "Line 4" },
  { id: "mv_shed", name: "MV Shed" },
  { id: "steam_point", name: "Steam Point" },
  { id: "yard", name: "Yard" },
] as const;

export type SickLine = typeof SICK_LINES[number]["id"];

// Repair work types (Legacy)
export const REPAIR_TYPES = [
  { id: "wheel", name: "Wheel Repair", icon: "🔧" },
  { id: "brake", name: "Brake System", icon: "🛑" },
  { id: "coupler", name: "Coupler/Draft Gear", icon: "🔗" },
  { id: "body", name: "Body Repair", icon: "🛠️" },
  { id: "bogie", name: "Bogie Overhaul", icon: "⚙️" },
  { id: "painting", name: "Painting", icon: "🎨" },
  { id: "suspension", name: "Suspension", icon: "🔩" },
  { id: "door", name: "Door/Hatch", icon: "🚪" },
] as const;

export type RepairType = typeof REPAIR_TYPES[number]["id"];

export type DefectSeverity = "Safety Critical" | "Urgent" | "Normal";

export interface DefectOption {
  name: string;
  severity: DefectSeverity;
}

export interface DefectGroup {
  groupName: string;
  defects: DefectOption[];
}

export const DEFECT_LIBRARY: DefectGroup[] = [
  {
    groupName: "Wheel & Axle",
    defects: [
      { name: "Wheel Repair", severity: "Normal" },
      { name: "Wheel Flat", severity: "Urgent" },
      { name: "Wheel Crack", severity: "Safety Critical" },
      { name: "Thin Flange", severity: "Normal" },
      { name: "Bearing Alert", severity: "Urgent" },
      { name: "Hot Axle", severity: "Safety Critical" },
      { name: "Axle Box Issue", severity: "Normal" },
      { name: "Wheel Profile Required", severity: "Normal" },
    ]
  },
  {
    groupName: "Brake System",
    defects: [
      { name: "Brake Binding", severity: "Urgent" },
      { name: "Brake Pipe Leakage", severity: "Urgent" },
      { name: "Brake Cylinder Defect", severity: "Normal" },
      { name: "Distributor Valve Defect", severity: "Urgent" },
      { name: "Air Pressure Issue", severity: "Normal" },
      { name: "Brake Failure", severity: "Safety Critical" },
      { name: "Single Wagon Test Required", severity: "Normal" },
    ]
  },
  {
    groupName: "Coupler / CBC / Draft Gear",
    defects: [
      { name: "Coupler / Draft Gear", severity: "Urgent" },
      { name: "CBC Defect", severity: "Safety Critical" },
      { name: "Knuckle Defect", severity: "Normal" },
      { name: "Draft Gear Damage", severity: "Urgent" },
      { name: "Buffer Issue", severity: "Normal" },
      { name: "Train Parting Risk", severity: "Safety Critical" },
    ]
  },
  {
    groupName: "Body & Structure",
    defects: [
      { name: "Body Repair", severity: "Normal" },
      { name: "Side Wall Damage", severity: "Normal" },
      { name: "Floor Damage", severity: "Normal" },
      { name: "Roof Damage", severity: "Normal" },
      { name: "Ladder Defect", severity: "Normal" },
      { name: "Door / Hatch Defect", severity: "Normal" },
      { name: "Barrel Defect", severity: "Normal" },
      { name: "Panel Damage", severity: "Normal" },
      { name: "Corrosion", severity: "Normal" },
      { name: "Crack / Bulging", severity: "Normal" },
    ]
  },
  {
    groupName: "Underframe",
    defects: [
      { name: "Underframe Defect", severity: "Normal" },
      { name: "Head Stock Defect", severity: "Normal" },
      { name: "Sole Bar Defect", severity: "Normal" },
      { name: "Cross Bar Defect", severity: "Normal" },
      { name: "Floor Plate Defect", severity: "Normal" },
      { name: "De-rusting Required", severity: "Normal" },
    ]
  },
  {
    groupName: "Bogie & Suspension",
    defects: [
      { name: "Bogie Overhaul", severity: "Normal" },
      { name: "Suspension", severity: "Normal" },
      { name: "Spring Defect", severity: "Normal" },
      { name: "Snubber Spring Issue", severity: "Normal" },
      { name: "Centre Pivot Issue", severity: "Normal" },
      { name: "Elastomeric Pad Issue", severity: "Normal" },
      { name: "Side Bearer Issue", severity: "Normal" },
    ]
  },
  {
    groupName: "Tank Wagon Work",
    defects: [
      { name: "Valve Defect", severity: "Urgent" },
      { name: "Master Valve Defect", severity: "Urgent" },
      { name: "Bottom Discharge Valve Defect", severity: "Urgent" },
      { name: "Delivery Pipe Defect", severity: "Normal" },
      { name: "Air Leakage", severity: "Safety Critical" },
      { name: "Tank Barrel Leakage", severity: "Safety Critical" },
      { name: "Tank Barrel Crack", severity: "Safety Critical" },
      { name: "Manhole Cover Defect", severity: "Normal" },
      { name: "Safety Valve Defect", severity: "Normal" },
      { name: "Steam Cleaning Required", severity: "Normal" },
      { name: "Hydro Testing Required", severity: "Normal" },
      { name: "Purging Required", severity: "Normal" },
      { name: "De-Gassing Required", severity: "Normal" },
    ]
  },
  {
    groupName: "Painting / Finishing",
    defects: [
      { name: "Painting", severity: "Normal" },
      { name: "Marking", severity: "Normal" },
      { name: "Cleaning", severity: "Normal" },
      { name: "Surface Preparation", severity: "Normal" },
      { name: "Minor Finishing", severity: "Normal" },
    ]
  },
  {
    groupName: "Scheduled Maintenance",
    defects: [
      { name: "ROH Due", severity: "Normal" },
      { name: "POH Due", severity: "Normal" },
      { name: "Yard Examination", severity: "Normal" },
      { name: "Periodic Inspection", severity: "Normal" },
      { name: "Fit Inspection", severity: "Normal" },
    ]
  }
];

export interface WagonDetails {
  wagonNumber: string;
  typeCode: string;
  typeName: string;
  category: string;
  railwayCode: string;
  railwayName: string;
  yearOfManufacture: string;
  serialNumber: string;
  checkDigit: string;
  isValidCheckDigit: boolean;
}

// BTPGLN Workflow Data
export interface BTPGLNWorkflowData {
  currentStage: "sick_reason" | "rrt_degassing" | "hapa_examination" | "rrt_purging" | "yard_examination" | "fit_for_loading";
  sickReason?: "under_gear" | "upper_gear" | "roh_due" | "poh_due";
  degassingOption?: "without_degassing" | "after_degassing";
  rectificationType?: string;
  stageHistory: {
    stage: string;
    completedAt: string;
    notes?: string;
    markedSickDuringPurging?: boolean;
  }[];
  notes: Record<string, string>;
}

// BTPN/BTPFLN Workflow Data (different from BTPGLN)
export interface BTPNWorkflowData {
  currentStage: "yard_issue" | "steaming" | "yard_exam_sick" | "steam_cleaning" | "rectification" | "placement_decision" | "hydro_testing" | "fit_for_use";
  placementType?: "mv_shed" | "sick_line";
  mvShedWorkTypes?: string[];
  stageHistory: {
    stage: string;
    completedAt: string;
    notes?: string;
  }[];
  notes: Record<string, string>;
}

export interface WagonRepair {
  id: string;
  wagonNumber: string;
  details: WagonDetails;
  repairTypes: RepairType[];
  primaryRepair?: string;
  secondaryRepairs?: string[];
  arrivalDate: string;
  arrivalTime?: string;
  trainNumber?: string;
  completedDate?: string;
  status: "in-repair" | "completed" | "sick" | "delayed";
  notes?: string;
  comments?: string;
  sickLine?: SickLine;
  btpglnWorkflow?: BTPGLNWorkflowData;
  btpnWorkflow?: BTPNWorkflowData;
  isDegassed?: boolean;
  isSteamed?: boolean;
}

export interface MonthlyArchive {
  id: string;
  month: string; // Format: "YYYY-MM"
  monthLabel: string; // Format: "January 2025"
  archivedAt: string;
  wagons: WagonRepair[];
}

// Count words in a string (for comment limit)
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Calculate check digit using the 6-step algorithm
export function calculateCheckDigit(wagonNumber: string): number {
  if (wagonNumber.length < 10) return -1;
  
  const digits = wagonNumber.slice(0, 10).split("").map(Number);
  
  // Step 1: Sum of even position digits (C2, C4, C6, C8, C10)
  const s1 = digits[1] + digits[3] + digits[5] + digits[7] + digits[9];
  
  // Step 2: Multiply by 3
  const step2 = s1 * 3;
  
  // Step 3: Sum of odd position digits (C1, C3, C5, C7, C9)
  const s2 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  
  // Step 4: Add step 2 and step 3
  const s4 = step2 + s2;
  
  // Step 5 & 6: Check digit is the number needed to round up to next multiple of 10
  const remainder = s4 % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

// Parse wagon number and extract details
export function parseWagonNumber(wagonNumber: string): WagonDetails | null {
  // Remove any spaces or dashes
  const cleanNumber = wagonNumber.replace(/[\s-]/g, "");
  
  if (cleanNumber.length !== 11 || !/^\d{11}$/.test(cleanNumber)) {
    return null;
  }
  
  const typeCode = cleanNumber.slice(0, 2);
  const railwayCode = cleanNumber.slice(2, 4);
  const yearCode = cleanNumber.slice(4, 6);
  const serialNumber = cleanNumber.slice(6, 10);
  const checkDigit = cleanNumber.slice(10, 11);
  
  const wagonType = WAGON_TYPE_CODES[typeCode];
  const railwayName = RAILWAY_CODES[railwayCode];
  
  // Calculate expected check digit
  const expectedCheckDigit = calculateCheckDigit(cleanNumber);
  const isValidCheckDigit = parseInt(checkDigit) === expectedCheckDigit;
  
  // Convert year code to full year (assuming 2000s for codes 00-23, 1900s for 24-99)
  const yearNum = parseInt(yearCode);
  const fullYear = yearNum <= 23 ? 2000 + yearNum : 1900 + yearNum;
  
  return {
    wagonNumber: cleanNumber,
    typeCode,
    typeName: wagonType?.name || "Unknown",
    category: wagonType?.category || "Unknown",
    railwayCode,
    railwayName: railwayName || "Unknown Railway",
    yearOfManufacture: fullYear.toString(),
    serialNumber,
    checkDigit,
    isValidCheckDigit,
  };
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Storage keys
const STORAGE_KEY = "railway_cw_wagons_v2";
const DELETED_STORAGE_KEY = "railway_cw_deleted_wagons";
const ARCHIVES_STORAGE_KEY = "railway_cw_monthly_archives";
const LAST_ARCHIVE_CHECK_KEY = "railway_cw_last_archive_check";

// Load wagons from localStorage
export function loadWagons(): WagonRepair[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save wagons to localStorage
export function saveWagons(wagons: WagonRepair[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wagons));
}

// Load deleted wagons from localStorage
export function loadDeletedWagons(): WagonRepair[] {
  try {
    const data = localStorage.getItem(DELETED_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save deleted wagons to localStorage
export function saveDeletedWagons(wagons: WagonRepair[]): void {
  localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(wagons));
}

// Load monthly archives from localStorage
export function loadMonthlyArchives(): MonthlyArchive[] {
  try {
    const data = localStorage.getItem(ARCHIVES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save monthly archives to localStorage
export function saveMonthlyArchives(archives: MonthlyArchive[]): void {
  localStorage.setItem(ARCHIVES_STORAGE_KEY, JSON.stringify(archives));
}

// Get month label from date
function getMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Get month key from date (YYYY-MM format)
function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Check and perform monthly archive if needed
export function checkAndArchiveMonthlyData(): { archived: boolean; monthLabel?: string; wagonCount?: number } {
  const now = new Date();
  const currentDay = now.getDate();
  
  // Only archive on the 1st of the month
  if (currentDay !== 1) {
    return { archived: false };
  }
  
  // Check if we already archived today
  const lastCheck = localStorage.getItem(LAST_ARCHIVE_CHECK_KEY);
  const todayKey = now.toISOString().split("T")[0];
  
  if (lastCheck === todayKey) {
    return { archived: false };
  }
  
  // Get current wagons
  const wagons = loadWagons();
  
  if (wagons.length === 0) {
    localStorage.setItem(LAST_ARCHIVE_CHECK_KEY, todayKey);
    return { archived: false };
  }
  
  // Get previous month details
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthKey = getMonthKey(prevMonth);
  const monthLabel = getMonthLabel(prevMonth);
  
  // Create archive
  const archives = loadMonthlyArchives();
  
  // Check if this month is already archived
  if (archives.some((a) => a.month === monthKey)) {
    localStorage.setItem(LAST_ARCHIVE_CHECK_KEY, todayKey);
    return { archived: false };
  }
  
  const newArchive: MonthlyArchive = {
    id: generateId(),
    month: monthKey,
    monthLabel,
    archivedAt: now.toISOString(),
    wagons: wagons,
  };
  
  // Save archive
  saveMonthlyArchives([newArchive, ...archives]);
  
  // Clear current wagons
  saveWagons([]);
  
  // Mark as checked
  localStorage.setItem(LAST_ARCHIVE_CHECK_KEY, todayKey);
  
  return { archived: true, monthLabel, wagonCount: wagons.length };
}