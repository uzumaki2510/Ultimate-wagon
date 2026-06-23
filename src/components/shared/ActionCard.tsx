import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  onClick?: () => void;
  className?: string;
  contentClassName?: string;
  children?: React.ReactNode;
  rightAction?: React.ReactNode;
  active?: boolean;
}

export function ActionCard({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  className, 
  contentClassName,
  children,
  rightAction,
  active = false
}: ActionCardProps) {
  const isInteractive = !!onClick;
  
  return (
    <Card 
      onClick={onClick}
      className={cn(
        "transition-all duration-200 border-border/50",
        isInteractive && "cursor-pointer hover:shadow-modern hover:border-primary/30 active:scale-[0.99]",
        active && "border-primary shadow-sm bg-primary/5",
        className
      )}
    >
      <CardHeader className="p-4 sm:p-5 flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex gap-3 items-start">
          {Icon && (
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              active ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            )}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="space-y-1 mt-0.5">
            <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">{title}</CardTitle>
            {description && <CardDescription className="text-xs sm:text-sm line-clamp-2">{description}</CardDescription>}
          </div>
        </div>
        {rightAction && <div className="shrink-0">{rightAction}</div>}
      </CardHeader>
      {children && (
        <CardContent className={cn("p-4 sm:p-5 pt-0 sm:pt-0", contentClassName)}>
          {children}
        </CardContent>
      )}
    </Card>
  );
}
