import { useState, useMemo } from "react";
import { WorkflowItem } from "@/types";
import { getStageDisplayConfig } from "@/lib/workflowConfig";
import { 
  Search, Filter, Calendar as CalendarIcon, User, 
  CheckCircle2, PlayCircle, Clock, ArrowRightCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface WagonTimelineProps {
  workflow: WorkflowItem;
}

export function WagonTimeline({ workflow }: WagonTimelineProps) {
  const [dateFilter, setDateFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");

  // Build a chronological list of events from the workflow stages and action history
  const events = useMemo(() => {
    if (!workflow) return [];

    const timelineEvents: any[] = [];

    // Add wagon registration event (simulated as the workflow creation time, which is usually the wagon creation time)
    const createdAtStr = (workflow as any).createdAt || (workflow.stages[0]?.startedAt) || new Date().toISOString();
    timelineEvents.push({
      id: "registered",
      type: "registered",
      timestamp: new Date(createdAtStr),
      title: "Wagon Registered",
      stageName: "Registration",
      employee: "System",
      department: "Operations",
      remarks: "Wagon entered into the register.",
      status: "Done",
      Icon: CheckCircle2,
      color: "text-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    });

    // Add stage events
    workflow.stages.forEach((stage, idx) => {
      const config = getStageDisplayConfig(stage.stageName);
      
      // Determine department loosely based on stage
      let department = "Operations";
      if (stage.stageName.includes("Inspection") || stage.stageName.includes("Mechanic") || stage.stageName.includes("Checklist") || stage.stageName.includes("Exam")) department = "Inspection (C&W)";
      if (stage.stageName.includes("Repair")) department = "Repair / Mechanical";
      if (stage.stageName.includes("Steam") || stage.stageName.includes("Degass") || stage.stageName.includes("Purging") || stage.stageName.includes("Gas")) department = "Special Operations";
      
      // Stage Started Event
      if (stage.startedAt && stage.status !== "Skipped") {
        timelineEvents.push({
          id: `start-${idx}`,
          type: "start",
          timestamp: new Date(stage.startedAt),
          title: `${stage.stageName} Started`,
          stageName: stage.stageName,
          employee: stage.staffName || "Unknown",
          department,
          remarks: stage.remarks || "",
          status: "In Progress",
          Icon: PlayCircle,
          color: "text-blue-500",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
          // Special data
          operator: stage.steamPointOperationName,
          inspector: stage.inspectorName,
        });
      }

      // Stage Completed Event
      if (stage.completedAt && stage.status === "Done") {
        timelineEvents.push({
          id: `end-${idx}`,
          type: "end",
          timestamp: new Date(stage.completedAt),
          title: `${stage.stageName} Completed`,
          stageName: stage.stageName,
          employee: stage.inspectorName || stage.staffName || "Unknown",
          department,
          remarks: stage.remarks || "",
          status: "Done",
          Icon: config.icon,
          color: config.color,
          bgColor: "bg-muted/30",
          operator: stage.steamPointOperationName,
          inspector: stage.inspectorName,
          duration: stage.durationHours ? `${stage.durationHours.toFixed(1)} hrs` : null,
        });
      }
    });

    // Sort chronologically (descending for timeline view)
    return timelineEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [workflow]);

  // Derived filter options
  const employees = useMemo(() => {
    const emps = new Set<string>();
    events.forEach(e => {
      if (e.employee && e.employee !== "System") emps.add(e.employee);
      if (e.operator) emps.add(e.operator);
      if (e.inspector) emps.add(e.inspector);
    });
    return Array.from(emps).sort();
  }, [events]);

  const stages = useMemo(() => {
    const stgs = new Set<string>();
    events.forEach(e => stgs.add(e.stageName));
    return Array.from(stgs).sort();
  }, [events]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    let result = events;

    const now = new Date();
    if (dateFilter === "today") {
      result = result.filter(e => e.timestamp.toDateString() === now.toDateString());
    } else if (dateFilter === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      result = result.filter(e => e.timestamp.toDateString() === yesterday.toDateString());
    } else if (dateFilter === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter(e => e.timestamp >= weekAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      result = result.filter(e => e.timestamp >= monthAgo);
    }

    if (employeeFilter !== "all") {
      result = result.filter(e => 
        e.employee === employeeFilter || 
        e.operator === employeeFilter || 
        e.inspector === employeeFilter
      );
    }

    if (stageFilter !== "all") {
      result = result.filter(e => e.stageName === stageFilter);
    }

    return result;
  }, [events, dateFilter, employeeFilter, stageFilter]);

  if (!workflow) {
    return <div className="text-center p-8 text-muted-foreground border rounded-lg">No workflow data available.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>

        <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <User className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <div className="relative pl-6 sm:pl-8 py-2">
        {/* Vertical Line */}
        <div className="absolute left-[15px] sm:left-[23px] top-4 bottom-4 w-0.5 bg-border z-0" />
        
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No timeline events match your filters.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEvents.map(event => (
              <div key={event.id} className="relative z-10 animate-in slide-in-from-bottom-2 fade-in duration-300">
                {/* Node */}
                <div className={`absolute -left-[30px] sm:-left-[30px] top-1 h-7 w-7 rounded-full border-2 bg-background flex items-center justify-center ${event.color.replace('text-', 'border-')}`}>
                  <event.Icon className={`h-3.5 w-3.5 ${event.color}`} />
                </div>
                
                {/* Content Card */}
                <Card className={`ml-2 sm:ml-4 overflow-hidden border-l-4 ${event.color.replace('text-', 'border-l-')}`}>
                  <div className={`px-4 py-3 ${event.bgColor}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{event.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] font-medium bg-background">{event.department}</Badge>
                          {event.status === "In Progress" && (
                            <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-none">In Progress</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end text-xs text-muted-foreground shrink-0">
                        <span className="font-medium text-foreground">{event.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>{event.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3 pt-3 border-t border-border/50 text-xs">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span className="text-muted-foreground">By:</span>
                        <span className="font-medium">{event.employee}</span>
                      </div>
                      
                      {event.duration && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">{event.duration}</span>
                        </div>
                      )}
                      
                      {event.operator && event.operator !== event.employee && (
                        <div className="flex items-center gap-1.5">
                          <Wrench className="h-3.5 w-3.5 text-muted-foreground/70" />
                          <span className="text-muted-foreground">Operator:</span>
                          <span className="font-medium">{event.operator}</span>
                        </div>
                      )}
                      
                      {event.inspector && event.inspector !== event.employee && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/70" />
                          <span className="text-muted-foreground">Inspector:</span>
                          <span className="font-medium">{event.inspector}</span>
                        </div>
                      )}
                    </div>
                    
                    {event.remarks && (
                      <div className="mt-3 bg-background/50 rounded-md p-2.5 text-xs text-foreground/80 border whitespace-pre-wrap">
                        <span className="font-semibold text-muted-foreground mr-1">Remarks:</span>
                        {event.remarks}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Wrench(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
}
