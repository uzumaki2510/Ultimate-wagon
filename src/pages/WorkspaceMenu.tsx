import { Link } from 'react-router-dom';
import { BarChart3, Users, Settings2, ShieldCheck, UserRound, CircleHelp, LogOut, Database, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';

export default function WorkspaceMenu({ administration = false }: { administration?: boolean }) {
  const { isAdmin, isSuperAdmin, logout } = useAuth();
  const entries = [
    ...(!administration ? [{ label: 'Reports', description: 'Workshop performance and exports', to: '/reports', icon: BarChart3 }] : []),
    ...(isAdmin ? [{ label: 'Workflow integrity', description: 'Review missing and conflicting work evidence', to: '/workflow-integrity', icon: ShieldCheck }, { label: 'Staff & approvals', description: 'Approved accounts and pending requests', to: '/employees', icon: Users }] : []),
    ...(isSuperAdmin ? [
      { label: 'Access & administration', description: 'Users, roles and account approvals', to: '/super-admin/center', icon: Settings2 },
      { label: 'Master data', description: 'Wagon types, defects and workshop locations', to: '/super-admin/master-data', icon: Database },
      { label: 'Audit & deleted records', description: 'Activity history and record recovery', to: '/super-admin/security', icon: ShieldCheck },
    ] : []),
    ...(!administration ? [
      { label: 'Profile & preferences', description: 'Your account, appearance and display density', to: '/profile', icon: UserRound },
      { label: 'Help', description: 'Find your way around YardPilot', to: '/help', icon: CircleHelp },
    ] : []),
  ];
  return <div className="space-y-6"><PageHeader title={administration ? 'Administration' : 'More'} description={administration ? 'Manage people, access and records.' : 'Reports, account and workspace settings.'} />
    <div className="grid gap-3 md:grid-cols-2">{entries.map(e => <Link to={e.to} key={e.to} className="flex items-center gap-4 rounded-xl border bg-card p-4 sm:p-5 hover:border-primary/40 hover:bg-primary/5 transition-colors"><e.icon className="h-5 w-5 text-primary shrink-0" /><div className="min-w-0"><h2 className="text-base font-semibold">{e.label}</h2><p className="hidden sm:block text-sm text-muted-foreground mt-1">{e.description}</p></div><ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" /></Link>)}</div>
    {!administration && <Button variant="ghost" className="text-destructive gap-2" onClick={logout}><LogOut className="h-4 w-4" />Sign out</Button>}
  </div>;
}
