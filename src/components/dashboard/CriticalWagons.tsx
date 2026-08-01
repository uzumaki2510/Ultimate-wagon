import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CriticalWagon {
  id: string;
  wagonNo: string;
  severity: "Critical" | "Warning";
  currentStage: string;
  pendingSince: string;
  assignedTo: string;
}

export function CriticalWagons() {
  const nav = useNavigate();

  // Mock critical wagons
  const wagons: CriticalWagon[] = [
    { id: '1', wagonNo: '40030410097', severity: 'Critical', currentStage: 'Repair', pendingSince: '4h 20m', assignedTo: 'John Doe' },
    { id: '2', wagonNo: '40030410091', severity: 'Critical', currentStage: 'Steam', pendingSince: '2h 15m', assignedTo: 'Jane Smith' },
    { id: '3', wagonNo: '40030410084', severity: 'Warning', currentStage: 'Inspection', pendingSince: '1h 45m', assignedTo: 'Unassigned' },
  ];

  return (
    <Card className="shadow-sm border-border/50 h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-h3 flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Critical Wagons
          </CardTitle>
          <Badge variant="destructive" className="rounded-full">{wagons.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto">
        {wagons.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-success/10 text-success flex items-center justify-center mb-3">
              <CheckCircle className="h-6 w-6" />
            </div>
            <p>No critical wagons needing attention.</p>
          </div>
        ) : (
          <div className="divide-y">
            {wagons.map(w => (
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
