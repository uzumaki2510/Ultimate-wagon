import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "An error occurred while loading this content.", 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center p-8 sm:p-12 min-h-[250px] animate-fade-in bg-destructive/5 rounded-lg border border-destructive/20">
      <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-destructive mb-2">{title}</h3>
      <p className="text-sm text-destructive/80 text-center max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="border-destructive/30 text-destructive hover:bg-destructive/10">
          Try Again
        </Button>
      )}
    </div>
  );
}
