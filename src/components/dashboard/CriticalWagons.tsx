import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

interface CriticalWagon {
  id: string;
  wagonNo: string;
  severity: "Critical" | "Warning";
  currentStage: string;
  pendingSince: string;
  assignedTo: string;
}

function timeSince(dateString?: string) {
  if (!dateString) return "—";
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  const remMins = diffMins % 60;
  return `${diffHours}h ${remMins}m`;
}

export function CriticalWagons() {
  const nav = useNavigate();
  const { wagons, workflows } = useAppStore();

  const criticalWagons = useMemo(() => {
    const list: CriticalWagon[] = [];
    const criticalStatuses = ["REPAIR_IN_PROGRESS", "SICK_LINE"];
    
    wagons.forEach(w => {
      if (criticalStatuses.includes(w.status)) {
        const wf = workflows.find(wf => wf.wagonId === w.id);
        let pendingTime = "—";
        let assignedTo = "Unassigned";
        let stageName: string = w.status;
        
        if (wf) {
          stageName = wf.currentStage;
          const currentStageRecord = wf.stages.find(s => s.stageName === wf.currentStage);
          if (currentStageRecord) {
            pendingTime = timeSince(currentStageRecord.startedAt || w.updatedAt);
            assignedTo = currentStageRecord.staffName || "Unassigned";
          }
        } else {
          pendingTime = timeSince(w.updatedAt);
        }

        const severity = w.status === "SICK_LINE" ? "Warning" : "Critical";

        list.push({
          id: w.id,
          wagonNo: w.wagonNo,
          severity,
          currentStage: stageName,
          pendingSince: pendingTime,
          assignedTo
        });
      }
    });

    // Sort by pending time roughly (assuming longer time string format is roughly comparable, or just sort by updatedAt if we had it)
    // For simplicity, we just return the list here, could be enhanced to sort by actual date
    return list.slice(0, 5); // Limit to top 5
  }, [wagons, workflows]);

  return (
    <Card className="shadow-sm border-border/50 h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-h3 flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Critical Wagons
          </CardTitle>
          <Badge variant="destructive" className="rounded-full">{criticalWagons.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto">
        {criticalWagons.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-success/10 text-success flex items-center justify-center mb-3">
              <CheckCircle className="h-6 w-6" />
            </div>
            <p>No critical wagons needing attention.</p>
          </div>
        ) : (
          <div className="divide-y">
            {criticalWagons.map(w => (
              <div key={w.id} className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{w.wagonNo}</span>
                    <Badge variant="outline" className={w.severity === 'Critical' ? "border-destructive text-destructive" : "border-warning text-warning"}>
                      {w.severity}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/80">{w.currentStage}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3"/> Pending: {w.pendingSince}</span>
                    <span>Assignee: {w.assignedTo}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => nav(`/wagon/${w.id}`)}>
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
