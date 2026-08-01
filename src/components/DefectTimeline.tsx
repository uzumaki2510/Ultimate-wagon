import { WagonRepair } from "@/lib/wagonData";
import { CheckCircle2, Clock, Wrench, UserCheck, Flag, Lock } from "lucide-react";

interface DefectTimelineProps {
  wagon: WagonRepair;
}

export function DefectTimeline({ wagon }: DefectTimelineProps) {
  // Mock timeline events for demonstration since there's no actual backend timeline data per defect
  const events = [
    {
      id: "1",
      status: "Reported",
      date: wagon.arrivalDate ? new Date(wagon.arrivalDate).toLocaleDateString() : "24 Jul",
      time: "08:30 AM",
      user: "Inspector Ravi",
      icon: Flag,
      color: "bg-blue-500",
      active: true
    },
    {
      id: "2",
      status: "Verified",
      date: wagon.arrivalDate ? new Date(wagon.arrivalDate).toLocaleDateString() : "24 Jul",
      time: "10:15 AM",
      user: "SSE Mahesh",
      icon: UserCheck,
      color: "bg-purple-500",
      active: true
    },
    {
      id: "3",
      status: "Assigned",
      date: "24 Jul",
      time: "11:00 AM",
      user: "Fitter Team A",
      icon: Clock,
      color: "bg-orange-500",
      active: wagon.status === "in-repair" || (wagon.status as any) === "REPAIR_IN_PROGRESS" || (wagon.status as any) === "FIT_READY" || (wagon.status as string) === "fit" || wagon.status === "completed"
    },
    {
      id: "4",
      status: "Repair Started",
      date: "25 Jul",
      time: "09:00 AM",
      user: "Fitter Team A",
      icon: Wrench,
      color: "bg-amber-500",
      active: wagon.status === "in-repair" || (wagon.status as any) === "REPAIR_IN_PROGRESS" || (wagon.status as any) === "FIT_READY" || (wagon.status as string) === "fit" || wagon.status === "completed"
    },
    {
      id: "5",
      status: "Repair Completed",
      date: "26 Jul",
      time: "02:30 PM",
      user: "Fitter Team A",
      icon: CheckCircle2,
      color: "bg-green-500",
      active: (wagon.status as any) === "FIT_READY" || (wagon.status as string) === "fit" || wagon.status === "completed"
    },
    {
      id: "6",
      status: "Closed",
      date: "26 Jul",
      time: "04:00 PM",
      user: "SSE Mahesh",
      icon: Lock,
      color: "bg-slate-500",
      active: (wagon.status as any) === "FIT_READY" || (wagon.status as string) === "fit" || wagon.status === "completed"
    }
  ];

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
                <span className="text-xs text-muted-foreground font-medium">{event.date} • {event.time}</span>
              </div>
              <span className="text-xs text-muted-foreground mt-0.5">By: {event.user}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
