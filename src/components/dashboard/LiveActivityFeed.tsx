import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Wrench, Droplets, CheckCircle, Train, Wind, ClipboardCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';

export function LiveActivityFeed() {
  const { audit, wagons } = useAppStore();

  const events = useMemo(() => {
    return audit
      .slice()
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 10) // show top 10 live events
      .map(log => {
        // Find wagon to get wagonNo if possible
        const w = wagons.find(wag => wag.id === log.wagonId);
        
        let type = "Activity";
        const text = `${log.action} ${log.details || ""}`.toLowerCase();
        if (text.includes('steam')) type = "Steam";
        else if (text.includes('repair')) type = "Repair";
        else if (text.includes('inspect')) type = "Inspection";
        else if (text.includes('fit') || text.includes('release')) type = "Release";
        else if (text.includes('degas') || text.includes('purge')) type = "Degassing";

        return {
          id: log.id,
          time: new Date(log.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: log.action,
          details: log.details,
          wagonNo: w ? w.wagonNo : (log.wagonId ? log.wagonId.substring(0, 8) : ""),
          type
        };
      });
  }, [audit, wagons]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'Steam': return <Droplets className="h-4 w-4 text-cyan-500" />;
      case 'Repair': return <Wrench className="h-4 w-4 text-orange-500" />;
      case 'Release': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'Inspection': return <ClipboardCheck className="h-4 w-4 text-amber-500" />;
      case 'Degassing': return <Wind className="h-4 w-4 text-indigo-500" />;
      default: return <Activity className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Card className="shadow-sm border-border/50 h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-h3 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] animate-pulse">Live</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {events.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No recent activity.
            </div>
          ) : (
            events.map((e, idx) => (
              <div key={e.id} className={`flex items-start gap-4 p-4 ${idx !== events.length -1 ? 'border-b border-border/50' : ''}`}>
                <div className="text-xs font-mono text-muted-foreground pt-1">{e.time}</div>
                <div className="mt-1">{getIcon(e.type)}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold leading-none">{e.action}</p>
                  {e.details && (
                    <p className="text-xs text-muted-foreground leading-snug line-clamp-1">{e.details}</p>
                  )}
                  {e.wagonNo && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                      <Train className="h-3 w-3" /> {e.wagonNo}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
