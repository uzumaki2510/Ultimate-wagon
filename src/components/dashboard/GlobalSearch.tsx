import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Search, Train, FileText, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { wagons, memos } = useAppStore();
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = (() => {
    if (!query.trim()) return { wagons: [], memos: [] };
    const q = query.toLowerCase().trim();

    const matchedWagons = wagons.filter(w => 
      w.wagonNo.toLowerCase().includes(q) || 
      (w.rakeId && w.rakeId.toLowerCase().includes(q))
    ).slice(0, 5);

    const matchedMemos = memos.filter(m => 
      m.memoNo.toLowerCase().includes(q) || 
      m.rakeName.toLowerCase().includes(q)
    ).slice(0, 5);

    return { wagons: matchedWagons, memos: matchedMemos };
  })();

  const hasResults = results.wagons.length > 0 || results.memos.length > 0;

  const handleSelectWagon = (id: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/wagon/${id}`);
  };

  const handleSelectMemo = (id: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/memos/${id}`);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto mb-8 z-50">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <Input
          type="text"
          className="pl-10 h-12 rounded-full border-2 bg-background/60 backdrop-blur-sm focus-visible:ring-0 focus-visible:border-primary shadow-sm text-base"
          placeholder="Global Search: Wagon No, Check No, Memo No..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {/* Keyboard shortcut hint */}
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {isOpen && query.trim() && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-2 shadow-xl border-border/50 max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
          {!hasResults ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-4">
              {results.wagons.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">Wagons</h3>
                  <div className="space-y-1">
                    {results.wagons.map(w => (
                      <div 
                        key={w.id} 
                        onClick={() => handleSelectWagon(w.id)}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Train className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{w.wagonNo}</p>
                            <p className="text-xs text-muted-foreground">Type: {w.type} {w.rakeId && `| Check: ${w.rakeId}`}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">{w.status.replace(/_/g, ' ')}</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.memos.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">Memos</h3>
                  <div className="space-y-1">
                    {results.memos.map(m => (
                      <div 
                        key={m.id} 
                        onClick={() => handleSelectMemo(m.id)}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground group-hover:text-blue-500 transition-colors">{m.memoNo}</p>
                            <p className="text-xs text-muted-foreground">{m.memoType === 'sick' ? 'Sick Memo' : 'Fit Memo'} | {new Date(m.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
