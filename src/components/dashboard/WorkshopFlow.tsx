import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowRight, Train, Droplets, Wind, ClipboardCheck, Wrench, Activity, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface FlowStage {
  id: string;
  name: string;
  icon: React.ElementType;
  currentCount: number;
  capacity: number;
  avgWaitMins: number;
}

export function WorkshopFlow() {
  const stages: FlowStage[] = [
    { id: 'reg', name: 'Register', icon: Train, currentCount: 5, capacity: 20, avgWaitMins: 10 },
    { id: 'insp', name: 'Inspection', icon: ClipboardCheck, currentCount: 15, capacity: 20, avgWaitMins: 45 },
    { id: 'steam', name: 'Steam', icon: Droplets, currentCount: 4, capacity: 5, avgWaitMins: 120 },
    { id: 'degas', name: 'Degassing', icon: Wind, currentCount: 2, capacity: 5, avgWaitMins: 90 },
    { id: 'rep', name: 'Repair', icon: Wrench, currentCount: 19, capacity: 20, avgWaitMins: 180 },
    { id: 'test', name: 'Testing', icon: Activity, currentCount: 8, capacity: 15, avgWaitMins: 30 },
    { id: 'rel', name: 'Release', icon: CheckCircle, currentCount: 12, capacity: 50, avgWaitMins: 5 },
  ];

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-h3 flex items-center gap-2">
          Workshop Flow Visualization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4 pt-2 no-scrollbar">
          {stages.map((stage, idx) => {
            const utilization = Math.round((stage.currentCount / stage.capacity) * 100);
            
            // Determine capacity color
            let progressColor = "bg-success"; // <70%
            let textColor = "text-success-foreground";
            if (utilization >= 90) {
              progressColor = "bg-destructive";
              textColor = "text-destructive";
            } else if (utilization >= 70) {
              progressColor = "bg-warning";
              textColor = "text-warning";
            }

            return (
              <React.Fragment key={stage.id}>
                {/* Stage Node */}
                <div className="flex flex-col items-center min-w-[120px] p-3 rounded-lg border bg-card hover:bg-secondary/20 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-2 group-hover:scale-110 transition-transform">
                    <stage.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold mb-1 text-center">{stage.name}</span>
                  
                  {/* Utilization Metric */}
                  <div className="w-full flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{stage.currentCount}/{stage.capacity}</span>
                    <span className={`font-bold ${textColor}`}>{utilization}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${progressColor} transition-all`} 
                      style={{ width: `${Math.min(utilization, 100)}%` }} 
                    />
                  </div>

                  {/* Wait Time */}
                  <div className="mt-2 text-[10px] text-muted-foreground">
                    Avg Wait: {stage.avgWaitMins}m
                  </div>
                </div>

                {/* Connector */}
                {idx < stages.length - 1 && (
                  <div className="flex-shrink-0 text-muted-foreground/30 px-1">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
