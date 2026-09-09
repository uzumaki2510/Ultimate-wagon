import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sectionFor, workshopLines } from '@/lib/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function SectionNavigation() {
  const { pathname } = useLocation(); const navigate = useNavigate(); const { isAdmin, isSuperAdmin } = useAuth();
  const section = sectionFor(pathname);
  const items = section === 'wagons' ? [{ label: 'Register', to: '/register' }, { label: 'Directory', to: '/wagon-directory' }, { label: 'Archives', to: '/wagon-archives' }, ...(isAdmin ? [{ label: 'Quick entry', to: '/quick-board' }] : [])]
    : section === 'workshop' ? [{ label: 'Overview', to: '/workshop' }, { label: 'Live board', to: '/live-sick-line' }, ...(isAdmin ? workshopLines.map(l => ({ label: l.label, to: `/workshop/${l.id}` })) : [])]
    : section === 'reports' ? [{ label: 'Reports', to: '/reports' }]
    : section === 'administration' ? [{ label: 'Overview', to: '/administration' }, { label: 'Staff', to: '/employees' }, ...(isSuperAdmin ? [{ label: 'Access & approvals', to: '/super-admin/center' }, { label: 'Master data', to: '/super-admin/master-data' }, { label: 'Audit & recovery', to: '/super-admin/security' }] : [])] : [];
  if (pathname.startsWith('/wagon/')) return null;
  if (items.length < 2) return null;
  return <nav aria-label={`${section} sections`} className="mb-6 no-print">
    <label className="md:hidden block"><span className="sr-only">Choose {section} section</span><select className="w-full min-h-11 rounded-lg border bg-card px-3 text-sm" value={items.some(i => i.to === pathname) ? pathname : items[0].to} onChange={e => navigate(e.target.value)}>{items.map(i => <option key={i.to} value={i.to}>{i.label}</option>)}</select></label>
    <div className="hidden md:flex flex-wrap gap-1 border-b pb-2">{items.map(i => <Link key={i.to} to={i.to} aria-current={pathname === i.to ? 'page' : undefined} className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${pathname === i.to ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>{i.label}</Link>)}</div>
  </nav>;
}
