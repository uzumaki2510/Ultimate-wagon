import { useState, useMemo } from "react";
import { Wagon, InspectionChecklist } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, ClipboardCheck, Filter } from "lucide-react";
import { MaintenanceChecklistItem } from "./MaintenanceChecklistItem";
import { getChecklistSections } from "./maintenanceProgress";
import { isTankWagonType } from "@/lib/workflowConfig";
import { toast } from "@/hooks/use-toast";

interface Props {
  wagon: Wagon;
}

type FilterValue = "all" | "pending" | "completed";

export function MaintenanceChecklist({ wagon }: Props) {
  const { updateInspectionChecklist, log } = useAppStore();
  const { user, isAdmin } = useAuth();
  const isTank = isTankWagonType(wagon.type);

  const [filter, setFilter] = useState<FilterValue>("all");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const sections = useMemo(() => getChecklistSections(wagon.inspectionChecklist, isTank), [wagon.inspectionChecklist, isTank]);

  const filteredSections = useMemo(() => {
    if (filter === "all") return sections;
    return sections
      .map(section => ({
        ...section,
        items: section.items.filter(item =>
          filter === "completed" ? item.item?.checked : !item.item?.checked
        ),
      }))
      .filter(section => section.items.length > 0);
  }, [sections, filter]);

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const handleToggle = (key: string, checked: boolean) => {
    if (!isAdmin) {
      toast({ title: "Permission Denied", description: "Only authorized users can update checklist items.", variant: "destructive" });
      return;
    }

    const patch: Partial<InspectionChecklist> = {
      [key]: checked
        ? { checked: true, checkedBy: user?.name || "Unknown", checkedAt: new Date().toISOString() }
        : undefined,
    };

    updateInspectionChecklist(wagon.id, patch);

    log({
      actor: user?.name || "user",
      action: checked ? "Checklist item completed" : "Checklist item unchecked",
      wagonId: wagon.id,
      details: key,
    });

    toast({
      title: checked ? "Item Completed" : "Item Unchecked",
      description: key,
    });
  };

  // Calculate totals for badge
  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  const completedItems = sections.reduce((sum, s) => sum + s.items.filter(i => i.item?.checked).length, 0);

  return (
    <div data-testid="maintenance-checklist">
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Inspection Checklist
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {completedItems} / {totalItems}
              </Badge>
              <Select value={filter} onValueChange={(v) => setFilter(v as FilterValue)}>
                <SelectTrigger className="w-[120px] h-7 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSections.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No checklist items match the current filter.
            </div>
          ) : (
            filteredSections.map(section => {
              const sectionCompleted = section.items.filter(i => i.item?.checked).length;
              const isCollapsed = collapsedSections.has(section.title);

              return (
                <div key={section.title} className="border-b last:border-b-0">
                  <button
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors text-left"
                    onClick={() => toggleSection(section.title)}
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                      <span className="text-sm font-semibold">{section.title}</span>
                    </div>
                    <Badge
                      variant={sectionCompleted === section.items.length ? "default" : "secondary"}
                      className={`text-[10px] ${sectionCompleted === section.items.length ? "bg-green-500 hover:bg-green-500" : ""}`}
                    >
                      {sectionCompleted} / {section.items.length}
                    </Badge>
                  </button>
                  {!isCollapsed && (
                    <div className="px-4 pb-3 space-y-1">
                      {section.items.map(item => (
                        <MaintenanceChecklistItem
                          key={item.key}
                          itemKey={item.key}
                          label={item.label}
                          item={item.item}
                          onToggle={handleToggle}
                          disabled={!isAdmin}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
