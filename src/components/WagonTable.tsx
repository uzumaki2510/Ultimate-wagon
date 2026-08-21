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
import { WagonRepair, SICK_LINES, SickLine, RepairType, REPAIR_TYPES, DEFECT_LIBRARY, BTPGLNWorkflowData, BTPNWorkflowData } from "@/lib/wagonData";
import { ConditionSummary } from "@/components/ConditionSummary";
import { CheckCircle, Clock, Trash2, FileSpreadsheet, Search, Undo2, Pencil, Train, FileText, ArrowRightCircle, AlertTriangle, Droplets, Flame, ArrowRight, Archive, X, MoreVertical } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { WagonWorkflowStatus } from "@/components/WagonWorkflowStatus";
import { ManageWagonPanel } from "@/components/ManageWagon/ManageWagonPanel";
import { ConditionPanel } from "@/components/ConditionPanel";
import { getWorkflowForWagonType } from "@/lib/wagonWorkflows";
import { getWagonSubtypeDisplay, getRailwayShortName } from "@/lib/wagonDisplay";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const updateWagon = useAppStore((s) => s.updateWagon);

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Unified Manage Wagon Panel State
  const [manageWagonId, setManageWagonId] = useState<string | null>(null);
  const [manageWagonTab, setManageWagonTab] = useState<"workflow" | "details" | "repairs">("workflow");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [moveDestination, setMoveDestination] = useState<string>("");

  const handleBulkDelete = async () => {
    setIsProcessingBulk(true);
    for (const id of selectedIds) {
      onDelete(id);
    }
    setSelectedIds(new Set());
    onSelectionChange?.([]);
    setIsProcessingBulk(false);
    setIsDeleteDialogOpen(false);
  };

  const handleBulkArchive = async () => {
    setIsProcessingBulk(true);
    for (const id of selectedIds) {
      updateWagon(id, { status: "ARCHIVED" as any });
    }
    setSelectedIds(new Set());
    onSelectionChange?.([]);
    setIsProcessingBulk(false);
    setIsArchiveDialogOpen(false);
  };

  const handleBulkMove = async () => {
    setIsProcessingBulk(true);
    for (const id of selectedIds) {
      onUpdateSickLine(id, moveDestination as SickLine);
    }
    setSelectedIds(new Set());
    onSelectionChange?.([]);
    setIsProcessingBulk(false);
    setIsMoveDialogOpen(false);
    setMoveDestination("");
  };

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
            <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
              <FileSpreadsheet className="h-5 w-5 text-info" />
              Wagon Register
              {selectedIds.size > 0 ? (
                <Badge className="ml-2 bg-primary text-primary-foreground">
                  ✓ {selectedIds.size} Selected
                </Badge>
              ) : (
                <Badge variant="secondary" className="ml-2">
                  {filteredWagons.length} Wagon{filteredWagons.length !== 1 ? "s" : ""}
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
        {selectedIds.size > 0 && (
          <div className="hidden sm:flex sticky top-0 z-10 items-center gap-3 bg-white border border-border/50 shadow-sm rounded-xl py-3 px-4 mx-6 mb-4 animate-in fade-in slide-in-from-top-4">
            <Button size="sm" onClick={() => setIsMoveDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <ArrowRight className="h-4 w-4" /> Move Wagons
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setIsArchiveDialogOpen(true)} className="gap-2 text-secondary-foreground">
              <Archive className="h-4 w-4" /> Archive Wagons
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="gap-2">
              <Trash2 className="h-4 w-4" /> Delete Wagons
            </Button>
            <div className="flex-1" />
            <Button size="sm" variant="ghost" onClick={() => { setSelectedIds(new Set()); onSelectionChange?.([]); }} className="gap-2 text-muted-foreground hover:bg-muted/50">
              <X className="h-4 w-4" /> Clear Selection
            </Button>
          </div>
        )}
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
                        checked={isAllSelected || (isSomeSelected ? "indeterminate" : false)}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                        className={isSomeSelected && !isAllSelected ? "opacity-50" : ""}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">Wagon No.</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold w-[80px]">Railway</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Condition</TableHead>
                    <TableHead className="font-semibold">Workflow Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWagons.map((wagon) => (
                    <TableRow key={wagon.id} className="hover:bg-secondary/30 transition-colors h-[72px] overflow-hidden">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(wagon.id)}
                          onCheckedChange={(checked) => handleSelectOne(wagon, checked as boolean)}
                          aria-label={`Select wagon ${wagon.wagonNumber}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        <button 
                          onClick={() => setViewingDetailWagonId(wagon.id)} 
                          className="text-primary hover:underline font-bold text-left focus:outline-none"
                        >
                          {wagon.wagonNumber}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{wagon.details.typeName}</span>
                            {wagon.details.typeName === "BTPGLN" && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900 font-semibold whitespace-nowrap">
                                {wagon.isDegassed ? "[DG]" : "[NDG]"}
                              </Badge>
                            )}
                            {wagon.details.typeName === "BTPN" && (() => {
                              const subtype = getWagonSubtypeDisplay(wagon.isSteamed);
                              return (
                                <Badge 
                                  variant="outline" 
                                  title={subtype.full}
                                  aria-label={subtype.full}
                                  className="text-[10px] py-0 px-1.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900 font-semibold whitespace-nowrap"
                                >
                                  {wagon.isSteamed ? "Steam" : "without Steam"}
                                </Badge>
                              );
                            })()}
                          </div>
                          <p className="text-xs text-muted-foreground">{wagon.details.category}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[80px]">
                        {(() => {
                          const rwy = getRailwayShortName(wagon.details.railwayName);
                          return (
                            <span 
                              className="truncate block" 
                              title={rwy.full} 
                              aria-label={rwy.full}
                            >
                              {rwy.short}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const wStatus = wagon.status as string;
                          const isFit = wStatus === "FIT_READY" || wStatus === "RELEASED" || wStatus === "FIT_CERTIFICATE_PENDING" || wStatus === "FIT_READY" || wStatus === "completed" || wStatus === "FIT_READY" || wStatus === "fit";
                          const isRepair = wStatus === "REPAIR_IN_PROGRESS" || wStatus === "in-repair" || wStatus === "REPAIR_IN_PROGRESS";
                          
                          if (isFit) {
                            return (
                              <Badge className="bg-success text-success-foreground">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Fit Ready
                              </Badge>
                            );
                          } else if (isRepair) {
                            return (
                              <Badge className="bg-warning text-warning-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                In Repair
                              </Badge>
                            );
                          } else {
                            return (
                              <Badge className="bg-destructive text-destructive-foreground">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Sick
                              </Badge>
                            );
                          }
                        })()}
                      </TableCell>
                      <TableCell className="max-w-[250px] align-top py-2">
                        <ConditionSummary wagon={wagon} />
                      </TableCell>
                      <TableCell>
                        <WagonWorkflowStatus 
                          wagon={wagon} 
                          onClick={() => {
                            if (getWorkflowForWagonType(wagon.details?.typeName || wagon.type).supported) {
                              setManageWagonTab("workflow");
                              setManageWagonId(wagon.id);
                            }
                          }} 
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Linked Memos badge */}
                          {(() => {
                            const count = linkedMemoCount[wagon.wagonNumber.trim()] ?? 0;
                            if (count === 0) return null;
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-muted-foreground hover:bg-muted"
                                title={`${count} Linked Memo(s)`}
                                onClick={() => nav("/operations/unit-memos")}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                {count}
                              </Button>
                            );
                          })()}

                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setManageWagonTab("details");
                                  setManageWagonId(wagon.id);
                                }}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  <span>Edit Details</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setManageWagonTab("repairs");
                                  setManageWagonId(wagon.id);
                                }}>
                                  <Wrench className="mr-2 h-4 w-4" />
                                  <span>Defects & Repairs</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setWagonToDelete(wagon.id)} className="text-destructive focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete Wagon</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
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

      {/* Unified Manage Wagon Panel */}
      {manageWagonId && (
        <ManageWagonPanel 
          key={manageWagonId}
          wagonId={manageWagonId} 
          defaultTab={manageWagonTab}
          open={!!manageWagonId} 
          onOpenChange={(open) => !open && setManageWagonId(null)} 
        />
      )}

      {/* Mobile Bottom Action Sheet */}
      {selectedIds.size > 0 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] pb-[calc(env(safe-area-inset-bottom)+1rem)] animate-in slide-in-from-bottom-full">
          <div className="text-center text-sm font-medium mb-3">{selectedIds.size} Selected</div>
          <div className="grid grid-cols-1 gap-2">
            <Button onClick={() => setIsMoveDialogOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Move</Button>
            <Button variant="secondary" onClick={() => setIsArchiveDialogOpen(true)} className="w-full">Archive</Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="w-full">Delete</Button>
            <Button variant="outline" onClick={() => { setSelectedIds(new Set()); onSelectionChange?.([]); }} className="w-full">Cancel</Button>
          </div>
        </div>
      )}

      {/* Bulk Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Wagons?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isProcessingBulk}>
              {isProcessingBulk ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Archive Dialog */}
      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive {selectedIds.size} Wagons?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">Archived wagons will be hidden from the default register but remain available in Archive.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArchiveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkArchive} disabled={isProcessingBulk}>
              {isProcessingBulk ? "Archiving..." : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Move Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {selectedIds.size} Wagons</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Destination</label>
            <Select value={moveDestination} onValueChange={setMoveDestination}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {["Steam Line", "Degassing Line", "Inspection", "Repair", "Testing", "Fit Line"].map((dest) => (
                  <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkMove} disabled={!moveDestination || isProcessingBulk} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isProcessingBulk ? "Moving..." : "Move Wagons"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Wagon Detail Drawer (replaces full page navigation) */}
      {viewingDetailWagon && (
        <ConditionPanel
          key={viewingDetailWagon.id}
          wagon={viewingDetailWagon}
          open={!!viewingDetailWagon}
          onOpenChange={(open) => !open && setViewingDetailWagonId(null)}
        />
      )}
    </>
  );
}