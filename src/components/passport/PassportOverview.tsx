import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { WagonRepair } from '@/lib/wagonData';
import { Activity, ShieldCheck, Zap, AlertTriangle, Train, Clock, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PassportOverviewProps {
  wagon: WagonRepair;
  activeStage?: string;
  defectCount?: number;
}

export function PassportOverview({ wagon, activeStage, defectCount = 0 }: PassportOverviewProps) {
  const healthScore = Math.max(0, 100 - (defectCount * 10));

  let healthColor = "text-success";
  let healthBg = "bg-success";
  if (healthScore < 50) {
    healthColor = "text-destructive";
    healthBg = "bg-destructive";
  } else if (healthScore < 80) {
    healthColor = "text-warning";
    healthBg = "bg-warning";
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-[var(--density-spacing-md,1rem)] h-full">
      
      {/* 1. Identity & Health Card */}
      <Card className="xl:col-span-1 shadow-sm border-border/50">
        <CardHeader className="pb-4 border-b bg-muted/10">
          <CardTitle className="text-h3 flex items-center gap-2">
            <Train className="h-5 w-5 text-primary" />
            Wagon Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-muted">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle className="text-muted/30 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent" />
                <circle className={`${healthColor} stroke-current transition-all duration-1000`} strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * healthScore) / 100} transform="rotate(-90 50 50)" />
              </svg>
              <div className="flex flex-col items-center justify-center text-center">
                <span className={`text-2xl font-bold ${healthColor}`}>{healthScore}%</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Health</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <InfoItem label="Wagon Type" value={wagon.type} />
            <InfoItem label="Owner" value={wagon.owner} />
            <InfoItem label="Built Year" value={wagon.builtYear?.toString() || "Unknown"} />
            <InfoItem label="Capacity" value="70.5T" />
            <InfoItem label="Last POH" value="12-Mar-2023" />
            <InfoItem label="Next POH Due" value="12-Mar-2027" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Current State & Predictive Maintenance */}
      <div className="xl:col-span-2 flex flex-col gap-[var(--density-spacing-md,1rem)] h-full">
        
        {/* Current State */}
        <Card className="flex-none shadow-sm border-border/50 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-primary uppercase font-bold tracking-wider mb-1">Current Operational State</p>
                <h2 className="text-h2 font-bold text-foreground flex items-center gap-2">
                  <Activity className="h-6 w-6 text-primary" />
                  {activeStage || "Idle"}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/> Pending in queue</span>
                  <Badge variant="outline" className="border-primary/30 text-primary">Priority: Normal</Badge>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-4xl font-black text-primary/10 select-none">
                  #{wagon.wagonNo.slice(-4)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Predictive Maintenance & Insights */}
        <Card className="flex-1 shadow-sm border-border/50">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-h3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Predictive Insights (AI)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-destructive">Brake Block Wear Predicted</h4>
                  <p className="text-xs text-muted-foreground mt-1">Based on mileage and age, Brake Block A is 85% likely to fail within the next 30 days. Recommend replacement during current repair cycle.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-warning/5 rounded-lg border border-warning/20">
                <Wrench className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-warning">Wheel Profile Nearing Limit</h4>
                  <p className="text-xs text-muted-foreground mt-1">Historical data suggests wheel turning will be required in approximately 4,000 km.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-success/5 rounded-lg border border-success/20">
                <ShieldCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-success">Structural Integrity</h4>
                  <p className="text-xs text-muted-foreground mt-1">No significant corrosion detected in last 3 inspections. Body panels are within acceptable tolerances.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5 tracking-wider">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}
