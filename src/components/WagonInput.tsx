import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { parseWagonNumber, WagonDetails, SICK_LINES, REPAIR_TYPES, RepairType } from "@/lib/wagonData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CheckCircle, XCircle, Train, Calendar, Clock, Wrench, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface WagonInputProps {
  onWagonParsed: (details: WagonDetails, trainNumber: string, arrivalDate: string, arrivalTime: string, sickLine: string, repairTypes: RepairType[], comments: string) => void;
}

export function WagonInput({ onWagonParsed }: WagonInputProps) {
  const [wagonNumber, setWagonNumber] = useState("");
  const [parsedDetails, setParsedDetails] = useState<WagonDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trainNumber, setTrainNumber] = useState("");
  const [arrivalDate, setArrivalDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [arrivalTime, setArrivalTime] = useState(format(new Date(), "HH:mm"));
  const [sickLine, setSickLine] = useState("");
  const [selectedRepairTypes, setSelectedRepairTypes] = useState<RepairType[]>([]);
  const [comments, setComments] = useState("");

  // Auto-update time every minute
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
    // Set current time when parsing
    setArrivalTime(format(new Date(), "HH:mm"));
  };

  const handleAddToRepair = () => {
    if (parsedDetails && trainNumber && sickLine) {
      onWagonParsed(parsedDetails, trainNumber, arrivalDate, arrivalTime, sickLine, selectedRepairTypes, comments);
      setWagonNumber("");
      setParsedDetails(null);
      setTrainNumber("");
      setSickLine("");
      setArrivalDate(format(new Date(), "yyyy-MM-dd"));
      setArrivalTime(format(new Date(), "HH:mm"));
      setSelectedRepairTypes([]);
      setComments("");
    }
  };

  const toggleRepairType = (type: RepairType) => {
    setSelectedRepairTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const formatWagonNumber = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 11);
  };

  // Check if wagon is a tank wagon (BTPN, BTFLN, etc.)
  const isTankWagon = parsedDetails?.category === "Tank Wagon";
  const isBTPNorBTFLN =
    parsedDetails?.typeCode === "40" || // BTPN
    parsedDetails?.typeCode === "47" || // BTFLN
    parsedDetails?.typeCode === "41"; // BTPNHS

  // Get available sick lines - now same for all wagon types
  const getAvailableSickLines = () => {
    return SICK_LINES;
  };

  const canAdd = parsedDetails && trainNumber && sickLine;

  return (
    <Card className="glass animate-fade-in">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
          <Train className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Wagon Arrival Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter 11-digit wagon"
              value={formatWagonNumber(wagonNumber)}
              onChange={(e) => setWagonNumber(e.target.value.replace(/\D/g, ""))}
              className="font-mono text-sm sm:text-base md:text-lg tracking-wider h-10 sm:h-12"
              maxLength={15}
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Format: TT-RR-YY-SSSS-C (Type-Railway-Year-Serial-Check)
            </p>
          </div>
          <Button onClick={handleParse} size="icon" className="h-10 w-10 sm:h-12 sm:w-12">
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm animate-fade-in">
            {error}
          </div>
        )}

        {parsedDetails && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <DetailItem label="Wagon Type" value={parsedDetails.typeName} />
              <DetailItem label="Category" value={parsedDetails.category} />
              <DetailItem label="Owning Railway" value={parsedDetails.railwayName} />
              <DetailItem label="Year of Manufacture" value={parsedDetails.yearOfManufacture} />
              <DetailItem label="Serial Number" value={parsedDetails.serialNumber} />
              <div className="p-3 rounded-lg bg-secondary">
                <p className="text-xs text-muted-foreground mb-1">Check Digit</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">{parsedDetails.checkDigit}</span>
                  {parsedDetails.isValidCheckDigit ? (
                    <Badge variant="default" className="bg-success text-success-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Invalid
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Arrival Form */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Arrival Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Train Number */}
                <div className="space-y-2">
                  <Label htmlFor="trainNumber">Train Number *</Label>
                  <Input
                    id="trainNumber"
                    placeholder="Enter train no."
                    value={trainNumber}
                    onChange={(e) => setTrainNumber(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                </div>

                {/* Arrival Date */}
                <div className="space-y-2">
                  <Label htmlFor="arrivalDate">Arrival Date *</Label>
                  <Input
                    id="arrivalDate"
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                  />
                </div>

                {/* Arrival Time (Auto) */}
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Arrival Time (Auto)
                  </Label>
                  <Input
                    id="arrivalTime"
                    type="time"
                    value={arrivalTime}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                {/* Sick Line */}
                <div className="space-y-2">
                  <Label htmlFor="sickLine">
                    {isBTPNorBTFLN ? "Location *" : "Sick Line *"}
                  </Label>
                  <Select value={sickLine} onValueChange={setSickLine}>
                    <SelectTrigger>
                      <SelectValue placeholder={isBTPNorBTFLN ? "Select location" : "Select sick line"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSickLines().map((line) => (
                        <SelectItem key={line.id} value={line.id}>
                          {line.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isBTPNorBTFLN && (
                <p className="text-xs text-muted-foreground">
                  Note: BTPN/BTFLN wagons are assigned to Steam Point or MV Shed only.
                </p>
              )}
            </div>

            {/* Repair Types Section */}
            <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 space-y-4">
              <h3 className="font-semibold text-accent flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Select Repair Work
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {REPAIR_TYPES.map((repair) => {
                  const isSelected = selectedRepairTypes.includes(repair.id);
                  return (
                    <Button
                      key={repair.id}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto py-3 px-3 flex flex-col items-center gap-1 transition-all ${
                        isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                      }`}
                      onClick={() => toggleRepairType(repair.id)}
                    >
                      <span className="text-xl">{repair.icon}</span>
                      <span className="text-xs font-medium text-center">{repair.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-2">
              <Label htmlFor="comments" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
              </Label>
              <Textarea
                id="comments"
                placeholder="Add any additional notes or comments..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <Button onClick={handleAddToRepair} className="w-full" size="lg" disabled={!canAdd}>
              Add to Arrival Register
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-secondary">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-medium truncate">{value}</p>
    </div>
  );
}