import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown } from "lucide-react";
import { FILTER_OPTIONS, EventCategory } from "./activityTimelineMapping";

interface ActivityTimelineFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  categoryFilter: EventCategory | "all";
  setCategoryFilter: (v: EventCategory | "all") => void;
  sortOrder: "newest" | "oldest";
  setSortOrder: (v: "newest" | "oldest") => void;
  onClear: () => void;
}

export function ActivityTimelineFilters({
  search, setSearch,
  categoryFilter, setCategoryFilter,
  sortOrder, setSortOrder,
  onClear
}: ActivityTimelineFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <div className="relative w-full sm:w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>
      <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as EventCategory | "all")}>
        <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs gap-1"
        onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
      >
        <ArrowUpDown className="h-3.5 w-3.5" />
        {sortOrder === "newest" ? "Newest first" : "Oldest first"}
      </Button>
      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClear}>Clear</Button>
    </div>
  );
}
