import { useState, useMemo } from "react";
import { WorkflowItem, AuditEvent } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { Clock } from "lucide-react";
import { ActivityTimelineItem, TimelineEvent } from "@/components/activity-timeline/ActivityTimelineItem";
import { ActivityTimelineFilters } from "@/components/activity-timeline/ActivityTimelineFilters";
import {
  EventCategory,
  inferCategoryFromStageName,
  inferCategoryFromAuditAction,
} from "@/components/activity-timeline/activityTimelineMapping";
import { getStageDisplayConfig } from "@/lib/workflowConfig";

interface WagonTimelineProps {
  workflow: WorkflowItem;
  wagonId?: string;
}

export function WagonTimeline({ workflow, wagonId }: WagonTimelineProps) {
  const audit = useAppStore((s) => s.audit);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | "all">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Build unified event list from 3 sources
  const events = useMemo(() => {
    if (!workflow) return [];

    const timelineEvents: TimelineEvent[] = [];
    const resolvedWagonId = wagonId || workflow.wagonId;

    // 1. Registration event
    const createdAtStr = (workflow as any).createdAt || workflow.stages[0]?.startedAt || new Date().toISOString();
    timelineEvents.push({
      id: "registered",
      type: "registered",
      category: "arrival",
      timestamp: new Date(createdAtStr),
      title: "Wagon Registered",
      employee: "System",
      department: "Operations",
      remarks: "Wagon entered into the register.",
    });

    // 2. Stage events (start + end)
    workflow.stages.forEach((stage, idx) => {
      const category = inferCategoryFromStageName(stage.stageName);

      if (stage.startedAt && stage.status !== "Skipped") {
        timelineEvents.push({
          id: `start-${idx}`,
          type: "stage_start",
          category,
          timestamp: new Date(stage.startedAt),
          title: `${stage.stageName} Started`,
          employee: stage.staffName,
          operator: stage.steamPointOperationName,
          inspector: stage.inspectorName,
          remarks: stage.remarks,
        });
      }

      if (stage.completedAt && stage.status === "Done") {
        timelineEvents.push({
          id: `end-${idx}`,
          type: "stage_end",
          category,
          timestamp: new Date(stage.completedAt),
          title: `${stage.stageName} Completed`,
          employee: stage.inspectorName || stage.staffName,
          operator: stage.steamPointOperationName,
          inspector: stage.inspectorName,
          remarks: stage.remarks,
          duration: stage.durationHours ? `${stage.durationHours.toFixed(1)} hrs` : undefined,
        });
      }
    });

    // 3. WorkflowActionHistory (e.g. PAUSE_STAGE, RESUME_STAGE, MARK_FIT)
    if (workflow.actionHistory) {
      workflow.actionHistory.forEach((ah, idx) => {
        let category: EventCategory = "workflow";
        const action = ah.action;
        if (action === "MARK_FIT") category = "fit";
        else if (action === "ADVANCE_WORKFLOW") category = "status_transition";
        else if (action === "PAUSE_STAGE" || action === "RESUME_STAGE") category = "workflow";

        timelineEvents.push({
          id: `ah-${idx}`,
          type: "action_history",
          category,
          timestamp: new Date(ah.createdAt),
          title: formatActionLabel(ah.action, ah.stageName),
          employee: ah.userName,
          remarks: ah.reason,
        });
      });
    }

    // 4. Audit events for this wagon (status transitions from board, etc.)
    if (resolvedWagonId) {
      const wagonAuditEvents = audit.filter(
        (a) => a.wagonId === resolvedWagonId
      );
      wagonAuditEvents.forEach((ae) => {
        // Avoid duplicating events already captured by workflow stages/actionHistory
        const isDuplicate = timelineEvents.some(
          (e) =>
            Math.abs(e.timestamp.getTime() - new Date(ae.at).getTime()) < 2000 &&
            (e.title.toLowerCase().includes(ae.action.toLowerCase().substring(0, 10)) ||
             ae.action.toLowerCase().includes(e.title.toLowerCase().substring(0, 10)))
        );
        if (isDuplicate) return;

        const category = inferCategoryFromAuditAction(ae.action);
        timelineEvents.push({
          id: `audit-${ae.id}`,
          type: "audit",
          category,
          timestamp: new Date(ae.at),
          title: ae.action,
          employee: ae.actor || ae.userName,
          details: ae.details,
        });
      });
    }

    return timelineEvents;
  }, [workflow, audit, wagonId]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    let result = events;

    if (categoryFilter !== "all") {
      result = result.filter((e) => e.category === categoryFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.remarks && e.remarks.toLowerCase().includes(q)) ||
          (e.employee && e.employee.toLowerCase().includes(q)) ||
          (e.details && e.details.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) =>
      sortOrder === "newest"
        ? b.timestamp.getTime() - a.timestamp.getTime()
        : a.timestamp.getTime() - b.timestamp.getTime()
    );

    return result;
  }, [events, categoryFilter, search, sortOrder]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: { date: string; events: TimelineEvent[] }[] = [];
    const map = new Map<string, TimelineEvent[]>();

    filteredEvents.forEach((event) => {
      const dateKey = event.timestamp.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(event);
    });

    map.forEach((events, date) => groups.push({ date, events }));
    return groups;
  }, [filteredEvents]);

  const onClear = () => {
    setSearch("");
    setCategoryFilter("all");
    setSortOrder("newest");
  };

  if (!workflow) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/10 border-dashed"
        data-testid="activity-timeline-empty"
      >
        <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <h3 className="text-lg font-semibold text-foreground">No workflow created</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          This wagon has not yet entered the workshop process, so there is no timeline history to display.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="activity-timeline">
      {/* Filters */}
      <ActivityTimelineFilters
        search={search}
        setSearch={setSearch}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onClear={onClear}
      />

      {/* Timeline */}
      <div className="relative pl-6 sm:pl-8 py-2">
        {/* Vertical Line */}
        <div className="absolute left-[15px] sm:left-[23px] top-4 bottom-4 w-0.5 bg-border z-0" />

        {filteredEvents.length === 0 ? (
          <div
            className="text-center py-8 text-muted-foreground text-sm"
            data-testid="activity-timeline-empty"
          >
            {events.length === 0
              ? "No activity recorded for this wagon yet."
              : "No timeline events match your filters."}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByDate.map((group) => (
              <div key={group.date}>
                {/* Date header */}
                <div className="flex items-center gap-2 mb-4 -ml-2 sm:ml-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {group.date}
                  </span>
                  <div className="flex-1 border-t border-border/50" />
                </div>
                <div className="space-y-4">
                  {group.events.map((event) => (
                    <ActivityTimelineItem key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center text-[10px] text-muted-foreground pt-2">
        {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} shown
        {filteredEvents.length < events.length && ` of ${events.length} total`}
      </div>
    </div>
  );
}

function formatActionLabel(action: string, stageName: string): string {
  switch (action) {
    case "START_STAGE": return `${stageName} Started`;
    case "MARK_STAGE_DONE": return `${stageName} Marked Done`;
    case "ADVANCE_WORKFLOW": return `Workflow Advanced to ${stageName}`;
    case "MARK_FIT": return "Wagon Declared FIT";
    case "PAUSE_STAGE": return `${stageName} Paused`;
    case "RESUME_STAGE": return `${stageName} Resumed`;
    default: return `${action} — ${stageName}`;
  }
}
