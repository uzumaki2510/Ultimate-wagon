import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { WagonRepair } from '@/lib/wagonData';
import { Activity, ShieldCheck, Zap, AlertTriangle, Train, Clock, Wrench, Info, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PassportOverviewProps {
  wagon: any; // Using any for extended Wagon type
  activeStage?: string;
  defectCount?: number;
}

export function PassportOverview({ wagon, activeStage, defectCount = 0 }: PassportOverviewProps) {
  
  // Compute Defect Information from repairTasks if available
  const repairTasks = wagon.repairTasks || [];
  const totalDefects = repairTasks.length;
  const criticalDefects = repairTasks.filter((t: any) => t.severity === 'Safety Critical').length;
  const majorDefects = repairTasks.filter((t: any) => t.severity === 'Urgent').length;
  const minorDefects = repairTasks.filter((t: any) => t.severity === 'Normal').length;
  
  // Note: Since we don't have task-level completion status in repairTasks right now, 
  // we'll simulate pending/completed based on wagon status for realistic UI structure
  const isRepairDone = ["REPAIR_COMPLETE", "FIT_CERTIFICATE_PENDING", "FIT_READY", "RELEASED"].includes(wagon.status);
  const completedRepairs = isRepairDone ? totalDefects : 0;
  const pendingRepairs = totalDefects - completedRepairs;
  const repairProgress = totalDefects === 0 ? 100 : Math.round((completedRepairs / totalDefects) * 100);

  return (
    <div className="flex flex-col gap-6 h-full">
      
      {/* 1. Workflow Status Card (Inline overview) */}
      <Card className="flex-none shadow-sm border-border/50 bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-primary uppercase font-bold tracking-wider mb-1">Current Operational State</p>
              <h2 className="text-h2 font-bold text-foreground flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                {activeStage || "No Active Workflow"}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3"/> 
                  {activeStage ? "In Workshop Queue" : "Not yet inducted into workshop flow"}
                </span>
                {activeStage && <Badge variant="outline" className="border-primary/30 text-primary">Priority: Normal</Badge>}
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-4xl font-black text-primary/10 select-none">
                #{wagon.wagonNo?.slice(-4) || wagon.wagonNumber?.slice(-4) || "0000"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-[var(--density-spacing-md,1.5rem)]">
        
        {/* Wagon Information Card */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Wagon Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
              <InfoItem label="Wagon Number" value={wagon.wagonNo} valueClassName="font-mono" />
              <InfoItem label="Check Number" value="N/A" valueClassName="font-mono text-muted-foreground" />
              <InfoItem label="Type" value={wagon.type} />
              <InfoItem label="Railway" value="WR" />
              <InfoItem label="Owner" value={wagon.owner || "IR"} />
              <InfoItem label="Load Status" value="Empty" />
              <InfoItem label="Current Status" value={wagon.status?.replace(/_/g, ' ')} />
              <InfoItem label="Registration Date" value={wagon.createdAt ? new Date(wagon.createdAt).toLocaleDateString() : "N/A"} valueClassName="font-mono" />
              <InfoItem label="Last Updated" value={wagon.updatedAt ? new Date(wagon.updatedAt).toLocaleDateString() : "N/A"} valueClassName="font-mono" />
              <InfoItem label="Current Line" value={wagon.bookedTo || "N/A"} />
              <InfoItem label="Workshop Status" value={wagon.status === 'RELEASED' ? 'Dispatched' : 'In Workshop'} />
              <InfoItem label="Memo Number" value={wagon.memoId || "N/A"} valueClassName="font-mono" />
              <InfoItem label="Repair Category" value={wagon.repairTypes?.join(", ") || "General"} />
              <InfoItem label="Primary Defect" value={wagon.defect || "N/A"} />
              <InfoItem label="Total Defects" value={totalDefects.toString()} valueClassName="font-bold text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Defect Information Card */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4 text-destructive" />
              Defect Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {totalDefects === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-muted/20 border-dashed">
                <CheckCircle2 className="h-8 w-8 text-success/50 mb-2" />
                <p className="text-sm font-medium text-foreground">No defects recorded.</p>
                <p className="text-xs text-muted-foreground mt-1">This wagon has a clean bill of health.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4 border-b pb-6">
                  <div className="flex flex-col items-center p-3 bg-destructive/5 rounded-md border border-destructive/20">
                    <span className="text-2xl font-black text-destructive">{criticalDefects}</span>
                    <span className="text-[10px] uppercase font-bold text-destructive/80 tracking-wider mt-1 text-center">Critical<br/>Defects</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-warning/5 rounded-md border border-warning/20">
                    <span className="text-2xl font-black text-warning">{majorDefects}</span>
                    <span className="text-[10px] uppercase font-bold text-warning/80 tracking-wider mt-1 text-center">Major<br/>Defects</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-md border border-border">
                    <span className="text-2xl font-black text-foreground">{minorDefects}</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-1 text-center">Minor<br/>Defects</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Repair Progress</h4>
                  
                  <div className="flex items-center justify-between text-sm font-medium">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending</span>
                      <span className="text-lg font-bold">{pendingRepairs}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-wider text-success">Completed</span>
                      <span className="text-lg font-bold text-success">{completedRepairs}</span>
                    </div>
                  </div>
                  
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-success transition-all duration-1000" 
                      style={{ width: `${repairProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-right text-muted-foreground font-mono">{repairProgress}% Resolved</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function InfoItem({ label, value, valueClassName = "" }: { label: string, value: string, valueClassName?: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5 tracking-wider">{label}</p>
      <p className={`text-sm font-medium ${valueClassName}`}>{value || "—"}</p>
    </div>
  );
}
