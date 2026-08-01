import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Wrench, Droplets, CheckCircle, Train } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FeedEvent {
  id: string;
  time: string;
  action: string;
  wagonNo: string;
  type: "Steam" | "Repair" | "Inspection" | "Release" | "Testing";
}

export function LiveActivityFeed() {
  const events: FeedEvent[] = [
    { id: '1', time: '09:31', action: 'Steam Completed', wagonNo: '40030410097', type: 'Steam' },
    { id: '2', time: '09:28', action: 'Repair Started', wagonNo: '40030410091', type: 'Repair' },
    { id: '3', time: '09:24', action: 'Inspection Completed', wagonNo: '40030410084', type: 'Inspection' },
    { id: '4', time: '09:15', action: 'Wagon Released', wagonNo: '40030410055', type: 'Release' },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'Steam': return <Droplets className="h-4 w-4 text-blue-500" />;
      case 'Repair': return <Wrench className="h-4 w-4 text-amber-500" />;
      case 'Release': return <CheckCircle className="h-4 w-4 text-green-500" />;
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
          {events.map((e, idx) => (
            <div key={e.id} className={`flex items-start gap-4 p-4 ${idx !== events.length -1 ? 'border-b border-border/50' : ''}`}>
              <div className="text-xs font-mono text-muted-foreground pt-1">{e.time}</div>
              <div className="mt-1">{getIcon(e.type)}</div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold leading-none">{e.action}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Train className="h-3 w-3" /> {e.wagonNo}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
