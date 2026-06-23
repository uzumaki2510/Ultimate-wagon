import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FolderSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon: Icon = FolderSearch, 
  actionLabel, 
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <Card className={`border-dashed border-2 shadow-sm bg-background/50 ${className}`}>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
        <div className="h-16 w-16 rounded-full bg-secondary/80 flex items-center justify-center mb-6 text-muted-foreground shadow-sm">
          <Icon className="h-8 w-8 opacity-80" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground tracking-tight">{title}</h3>
        <p className="text-muted-foreground text-sm max-w-[350px] mb-6 leading-relaxed">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="default" className="shadow-sm">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
