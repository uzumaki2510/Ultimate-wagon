import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowRight, Train, Droplets, Wind, ClipboardCheck, Wrench, Activity, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface FlowStage {
  id: string;
  name: string;
  icon: React.ElementType;
  capacity: number;
}

export function WorkshopFlow() {
  const { workflows } = useAppStore();

  const baseStages: FlowStage[] = [
    { id: 'reg', name: 'Register', icon: Train, capacity: 50 },
    { id: 'insp', name: 'Inspection', icon: ClipboardCheck, capacity: 30 },
    { id: 'steam', name: 'Steam', icon: Droplets, capacity: 10 },
    { id: 'degas', name: 'Degassing', icon: Wind, capacity: 10 },
    { id: 'rep', name: 'Repair', icon: Wrench, capacity: 40 },
    { id: 'test', name: 'Testing', icon: Activity, capacity: 20 },
    { id: 'rel', name: 'Release', icon: CheckCircle, capacity: 100 },
  ];

  const stagesWithCounts = useMemo(() => {
    return baseStages.map(stage => {
      let count = 0;
      workflows.forEach(wf => {
        // Map currentStage from workflow to our display stages
        const s = wf.currentStage.toLowerCase();
        if (stage.id === 'reg' && s.includes('register')) count++;
        if (stage.id === 'insp' && s.includes('inspection')) count++;
        if (stage.id === 'steam' && s.includes('steam')) count++;
        if (stage.id === 'degas' && (s.includes('degas') || s.includes('purge'))) count++;
        if (stage.id === 'rep' && s.includes('repair')) count++;
        if (stage.id === 'test' && s.includes('test')) count++;
        if (stage.id === 'rel' && s.includes('fit')) count++;
      });
      return { ...stage, currentCount: count, avgWaitMins: "—" };
    });
  }, [workflows]);

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-h3 flex items-center gap-2">
          Workshop Flow Visualization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4 pt-2 no-scrollbar">
          {stagesWithCounts.map((stage, idx) => {
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
                    <span className={`font-bold ${textColor}`}>{Math.min(utilization, 100)}%</span>
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
                    Avg Wait: {stage.avgWaitMins}
                  </div>
                </div>

                {/* Connector */}
                {idx < stagesWithCounts.length - 1 && (
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
