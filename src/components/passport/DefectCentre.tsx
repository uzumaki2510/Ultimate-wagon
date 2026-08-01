import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WagonRepair, RepairTask } from '@/lib/wagonData';
import { AlertTriangle, Wrench, Clock, CheckCircle } from 'lucide-react';
import { WagonDiagram } from '@/components/WagonDiagram';

interface DefectCentreProps {
  wagon: WagonRepair;
}

export function DefectCentre({ wagon }: DefectCentreProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>();
  const defects = wagon.repairTasks || [];

  const filteredDefects = selectedLocation 
    ? defects.filter(d => {
        // Very rudimentary filter logic matching the WagonDiagram dummy logic
        const text = (d.repairType + " " + d.subRepair).toLowerCase();
        if (selectedLocation === "bogie-a") return text.includes("bogie a") || text.includes("wheel a");
        if (selectedLocation === "bogie-b") return text.includes("bogie b") || text.includes("wheel b");
        if (selectedLocation === "roof") return text.includes("roof");
        if (selectedLocation === "left") return text.includes("left");
        if (selectedLocation === "right") return text.includes("right");
        if (selectedLocation === "underframe") return text.includes("under") || text.includes("frame");
        return true; // Fallback for center or unmapped
      })
    : defects;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--density-spacing-md,1rem)] h-full">
      
      {/* 1. Interactive Diagram */}
      <Card className="lg:col-span-1 shadow-sm border-border/50">
        <CardHeader className="pb-2 border-b bg-muted/10">
          <CardTitle className="text-h3">Defect Map</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <WagonDiagram 
            wagon={wagon} 
            defects={defects}
            selectedLocation={selectedLocation}
            onSelectLocation={(loc) => setSelectedLocation(loc === selectedLocation ? undefined : loc)}
          />
        </CardContent>
      </Card>

      {/* 2. Defect List */}
      <Card className="lg:col-span-2 shadow-sm border-border/50 flex flex-col h-full">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-h3 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Identified Defects
            </CardTitle>
            <Badge variant="outline">{filteredDefects.length} Defects</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-y-auto">
          {filteredDefects.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <CheckCircle className="h-10 w-10 text-success mb-3 opacity-50" />
              <p>No defects identified for this location.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredDefects.map((d, idx) => (
                <div key={idx} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{d.repairType}</span>
                        <Badge variant="outline" className={
                          d.priority === 'Critical' ? "border-destructive text-destructive bg-destructive/10" : 
                          d.priority === 'High' ? "border-warning text-warning bg-warning/10" : "bg-muted"
                        }>
                          {d.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground/80">{d.subRepair}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3"/> Est. Time: {d.estimatedMinutes}m</span>
                        <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Parts: {d.partsRequired.length ? d.partsRequired.join(", ") : "None"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
}
