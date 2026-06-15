import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search, Edit, X } from "lucide-react";
import { getStatusColor } from "@/lib/utils";
import { getWagonCategory, WagonCategory } from "@/lib/wagonHelpers";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wagon Master</h1>
          <p className="text-sm text-muted-foreground">Master database view of all wagons. Edit and manage core details.</p>
        </div>
        <div className="flex gap-2">
          {(selectedCategory !== "All" || selectedType !== "All" || search !== "") && (
            <Button variant="outline" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" /> Clear Filters
            </Button>
          )}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by No, Type, Owner..." 
              className="pl-8 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Category Summary Section */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {Object.entries(categoryCounts).map(([cat, data]) => (
          <Card 
            key={cat} 
            className={`min-w-[200px] cursor-pointer transition-all hover:border-primary/50 flex-shrink-0 ${selectedCategory === cat ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}`}
            onClick={() => handleCategoryClick(cat as WagonCategory)}
          >
            <CardContent className="p-3">
              <div className="font-bold text-sm mb-2 flex justify-between items-center">
                <span>{cat}</span>
                <Badge variant="secondary">{data.total}</Badge>
              </div>
              <div className="space-y-1">
                {Object.entries(data.types).map(([type, count]) => (
                  <div 
                    key={type} 
                    className={`text-xs flex justify-between items-center p-1 rounded hover:bg-muted/50 ${selectedType === type ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground'}`}
                    onClick={(e) => { e.stopPropagation(); handleTypeClick(type); }}
                  >
                    <span>{type}</span>
                    <span>({count})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wagon Number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Built Year</TableHead>
              <TableHead>POH Station</TableHead>
              <TableHead>POH Date</TableHead>
              <TableHead>ROH Station</TableHead>
              <TableHead>ROH Date</TableHead>
              <TableHead>Return Date</TableHead>
              <TableHead>Current Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWagons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  No wagons found matching filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredWagons.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.wagonNo}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => handleTypeClick(w.type as string)}>
                      {w.type || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="cursor-pointer hover:underline text-sm" onClick={() => handleCategoryClick(getWagonCategory(w.type))}>
                      {getWagonCategory(w.type)}
                    </span>
                  </TableCell>
                  <TableCell>{w.owner || "-"}</TableCell>
                  <TableCell>{w.builtYear || "-"}</TableCell>
                  <TableCell>{w.pohStation || "-"}</TableCell>
                  <TableCell>{w.pohDate || "-"}</TableCell>
                  <TableCell>{w.rohStation || "-"}</TableCell>
                  <TableCell>{w.rohDate || "-"}</TableCell>
                  <TableCell>{w.returnDate || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(w.status)}>
                      {w.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" className="mr-1">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeWagon(w.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
