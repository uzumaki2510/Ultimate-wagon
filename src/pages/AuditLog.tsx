import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { PageHeader } from "@/components/shared/PageHeader";
import { ShieldCheck, Search, Activity, User, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function AuditLog() {
  const { audit } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const filteredLogs = useMemo(() => {
    return audit.filter(log => {
      // Safely infer department from our enhanced log or details
      const text = `${log.action} ${log.details || ""}`.toLowerCase();
      let department = "Operations";
      if (text.includes("steam")) department = "Steam Department";
      else if (text.includes("degass") || text.includes("purge")) department = "Degassing Department";
      else if (text.includes("inspect")) department = "Inspection Department";
      else if (text.includes("repair")) department = "Repair Department";

      if (departmentFilter !== "all" && department !== departmentFilter) {
        return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !log.action.toLowerCase().includes(q) &&
          !(log.details || "").toLowerCase().includes(q) &&
          !log.actor.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [audit, searchQuery, departmentFilter]);

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("added") || act.includes("created")) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (act.includes("started") || act.includes("resumed")) return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
    if (act.includes("paused")) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    if (act.includes("done") || act.includes("completed") || act.includes("fit")) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (act.includes("deleted") || act.includes("removed")) return "bg-red-500/10 text-red-500 border-red-500/20";
    return "bg-secondary text-secondary-foreground border-border";
  };

  // Extract department logic for render
  const getDepartment = (log: any) => {
    const text = `${log.action} ${log.details || ""}`.toLowerCase();
    if (text.includes("steam")) return "Steam Department";
    if (text.includes("degass") || text.includes("purge")) return "Degassing Department";
    if (text.includes("inspect")) return "Inspection Department";
    if (text.includes("repair")) return "Repair Department";
    return "Operations";
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader 
        title="Audit Trail" 
        description="Complete chronological record of all system operations and workflow changes."
        icon={ShieldCheck}
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by action, employee, or details..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filter by Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="Operations">Operations</SelectItem>
            <SelectItem value="Steam Department">Steam Department</SelectItem>
            <SelectItem value="Degassing Department">Degassing Department</SelectItem>
            <SelectItem value="Inspection Department">Inspection Department</SelectItem>
            <SelectItem value="Repair Department">Repair Department</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm">
        <div className="rounded-md overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Details & Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No audit records found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">{new Date(log.at).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">{new Date(log.at).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{log.actor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{getDepartment(log)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className={`text-[10px] ${getActionColor(log.action)}`}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground/90 max-w-md line-clamp-2">
                        {log.details || "-"}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
