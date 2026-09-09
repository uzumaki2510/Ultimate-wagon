import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { CircleHelp, UserRound } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Brand } from '@/components/Brand';
import { primaryNavigation, sectionFor } from '@/lib/navigation';

export function AppSidebar() {
  const { state, isMobile, setOpenMobile, setOpen } = useSidebar();
  const collapsed = state === 'collapsed' && !isMobile;
  const { pathname } = useLocation();
  const { user, isAdmin } = useAuth();
  useEffect(() => { setOpenMobile(false); }, [pathname, setOpenMobile]);
  useEffect(() => { const query = window.matchMedia('(min-width: 1024px)'); const changed = () => setOpen(query.matches); query.addEventListener('change', changed); return () => query.removeEventListener('change', changed); }, [setOpen]);
  return <Sidebar collapsible="icon" className="no-print">
    <SidebarHeader className={collapsed ? "px-1 py-6 border-b" : "px-4 py-6 border-b"}><Link to="/" aria-label="RailFlow home"><Brand compact={collapsed} /></Link></SidebarHeader>
    <SidebarContent className={collapsed ? "px-1 py-6" : "px-3 py-6"}>
      <nav aria-label="Primary navigation"><SidebarMenu className="gap-2">
        {primaryNavigation.filter(item => !item.admin || isAdmin).map(item => <SidebarMenuItem key={item.to}>
          <SidebarMenuButton size="lg" asChild isActive={sectionFor(pathname) === item.section} tooltip={item.label} className="px-3 data-[active=true]:bg-primary/10 data-[active=true]:text-primary">
            <Link to={item.to} aria-label={item.label} aria-current={sectionFor(pathname) === item.section ? 'page' : undefined}><item.icon className="h-5 w-5" />{!collapsed && <span>{item.label}</span>}</Link>
          </SidebarMenuButton>
        </SidebarMenuItem>)}
      </SidebarMenu></nav>
    </SidebarContent>
    <SidebarFooter className="p-3 border-t">
      <SidebarMenu><SidebarMenuItem><SidebarMenuButton asChild size="lg" tooltip="Help"><Link to="/help" aria-label="Help"><CircleHelp />{!collapsed && <span>Help</span>}</Link></SidebarMenuButton></SidebarMenuItem>
      <SidebarMenuItem><SidebarMenuButton asChild size="lg" tooltip="Profile & preferences"><Link to="/profile" aria-label="Profile & preferences"><UserRound />{!collapsed && <span className="truncate">{user?.name}<span className="block text-xs text-muted-foreground">{isAdmin ? 'Administrator' : 'Staff'}</span></span>}</Link></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
    </SidebarFooter>
  </Sidebar>;
}
