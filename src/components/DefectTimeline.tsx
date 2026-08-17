import { WagonRepair } from "@/lib/wagonData";
import { CheckCircle2, Clock, Wrench, UserCheck, Flag, Lock, Activity } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useMemo } from "react";

interface DefectTimelineProps {
  wagon: WagonRepair;
}

export function DefectTimeline({ wagon }: DefectTimelineProps) {
  const { workflows } = useAppStore();
  
  const events = useMemo(() => {
    const workflow = workflows.find(wf => wf.wagonId === wagon.id);
    
    if (!workflow || workflow.stages.length === 0) {
      return [
        {
          id: "1",
          status: "Reported",
          date: wagon.arrivalDate ? new Date(wagon.arrivalDate).toLocaleDateString() : "N/A",
          time: "-",
          user: "System",
          icon: Flag,
          color: "bg-blue-500",
          active: true
        }
      ];
    }

    return workflow.stages.map((stage, idx) => {
      let icon = Activity;
      let color = "bg-blue-500";
      
      const name = stage.stageName.toLowerCase();
      if (name.includes('repair')) { icon = Wrench; color = "bg-amber-500"; }
      else if (name.includes('inspect')) { icon = UserCheck; color = "bg-purple-500"; }
      else if (name.includes('fit') || name.includes('release')) { icon = CheckCircle2; color = "bg-green-500"; }
      else if (name.includes('delay') || name.includes('sick')) { icon = Flag; color = "bg-red-500"; }

      const dateObj = stage.completedAt ? new Date(stage.completedAt) : (stage.startedAt ? new Date(stage.startedAt) : null);

      return {
        id: idx.toString(),
        status: stage.stageName,
        date: dateObj ? dateObj.toLocaleDateString() : "Pending",
        time: dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-",
        user: stage.staffName || stage.inspectorName || stage.sscJeName || "Unassigned",
        icon,
        color,
        active: stage.status === "Done" || stage.status === "In Progress"
      };
    });
  }, [workflows, wagon]);

  return (
    <div className="space-y-4 py-4 px-2">
      <h3 className="font-semibold text-sm">Condition Timeline</h3>
      <div className="relative border-l-2 border-muted ml-4 space-y-6">
        {events.map((event, i) => (
          <div key={event.id} className="relative pl-6">
            <div className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full flex items-center justify-center ring-4 ring-background ${event.active ? event.color : 'bg-muted'}`}>
              <event.icon className={`w-3 h-3 ${event.active ? 'text-white' : 'text-muted-foreground'}`} />
            </div>
            <div className={`flex flex-col ${event.active ? '' : 'opacity-50'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{event.status}</span>
                <span className="text-xs text-muted-foreground font-medium">{event.date} {event.time !== '-' ? `• ${event.time}` : ''}</span>
              </div>
              <span className="text-xs text-muted-foreground mt-0.5">By: {event.user}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
