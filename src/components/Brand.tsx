import { cn } from '@/lib/utils';

/** Code-native identity: parallel rails with a forward direction. */
export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return <span className={cn('inline-flex items-center gap-2.5 shrink-0', className)} aria-label="RailFlow — Wagon Maintenance">
    <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0 text-primary" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="currentColor" />
      <path d="M13 10v20M20 10v20M10 14h13M10 26h13" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 20h7m-3-4 4 4-4 4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    {!compact && <span className="leading-tight text-left"><span className="block text-xl font-bold tracking-tight text-foreground">RailFlow</span><span className="block text-[11px] text-muted-foreground">Wagon Maintenance</span></span>}
  </span>;
}
