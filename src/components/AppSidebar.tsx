import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { LayoutDashboard, FileText, Wrench, Users, Archive, ShieldCheck, User as UserIcon, LogOut, Trash2, Zap, ChevronDown, ShieldAlert, ListFilter, Droplets, Wind, ClipboardCheck, Activity, CheckCircle, Database, Workflow } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar, SidebarFooter
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTheme } from "next-themes";
import { useDensity } from "@/contexts/DensityContext";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin, logout, listPendingEmployees } = useAuth();
  const { theme, setTheme } = useTheme();
  const { density, setDensity } = useDensity();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      listPendingEmployees().then(pend => setPendingCount(pend.length)).catch(() => { });
    }
  }, [isAdmin, listPendingEmployees]);

  const isActive = (u: string) => u === "/" ? pathname === "/" : pathname.startsWith(u);

  const navItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, role: "all" },
    { title: "Wagon Register", url: "/register", icon: FileText, role: "all" },
    { title: "Wagon Master", url: "/wagon-directory", icon: FileText, role: "all" },
    { title: "Employees", url: "/employees", icon: Users, role: "all", badge: pendingCount },
  ];

  const superAdminItems = [
    { title: "System Dashboard", url: "/super-admin", icon: LayoutDashboard },
    { title: "Admin Management", url: "/super-admin/admins", icon: ShieldCheck },
    { title: "Employee Approvals", url: "/super-admin/approvals", icon: Users },
    { title: "User Directory", url: "/super-admin/users", icon: FileText },
    { title: "Master Data", url: "/super-admin/master-data", icon: Database },
    { title: "Audit Logs", url: "/super-admin/logs", icon: ListFilter },
  ];

  const adminItems = [
    { title: "SICK_LINE", url: "/sickline", icon: Wrench },
    { title: "Live Board", url: "/live-sick-line", icon: LayoutDashboard },
    { title: "Quick Entry", url: "/quick-board", icon: Zap },
    { title: "Unit Memos", url: "/memos", icon: FileText },
    { title: "Reports", url: "/reports", icon: FileText },
    { title: "Archives", url: "/archives", icon: Archive },
    { title: "Deleted Register", url: "/deleted", icon: Trash2 },
    { title: "Admin Log", url: "/admin-log", icon: ShieldCheck },
    { title: "Audit Trail", url: "/audit-logs", icon: ShieldCheck },
    { title: "Workflow Engine", url: "/workflow-builder", icon: Workflow },
  ];

  const workshopItems = [
    { title: "Steam Line", url: "/workshop/steam", icon: Droplets },
    { title: "Degassing Line", url: "/workshop/degassing", icon: Wind },
    { title: "Inspection Line", url: "/workshop/inspection", icon: ClipboardCheck },
    { title: "Repair Line", url: "/workshop/repair", icon: Wrench },
    { title: "Testing Line", url: "/workshop/testing", icon: Activity },
    { title: "Fit Certificate", url: "/workshop/fit", icon: CheckCircle },
  ];

  const filteredItems = navItems.filter(item => {
    if (item.role === "admin") return isAdmin;
    return true;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-bold text-sidebar-foreground">Ultimate Wagon</div>
              <div className="text-[10px] text-sidebar-foreground/70 uppercase tracking-wider">Repair & Memo System</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="pt-4">
          <SidebarGroupLabel className="text-xs tracking-wider text-sidebar-foreground/50 uppercase font-semibold">Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((n) => (
                <SidebarMenuItem key={n.url}>
                  <SidebarMenuButton asChild isActive={isActive(n.url)}>
                    <NavLink to={n.url} className="flex items-center gap-2">
                      <n.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="flex-1">{n.title}</span>
                      )}
                      {!collapsed && n.badge && n.badge > 0 && (
                        <span className="ml-auto h-5 min-w-5 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold px-1">
                          {n.badge}
                        </span>
                      )}
                      {collapsed && n.badge && n.badge > 0 && (
                        <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-amber-500 border-2 border-sidebar" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSuperAdmin && (
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="pt-2">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center text-xs tracking-wider text-sidebar-foreground/50 uppercase font-semibold">
                  Super Admin
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {superAdminItems.map((n) => (
                      <SidebarMenuItem key={n.url}>
                        <SidebarMenuButton asChild isActive={isActive(n.url)}>
                          <NavLink to={n.url} className="flex items-center gap-2">
                            <n.icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span>{n.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {isAdmin && (
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="pt-2">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center text-xs tracking-wider text-sidebar-foreground/50 uppercase font-semibold">
                  Workshop Lines
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {workshopItems.map((n) => (
                      <SidebarMenuItem key={n.url}>
                        <SidebarMenuButton asChild isActive={isActive(n.url)}>
                          <NavLink to={n.url} className="flex items-center gap-2">
                            <n.icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span>{n.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {isAdmin && (
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="pt-2">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center text-xs tracking-wider text-sidebar-foreground/50 uppercase font-semibold">
                  Admin / More
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminItems.map((n) => (
                      <SidebarMenuItem key={n.url}>
                        <SidebarMenuButton asChild isActive={isActive(n.url)}>
                          <NavLink to={n.url} className="flex items-center gap-2">
                            <n.icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span>{n.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex items-center gap-3 cursor-pointer text-muted-foreground hover:text-foreground">
               <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                 {theme === "dark" ? <Wind className="h-3 w-3" /> : <Droplets className="h-3 w-3" />}
               </div>
               {!collapsed && <span>Toggle Theme</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => {
                const next = density === 'compact' ? 'comfortable' : density === 'comfortable' ? 'touch' : 'compact';
                setDensity(next);
              }} 
              className="flex items-center gap-3 cursor-pointer text-muted-foreground hover:text-foreground"
            >
               <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                 <LayoutDashboard className="h-3 w-3" />
               </div>
               {!collapsed && <span className="capitalize">{density} Mode</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/profile")}>
              <NavLink to="/profile" className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <UserIcon className="h-3 w-3" />
                </div>
                {!collapsed && <span className="truncate font-medium">{user?.name || "Profile"}</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                logout();
                navigate("/auth");
              }}
              className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
