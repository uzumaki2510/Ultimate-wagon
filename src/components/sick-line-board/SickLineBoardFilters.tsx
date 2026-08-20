import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface SickLineBoardFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  alertFilter: string;
  setAlertFilter: (val: string) => void;
  onClear: () => void;
}

export function SickLineBoardFilters({
  search, setSearch,
  typeFilter, setTypeFilter,
  priorityFilter, setPriorityFilter,
  alertFilter, setAlertFilter,
  onClear
}: SickLineBoardFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <Input 
        placeholder="Search wagon no..." 
        value={search} 
        onChange={e => setSearch(e.target.value)}
        className="w-[200px]"
      />
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Wagon Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="BTPGLN">BTPGLN</SelectItem>
          <SelectItem value="BTPN">BTPN</SelectItem>
          <SelectItem value="BOXN">BOXN</SelectItem>
          <SelectItem value="BCNMI">BCNMI</SelectItem>
        </SelectContent>
      </Select>
      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="Normal">Normal</SelectItem>
          <SelectItem value="Urgent">Urgent</SelectItem>
          <SelectItem value="Safety Critical">Safety Critical</SelectItem>
        </SelectContent>
      </Select>
      <Select value={alertFilter} onValueChange={setAlertFilter}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Alerts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Wagons</SelectItem>
          <SelectItem value="has_alerts">Has Alerts</SelectItem>
          <SelectItem value="CRITICAL">Critical Alerts</SelectItem>
          <SelectItem value="DELAY">Delayed</SelectItem>
          <SelectItem value="MATERIAL">Material Pending</SelectItem>
          <SelectItem value="INSPECTION">Inspection Pending</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={onClear}>Clear Filters</Button>
    </div>
  );
}
