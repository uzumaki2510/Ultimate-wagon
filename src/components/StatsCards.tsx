import { Card, CardContent } from "@/components/ui/card";
import { WagonRepair } from "@/lib/wagonData";
import { Train, Wrench, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  wagons: WagonRepair[];
  filter: "all" | "in-repair" | "completed";
  onFilterChange: (filter: "all" | "in-repair" | "completed") => void;
}

export function StatsCards({ wagons, filter, onFilterChange }: StatsCardsProps) {
  const totalWagons = wagons.length;
  const inRepair = wagons.filter((w) => w.status === "in-repair").length;
  const completed = wagons.filter((w) => w.status === "completed").length;

  const stats = [
    {
      id: "all" as const,
      label: "Total Wagons",
      value: totalWagons,
      icon: Train,
      color: "text-primary",
      bg: "bg-primary/10",
      activeBorder: "border-primary",
    },
    {
      id: "in-repair" as const,
      label: "In Repair",
      value: inRepair,
      icon: Wrench,
      color: "text-warning",
      bg: "bg-warning/10",
      activeBorder: "border-warning",
      activeIndicator: "bg-warning",
    },
    {
      id: "completed" as const,
      label: "Completed",
      value: completed,
      icon: CheckCircle,
      color: "text-success",
      bg: "bg-success/10",
      activeBorder: "border-success",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {stats.map((stat) => {
        const isActive = filter === stat.id;
        return (
          <Card
            key={stat.id}
            onClick={() => onFilterChange(stat.id)}
            className={cn(
              "cursor-pointer transition-all duration-200 group relative overflow-hidden",
              isActive 
                ? `border-2 ${stat.activeBorder} shadow-md` 
                : "border-transparent shadow-sm hover:shadow-md hover:border-primary/30"
            )}
            style={{ 
              backgroundColor: isActive ? 'var(--card)' : 'rgba(var(--card), 0.7)' 
            }}
          >
            {isActive && stat.activeIndicator && (
              <div className={cn("absolute bottom-0 left-0 right-0 h-1", stat.activeIndicator)} />
            )}
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div 
                  className={cn(
                    "p-1.5 sm:p-2 rounded-lg transition-colors", 
                    isActive ? stat.bg : "bg-muted group-hover:bg-muted/80"
                  )}
                >
                  <stat.icon 
                    className={cn(
                      "h-4 w-4 sm:h-5 sm:w-5 transition-colors", 
                      isActive ? stat.color : "text-muted-foreground group-hover:text-foreground"
                    )} 
                  />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
