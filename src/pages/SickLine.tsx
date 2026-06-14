import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight } from "lucide-react";

export default function SickLine() {
  const { workflows, advanceWorkflow } = useAppStore();

  const groups = workflows.reduce<Record<string, typeof workflows>>((acc, wf) => {
    (acc[wf.wagonType] ||= []).push(wf);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sick Line Workflow</h1>
        <p className="text-sm text-muted-foreground">Track each wagon through type-specific repair stages.</p>
      </div>

      {Object.entries(groups).map(([type, items]) => (
        <Card key={type}>
          <CardHeader><CardTitle className="text-base">{type} <Badge variant="outline" className="ml-2">{items.length} wagons</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {items.map((wf) => (
              <div key={wf.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-mono text-sm font-semibold">{wf.wagonNo}</div>
                    <div className="text-xs text-muted-foreground">Updated {new Date(wf.updatedAt).toLocaleString()}</div>
                  </div>
                  <Badge>{wf.currentStage}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {wf.stages.map((s, i) => {
                    const isDone = wf.completedStages.includes(s);
                    const isCurrent = s === wf.currentStage;
                    return (
                      <div key={s} className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant={isCurrent ? "default" : isDone ? "secondary" : "outline"}
                          className="text-xs h-7"
                          onClick={() => advanceWorkflow(wf.id, s)}
                        >
                          {isDone && <CheckCircle2 className="h-3 w-3 mr-1" />} {s}
                        </Button>
                        {i < wf.stages.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      {workflows.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No wagons in sick line.</CardContent></Card>}
    </div>
  );
}
