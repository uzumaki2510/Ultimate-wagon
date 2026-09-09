import { cn } from '@/lib/utils';

/** Code-native identity: two rails meeting in a Y. */
export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return <span className={cn('inline-flex items-center gap-2.5 shrink-0', className)} aria-label="YardPilot — Wagon Maintenance">
    <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0 text-primary" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="currentColor" />
      <path d="M11 10 19 21v10M29 10 21 21v10" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      <path d="m11 15 4-3m10 0 4 3M17 26h6" fill="none" stroke="white" strokeWidth="1.5" />
    </svg>
    {!compact && <span className="leading-tight text-left"><span className="block text-xl font-bold tracking-tight text-foreground">YardPilot</span><span className="block text-[11px] text-muted-foreground">Wagon Maintenance</span></span>}
  </span>;
}
