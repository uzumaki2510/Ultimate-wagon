import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { REPAIR_TYPES, RepairType } from "@/lib/wagonData";
import { Wrench } from "lucide-react";

interface RepairTypeSelectorProps {
  selectedTypes: RepairType[];
  onToggle: (type: RepairType) => void;
}

export function RepairTypeSelector({ selectedTypes, onToggle }: RepairTypeSelectorProps) {
  return (
    <Card className="glass animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Wrench className="h-5 w-5 text-accent" />
          Select Repair Work
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {REPAIR_TYPES.map((repair) => {
            const isSelected = selectedTypes.includes(repair.id);
            return (
              <Button
                key={repair.id}
                variant={isSelected ? "default" : "outline"}
                className={`h-auto py-4 px-3 flex flex-col items-center gap-2 transition-all ${
                  isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                }`}
                onClick={() => onToggle(repair.id)}
              >
                <span className="text-2xl">{repair.icon}</span>
                <span className="text-xs font-medium text-center">{repair.name}</span>
                {isSelected && (
                  <Badge variant="secondary" className="text-[10px]">
                    Selected
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
