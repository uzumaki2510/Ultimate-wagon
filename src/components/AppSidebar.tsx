import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, Wrench, Users, Archive, ShieldCheck, User, LogOut, Trash2, Zap } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar, SidebarFooter
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout, listPendingEmployees } = useAuth();

  const isActive = (u: string) => u === "/" ? pathname === "/" : pathname.startsWith(u);

  const pendingCount = isAdmin ? listPendingEmployees().length : 0;

  const navItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, role: "all" },
    { title: "Wagon Register", url: "/register", icon: FileText, role: "all" },
    { title: "Wagon Master", url: "/wagon-directory", icon: FileText, role: "all" },
    { title: "Sick Line", url: "/sickline", icon: Wrench, role: "all" },
    { title: "Employees", url: "/employees", icon: Users, role: "all", badge: pendingCount },
  ];

  const adminItems = [
    { title: "Quick Entry", url: "/quick-board", icon: Zap },
    { title: "Unit Memos", url: "/memos", icon: FileText },
    { title: "Reports", url: "/reports", icon: FileText },
    { title: "Archives", url: "/archives", icon: Archive },
    { title: "Deleted Register", url: "/deleted", icon: Trash2 },
    { title: "Admin Log", url: "/admin-log", icon: ShieldCheck },
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
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((n) => (
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

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin / More</SidebarGroupLabel>
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
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/profile")}>
              <NavLink to="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {!collapsed && <span className="truncate">{user?.name || "Profile"}</span>}
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
