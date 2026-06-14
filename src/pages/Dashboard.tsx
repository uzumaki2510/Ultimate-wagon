import { Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { StatCard } from "@/components/StatCard";
import { FileText, AlertTriangle, Wrench, ClipboardCheck, Train, CheckCircle2, Hourglass } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { memos, wagons, audit } = useAppStore();

  const totalMemos = memos.length;
  const cutOff = wagons.filter((w) => w.status === "Cut Off").length;
  const sickLine = wagons.filter((w) => w.status === "Sick Line").length;
  const underRepair = wagons.filter((w) => w.status === "Under Repair").length;
  const awaiting = wagons.filter((w) => w.status === "Awaiting Inspection").length;
  const fit = wagons.filter((w) => w.status === "Fit For Loading").length;
  const pendingApproval = memos.reduce((n, m) => n + m.approvals.filter((a) => a.status === "Pending").length, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operations Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live overview of memos, sick line, and approvals.</p>
      </div>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Total Memos" value={totalMemos} icon={FileText} tone="info" />
        <StatCard label="Wagons Cut Off" value={cutOff} icon={AlertTriangle} tone="danger" />
        <StatCard label="In Sick Line" value={sickLine} icon={Train} tone="warning" />
        <StatCard label="Under Repair" value={underRepair} icon={Wrench} tone="warning" />
        <StatCard label="Awaiting Inspection" value={awaiting} icon={Hourglass} tone="default" />
        <StatCard label="Fit For Loading" value={fit} icon={CheckCircle2} tone="success" />
        <StatCard label="Pending Approval" value={pendingApproval} icon={ClipboardCheck} tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Memos</CardTitle>
            <Button asChild size="sm" variant="outline"><Link to="/memos">View all</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {memos.slice(0, 6).map((m) => (
                <Link key={m.id} to={`/memos/${m.id}`} className="flex items-center justify-between py-3 hover:bg-muted/40 px-2 rounded">
                  <div>
                    <div className="font-mono text-sm font-semibold">#{m.memoNo}</div>
                    <div className="text-xs text-muted-foreground">{m.rakeName} · {m.yard} · Line {m.lineNo}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{m.entries.length} wagons</Badge>
                    <Badge variant="outline">{m.date}</Badge>
                  </div>
                </Link>
              ))}
              {memos.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No memos yet.</div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm max-h-80 overflow-auto">
              {audit.slice(0, 12).map((e) => (
                <div key={e.id} className="flex justify-between gap-2 border-l-2 border-primary/40 pl-2">
                  <div>
                    <div className="font-medium">{e.action}</div>
                    {e.details && <div className="text-xs text-muted-foreground truncate">{e.details}</div>}
                  </div>
                  <div className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(e.at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
