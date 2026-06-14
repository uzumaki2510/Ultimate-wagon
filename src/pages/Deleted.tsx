import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  WagonRepair,
  SICK_LINES,
  loadWagons,
  saveWagons,
  loadDeletedWagons,
  saveDeletedWagons,
} from "@/lib/wagonData";
import { useToast } from "@/hooks/use-toast";
import { Trash2, RotateCcw, Archive, Search } from "lucide-react";

const Deleted = () => {
  const [deletedWagons, setDeletedWagons] = useState<WagonRepair[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    setDeletedWagons(loadDeletedWagons());
  }, []);

  useEffect(() => {
    saveDeletedWagons(deletedWagons);
  }, [deletedWagons]);

  const handleRestore = (id: string) => {
    const wagonToRestore = deletedWagons.find((w) => w.id === id);
    if (wagonToRestore) {
      const currentWagons = loadWagons();
      saveWagons([wagonToRestore, ...currentWagons]);
      setDeletedWagons((prev) => prev.filter((w) => w.id !== id));
      toast({
        title: "Wagon Restored",
        description: "Wagon has been restored to the register.",
      });
    }
  };

  const handlePermanentDelete = (id: string) => {
    setDeletedWagons((prev) => prev.filter((w) => w.id !== id));
    toast({
      title: "Permanently Deleted",
      description: "Wagon has been permanently removed.",
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getSickLineName = (sickLineId?: string) => {
    if (!sickLineId) return "—";
    const line = SICK_LINES.find(l => l.id === sickLineId);
    return line?.name || "—";
  };

  const filteredWagons = deletedWagons.filter((w) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      w.wagonNumber.toLowerCase().includes(query) ||
      w.details.typeName.toLowerCase().includes(query) ||
      w.details.railwayName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Deleted Register</h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Restore or permanently delete wagons from the system."
            : "View wagons that have been removed from the active register."}
        </p>
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 rounded-md border border-amber-400/40 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
          <span className="font-semibold">View only</span> — Only administrators can restore or permanently delete wagons.
        </div>
      )}

      <Card className="border-destructive/20 bg-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Archive className="h-5 w-5 text-destructive" />
              Deleted Wagons
              <Badge variant="destructive" className="ml-2">
                {filteredWagons.length} wagon{filteredWagons.length !== 1 ? "s" : ""}
              </Badge>
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deleted wagons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredWagons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{searchQuery ? "No wagons match your search" : "No deleted wagons"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow className="bg-destructive/5">
                    <TableHead className="font-semibold">Wagon No.</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Railway</TableHead>
                    <TableHead className="font-semibold">Sick Line</TableHead>
                    <TableHead className="font-semibold">Sick Date</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWagons.map((wagon) => (
                    <TableRow key={wagon.id} className="hover:bg-destructive/5 transition-colors">
                      <TableCell className="font-mono font-medium">
                        {wagon.wagonNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-xs">{wagon.details.typeName}</p>
                          <p className="text-[10px] text-muted-foreground">{wagon.details.category}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-xs">
                        {wagon.details.railwayName}
                      </TableCell>
                      <TableCell className="text-xs">{getSickLineName(wagon.sickLine)}</TableCell>
                      <TableCell className="text-xs">{formatDateTime(wagon.arrivalDate)}</TableCell>
                      <TableCell className="text-right">
                        {isAdmin ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-success hover:text-success hover:bg-success/10"
                              onClick={() => handleRestore(wagon.id)}
                              title="Restore Wagon"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handlePermanentDelete(wagon.id)}
                              title="Delete Permanently"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Deleted;
