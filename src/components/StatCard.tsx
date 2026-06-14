import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label, value, icon: Icon, tone = "default",
}: { label: string; value: number | string; icon: LucideIcon; tone?: "default" | "warning" | "success" | "danger" | "info" }) {
  const tones: Record<string, string> = {
    default: "bg-secondary text-secondary-foreground",
    warning: "bg-warning/15 text-warning",
    success: "bg-success/15 text-success",
    danger: "bg-destructive/15 text-destructive",
    info: "bg-info/15 text-info",
  };
  return (
    <Card className="p-4 flex items-center gap-3 hover:shadow-md transition">
      <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center", tones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-bold leading-tight">{value}</div>
      </div>
    </Card>
  );
}
