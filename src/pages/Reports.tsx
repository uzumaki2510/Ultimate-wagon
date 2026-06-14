import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BOOKED_TO, REASONS } from "@/types";
import { exportCsv, exportExcel } from "@/lib/exporters";
import { generateMemoPdf } from "@/lib/pdf";
import { FileDown, FileSpreadsheet, FileText, BarChart3, PieChart, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  "In Service": "#22c55e",
  "Cut Off": "#ef4444",
  "Sick Line": "#f59e0b",
  "Under Repair": "#3b82f6",
  "Awaiting Inspection": "#a855f7",
  "Fit For Loading": "#10b981",
};

export default function Reports() {
  const { memos, wagons } = useAppStore();
  const byId = Object.fromEntries(wagons.map((w) => [w.id, w]));
  const [q, setQ] = useState<string>("");
  const [reason, setReason] = useState<string>("all");
  const [bookedTo, setBookedTo] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const rows = useMemo(() => {
    const all = memos.flatMap((m) => m.entries.map((e) => ({ m, e, w: byId[e.wagonId] })));
    return all.filter(({ m, e, w }) => {
      const blob = [m.memoNo, m.rakeId, w?.wagonNo, w?.type, m.date].join(" ").toLowerCase();
      if (q && !blob.includes(q.toLowerCase())) return false;
      if (reason !== "all" && e.reason !== reason) return false;
      if (bookedTo !== "all" && e.bookedTo !== bookedTo) return false;
      if (status !== "all" && e.status !== status) return false;
      return true;
    });
  }, [memos, byId, q, reason, bookedTo, status]);

  // Chart data
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    wagons.forEach((w) => {
      counts[w.status] = (counts[w.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [wagons]);

  const reasonData = useMemo(() => {
    const counts: Record<string, number> = {};
    memos.forEach((m) => m.entries.forEach((e) => {
      counts[e.reason] = (counts[e.reason] || 0) + 1;
    }));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [memos]);

  const monthlyData = useMemo(() => {
    const counts: Record<string, number> = {};
    memos.forEach((m) => {
      const month = m.date?.slice(0, 7) || "Unknown";
      counts[month] = (counts[month] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([name, value]) => ({ name, value }));
  }, [memos]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Visualize, search, filter, and export across all memos and wagon data.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportExcel(memos, byId, "report")}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportCsv(memos, byId, "report")}>
            <FileText className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" /> Wagon Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No wagon data</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <RechartsPie>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#6366f1"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: "10px" }} />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Top Defect Reasons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reasonData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No memo data</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={reasonData} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Memos Per Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No memo data</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter Row */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Memo Entries</CardTitle>
          <CardDescription>Search across all memo entries by wagon, reason, or booking destination.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Search memo / rake / wagon..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger><SelectValue placeholder="Filter by Reason" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={bookedTo} onValueChange={setBookedTo}>
            <SelectTrigger><SelectValue placeholder="Filter by Booked To" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Booked To</SelectItem>
              {BOOKED_TO.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {["In Service","Cut Off","Sick Line","Under Repair","Awaiting Inspection","Fit For Loading"].map((s) =>
                <SelectItem key={s} value={s}>{s}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Memo Entry Results</CardTitle>
          <Badge variant="outline">{rows.length} entries</Badge>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                {["Memo No","Date","Rake","Wagon No","Type","Reason","Booked To","Defects","Status","PDF"].map((h) =>
                  <TableHead key={h} className="text-xs font-semibold">{h}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ m, e, w }) => (
                <TableRow key={e.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{m.memoNo}</TableCell>
                  <TableCell className="text-xs">{m.date}</TableCell>
                  <TableCell className="text-xs">{m.rakeName}</TableCell>
                  <TableCell className="font-mono text-xs">{w?.wagonNo}</TableCell>
                  <TableCell className="text-xs">{w?.type}</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{e.reason}</TableCell>
                  <TableCell className="text-xs">{e.bookedTo}</TableCell>
                  <TableCell className="text-xs max-w-[100px] truncate">{e.defects}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{e.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => generateMemoPdf(m, byId)} title="Download PDF">
                      <FileDown className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                    No matching entries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
