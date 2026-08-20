import { ChecklistItem } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  itemKey: string;
  label: string;
  item: ChecklistItem | undefined;
  onToggle: (key: string, checked: boolean) => void;
  disabled?: boolean;
}

export function MaintenanceChecklistItem({ itemKey, label, item, onToggle, disabled }: Props) {
  const isChecked = !!item?.checked;

  return (
    <div
      className={`flex items-start gap-3 py-2 px-3 rounded-md transition-colors ${
        isChecked ? "bg-green-50 dark:bg-green-950/20" : "hover:bg-muted/30"
      }`}
      data-testid={`maintenance-item-${itemKey}`}
      data-status={isChecked ? "completed" : "pending"}
      data-completed={isChecked ? "true" : "false"}
    >
      <Checkbox
        id={`mc-${itemKey}`}
        checked={isChecked}
        onCheckedChange={(checked) => onToggle(itemKey, !!checked)}
        disabled={disabled}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <Label
          htmlFor={`mc-${itemKey}`}
          className={`text-sm font-normal cursor-pointer leading-none ${
            isChecked ? "line-through text-muted-foreground" : ""
          }`}
        >
          {label}
        </Label>
        {isChecked && item && (
          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
            {item.checkedBy && (
              <span className="flex items-center gap-1">
                <User className="h-2.5 w-2.5" />
                {item.checkedBy}
              </span>
            )}
            {item.checkedAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {formatDistanceToNow(new Date(item.checkedAt), { addSuffix: true })}
              </span>
            )}
            {item.remarks && (
              <span className="text-foreground/70">"{item.remarks}"</span>
            )}
          </div>
        )}
      </div>
      <Badge
        variant={isChecked ? "default" : "outline"}
        className={`text-[9px] shrink-0 ${
          isChecked
            ? "bg-green-500 hover:bg-green-500"
            : "text-muted-foreground"
        }`}
      >
        {isChecked ? "Done" : "Pending"}
      </Badge>
    </div>
  );
}
