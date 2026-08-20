// Presentation helpers for Wagon display
// Handles formatting without changing underlying data

export function getWagonSubtypeDisplay(isSteamed: boolean | undefined): { short: string; full: string } {
  return {
    short: isSteamed ? "[S]" : "[NS]",
    full: isSteamed ? "Steam" : "Non-Steam",
  };
}

export function getRailwayShortName(railway: string | undefined | null): { short: string; full: string } {
  if (!railway) return { short: "", full: "" };
  
  const mapping: Record<string, string> = {
    "Central Railway": "CR",
    "Eastern Railway": "ER",
    "East Central Railway": "ECR",
    "East Coast Railway": "ECoR",
    "Northern Railway": "NR",
    "North Central Railway": "NCR",
    "North Eastern Railway": "NER",
    "Northeast Frontier Railway": "NFR",
    "North Western Railway": "NWR",
    "Southern Railway": "SR",
    "South Central Railway": "SCR",
    "South Eastern Railway": "SER",
    "South East Central Railway": "SECR",
    "South Western Railway": "SWR",
    "Western Railway": "WR",
    "West Central Railway": "WCR"
  };

  // If known, use the mapped short name. Otherwise fall back to the original value.
  const short = mapping[railway] || railway;
  return { short, full: railway };
}
