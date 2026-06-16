import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { parseWagonNumber, WagonDetails, SICK_LINES, DEFECT_LIBRARY } from "@/lib/wagonData";
import { PriorityLevel, RepairTask } from "@/types/index";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckCircle, XCircle, Train, Calendar, Clock, Wrench, MessageSquare, Camera, ArrowRight, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface WagonInputProps {
  onWagonParsed: (
    details: WagonDetails, 
    trainNumber: string, 
    arrivalDate: string, 
    arrivalTime: string, 
    sickLine: string, 
    repairTasks: RepairTask[], 
    comments: string, 
    priority: PriorityLevel,
    isDegassed?: boolean, 
    isSteamed?: boolean
  ) => void;
}

const QUICK_REMARKS = [
  "Wheel alert received", "Sent to sick line", "Awaiting inspection", 
  "Repair started", "Repair completed", "Fit certificate pending", "Staff informed"
];

const getSeverity = (subRepair: string): PriorityLevel => {
  for (const group of DEFECT_LIBRARY) {
    const def = group.defects.find(d => d.name === subRepair);
    if (def) return def.severity;
  }
  return "Normal";
};

const PriorityColors: Record<PriorityLevel, string> = {
  "Normal": "text-blue-600 bg-blue-50 border-blue-200",
  "Urgent": "text-orange-600 bg-orange-50 border-orange-200",
  "Safety Critical": "text-red-600 bg-red-50 border-red-200"
};

export function WagonInput({ onWagonParsed }: WagonInputProps) {
  const [wagonNumber, setWagonNumber] = useState("");
  const [parsedDetails, setParsedDetails] = useState<WagonDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [trainNumber, setTrainNumber] = useState("");
  const [arrivalDate, setArrivalDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [arrivalTime, setArrivalTime] = useState(format(new Date(), "HH:mm"));
  const [sickLine, setSickLine] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("Normal");
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRepairs, setSelectedRepairs] = useState<RepairTask[]>([]);
  
  const [comments, setComments] = useState("");
  const [isDegassed, setIsDegassed] = useState<boolean>(false);
  const [isSteamed, setIsSteamed] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!parsedDetails) {
        setArrivalTime(format(new Date(), "HH:mm"));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [parsedDetails]);

  const handleParse = () => {
    setError(null);
    const details = parseWagonNumber(wagonNumber);
    if (!details) {
      setError("Invalid wagon number. Please enter an 11-digit number.");
      setParsedDetails(null);
      return;
    }
    setParsedDetails(details);
    setArrivalTime(format(new Date(), "HH:mm"));
  };

  const handleToggleRepair = (cat: string, sub: string) => {
    setSelectedRepairs(prev => {
      const exists = prev.find(r => r.category === cat && r.subRepair === sub);
      if (exists) return prev.filter(r => r !== exists);
      return [...prev, { category: cat, subRepair: sub, severity: getSeverity(sub) }];
    });
  };

  const handleRemoveRepair = (task: RepairTask) => {
    setSelectedRepairs(prev => prev.filter(r => r !== task));
  };

  const handleAddToRepair = () => {
    if (parsedDetails && trainNumber && sickLine) {
      onWagonParsed(
        parsedDetails, trainNumber, arrivalDate, arrivalTime, sickLine, selectedRepairs, comments, priority,
        parsedDetails.typeName === "BTPGLN" ? isDegassed : undefined,
        ["BTPN", "BTPFLN", "BTPNHS"].includes(parsedDetails.typeName) ? isSteamed : undefined
      );
      // Reset form
      setWagonNumber(""); setParsedDetails(null); setTrainNumber(""); setPriority("Normal");
      setSelectedRepairs([]); setComments(""); setIsDegassed(false); setIsSteamed(false);
    }
  };

  const appendRemark = (remark: string) => {
    setComments(prev => prev ? `${prev}\n${remark}` : remark);
  };

  const isTankWagon = parsedDetails?.category === "Tank Wagon";
  const needsSteaming = parsedDetails && ["BTPN", "BTPFLN", "BTPGLN", "BTPNHS"].includes(parsedDetails.typeName);
  const canAdd = parsedDetails && trainNumber && sickLine;

  const getWorkflowPreview = () => {
    if (!parsedDetails) return [];
    if (parsedDetails.typeName === "BTPGLN") return ["Sick Reason", "RRT De-Gassing", "HAPA Examination", "Purging", "Yard Examination", "Fit For Loading"];
    if (["BTPN", "BTPFLN", "BTPNHS"].includes(parsedDetails.typeName)) return ["Issue Marked", "Steaming", "Steam Point", "Rectification", "Hydro Testing", "Fit For Use"];
    return ["Issue Marked", "Rectification", "Inspection", "Fit"];
  };

  return (
    <Card className="glass animate-fade-in shadow-lg border-primary/10">
      <CardHeader className="pb-3 sm:pb-4 bg-primary/5 rounded-t-xl border-b border-primary/10">
        <CardTitle className="flex items-center justify-between gap-2 text-base sm:text-lg md:text-xl">
          <div className="flex items-center gap-2">
            <Train className="h-5 w-5 text-primary" />
            Wagon Arrival & Repair Work Entry
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6 p-4 md:p-6">
        {/* Wagon Search */}
        <div className="flex gap-2 max-w-xl">
          <div className="flex-1">
            <Input
              placeholder="Enter 11-digit wagon number"
              value={wagonNumber.replace(/\D/g, "").slice(0, 11)}
              onChange={(e) => setWagonNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
              className="font-mono text-lg tracking-wider h-12"
            />
          </div>
          <Button onClick={handleParse} size="lg" className="h-12 w-12 px-0">
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm animate-fade-in">{error}</div>}

        {parsedDetails && (
          <div className="space-y-8 animate-fade-in">
            {/* Wagon Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/30 p-4 rounded-xl border">
              <DetailItem label="Type" value={parsedDetails.typeName} />
              <DetailItem label="Category" value={parsedDetails.category} />
              <DetailItem label="Owner" value={parsedDetails.railwayName} />
              <DetailItem label="Built Year" value={parsedDetails.yearOfManufacture} />
            </div>

            {/* Auto Workflow Preview */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide text-sm">
              <span className="font-semibold text-muted-foreground whitespace-nowrap">Auto Workflow:</span>
              {getWorkflowPreview().map((step, idx, arr) => (
                <div key={idx} className="flex items-center gap-2 text-primary font-medium whitespace-nowrap">
                  <span>{step}</span>
                  {idx < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              ))}
            </div>

            {/* Arrival Details Form */}
            <div className="space-y-4">
              <h3 className="font-semibold text-primary flex items-center gap-2 border-b pb-2">
                <Calendar className="h-4 w-4" /> Arrival Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Priority *</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as PriorityLevel)}>
                    <SelectTrigger className={`border-2 ${PriorityColors[priority]}`}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal" className="text-blue-600 font-medium">Normal</SelectItem>
                      <SelectItem value="Urgent" className="text-orange-600 font-medium">Urgent</SelectItem>
                      <SelectItem value="Safety Critical" className="text-red-600 font-bold">Safety Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Train Number *</Label>
                  <Input value={trainNumber} onChange={(e) => setTrainNumber(e.target.value.toUpperCase())} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Location / Sick Line *</Label>
                  <Select value={sickLine} onValueChange={setSickLine}>
                    <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>
                      {SICK_LINES.map(line => <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {needsSteaming && (
                  <div className="space-y-2 animate-fade-in">
                    <Label>Steaming Status *</Label>
                    <Select value={isSteamed ? "Steam" : "without Steam"} onValueChange={(v) => setIsSteamed(v === "Steam")}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="without Steam">without Steam</SelectItem>
                        <SelectItem value="Steam">Steam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Arrival Date</Label>
                  <Input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Arrival Time</Label>
                  <Input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Repair Selection */}
            <div className="space-y-4 bg-muted/20 p-4 rounded-xl border">
              <h3 className="font-semibold text-primary flex items-center gap-2 border-b pb-2">
                <Wrench className="h-4 w-4" /> Repair Work Selection
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {DEFECT_LIBRARY.map(group => (
                  <Card 
                    key={group.groupName} 
                    className={`cursor-pointer transition-all hover:border-primary/50 ${selectedCategory === group.groupName ? 'ring-2 ring-primary ring-offset-2 border-primary bg-primary/5' : ''}`}
                    onClick={() => setSelectedCategory(selectedCategory === group.groupName ? null : group.groupName)}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full gap-2 min-h-[80px]">
                      <span className="font-semibold text-sm leading-tight">{group.groupName}</span>
                      <span className="text-[10px] text-muted-foreground hidden sm:block">{group.defects.length} items</span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedCategory && (
                <div className="p-4 bg-card rounded-lg border shadow-sm animate-in slide-in-from-top-2">
                  <h4 className="text-sm font-semibold mb-3">{selectedCategory} Options</h4>
                  <div className="flex flex-wrap gap-2">
                    {DEFECT_LIBRARY.find(g => g.groupName === selectedCategory)?.defects.map(def => {
                      const isSelected = selectedRepairs.some(r => r.subRepair === def.name);
                      const severity = def.severity;
                      return (
                        <Button 
                          key={def.name} 
                          variant={isSelected ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handleToggleRepair(selectedCategory, def.name)}
                          className={isSelected ? PriorityColors[severity] : ""}
                        >
                          {def.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Repair Summary */}
            {selectedRepairs.length > 0 && (
              <div className="p-4 rounded-lg bg-card border border-primary/20 shadow-sm">
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                  Selected Repair Works <Badge variant="secondary">{selectedRepairs.length}</Badge>
                </h4>
                <div className="flex flex-col gap-2">
                  {selectedRepairs.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50 border text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{r.category}</span>
                        <span className="text-muted-foreground">-</span>
                        <span>{r.subRepair}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] uppercase border-transparent ${PriorityColors[r.severity]}`}>
                          {r.severity}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveRepair(r)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments & Photos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Remarks / Comments
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REMARKS.map(rmk => (
                    <Badge key={rmk} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground font-normal" onClick={() => appendRemark(rmk)}>
                      + {rmk}
                    </Badge>
                  ))}
                </div>
                <Textarea value={comments} onChange={(e) => setComments(e.target.value)} className="min-h-[100px]" placeholder="Add detailed remarks..." />
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Camera className="h-4 w-4" /> Optional Photos
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {["Before", "During", "After"].map(type => (
                    <div key={type} className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors h-32">
                      <Camera className="h-6 w-6 opacity-50" />
                      <span className="text-xs font-medium text-center">{type} Repair</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={handleAddToRepair} className="w-full text-lg h-14 shadow-lg" disabled={!canAdd}>
              Save Arrival & Work Entry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">{label}</p>
      <p className="font-bold text-sm truncate">{value}</p>
    </div>
  );
}