import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WagonDetails } from "@/lib/wagonData";
import { CheckCircle, XCircle, Info } from "lucide-react";

interface WagonDetailsDisplayProps {
  details: WagonDetails;
}

export function WagonDetailsDisplay({ details }: WagonDetailsDisplayProps) {
  return (
    <Card className="glass animate-fade-in border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="h-5 w-5 text-info" />
          Wagon Details
          <Badge variant="outline" className="ml-2 font-mono">
            {details.wagonNumber}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <DetailCard label="Wagon Type" value={details.typeName} />
          <DetailCard label="Category" value={details.category} />
          <DetailCard label="Owning Railway" value={details.railwayName} />
          <DetailCard label="Year of Manufacture" value={details.yearOfManufacture} />
          <DetailCard label="Serial Number" value={details.serialNumber} />
          <div className="p-3 rounded-lg bg-secondary">
            <p className="text-xs text-muted-foreground mb-1">Check Digit</p>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold">{details.checkDigit}</span>
              {details.isValidCheckDigit ? (
                <Badge variant="default" className="bg-success text-success-foreground text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Valid
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <XCircle className="h-3 w-3 mr-1" />
                  Invalid
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-secondary">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-medium truncate" title={value}>{value}</p>
    </div>
  );
}
