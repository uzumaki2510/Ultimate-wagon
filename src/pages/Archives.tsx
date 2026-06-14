import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MonthlyArchive,
  WagonRepair,
  SICK_LINES,
  loadMonthlyArchives,
} from "@/lib/wagonData";
import { Calendar, FileSpreadsheet, Download, CheckCircle, Clock, FileText, History } from "lucide-react";
import * as XLSX from "xlsx";

export default function Archives() {
  const { memos, audit } = useAppStore();
  const archivedMemos = memos.filter((m) => m.archived);
  const [wagonArchives, setWagonArchives] = useState<MonthlyArchive[]>([]);

  useEffect(() => {
    setWagonArchives(loadMonthlyArchives());
  }, []);

  const getSickLineName = (sickLineId?: string) => {
    if (!sickLineId) return "";
    const line = SICK_LINES.find((l) => l.id === sickLineId);
    return line?.name || "";
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const exportArchive = (archive: MonthlyArchive) => {
    const exportData = archive.wagons.map((wagon, index) => ({
      "Sr. No.": index + 1,
      "Wagon Number": wagon.wagonNumber,
      "Type": wagon.details.typeName,
      "Category": wagon.details.category,
      "Railway": wagon.details.railwayName,
      "Year of Manufacture": wagon.details.yearOfManufacture,
      "Sick Line": getSickLineName(wagon.sickLine),
      "Sick (Arrival)": new Date(wagon.arrivalDate).toLocaleString("en-IN"),
      "Fit (Completion)": wagon.completedDate
        ? new Date(wagon.completedDate).toLocaleString("en-IN")
        : "",
      "Status": wagon.status === "in-repair" ? "Sick" : "Fit",
      "Comments": wagon.comments || "",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    ws["!cols"] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 25 },
      { wch: 18 },
      { wch: 10 },
      { wch: 22 },
      { wch: 22 },
      { wch: 10 },
      { wch: 30 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Wagon Register");
    const fileName = `Wagon_Register_CW_Dept_${archive.monthLabel.replace(/ /g, "_")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getStats = (wagons: WagonRepair[]) => {
    const sick = wagons.filter((w) => w.status === "in-repair").length;
    const fit = wagons.filter((w) => w.status === "completed").length;
    return { sick, fit, total: wagons.length };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Archives & History</h1>
        <p className="text-sm text-muted-foreground">Access archived memos, monthly wagon registers, and detailed audit trails.</p>
      </div>

      <Tabs defaultValue="memos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="memos" className="gap-2">
            <FileText className="h-4 w-4" />
            Archived Memos ({archivedMemos.length})
          </TabsTrigger>
          <TabsTrigger value="wagons" className="gap-2">
            <Calendar className="h-4 w-4" />
            Monthly Wagon Registers ({wagonArchives.length})
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="h-4 w-4" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="memos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Archived Unit Memos</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {archivedMemos.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-mono font-semibold text-sm">#{m.memoNo}</div>
                    <div className="text-xs text-muted-foreground">{m.date} · {m.rakeName} · {m.yard}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{m.entries.length} wagons</Badge>
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/memos/${m.id}`}>Open Memo</Link>
                    </Button>
                  </div>
                </div>
              ))}
              {archivedMemos.length === 0 && (
                <div className="text-sm text-muted-foreground py-8 text-center">No archived memos found.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wagons" className="space-y-4">
          {wagonArchives.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Monthly Archives Yet</p>
                <p className="text-sm">
                  Wagon archives are generated automatically on the 1st of each month.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {wagonArchives.map((archive) => {
                const stats = getStats(archive.wagons);
                return (
                  <AccordionItem
                    key={archive.id}
                    value={archive.id}
                    className="border rounded-lg bg-card"
                  >
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-sm">{archive.monthLabel}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Archived on {new Date(archive.archivedAt).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{stats.total} wagons</Badge>
                          <Badge className="bg-warning/10 text-warning hover:bg-warning/20 border-warning/20">
                            {stats.sick} Sick
                          </Badge>
                          <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20">
                            {stats.fit} Fit
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="mb-4 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportArchive(archive)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export {archive.monthLabel}
                        </Button>
                      </div>
                      {archive.wagons.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No wagons in this archive</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto border rounded">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold">Wagon No.</TableHead>
                                <TableHead className="font-semibold">Type</TableHead>
                                <TableHead className="font-semibold">Railway</TableHead>
                                <TableHead className="font-semibold">Sick Line</TableHead>
                                <TableHead className="font-semibold">Sick Date</TableHead>
                                <TableHead className="font-semibold">Fit Date</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {archive.wagons.map((wagon) => (
                                <TableRow key={wagon.id} className="hover:bg-muted/30">
                                  <TableCell className="font-mono font-medium">{wagon.wagonNumber}</TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-xs">{wagon.details.typeName}</p>
                                      <p className="text-[10px] text-muted-foreground">{wagon.details.category}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-[150px] truncate text-xs">
                                    {wagon.details.railwayName}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {getSickLineName(wagon.sickLine) || "—"}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {formatDateTime(wagon.arrivalDate).date}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {wagon.completedDate ? formatDateTime(wagon.completedDate).date : "—"}
                                  </TableCell>
                                  <TableCell>
                                    {wagon.status === "in-repair" ? (
                                      <Badge variant="outline" className="text-warning border-warning/20 bg-warning/5 text-[10px]">
                                        <Clock className="h-3 w-3 mr-1" /> Sick
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-success border-success/20 bg-success/5 text-[10px]">
                                        <CheckCircle className="h-3 w-3 mr-1" /> Fit
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Activity Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[500px] overflow-auto text-sm divide-y">
                {audit.map((e) => (
                  <div key={e.id} className="flex justify-between gap-3 py-2.5 items-center">
                    <div>
                      <span className="font-medium">{e.action}</span>
                      {e.actor && <span className="text-xs text-muted-foreground ml-2">by {e.actor}</span>}
                      {e.details && (
                        <div className="text-xs text-muted-foreground mt-0.5 break-all max-w-xl">
                          {e.details}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(e.at).toLocaleString()}
                    </div>
                  </div>
                ))}
                {audit.length === 0 && (
                  <div className="text-sm text-muted-foreground py-8 text-center">No activity logged yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
