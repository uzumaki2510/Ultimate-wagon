import { useState, useRef, useEffect } from "react";
import { DEFECT_LIBRARY } from "@/lib/wagonData";
import { RepairTask, PriorityLevel } from "@/types/index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, ChevronDown, Wrench, AlertTriangle, ShieldAlert, Info } from "lucide-react";

interface DefectMultiSelectProps {
  selectedRepairs: RepairTask[];
  onChange: (repairs: RepairTask[]) => void;
}

const SeverityConfig: Record<PriorityLevel, { color: string; chipColor: string; icon: typeof Info }> = {
  "Normal": {
    color: "text-blue-600",
    chipColor: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    icon: Info,
  },
  "Urgent": {
    color: "text-orange-600",
    chipColor: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    icon: AlertTriangle,
  },
  "Safety Critical": {
    color: "text-red-600",
    chipColor: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    icon: ShieldAlert,
  },
};

function getSeverity(subRepair: string): PriorityLevel {
  for (const group of DEFECT_LIBRARY) {
    const def = group.defects.find(d => d.name === subRepair);
    if (def) return def.severity;
  }
  return "Normal";
}

export function DefectMultiSelect({ selectedRepairs, onChange }: DefectMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Focus search when opened
  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const toggleDefect = (category: string, defectName: string) => {
    const exists = selectedRepairs.find(r => r.category === category && r.subRepair === defectName);
    if (exists) {
      onChange(selectedRepairs.filter(r => !(r.category === category && r.subRepair === defectName)));
    } else {
      onChange([...selectedRepairs, { category, subRepair: defectName, severity: getSeverity(defectName) }]);
    }
  };

  const removeRepair = (task: RepairTask) => {
    onChange(selectedRepairs.filter(r => !(r.category === task.category && r.subRepair === task.subRepair)));
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  };

  const isSelected = (category: string, defectName: string) =>
    selectedRepairs.some(r => r.category === category && r.subRepair === defectName);

  const q = search.toLowerCase().trim();

  // Filter groups and defects by search query
  const filteredGroups = DEFECT_LIBRARY.map(group => ({
    ...group,
    defects: group.defects.filter(d =>
      !q || d.name.toLowerCase().includes(q) || group.groupName.toLowerCase().includes(q)
    ),
  })).filter(group => group.defects.length > 0);

  // When searching, auto-expand all matching groups
  const effectiveExpanded = q
    ? new Set(filteredGroups.map(g => g.groupName))
    : expandedGroups;

  const selectedCount = selectedRepairs.length;

  return (
    <div className="space-y-3">
      {/* Trigger / Dropdown Container */}
      <div ref={containerRef} className="relative">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between h-auto min-h-[44px] py-2 px-3 text-left font-normal"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center gap-2 text-sm">
            <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
            {selectedCount > 0
              ? `${selectedCount} defect${selectedCount > 1 ? "s" : ""} selected`
              : "Select defects..."}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {selectedCount > 0 && (
              <Badge variant="secondary" className="text-xs font-bold">
                {selectedCount}
              </Badge>
            )}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </Button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-background border rounded-lg shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
            {/* Search */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search defects..."
                  className="pl-8 h-9 text-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Grouped Defect List */}
            <ScrollArea className="max-h-[300px]">
              <div className="p-1">
                {filteredGroups.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No defects found for "{search}"
                  </div>
                )}
                {filteredGroups.map(group => {
                  const isExpanded = effectiveExpanded.has(group.groupName);
                  const groupSelectedCount = group.defects.filter(d =>
                    isSelected(group.groupName, d.name)
                  ).length;

                  return (
                    <div key={group.groupName} className="mb-0.5">
                      {/* Group Header */}
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-md hover:bg-muted/60 transition-colors"
                        onClick={() => toggleGroup(group.groupName)}
                      >
                        <span className="flex items-center gap-2">
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`}
                          />
                          {group.groupName}
                        </span>
                        {groupSelectedCount > 0 && (
                          <Badge className="bg-primary/10 text-primary text-[10px] px-1.5 py-0 font-bold border-0">
                            {groupSelectedCount}
                          </Badge>
                        )}
                      </button>

                      {/* Defect Items */}
                      {isExpanded && (
                        <div className="ml-3 pl-3 border-l border-border/50 space-y-0.5 pb-1">
                          {group.defects.map(defect => {
                            const selected = isSelected(group.groupName, defect.name);
                            const config = SeverityConfig[defect.severity];
                            const SevIcon = config.icon;

                            return (
                              <button
                                type="button"
                                key={defect.name}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-all cursor-pointer
                                  ${selected
                                    ? "bg-primary/5 text-foreground font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                  }`}
                                onClick={() => toggleDefect(group.groupName, defect.name)}
                              >
                                <Checkbox
                                  checked={selected}
                                  className="pointer-events-none shrink-0"
                                  tabIndex={-1}
                                />
                                <span className="flex-1 text-left truncate">{defect.name}</span>
                                <SevIcon className={`h-3.5 w-3.5 shrink-0 ${config.color}`} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Footer */}
            {selectedCount > 0 && (
              <div className="border-t px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {selectedCount} selected
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={() => onChange([])}
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Chips */}
      {selectedRepairs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedRepairs.map(task => {
            const config = SeverityConfig[task.severity];
            return (
              <Badge
                key={`${task.category}-${task.subRepair}`}
                variant="outline"
                className={`pl-2.5 pr-1 py-1 gap-1.5 text-xs font-medium border cursor-default transition-colors ${config.chipColor}`}
              >
                <span className="truncate max-w-[160px]">{task.subRepair}</span>
                <button
                  type="button"
                  onClick={() => removeRepair(task)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
