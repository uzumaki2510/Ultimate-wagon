import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingState({ text = "Loading data..." }: { text?: string }) {
  return (
    <div className="w-full flex flex-col items-center justify-center p-12 min-h-[200px] animate-fade-in">
      <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
      <p className="text-sm font-medium text-muted-foreground">{text}</p>
    </div>
  );
}

export function LoadingOverlay({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-lg animate-fade-in">
      <Loader2 className="h-8 w-8 text-primary animate-spin mb-4 shadow-sm rounded-full" />
      <p className="text-sm font-medium text-foreground">{text}</p>
    </div>
  );
}
