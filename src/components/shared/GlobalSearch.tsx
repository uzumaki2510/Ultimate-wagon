import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useAppStore } from '@/store/useAppStore';
export function GlobalSearch() {
  const [open, setOpen] = useState(false); const [query, setQuery] = useState('');
  const { wagons, memos } = useAppStore(); const navigate = useNavigate();
  useEffect(() => { const down = (e: KeyboardEvent) => { if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen(v => !v); } }; document.addEventListener('keydown', down); return () => document.removeEventListener('keydown', down); }, []);
  const choose = (path: string) => { setOpen(false); setQuery(''); navigate(path); };
  const q = query.toLowerCase().trim();
  const matches = wagons.filter(w => [w.wagonNo, w.owner, w.type, w.status].join(' ').toLowerCase().includes(q)).slice(0, 30);
  return <>
    <button aria-label="Search wagons or memos" onClick={() => setOpen(true)} className="flex min-h-11 min-w-11 items-center justify-center md:justify-start gap-3 rounded-lg md:border md:bg-muted/30 px-2 md:px-3 md:w-full md:max-w-lg text-muted-foreground"><Search className="h-5 w-5 shrink-0" /><span className="hidden md:inline text-sm">Search wagons or memos</span><kbd className="hidden lg:inline ml-auto text-xs">⌘ K</kbd></button>
    <CommandDialog open={open} onOpenChange={setOpen}><CommandInput value={query} onValueChange={setQuery} placeholder="Search wagon number, type or memo…" /><CommandList><CommandEmpty>No matching records.</CommandEmpty>
      <CommandGroup heading="Wagons">{matches.map(w => <CommandItem key={w.id} value={[w.wagonNo, w.owner, w.type, w.status].join(' ')} onSelect={() => choose('/wagon/' + w.id)}><span className="font-medium">{w.wagonNo}</span><span className="ml-3 text-muted-foreground">{w.type}</span></CommandItem>)}</CommandGroup>
      <CommandGroup heading="Memos">{memos.filter(m => [m.memoNo, m.rakeName].join(' ').toLowerCase().includes(q)).slice(0, 20).map(m => <CommandItem key={m.id} value={'Memo ' + m.memoNo + ' ' + m.rakeName} onSelect={() => choose('/memos/' + m.id)}>{m.memoNo} · {m.rakeName}</CommandItem>)}</CommandGroup>
    </CommandList></CommandDialog>
  </>;
}
