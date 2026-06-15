import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { WAGON_TYPE_CODES, WagonRepair, loadWagons } from "@/lib/wagonData";
import { WagonTable } from "@/components/WagonTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function WagonDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [wagons, setWagons] = useState<WagonRepair[]>(() => loadWagons());

  const initialStatus = (searchParams.get("status") as "all" | "in-repair" | "completed") || "all";
  const [statusFilter, setStatusFilter] = useState<"all" | "in-repair" | "completed">(initialStatus);

  useEffect(() => {
    if (statusFilter !== "all") {
      setSearchParams({ status: statusFilter }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [statusFilter, setSearchParams]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [degassedFilter, setDegassedFilter] = useState<"all" | "dg" | "non-dg">("all");
  const [steamedFilter, setSteamedFilter] = useState<"all" | "steam" | "without-steam">("all");

  useEffect(() => {
    if (selectedType !== "BTPGLN") {
      setDegassedFilter("all");
    }
  }, [selectedType]);

  useEffect(() => {
    if (selectedType !== "BTPN") {
      setSteamedFilter("all");
    }
  }, [selectedType]);

  // Derive unique categories from the predefined types
  const categories = useMemo(() => {
    const cats = new Set<string>();
    Object.values(WAGON_TYPE_CODES).forEach((val) => cats.add(val.category));
    return Array.from(cats).sort();
  }, []);

  // Get base wagons based on status filter only
  const wagonsByStatus = useMemo(() => {
    if (statusFilter === "all") return wagons;
    return wagons.filter((w) => w.status === statusFilter);
  }, [wagons, statusFilter]);

  // Filter wagons based on selected status and category/type
  const filteredWagons = useMemo(() => {
    let result = wagonsByStatus;

    if (selectedCategory) {
      result = result.filter((w) => w.details.category === selectedCategory);
    }

    if (selectedType) {
      result = result.filter((w) => w.details.typeName === selectedType);
    }

    if (selectedType === "BTPGLN" && degassedFilter !== "all") {
      result = result.filter((w) => {
        const isDg = !!w.isDegassed;
        return degassedFilter === "dg" ? isDg : !isDg;
      });
    }

    if (selectedType === "BTPN" && steamedFilter !== "all") {
      result = result.filter((w) => {
        const isSteam = !!w.isSteamed;
        return steamedFilter === "steam" ? isSteam : !isSteam;
      });
    }

    return result;
  }, [wagonsByStatus, selectedCategory, selectedType, degassedFilter, steamedFilter]);

  // Get types for the selected category — derived from actual wagon data
  const typesInCategory = useMemo(() => {
    if (!selectedCategory) return [];
    const types = new Set<string>();
    wagonsByStatus.forEach((w) => {
      if (w.details.category === selectedCategory) types.add(w.details.typeName);
    });
    return Array.from(types).sort();
  }, [selectedCategory, wagonsByStatus]);

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setSelectedType(null);
    } else {
      setSelectedCategory(category);
      setSelectedType(null);
    }
  };

  const handleTypeClick = (type: string) => {
    if (selectedType === type) {
      setSelectedType(null);
    } else {
      setSelectedType(type);
    }
  };

  const getCategoryCount = (cat: string) => wagonsByStatus.filter(w => w.details.category === cat).length;
  const getTypeCount = (type: string) => wagonsByStatus.filter(w => w.details.typeName === type).length;
  const getBTPGLNDegassedCount = (isDg: boolean) => wagonsByStatus.filter(w => w.details.typeName === "BTPGLN" && (isDg ? w.isDegassed : !w.isDegassed)).length;
  const getBTPNSteamedCount = (isSteam: boolean) => wagonsByStatus.filter(w => w.details.typeName === "BTPN" && (isSteam ? w.isSteamed : !w.isSteamed)).length;

  const activeCategories = useMemo(() => categories.filter(c => getCategoryCount(c) > 0), [categories, wagonsByStatus]);
  const activeTypes = useMemo(() => typesInCategory.filter(t => getTypeCount(t) > 0), [typesInCategory, wagonsByStatus]);

  useEffect(() => {
    if (selectedCategory && getCategoryCount(selectedCategory) === 0) {
      setSelectedCategory(null);
      setSelectedType(null);
    }
  }, [selectedCategory, wagonsByStatus]);

  useEffect(() => {
    if (selectedType && getTypeCount(selectedType) === 0) {
      setSelectedType(null);
    }
  }, [selectedType, wagonsByStatus]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wagon Directory</h1>
          <p className="text-sm text-muted-foreground">Filter and browse wagons by category and type.</p>
        </div>
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All ({wagons.length})</TabsTrigger>
            <TabsTrigger value="in-repair">In Repair ({wagons.filter(w => w.status === "in-repair").length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({wagons.filter(w => w.status === "completed").length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Categories
            <Badge variant="secondary" className="ml-1 font-semibold">
              {wagonsByStatus.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {activeCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No wagons found in any category for this filter.</p>
            ) : (
              activeCategories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <Badge
                    key={cat}
                    variant={isActive ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer text-sm py-1.5 px-3 transition-all",
                      isActive ? "shadow-md scale-105" : "hover:bg-primary/10"
                    )}
                    onClick={() => handleCategoryClick(cat)}
                  >
                    {cat} ({getCategoryCount(cat)})
                  </Badge>
                );
              }))}
          </div>

          {selectedCategory && (
            <div className="mt-6 pt-6 border-t animate-fade-in">
              <p className="text-sm font-semibold mb-3">Specific Types ({selectedCategory})</p>
              <div className="flex flex-wrap gap-2">
                {activeTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No specific types found.</p>
                ) : (
                  activeTypes.map((type) => {
                    const isActive = selectedType === type;
                    return (
                      <Badge
                        key={type}
                        variant={isActive ? "secondary" : "outline"}
                        className={cn(
                          "cursor-pointer transition-colors",
                          isActive ? "bg-primary/20 text-primary border-primary/50" : "hover:bg-secondary"
                        )}
                        onClick={() => handleTypeClick(type)}
                      >
                        {type} ({getTypeCount(type)})
                      </Badge>
                    );
                  }))}
              </div>
            </div>
          )}

          {selectedType === "BTPGLN" && (
            <div className="mt-6 pt-6 border-t animate-fade-in space-y-3">
              <p className="text-sm font-semibold">Degassing Status (BTPGLN Only)</p>
              <Tabs value={degassedFilter} onValueChange={(v) => setDegassedFilter(v as any)} className="w-fit">
                <TabsList>
                  <TabsTrigger value="all">All BTPGLN ({getTypeCount("BTPGLN")})</TabsTrigger>
                  <TabsTrigger value="dg">DG (Degassed) ({getBTPGLNDegassedCount(true)})</TabsTrigger>
                  <TabsTrigger value="non-dg">NON-DG (Non-Degassed) ({getBTPGLNDegassedCount(false)})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {selectedType === "BTPN" && (
            <div className="mt-6 pt-6 border-t animate-fade-in space-y-3">
              <p className="text-sm font-semibold">Steaming Status (BTPN Only)</p>
              <Tabs value={steamedFilter} onValueChange={(v) => setSteamedFilter(v as any)} className="w-fit">
                <TabsList>
                  <TabsTrigger value="all">All BTPN ({getTypeCount("BTPN")})</TabsTrigger>
                  <TabsTrigger value="steam">Steam ({getBTPNSteamedCount(true)})</TabsTrigger>
                  <TabsTrigger value="without-steam">without Steam ({getBTPNSteamedCount(false)})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <WagonTable
          wagons={filteredWagons}
          filter="all" // Pass "all" because we pre-filter status ourselves above if needed, but wait! WagonTable also does its own status filtering based on the 'filter' prop.
          onComplete={() => { }}
          onUndoComplete={() => { }}
          onDelete={() => { }}
          onUpdateSickLine={() => { }}
          onEdit={() => { }}
        />
      </div>
    </div>
  );
}
