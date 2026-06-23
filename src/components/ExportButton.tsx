import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WagonRepair, SICK_LINES } from "@/lib/wagonData";
import { Download, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";

interface ExportButtonProps {
  wagons: WagonRepair[];
  selectedWagons?: WagonRepair[];
}

export function ExportButton({ wagons, selectedWagons = [] }: ExportButtonProps) {
  const getSickLineName = (sickLineId?: string) => {
    if (!sickLineId) return "";
    const line = SICK_LINES.find(l => l.id === sickLineId);
    return line?.name || "";
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const exportData = (dataToExport: WagonRepair[], suffix: string = "") => {
    if (dataToExport.length === 0) return;

    // Prepare data for export
    const exportData = dataToExport.map((wagon, index) => ({
      "Sr. No.": index + 1,
      "Wagon Number": wagon.wagonNumber,
      "Type": wagon.details.typeName === "BTPGLN" 
        ? `BTPGLN (${wagon.isDegassed ? "DG" : "NON-DG"})` 
        : wagon.details.typeName === "BTPN"
          ? `BTPN (${wagon.isSteamed ? "Steam" : "without Steam"})`
          : wagon.details.typeName,
      "Category": wagon.details.category,
      "Railway": wagon.details.railwayName,
      "Year of Manufacture": wagon.details.yearOfManufacture,
      "SICK_LINE": getSickLineName(wagon.sickLine),
      "Sick (Arrival)": formatDateTime(wagon.arrivalDate),
      "Fit (Completion)": wagon.completedDate ? formatDateTime(wagon.completedDate) : "",
      "Status": wagon.status === "in-repair" ? "SICK_LINE" : "FIT_READY",
      "Comments": wagon.comments || "",
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws["!cols"] = [
      { wch: 8 },   // Sr. No.
      { wch: 15 },  // Wagon Number
      { wch: 12 },  // Type
      { wch: 15 },  // Category
      { wch: 25 },  // Railway
      { wch: 18 },  // Year
      { wch: 10 },  // Sick Line
      { wch: 22 },  // Sick
      { wch: 22 },  // Fit
      { wch: 10 },  // Status
      { wch: 30 },  // Comments
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Wagon Register");

    // Generate filename with date
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).replace(/ /g, "-");
    
    const fileName = `Wagon_Register_CW_Dept_${dateStr}${suffix}.xlsx`;

    // Download file
    XLSX.writeFile(wb, fileName);
  };

  const handleExportAll = () => {
    exportData(wagons, "_All");
  };

  const handleExportSelected = () => {
    exportData(selectedWagons, "_Selected");
  };

  const hasSelection = selectedWagons.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={wagons.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportAll} disabled={wagons.length === 0}>
          Export All ({wagons.length})
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportSelected} disabled={!hasSelection}>
          Export Selected ({selectedWagons.length})
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}