import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { WagonRepair, SICK_LINES, SickLine, RepairType, REPAIR_TYPES, BTPGLNWorkflowData, BTPNWorkflowData } from "@/lib/wagonData";
import { EditWagonModal } from "@/components/EditWagonModal";
import { CheckCircle, Clock, Trash2, FileSpreadsheet, Search, Undo2, Pencil, Train, FileText, ArrowRightCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";

interface WagonTableProps {
  wagons: WagonRepair[];
  onComplete: (id: string) => void;
  onUndoComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateSickLine: (id: string, sickLine: SickLine) => void;
  onEdit: (id: string, updates: Partial<WagonRepair>) => void;
  onUpdateBTPGLNWorkflow?: (id: string, workflow: BTPGLNWorkflowData) => void;
  onUpdateBTPNWorkflow?: (id: string, workflow: BTPNWorkflowData) => void;
  onSelectionChange?: (selectedWagons: WagonRepair[]) => void;
  filter: "all" | "in-repair" | "completed";
  isAdmin?: boolean;
}

export function WagonTable({ wagons, onComplete, onUndoComplete, onDelete, onUpdateSickLine, onEdit, onUpdateBTPGLNWorkflow, onUpdateBTPNWorkflow, onSelectionChange, filter, isAdmin = false }: WagonTableProps) {
  const nav = useNavigate();
  const memos = useAppStore((s) => s.memos);
  const zustandWagons = useAppStore((s) => s.wagons);

  // Build a map: wagonNumber -> linked memo count
  const linkedMemoCount = useMemo(() => {
    const map: Record<string, number> = {};
    memos.forEach((memo) => {
      memo.entries.forEach((entry) => {
        const zw = zustandWagons.find((w) => w.id === entry.wagonId);
        if (!zw?.wagonNo) return;
        const key = zw.wagonNo.trim();
        map[key] = (map[key] ?? 0) + 1;
      });
    });
    return map;
  }, [memos, zustandWagons]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingWagon, setEditingWagon] = useState<WagonRepair | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredWagons = useMemo(() => {
    let result = wagons;
    
    // Filter by status
    if (filter !== "all") {
      result = result.filter((w) => w.status === filter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((w) => 
        w.wagonNumber.toLowerCase().includes(query) ||
        w.details.typeName.toLowerCase().includes(query) ||
        w.details.railwayName.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [wagons, filter, searchQuery]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredWagons.map((w) => w.id));
      setSelectedIds(allIds);
      onSelectionChange?.(filteredWagons);
    } else {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectOne = (wagon: WagonRepair, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(wagon.id);
    } else {
      newSelected.delete(wagon.id);
    }
    setSelectedIds(newSelected);
    onSelectionChange?.(wagons.filter((w) => newSelected.has(w.id)));
  };

  const handleSaveEdit = () => {
    // This is now handled entirely inside EditWagonModal
    setEditingWagon(null);
  };

  const openEditDialog = (wagon: WagonRepair) => {
    setEditingWagon(wagon);
  };

  const isAllSelected = filteredWagons.length > 0 && filteredWagons.every((w) => selectedIds.has(w.id));
  const isSomeSelected = filteredWagons.some((w) => selectedIds.has(w.id));

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  return (
    <>
      <Card className="glass animate-fade-in">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileSpreadsheet className="h-5 w-5 text-info" />
              Wagon Register
              <Badge variant="secondary" className="ml-2">
                {filteredWagons.length} wagon{filteredWagons.length !== 1 ? "s" : ""}
              </Badge>
              {selectedIds.size > 0 && (
                <Badge variant="outline" className="ml-2">
                  {selectedIds.size} selected
                </Badge>
              )}
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search wagon no., type, railway..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredWagons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{searchQuery ? "No wagons match your search" : "No wagons found"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                        className={isSomeSelected && !isAllSelected ? "opacity-50" : ""}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">Wagon No.</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Railway</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Main Defect</TableHead>
                    <TableHead className="font-semibold">Repairs</TableHead>
                    <TableHead className="font-semibold">Workflow Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWagons.map((wagon) => (
                    <TableRow key={wagon.id} className="hover:bg-secondary/30 transition-colors">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(wagon.id)}
                          onCheckedChange={(checked) => handleSelectOne(wagon, checked as boolean)}
                          aria-label={`Select wagon ${wagon.wagonNumber}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        {wagon.wagonNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{wagon.details.typeName}</span>
                            {wagon.details.typeName === "BTPGLN" && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900 font-semibold">
                                {wagon.isDegassed ? "DG" : "NON-DG"}
                              </Badge>
                            )}
                            {wagon.details.typeName === "BTPN" && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900 font-semibold">
                                {wagon.isSteamed ? "Steam" : "without Steam"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{wagon.details.category}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {wagon.details.railwayName}
                      </TableCell>
                      <TableCell>
                        {wagon.status === "in-repair" ? (
                          <Badge className="bg-warning text-warning-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            Sick
                          </Badge>
                        ) : (
                          <Badge className="bg-success text-success-foreground">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Fit
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {wagon.comments ? (
                          <Badge variant="outline" className={`font-medium ${wagon.comments.includes('Fit') || wagon.comments.includes('completed') ? 'bg-green-100 text-green-800 border-green-300' : 
                            (wagon.comments.toLowerCase().includes('crack') || wagon.comments.toLowerCase().includes('leak') || wagon.comments.toLowerCase().includes('fail') ? 'bg-red-100 text-red-800 border-red-300 font-bold' : 
                            (wagon.comments.toLowerCase().includes('alert') || wagon.comments.toLowerCase().includes('bind') ? 'bg-orange-100 text-orange-800 border-orange-300 font-semibold' : 'bg-blue-100 text-blue-800 border-blue-300'))}`}>
                            {wagon.comments}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          {wagon.primaryRepair && (
                            <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                              {wagon.primaryRepair}
                            </span>
                          )}
                          {wagon.secondaryRepairs && wagon.secondaryRepairs.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {wagon.secondaryRepairs.map((r, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                  {r}
                                </div>
                              ))}
                            </div>
                          )}
                          {!wagon.primaryRepair && (!wagon.secondaryRepairs || wagon.secondaryRepairs.length === 0) && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const wf = useAppStore.getState().workflows.find(w => w.wagonId === wagon.id);
                          if (!wf || wagon.status !== "in-repair") return <span className="text-muted-foreground text-xs">-</span>;
                          return (
                            <div className="flex gap-1 items-center overflow-x-auto max-w-[200px] no-scrollbar">
                              {wf.stages.map((st, i) => {
                                let bg = "bg-gray-200 dark:bg-gray-700";
                                if (st.status === "Done") bg = "bg-green-500";
                                else if (st.status === "In Progress") bg = "bg-blue-500";
                                else if (st.status === "Delayed") bg = "bg-red-500";
                                return <div key={i} className={`w-3 h-3 rounded-full flex-shrink-0 ${bg}`} title={st.stageName + " - " + st.status} />;
                              })}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {wagon.status === "in-repair" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => setEditingWagon(wagon)}
                              title="Open Workflow Timeline"
                            >
                              <ArrowRightCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-info hover:text-info hover:bg-info/10"
                              onClick={() => openEditDialog(wagon)}
                              title="Edit Wagon"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {wagon.status === "in-repair" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-success hover:text-success hover:bg-success/10"
                              onClick={() => onComplete(wagon.id)}
                              title="Mark as Fit"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-warning hover:text-warning hover:bg-warning/10"
                              onClick={() => onUndoComplete(wagon.id)}
                              title="Undo - Mark as Sick"
                            >
                              <Undo2 className="h-4 w-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => onDelete(wagon.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Linked Memos badge */}
                          {(() => {
                            const count = linkedMemoCount[wagon.wagonNumber.trim()] ?? 0;
                            if (count === 0) return null;
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-violet-600 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950 gap-1"
                                onClick={() => nav(`/memos?wagon=${encodeURIComponent(wagon.wagonNumber)}`)}
                                title={`${count} linked memo${count > 1 ? "s" : ""}`}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span className="text-[11px] font-bold">{count}</span>
                              </Button>
                            );
                          })()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unified Edit Modal for Workflow & Details */}
      {editingWagon && (
        <EditWagonModal 
          wagonId={editingWagon.id} 
          open={!!editingWagon} 
          onOpenChange={(open) => !open && setEditingWagon(null)} 
        />
      )}
    </>
  );
}