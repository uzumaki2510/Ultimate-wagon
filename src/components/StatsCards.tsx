import { Card, CardContent } from "@/components/ui/card";
import { WagonRepair } from "@/lib/wagonData";
import { Train, Wrench, CheckCircle } from "lucide-react";

interface StatsCardsProps {
  wagons: WagonRepair[];
}

export function StatsCards({ wagons }: StatsCardsProps) {
  const totalWagons = wagons.length;
  const inRepair = wagons.filter((w) => w.status === "in-repair").length;
  const completed = wagons.filter((w) => w.status === "completed").length;

  const stats = [
    {
      label: "Total Wagons",
      value: totalWagons,
      icon: Train,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "In Repair",
      value: inRepair,
      icon: Wrench,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="glass animate-slide-in">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
