import { Link, useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Printer, Trash2, Archive, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { loadWagons } from "@/lib/wagonData";

export default function MemoList() {
  const { memos, archiveMemo, removeMemo, wagons: zustandWagons } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const wagonParam = searchParams.get("wagon") ?? "";
  const [q, setQ] = useState(wagonParam);

  // All wagons from register for reverse lookup
  const registerWagons = useMemo(() => loadWagons(), []);

  const filtered = useMemo(() =>
    memos.filter((m) =>
      [m.memoNo, m.rakeId, m.rakeName, m.yard, m.lineNo].join(" ").toLowerCase().includes(q.toLowerCase()) ||
      m.entries.some((e) => {
        const zw = zustandWagons.find((w) => w.id === e.wagonId);
        return zw?.wagonNo?.toLowerCase().includes(q.toLowerCase());
      })
    ), [memos, q, zustandWagons]);

  const clearWagonFilter = () => {
    setQ("");
    setSearchParams({});
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Unit Memos</h1>
          <p className="text-sm text-muted-foreground">All digital UNIT MEMOs created in the yard.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Input placeholder="Search memo, rake, wagon no…" value={q} onChange={(e) => setQ(e.target.value)} className="w-60" />
            {q && (
              <button
                onClick={clearWagonFilter}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button asChild variant="outline" className="gap-1.5 border-orange-400/60 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950">
            <Link to="/memos/new?type=sick">
              <AlertTriangle className="h-4 w-4" />
              Sick Memo
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-1.5 border-emerald-400/60 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950">
            <Link to="/memos/new?type=fit">
              <CheckCircle2 className="h-4 w-4" />
              Fit Memo
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Memo No</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date / Time</TableHead>
              <TableHead>Rake</TableHead>
              <TableHead>Yard</TableHead>
              <TableHead>Line</TableHead>
              <TableHead>Wagons</TableHead>
              <TableHead>Approvals</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Wagon filter indicator banner */}
            {q && wagonParam && (
              <TableRow className="bg-violet-50 dark:bg-violet-950/30">
                <TableCell colSpan={9} className="py-2 text-sm text-violet-700 dark:text-violet-300 font-medium">
                  Showing memos linked to wagon: <span className="font-mono font-bold">{wagonParam}</span>
                  <button onClick={clearWagonFilter} className="ml-3 text-xs underline hover:no-underline">Clear</button>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((m) => {
              const approved = m.approvals.filter((a) => a.status === "Approved").length;
              // Count how many wagon numbers in this memo exist in the register
              const linkedCount = m.entries.filter((e) => {
                const zw = zustandWagons.find((w) => w.id === e.wagonId);
                return zw?.wagonNo ? registerWagons.some((rw) => rw.wagonNumber.trim() === zw.wagonNo.trim()) : false;
              }).length;
              return (
                <TableRow key={m.id} className={m.archived ? "opacity-60" : ""}>
                  <TableCell className="font-mono font-semibold">{m.memoNo}</TableCell>
                  <TableCell>
                    {m.memoType === "fit" ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-400/40 gap-1 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> Fit
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-500/15 text-orange-700 border-orange-400/40 gap-1 text-[10px]">
                        <AlertTriangle className="h-3 w-3" /> Sick
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{m.date} {m.time}</TableCell>
                  <TableCell><div>{m.rakeName}</div><div className="text-xs text-muted-foreground">{m.rakeId}</div></TableCell>
                  <TableCell>{m.yard}</TableCell>
                  <TableCell>{m.lineNo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary">{m.entries.length}</Badge>
                      {linkedCount > 0 && (
                        <Badge className="text-[10px] bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800">
                          {linkedCount} in Register
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={approved === m.approvals.length ? "default" : "outline"}>{approved}/{m.approvals.length}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" asChild><Link to={`/memos/${m.id}`}><Eye className="h-4 w-4" /></Link></Button>
                    <Button size="icon" variant="ghost" asChild><Link to={`/memos/${m.id}/print`}><Printer className="h-4 w-4" /></Link></Button>
                    <Button size="icon" variant="ghost" onClick={() => archiveMemo(m.id)}><Archive className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this memo?")) removeMemo(m.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-10">No memos.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
