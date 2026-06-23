import { Link, useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Printer, Trash2, Archive, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { loadWagons } from "@/lib/wagonData";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";
import { EmptyState } from "@/components/shared/EmptyState";

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
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader 
        title="Unit Memos"
        description="All digital UNIT MEMOs created in the yard."
        icon={FileText}
        actions={
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <SearchBar 
              value={q} 
              onChange={setQ} 
              placeholder="Search memo, rake, wagon no…" 
              className="w-full sm:w-[250px]"
              onClear={clearWagonFilter}
            />
            <div className="flex gap-2">
              <Button asChild variant="outline" className="gap-2 border-warning/30 text-warning hover:bg-warning/10 hover:text-warning shadow-sm">
                <Link to="/memos/new?type=sick">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Sick Memo</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 border-success/30 text-success hover:bg-success/10 hover:text-success shadow-sm">
                <Link to="/memos/new?type=fit">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Fit Memo</span>
                </Link>
              </Button>
            </div>
          </div>
        }
      />

      <Card className="border-border/50 shadow-sm overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold pl-6">Memo No</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Date / Time</TableHead>
                <TableHead className="font-semibold">Rake</TableHead>
                <TableHead className="font-semibold">Yard</TableHead>
                <TableHead className="font-semibold">Line</TableHead>
                <TableHead className="font-semibold">Wagons</TableHead>
                <TableHead className="font-semibold">Approvals</TableHead>
                <TableHead className="text-right pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Wagon filter indicator banner */}
              {q && wagonParam && (
                <TableRow className="bg-primary/5">
                  <TableCell colSpan={9} className="py-3 px-6 text-sm text-primary font-medium border-b border-primary/10">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                      Showing memos linked to wagon: <span className="font-mono font-bold tracking-tight bg-background px-2 py-0.5 rounded shadow-sm border border-primary/20">{wagonParam}</span>
                      <Button variant="ghost" size="sm" onClick={clearWagonFilter} className="ml-2 h-7 text-xs hover:bg-primary/10 hover:text-primary">Clear Filter</Button>
                    </div>
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
                  <TableRow key={m.id} className={`${m.archived ? "opacity-60 bg-muted/30" : ""} hover:bg-muted/50 transition-colors`}>
                    <TableCell className="font-mono font-bold tracking-tight pl-6">{m.memoNo}</TableCell>
                    <TableCell>
                      {m.memoType === "fit" ? (
                        <Badge className="bg-success/15 text-success hover:bg-success/20 border-success/30 gap-1.5 text-[10px] px-2 py-0.5 shadow-sm">
                          <CheckCircle2 className="h-3 w-3" /> Fit
                        </Badge>
                      ) : (
                        <Badge className="bg-warning/15 text-warning hover:bg-warning/20 border-warning/30 gap-1.5 text-[10px] px-2 py-0.5 shadow-sm">
                          <AlertTriangle className="h-3 w-3" /> Sick
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      <span className="font-medium text-foreground">{m.date}</span> <span className="text-muted-foreground ml-1">{m.time}</span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{m.rakeName}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{m.rakeId}</div>
                    </TableCell>
                    <TableCell className="text-sm">{m.yard}</TableCell>
                    <TableCell className="text-sm">{m.lineNo}</TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
                        <Badge variant="secondary" className="shadow-sm font-medium">{m.entries.length} Wagons</Badge>
                        {linkedCount > 0 && (
                          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 shadow-sm whitespace-nowrap">
                            {linkedCount} Linked
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={approved === m.approvals.length ? "default" : "secondary"} className={`shadow-sm ${approved === m.approvals.length ? 'bg-success hover:bg-success/90' : ''}`}>
                        {approved}/{m.approvals.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" asChild><Link to={`/memos/${m.id}`}><Eye className="h-4 w-4" /></Link></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" asChild><Link to={`/memos/${m.id}/print`}><Printer className="h-4 w-4" /></Link></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" onClick={() => archiveMemo(m.id)}><Archive className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => { if (confirm("Delete this memo?")) removeMemo(m.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center">
                    <EmptyState 
                      icon={FileText} 
                      title="No Memos Found" 
                      description={q ? `No memos matching "${q}"` : "Create your first memo to get started"} 
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
