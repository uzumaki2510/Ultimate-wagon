import { WagonAlert } from "./wagonAlertTypes";

export function getAlertColor(severity: WagonAlert["severity"]) {
  switch (severity) {
    case "CRITICAL": return "bg-red-500";
    case "WARNING": return "bg-orange-500";
    case "INFO": return "bg-blue-500";
    default: return "bg-gray-500";
  }
}

interface Props {
  alerts: WagonAlert[];
}

export function WagonAlertBadge({ alerts }: Props) {
  if (alerts.length === 0) return null;

  const topAlert = alerts[0];
  const color = getAlertColor(topAlert.severity);

  return (
    <div 
      className="flex items-center gap-1.5 text-[10px] mt-1.5 mb-1.5 p-1 rounded-sm border"
      data-testid="wagon-board-alerts"
      data-has-alerts="true"
    >
      <div className={`h-2 w-2 rounded-full shrink-0 ${color}`} />
      <span className="font-medium truncate flex-1 leading-tight">{topAlert.title}</span>
      {alerts.length > 1 && (
        <span className="shrink-0 text-muted-foreground ml-1">+{alerts.length - 1}</span>
      )}
    </div>
  );
}
