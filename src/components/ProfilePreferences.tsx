import { useTheme } from 'next-themes';
import { useDensity } from '@/contexts/DensityContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
export function ProfilePreferences() {
  const { theme, setTheme } = useTheme(); const { density, setDensity } = useDensity(); const { logout } = useAuth();
  return <section className="rounded-xl border bg-card p-5 space-y-5"><h2 className="text-lg font-semibold">Workspace preferences</h2>
    <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium"><span className="block">Appearance</span><select value={theme || 'system'} onChange={e => setTheme(e.target.value)} className="w-full min-h-11 rounded-lg border bg-background px-3"><option value="light">Light</option><option value="dark">Dark</option><option value="system">Use device setting</option></select></label>
    <label className="space-y-2 text-sm font-medium"><span className="block">Display spacing</span><select value={density} onChange={e => setDensity(e.target.value as 'compact' | 'comfortable' | 'touch')} className="w-full min-h-11 rounded-lg border bg-background px-3"><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="touch">Touch friendly</option></select></label></div>
    <Button onClick={logout} variant="ghost" className="text-destructive">Sign out</Button>
  </section>;
}
