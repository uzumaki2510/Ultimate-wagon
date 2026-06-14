import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Printer, Trash2, Archive } from "lucide-react";

export default function MemoList() {
  const { memos, archiveMemo, removeMemo } = useAppStore();
  const [q, setQ] = useState("");
  const filtered = useMemo(() => memos.filter((m) =>
    [m.memoNo, m.rakeId, m.rakeName, m.yard, m.lineNo].join(" ").toLowerCase().includes(q.toLowerCase())
  ), [memos, q]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Unit Memos</h1>
          <p className="text-sm text-muted-foreground">All digital UNIT MEMOs created in the yard.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search memo, rake, yard…" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <Button asChild><Link to="/memos/new">+ New Memo</Link></Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Memo No</TableHead>
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
            {filtered.map((m) => {
              const approved = m.approvals.filter((a) => a.status === "Approved").length;
              return (
                <TableRow key={m.id} className={m.archived ? "opacity-60" : ""}>
                  <TableCell className="font-mono font-semibold">{m.memoNo}</TableCell>
                  <TableCell>{m.date} {m.time}</TableCell>
                  <TableCell><div>{m.rakeName}</div><div className="text-xs text-muted-foreground">{m.rakeId}</div></TableCell>
                  <TableCell>{m.yard}</TableCell>
                  <TableCell>{m.lineNo}</TableCell>
                  <TableCell><Badge variant="secondary">{m.entries.length}</Badge></TableCell>
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
            {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">No memos.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
