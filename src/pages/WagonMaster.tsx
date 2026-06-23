import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, X, Database } from "lucide-react";
import { getStatusColor } from "@/lib/utils";
import { getWagonCategory, WagonCategory } from "@/lib/wagonHelpers";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchBar } from "@/components/shared/SearchBar";

export default function WagonMaster() {
  const { wagons, removeWagon } = useAppStore();
  const [search, setSearch] = useState("");
  
  const [selectedCategory, setSelectedCategory] = useState<WagonCategory | "All">("All");
  const [selectedType, setSelectedType] = useState<string | "All">("All");

  const categoryCounts = useMemo(() => {
    const counts: Record<string, { total: number, types: Record<string, number> }> = {};
    
    wagons.forEach(w => {
      const cat = getWagonCategory(w.type);
      const type = w.type || "Unknown";
      
      if (!counts[cat]) counts[cat] = { total: 0, types: {} };
      counts[cat].total++;
      
      if (!counts[cat].types[type]) counts[cat].types[type] = 0;
      counts[cat].types[type]++;
    });
    
    return counts;
  }, [wagons]);

  const filteredWagons = useMemo(() => {
    return wagons.filter(w => {
      const matchesSearch = 
        w.wagonNo?.toLowerCase().includes(search.toLowerCase()) ||
        w.type?.toLowerCase().includes(search.toLowerCase()) ||
        w.owner?.toLowerCase().includes(search.toLowerCase()) ||
        w.status?.toLowerCase().includes(search.toLowerCase());
        
      const matchesCat = selectedCategory === "All" || getWagonCategory(w.type) === selectedCategory;
      const matchesType = selectedType === "All" || w.type === selectedType;
      
      return matchesSearch && matchesCat && matchesType;
    });
  }, [wagons, search, selectedCategory, selectedType]);

  const handleCategoryClick = (cat: WagonCategory) => {
    if (selectedCategory === cat) {
      setSelectedCategory("All");
    } else {
      setSelectedCategory(cat);
      setSelectedType("All");
    }
  };

  const handleTypeClick = (type: string) => {
    if (selectedType === type) {
      setSelectedType("All");
    } else {
      setSelectedType(type);
      setSelectedCategory(getWagonCategory(type));
    }
  };

  const clearFilters = () => {
    setSelectedCategory("All");
    setSelectedType("All");
    setSearch("");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Wagon Master"
        description="Master database view of all wagons. Edit and manage core details."
        icon={Database}
        actions={
          <div className="flex gap-2">
            {(selectedCategory !== "All" || selectedType !== "All" || search !== "") && (
              <Button variant="outline" onClick={clearFilters} className="text-muted-foreground shadow-sm bg-background">
                <X className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Clear Filters</span>
              </Button>
            )}
            <SearchBar 
              value={search} 
              onChange={setSearch} 
              placeholder="Search by No, Type, Owner..." 
              className="w-[200px] sm:w-[250px]"
            />
          </div>
        }
      />

      {/* Category Summary Section */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {Object.entries(categoryCounts).map(([cat, data]) => (
          <Card 
            key={cat} 
            className={`min-w-[200px] cursor-pointer transition-all hover:shadow-modern flex-shrink-0 ${selectedCategory === cat ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50 border-border/50 shadow-sm'}`}
            onClick={() => handleCategoryClick(cat as WagonCategory)}
          >
            <CardContent className="p-3">
              <div className="font-bold text-sm mb-2 flex justify-between items-center tracking-tight">
                <span>{cat}</span>
                <Badge variant={selectedCategory === cat ? "default" : "secondary"}>{data.total}</Badge>
              </div>
              <div className="space-y-1">
                {Object.entries(data.types).map(([type, count]) => (
                  <div 
                    key={type} 
                    className={`text-xs flex justify-between items-center p-1.5 rounded transition-colors hover:bg-muted ${selectedType === type ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground'}`}
                    onClick={(e) => { e.stopPropagation(); handleTypeClick(type); }}
                  >
                    <span>{type}</span>
                    <span className="font-medium">({count})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-md border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="whitespace-nowrap font-semibold">Wagon Number</TableHead>
                <TableHead className="whitespace-nowrap font-semibold">Type</TableHead>
                <TableHead className="whitespace-nowrap font-semibold">Category</TableHead>
                <TableHead className="whitespace-nowrap font-semibold">Owner</TableHead>
                <TableHead className="whitespace-nowrap font-semibold">Built Year</TableHead>
                <TableHead className="whitespace-nowrap font-semibold">POH Station</TableHead>
                <TableHead className="whitespace-nowrap font-semibold">POH Date</TableHead>
                <TableHead className="whitespace-nowrap font-semibold">ROH Station</TableHead>
                <TableHead className="whitespace-nowrap font-semibold">ROH Date</TableHead>
                <TableHead className="whitespace-nowrap font-semibold">Return Date</TableHead>
                <TableHead className="whitespace-nowrap font-semibold">Current Status</TableHead>
                <TableHead className="text-right whitespace-nowrap font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWagons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                    No wagons found matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredWagons.map((w) => (
                  <TableRow key={w.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-semibold tracking-tight">{w.wagonNo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="cursor-pointer hover:bg-muted transition-colors font-medium bg-background" onClick={() => handleTypeClick(w.type as string)}>
                        {w.type || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="cursor-pointer hover:underline text-sm font-medium text-muted-foreground" onClick={() => handleCategoryClick(getWagonCategory(w.type))}>
                        {getWagonCategory(w.type)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{w.owner || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{w.builtYear || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{w.pohStation || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{w.pohDate || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{w.rohStation || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{w.rohDate || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{w.returnDate || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getStatusColor(w.status)} font-semibold`}>
                        {w.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" className="mr-1 hover:bg-secondary text-muted-foreground hover:text-foreground">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeWagon(w.id)} className="hover:bg-destructive/10 text-destructive/70 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
