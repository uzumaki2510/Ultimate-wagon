import React from "react";
import { Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
  placeholder?: string;
  className?: string;
}

export function FilterBar({ value, onChange, options, placeholder = "Filter", className = "" }: FilterBarProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[140px] sm:w-[180px] bg-background shadow-sm border-muted-foreground/20 h-10">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
