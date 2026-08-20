import { Wagon } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { getBoardColumn } from "./statusMapping";

export function SickLineBoardSummary({ wagons }: { wagons: Wagon[] }) {
  const active = wagons.length;
  const wip = wagons.filter(w => getBoardColumn(w.status) === "WORK_IN_PROGRESS").length;
  const inspection = wagons.filter(w => getBoardColumn(w.status) === "INSPECTION").length;
  const ready = wagons.filter(w => getBoardColumn(w.status) === "READY").length;
  const pending = wagons.filter(w => getBoardColumn(w.status) === "WAITING").length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{active}</div><div className="text-xs text-muted-foreground uppercase">Total Active</div></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{wip}</div><div className="text-xs text-muted-foreground uppercase">In Progress</div></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{pending}</div><div className="text-xs text-muted-foreground uppercase">Pending</div></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{inspection}</div><div className="text-xs text-muted-foreground uppercase">Inspection</div></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-500">{ready}</div><div className="text-xs text-muted-foreground uppercase">Fit / Ready</div></CardContent></Card>
    </div>
  );
}
