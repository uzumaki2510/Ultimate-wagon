import { Wagon } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { getBoardColumn } from "./statusMapping";

export function SickLineBoardSummary({ wagons }: { wagons: Wagon[] }) {
  const active = wagons.length;
  // Based on the new setup, we can define In Process as MV Shed, New ROH Shed, Old Sick Line, Steam Point, De-Gassing.
  // Wait, let's keep it simple: Yard is "Yard". Fit is "Booked for Purging" or global status "FIT_READY".
  const yard = wagons.filter(w => getBoardColumn(w.currentLocation) === "Yard").length;
  const fitReady = wagons.filter(w => w.status === "FIT_READY" || getBoardColumn(w.currentLocation) === "Booked for Purging").length;
  const inProcess = active - yard - fitReady; // Simplified
  
  // Just use 4 basic metrics since we don't have a reliable 'Delayed' metric yet
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{active}</div><div className="text-xs text-muted-foreground uppercase">Total Active</div></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{yard}</div><div className="text-xs text-muted-foreground uppercase">Yard</div></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{inProcess}</div><div className="text-xs text-muted-foreground uppercase">In Process</div></CardContent></Card>
      <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-500">{fitReady}</div><div className="text-xs text-muted-foreground uppercase">Fit / Ready</div></CardContent></Card>
    </div>
  );
}
