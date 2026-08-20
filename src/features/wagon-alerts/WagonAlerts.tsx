import { WagonAlert } from "./wagonAlertTypes";
import { getAlertColor } from "./WagonAlertBadge";
import { AlertCircle, AlertTriangle, Info, BellRing, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  alerts: WagonAlert[];
  onAction?: (actionType: NonNullable<WagonAlert["actionType"]>) => void;
}

export function WagonAlerts({ alerts, onAction }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg bg-muted/10 border-dashed" data-testid="wagon-alerts-empty">
        <BellRing className="h-6 w-6 text-muted-foreground/30 mb-2 mx-auto" />
        No operational alerts
      </div>
    );
  }

  return (
    <Card className="shadow-sm border-border/50" data-testid="wagon-alerts">
      <CardHeader className="pb-3 border-b bg-muted/10">
        <CardTitle className="text-base flex items-center gap-2">
          <BellRing className="h-4 w-4 text-primary" />
          Operational Alerts
          <Badge variant="secondary" className="ml-auto">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {alerts.map(alert => (
            <div 
              key={alert.id} 
              className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-start gap-4"
              data-testid="wagon-alert"
              data-alert-key={alert.id}
              data-alert-severity={alert.severity}
              data-alert-category={alert.category}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {alert.severity === "CRITICAL" && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {alert.severity === "WARNING" && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                  {alert.severity === "INFO" && <Info className="h-4 w-4 text-blue-500" />}
                  <span className="font-semibold text-sm">{alert.title}</span>
                  <Badge variant="outline" className={`text-[10px] ${getAlertColor(alert.severity).replace('bg-', 'text-').replace('500', '600')} bg-transparent`}>
                    {alert.severity}
                  </Badge>
                </div>
                {alert.description && (
                  <p className="text-xs text-muted-foreground ml-6">
                    {alert.description}
                  </p>
                )}
              </div>
              
              {alert.actionType && onAction && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="shrink-0 text-xs h-7 ml-6 sm:ml-0"
                  onClick={() => onAction(alert.actionType!)}
                >
                  {alert.actionType === "VIEW_MAINTENANCE" && "Open Maintenance"}
                  {alert.actionType === "VIEW_INSPECTION" && "Open Inspection"}
                  {alert.actionType === "VIEW_WORKFLOW" && "Review Workflow"}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
