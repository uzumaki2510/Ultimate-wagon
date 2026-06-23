import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";
import { AuditEvent } from "@/types";
import {
  Shield, Clock, User, Search, RefreshCw, Download,
  FileEdit, LogIn, Activity, ChevronDown, ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";

/* ── helpers ──────────────────────────────────────── */
function actionColor(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action.includes("deleted") || action.includes("removed")) return "destructive";
  if (action.includes("created") || action.includes("added") || action.includes("seeded")) return "secondary";
  if (action.includes("approved") || action.includes("FIT_READY")) return "default";
  return "outline";
}

function actionIcon(action: string) {
  const lc = action.toLowerCase();
  if (lc.includes("login")) return <LogIn className="h-3.5 w-3.5" />;
  if (lc.includes("updated") || lc.includes("edited")) return <FileEdit className="h-3.5 w-3.5" />;
  return <Activity className="h-3.5 w-3.5" />;
}

function roleBadge(role?: string) {
  if (role === "admin") return <Badge className="bg-amber-500/15 text-amber-600 border-amber-400/30">Admin</Badge>;
  if (role === "employee") return <Badge className="bg-blue-500/15 text-blue-600 border-blue-400/30">Employee</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">System</Badge>;
}

/* ── component ───────────────────────────────────── */
export default function AdminLog() {
  const { audit } = useAppStore();
  const { getLoginRecords } = useAuth();

  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [tab, setTab] = useState<"edits" | "logins">("edits");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const loginRecords = getLoginRecords();

  /* unique actors for filter dropdown */
  const actors = useMemo(() => {
    const names = new Set<string>();
    audit.forEach((e) => {
      if (e.userName) names.add(e.userName);
      else if (e.actor) names.add(e.actor);
    });
    return Array.from(names).sort();
  }, [audit]);

  /* unique action categories */
  const actionCategories = useMemo(() => {
    const cats = new Set<string>();
    audit.forEach((e) => cats.add(e.action.split(" ")[0]));
    return Array.from(cats).sort();
  }, [audit]);

  const filtered = useMemo(() => {
    let result = [...audit];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.action.toLowerCase().includes(q) ||
          (e.userName ?? e.actor ?? "").toLowerCase().includes(q) ||
          (e.userEmail ?? "").toLowerCase().includes(q) ||
          (e.details ?? "").toLowerCase().includes(q)
      );
    }

    if (actorFilter !== "all") {
      result = result.filter(
        (e) => (e.userName ?? e.actor) === actorFilter
      );
    }

    if (actionFilter !== "all") {
      result = result.filter((e) => e.action.startsWith(actionFilter));
    }

    result.sort((a, b) => {
      const diff = new Date(b.at).getTime() - new Date(a.at).getTime();
      return sortDir === "desc" ? diff : -diff;
    });

    return result;
  }, [audit, search, actorFilter, actionFilter, sortDir]);

  function exportCSV() {
    const rows = [
      ["Time", "User", "Email", "Role", "Action", "Details"],
      ...filtered.map((e) => [
        format(new Date(e.at), "yyyy-MM-dd HH:mm:ss"),
        e.userName ?? e.actor,
        e.userEmail ?? "",
        e.userRole ?? "",
        e.action,
        e.details ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `admin-log-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight">Admin Audit Log</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Full history of system edits and user login activity.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start sm:self-auto" onClick={exportCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">{audit.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total Events</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">{actors.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Unique Users</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">{loginRecords.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Tracked Logins</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">
              {audit.filter((e) => {
                const d = new Date(e.at);
                const now = new Date();
                return (
                  d.getDate() === now.getDate() &&
                  d.getMonth() === now.getMonth() &&
                  d.getFullYear() === now.getFullYear()
                );
              }).length}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Events Today</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {(["edits", "logins"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === t
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "edits" ? (
              <span className="flex items-center gap-1.5"><FileEdit className="h-3.5 w-3.5" />Edit History</span>
            ) : (
              <span className="flex items-center gap-1.5"><LogIn className="h-3.5 w-3.5" />Last Logins</span>
            )}
          </button>
        ))}
      </div>

      {tab === "edits" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileEdit className="h-4 w-4" /> Edit History
                <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto flex-1 sm:max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, action, details…"
                    className="pl-8 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={actorFilter} onValueChange={setActorFilter}>
                  <SelectTrigger className="h-9 w-40">
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    {actors.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="h-9 w-36">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    {actionCategories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  title="Toggle sort"
                  onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                >
                  {sortDir === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[520px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-40">Time</TableHead>
                    <TableHead className="w-44">User</TableHead>
                    <TableHead className="w-24">Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="w-52">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No events found.
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((e: AuditEvent) => (
                    <TableRow key={e.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground">
                            {format(new Date(e.at), "dd MMM, HH:mm")}
                          </span>
                          <span>{formatDistanceToNow(new Date(e.at), { addSuffix: true })}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{e.userName ?? e.actor}</div>
                            {e.userEmail && (
                              <div className="text-[10px] text-muted-foreground truncate">{e.userEmail}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{roleBadge(e.userRole)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {actionIcon(e.action)}
                          <Badge variant={actionColor(e.action)} className="text-xs">
                            {e.action}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono max-w-[200px] truncate">
                        {e.details ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "logins" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LogIn className="h-4 w-4" /> Last Login Per User
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-44">User</TableHead>
                    <TableHead className="w-56">Email</TableHead>
                    <TableHead className="w-24">Role</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-28 text-right">Total Logins</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginRecords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No login records yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {loginRecords.map((r) => (
                    <TableRow key={r.userId} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">{r.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.email}</TableCell>
                      <TableCell>{roleBadge(r.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">
                              {format(new Date(r.lastLogin), "dd MMM yyyy, HH:mm")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(r.lastLogin), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="font-mono">
                          {r.loginCount}×
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <RefreshCw className="h-3 w-3" /> Logs are stored locally. Up to 1 000 edit events are retained.
      </p>
    </div>
  );
}
