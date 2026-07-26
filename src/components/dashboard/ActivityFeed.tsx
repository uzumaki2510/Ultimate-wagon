import { useAppStore } from "@/store/useAppStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, PlayCircle, CheckCircle2, PauseCircle, Train, FileText, 
  Droplets, Wind, Wrench, ShieldCheck, ClipboardCheck
} from "lucide-react";

function getEventIcon(action: string, details?: string) {
  const lowerAction = action.toLowerCase();
  const lowerDetails = (details || "").toLowerCase();

  if (lowerAction.includes("added") || lowerAction.includes("registered")) return <Train className="h-4 w-4 text-blue-500" />;
  if (lowerAction.includes("memo")) return <FileText className="h-4 w-4 text-purple-500" />;
  
  if (lowerAction.includes("started") || lowerAction.includes("resumed")) return <PlayCircle className="h-4 w-4 text-blue-500" />;
  if (lowerAction.includes("paused")) return <PauseCircle className="h-4 w-4 text-amber-500" />;
  if (lowerAction.includes("done") || lowerAction.includes("completed") || lowerAction.includes("fit")) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  
  if (lowerDetails.includes("steam")) return <Droplets className="h-4 w-4 text-cyan-500" />;
  if (lowerDetails.includes("degass") || lowerDetails.includes("purge")) return <Wind className="h-4 w-4 text-indigo-500" />;
  if (lowerDetails.includes("repair")) return <Wrench className="h-4 w-4 text-orange-500" />;
  if (lowerDetails.includes("gas free")) return <ShieldCheck className="h-4 w-4 text-emerald-600" />;
  if (lowerDetails.includes("inspection")) return <ClipboardCheck className="h-4 w-4 text-amber-500" />;

  return <Activity className="h-4 w-4 text-muted-foreground" />;
}

function timeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return `${diffSecs}s ago`;
  
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return `Yesterday`;
  return `${diffDays}d ago`;
}

export function ActivityFeed() {
  const { audit } = useAppStore();
  
  // Get top 15 most recent activities
  const recentActivities = audit
    .slice()
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 15);

  return (
    <Card className="h-full flex flex-col shadow-sm border-border/50">
      <CardHeader className="pb-3 border-b bg-muted/20">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
          <Activity className="h-4 w-4 text-primary" />
          Recent Operations Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-[400px] sm:h-full w-full">
          {recentActivities.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No recent activity found.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {recentActivities.map((event) => (
                <div key={event.id} className="p-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex gap-3">
                    <div className="mt-0.5 shrink-0 bg-background border p-1.5 rounded-full shadow-sm">
                      {getEventIcon(event.action, event.details)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {event.action}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 group-hover:text-foreground transition-colors">
                          {timeAgo(event.at)}
                        </span>
                      </div>
                      
                      {event.details && (
                        <p className="text-xs text-muted-foreground/90 leading-snug line-clamp-2 mb-1">
                          {event.details}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          By: {event.actor}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
