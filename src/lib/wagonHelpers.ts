export type WagonCategory = "Open Wagon" | "Covered Wagon" | "Tank Wagon" | "Flat Wagon" | "Hopper Wagon" | "Well Wagon" | "Brake Van" | "Other";

export function getWagonCategory(type: string | undefined): WagonCategory {
  if (!type) return "Other";
  const t = type.toUpperCase();

  if (["BOXN", "BOXNHL", "BOXNHS", "BOXNHA", "BOXNCR", "BOXNLW", "BOXNB", "BOXNF", "BOXNG", "BOY", "BOST"].includes(t)) return "Open Wagon";
  if (["BCN", "BCNA", "BCNAHS", "BCNMI", "BCNHL", "BCCNR"].includes(t)) return "Covered Wagon";
  if (["BTPN", "BTPNHS", "BTPGLN", "BTPFLN", "BTALN", "BTCS", "BTPH", "BTAP"].includes(t)) return "Tank Wagon";
  if (["BRNA", "BRNAHS", "BFNS", "BOMN", "BRSTH", "BFAT", "BLCA", "BLCB"].includes(t)) return "Flat Wagon";
  if (["BOBYN", "BOBYNHS", "BOBRN", "BOBRNHS", "BOBRAL"].includes(t)) return "Hopper Wagon";
  if (t === "BWTB") return "Well Wagon";
  if (["BVZC", "BVZI", "BVCM"].includes(t)) return "Brake Van";

  // Fallback pattern matching
  if (t.includes("BOX")) return "Open Wagon";
  if (t.includes("BCN")) return "Covered Wagon";
  if (t.includes("BTP") || t.includes("BT")) return "Tank Wagon";
  
  return "Other";
}

export type DefectSeverity = "Safety Critical" | "Urgent" | "Normal";

export function getDefectSeverity(defect: string | undefined): DefectSeverity {
  if (!defect) return "Normal";
  const lowerDefect = defect.toLowerCase();

  const critical = ["wheel crack", "hot axle", "brake failure", "cbc defect", "air leakage"];
  const urgent = ["wheel alert", "bearing alert", "brake binding", "valve defect", "master valve defect"];

  if (critical.some(c => lowerDefect.includes(c))) return "Safety Critical";
  if (urgent.some(u => lowerDefect.includes(u))) return "Urgent";
  return "Normal";
}

export function getDefectBadgeClass(defect: string | undefined): string {
  if (!defect || defect.toLowerCase() === "completed" || defect.toLowerCase() === "fit") {
    return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400";
  }

  const severity = getDefectSeverity(defect);
  switch (severity) {
    case "Safety Critical":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 font-bold";
    case "Urgent":
      return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 font-semibold";
    default:
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400";
  }
}
