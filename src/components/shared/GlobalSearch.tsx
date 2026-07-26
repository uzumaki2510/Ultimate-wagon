import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useAppStore } from "@/store/useAppStore";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const { wagons, rakes } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted border rounded-md w-full md:w-64 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline-block">Search wagons...</span>
        <kbd className="hidden md:inline-block ml-auto text-[10px] bg-background px-1.5 py-0.5 rounded border shadow-sm">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a wagon number, yard, or status..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Wagons">
            {wagons.slice(0, 10).map((wagon) => (
              <CommandItem 
                key={wagon.id} 
                onSelect={() => handleSelect(`/wagon/${wagon.id}`)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{wagon.wagonNo}</span>
                  <span className="text-xs text-muted-foreground">{wagon.type} • {wagon.status.replace(/_/g, " ")}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandGroup heading="Quick Links">
            <CommandItem onSelect={() => handleSelect("/register")}>
              Register New Wagon
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/memos/new")}>
              Create Unit Memo
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/reports")}>
              Generate Reports
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
