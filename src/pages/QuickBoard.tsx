import { useState, useMemo } from "react";
import { loadWagons, WagonRepair, SICK_LINES, REPAIR_TYPES } from "@/lib/wagonData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Search, Train, Zap, MapPin } from "lucide-react";

const getSickLineName = (id?: string) => {
  if (!id) return "—";
  return SICK_LINES.find((l) => l.id === id)?.name ?? id;
};

const getDefect = (wagon: WagonRepair): string => {
  const parts: string[] = [];

  // Repair types
  if (wagon.repairTypes && wagon.repairTypes.length > 0) {
    const names = wagon.repairTypes.map(
      (rt) => REPAIR_TYPES.find((r) => r.id === rt)?.name ?? rt
    );
    parts.push(...names);
  }

  // Primary/secondary repairs (legacy)
  if (wagon.primaryRepair) parts.push(wagon.primaryRepair);
  if (wagon.secondaryRepairs) parts.push(...wagon.secondaryRepairs);

  if (parts.length === 0 && wagon.comments) return wagon.comments;
  return parts.length > 0 ? parts.join(", ") : "—";
};

const formatArrival = (dateStr: string, timeStr?: string) => {
  const date = new Date(dateStr);
  const dateFormatted = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // If time is separately stored
  if (timeStr) return { date: dateFormatted, time: timeStr };

  // Otherwise parse time from the date string itself
  const timeFormatted = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return { date: dateFormatted, time: timeFormatted };
};

const LINE_COLORS: Record<string, string> = {
  line1: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-900",
  line2: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-900",
  line3: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-900",
  line4: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-900",
  mv_shed: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-900",
  steam_point: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-900",
  yard: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-900",
};

export default function QuickBoard() {
  const wagons = useMemo(() => loadWagons(), []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"in-repair" | "completed" | "all">("in-repair");

  const filtered = useMemo(() => {
    let result = wagons;

    if (statusFilter !== "all") {
      result = result.filter((w) => w.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.wagonNumber.includes(q) ||
          getSickLineName(w.sickLine).toLowerCase().includes(q) ||
          getDefect(w).toLowerCase().includes(q)
      );
    }

    // Sort: newest first
    return [...result].sort(
      (a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime()
    );
  }, [wagons, statusFilter, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Quick Board
          </h1>
          <p className="text-sm text-muted-foreground">
            At-a-glance view of wagons — number, defect, line &amp; arrival.
          </p>
        </div>

        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <TabsList>
            <TabsTrigger value="in-repair">
              Sick ({wagons.filter((w) => w.status === "in-repair").length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Fit ({wagons.filter((w) => w.status === "completed").length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({wagons.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="glass animate-fade-in">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Train className="h-4 w-4 text-primary" />
              Wagon Board
              <Badge variant="secondary" className="ml-1">
                {filtered.length} wagon{filtered.length !== 1 ? "s" : ""}
              </Badge>
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search wagon, defect, line…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Train className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No wagons found</p>
              <p className="text-sm mt-1">Try adjusting your search or status filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="font-semibold w-12">#</TableHead>
                    <TableHead className="font-semibold">Wagon No.</TableHead>
                    <TableHead className="font-semibold">Defect / Repair</TableHead>
                    <TableHead className="font-semibold">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        Line / Location
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Arrival
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((wagon, idx) => {
                    const defect = getDefect(wagon);
                    const { date, time } = formatArrival(wagon.arrivalDate, wagon.arrivalTime);
                    const lineColor = LINE_COLORS[wagon.sickLine ?? ""] ?? "bg-secondary text-secondary-foreground border-border";

                    return (
                      <TableRow
                        key={wagon.id}
                        className="hover:bg-secondary/30 transition-colors group"
                      >
                        <TableCell className="text-muted-foreground text-sm">
                          {idx + 1}
                        </TableCell>

                        {/* Wagon Number */}
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono font-semibold tracking-wider text-sm">
                              {wagon.wagonNumber}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {wagon.details.typeName}
                              {wagon.details.typeName === "BTPGLN" && (
                                <span className="ml-1 text-orange-600 font-medium">
                                  {wagon.isDegassed ? "• DG" : "• NON-DG"}
                                </span>
                              )}
                              {wagon.details.typeName === "BTPN" && (
                                <span className="ml-1 text-blue-600 font-medium">
                                  {wagon.isSteamed ? "• Steam" : "• without Steam"}
                                </span>
                              )}
                            </span>
                            {wagon.trainNumber && (
                              <span className="text-[10px] text-muted-foreground/70">
                                Train: {wagon.trainNumber}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Defect */}
                        <TableCell className="max-w-[260px]">
                          {defect === "—" ? (
                            <span className="text-muted-foreground text-sm italic">No defect recorded</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {wagon.repairTypes && wagon.repairTypes.length > 0 ? (
                                wagon.repairTypes.map((rt) => {
                                  const rep = REPAIR_TYPES.find((r) => r.id === rt);
                                  return (
                                    <Badge
                                      key={rt}
                                      variant="outline"
                                      className="text-[10px] py-0 px-1.5 bg-primary/5 border-primary/20"
                                    >
                                      {rep?.icon} {rep?.name ?? rt}
                                    </Badge>
                                  );
                                })
                              ) : (
                                <span className="text-sm">{defect}</span>
                              )}
                              {wagon.comments && (
                                <span className="text-xs text-muted-foreground w-full mt-0.5 truncate">
                                  {wagon.comments}
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Line / Location */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs font-semibold ${lineColor}`}
                          >
                            <MapPin className="h-3 w-3 mr-1 shrink-0" />
                            {getSickLineName(wagon.sickLine)}
                          </Badge>
                        </TableCell>

                        {/* Arrival */}
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">{date}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {time}
                            </span>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {wagon.status === "in-repair" ? (
                            <Badge className="bg-warning text-warning-foreground text-xs">
                              Sick
                            </Badge>
                          ) : (
                            <Badge className="bg-success text-success-foreground text-xs">
                              Fit
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
