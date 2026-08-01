import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ElementType;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export function StatCard({ title, value, icon: Icon, description, trend, className, onClick }: StatCardProps) {
  const isInteractive = !!onClick;
  
  return (
    <Card 
      className={cn(
        "shadow-sm border-border/50 transition-colors", 
        isInteractive && "cursor-pointer hover:bg-muted/50 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground tracking-tight">{title}</p>
          {Icon && (
            <div className="p-1.5 sm:p-2 rounded-md bg-secondary/50 text-muted-foreground">
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{value}</h2>
          {trend && (
            <span className={cn(
              "text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full",
              trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}>
              {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {description && (
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
