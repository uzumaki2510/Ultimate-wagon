import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, User, Clock, ArrowRight } from "lucide-react";
import { EventCategory, EVENT_CATEGORY_CONFIG, parseStatusTransition } from "./activityTimelineMapping";
import { formatDistanceToNow } from "date-fns";

export interface TimelineEvent {
  id: string;
  type: "stage_start" | "stage_end" | "action_history" | "audit" | "registered";
  category: EventCategory;
  timestamp: Date;
  title: string;
  employee?: string;
  department?: string;
  remarks?: string;
  duration?: string;
  inspector?: string;
  operator?: string;
  details?: string;
  fromStatus?: string;
  toStatus?: string;
}

export function ActivityTimelineItem({ event }: { event: TimelineEvent }) {
  const [expanded, setExpanded] = useState(false);
  const config = EVENT_CATEGORY_CONFIG[event.category] || EVENT_CATEGORY_CONFIG.other;
  const Icon = config.icon;

  const transition = event.category === "status_transition" ? parseStatusTransition(event.details) ?? (event.fromStatus && event.toStatus ? { from: event.fromStatus, to: event.toStatus } : null) : null;

  const hasDetails = !!(event.remarks || event.duration || event.inspector || event.operator || event.details || transition);

  return (
    <div
      className="relative z-10"
      data-testid="activity-event"
      data-event-type={event.category}
      data-event-id={event.id}
      {...(transition ? { "data-from-status": transition.from, "data-to-status": transition.to } : {})}
    >
      {/* Node */}
      <div className={`absolute -left-[30px] sm:-left-[30px] top-1 h-7 w-7 rounded-full border-2 bg-background flex items-center justify-center ${config.color.replace("text-", "border-")}`}>
        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
      </div>

      {/* Content */}
      <Card className={`ml-2 sm:ml-4 overflow-hidden border-l-4 ${config.color.replace("text-", "border-l-")}`}>
        <div className={`px-4 py-3 ${config.bgColor}`}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] font-medium bg-background shrink-0">{config.label}</Badge>
                <h4 className="font-semibold text-sm truncate">{event.title}</h4>
              </div>
              {event.employee && event.employee !== "Unknown" && event.employee !== "System" && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>By: <span className="font-medium text-foreground">{event.employee}</span></span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:items-end text-xs text-muted-foreground shrink-0">
              <span className="font-medium text-foreground">
                {event.timestamp.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true })}
              </span>
              <span className="text-[10px]">{formatDistanceToNow(event.timestamp, { addSuffix: true })}</span>
            </div>
          </div>

          {/* Status transition */}
          {transition && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Badge variant="secondary" className="font-mono text-[10px]">{transition.from}</Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="secondary" className="font-mono text-[10px]">{transition.to}</Badge>
            </div>
          )}

          {/* Expand/collapse for details */}
          {hasDetails && !transition && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-6 px-2 text-[10px] text-muted-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {expanded ? "Hide details" : "View details"}
            </Button>
          )}

          {expanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 pt-2 border-t border-border/50 text-xs">
              {event.duration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{event.duration}</span>
                </div>
              )}
              {event.inspector && event.inspector !== event.employee && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="text-muted-foreground">Inspector:</span>
                  <span className="font-medium">{event.inspector}</span>
                </div>
              )}
              {event.operator && event.operator !== event.employee && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="text-muted-foreground">Operator:</span>
                  <span className="font-medium">{event.operator}</span>
                </div>
              )}
              {event.remarks && (
                <div className="col-span-full mt-1 bg-background/50 rounded-md p-2 text-xs text-foreground/80 border whitespace-pre-wrap">
                  <span className="font-semibold text-muted-foreground mr-1">Remarks:</span>
                  {event.remarks}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
