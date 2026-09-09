import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Brand } from '@/components/Brand';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Plus, UserRound, LogOut, Settings2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { SectionNavigation } from '@/components/SectionNavigation';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';
import { mobileNavigation, sectionFor } from '@/lib/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export default function AppLayout() {
  const nav = useNavigate(); const { pathname } = useLocation();
  const { user, isAdmin, isLoading, logout } = useAuth();
  const { initializeStore, isLoading: recordsLoading, loadError } = useAppStore();
  useEffect(() => {
    if (user && !isLoading) { useAppStore.setState({ isAdmin }); void initializeStore(); }
  }, [user?.id, isLoading, isAdmin, initializeStore]);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  if (isLoading || recordsLoading) return <div role="status" className="min-h-screen flex flex-col items-center justify-center gap-4"><Brand /><p className="text-muted-foreground">Loading your workspace…</p></div>;
  if (loadError) return <div role="alert" className="mx-auto max-w-md p-8 space-y-4"><Brand /><h1 className="text-xl font-semibold">We couldn’t load your workspace</h1><p>{loadError}</p><Button onClick={() => initializeStore()}>Retry loading</Button><Button variant="ghost" onClick={logout}>Sign out</Button></div>;
  if (!user) return null;
  const section = sectionFor(pathname);
  return <SidebarProvider defaultOpen={window.innerWidth >= 1024}>
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-card focus:p-3">Skip to content</a>
    <div className="min-h-svh flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="no-print sticky top-0 z-30 flex h-[72px] items-center gap-2 border-b bg-card/95 px-4 backdrop-blur sm:gap-4 sm:px-6">
          <SidebarTrigger className="hidden md:inline-flex" />
          <Link to="/" className="md:hidden"><Brand /></Link>
          <div className="ml-auto md:ml-0 md:flex-1"><GlobalSearch /></div>
          <NotificationBell />
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Account menu"><UserRound className="h-5 w-5" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => nav('/profile')}><Settings2 className="mr-2 h-4 w-4" />Profile & preferences</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={logout} className="text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu><DropdownMenuTrigger asChild><Button className="hidden md:inline-flex gap-2"><Plus className="h-4 w-4" />New</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => nav('/register?add=1')}>Add wagon</DropdownMenuItem><DropdownMenuItem onSelect={() => nav('/memos/new?type=sick')}>Sick memo</DropdownMenuItem><DropdownMenuItem onSelect={() => nav('/memos/new?type=fit')}>Fit memo</DropdownMenuItem>{isAdmin && <DropdownMenuItem onSelect={() => nav('/quick-board')}>Quick entry</DropdownMenuItem>}</DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main id="main-content" tabIndex={-1} className="yardpilot-main flex-1 min-w-0 outline-none">
          <div className="mx-auto w-full max-w-[1440px] p-4 pb-28 sm:p-6 sm:pb-28 md:p-8"><SectionNavigation /><PageErrorBoundary key={pathname}><Outlet /></PageErrorBoundary></div>
        </main>
      </div>
      <nav aria-label="Mobile navigation" className="no-print fixed bottom-0 inset-x-0 z-40 grid grid-cols-5 border-t bg-card md:hidden pb-[env(safe-area-inset-bottom)]">
        {mobileNavigation.map(item => { const active = item.section === section || item.section === 'more' && ['more', 'reports', 'administration'].includes(section); return <Link key={item.to} to={item.to} aria-current={active ? 'page' : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${active ? 'text-primary bg-primary/5' : 'text-muted-foreground'}`}><item.icon className="h-5 w-5" /><span>{item.label}</span></Link>; })}
      </nav>
    </div>
  </SidebarProvider>;
}
