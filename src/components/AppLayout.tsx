import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export default function AppLayout() {
  const nav = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();
  const { initializeStore } = useAppStore();

  useEffect(() => {
    if (user && !isLoading) {
      initializeStore();
    }
  }, [user, isLoading, initializeStore]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background selection:bg-primary/20">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 sm:h-16 flex items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sticky top-0 z-30 shadow-sm">
            <SidebarTrigger className="hover:bg-secondary rounded-md transition-colors" />
            <div className="font-semibold tracking-tight text-sm md:text-base flex items-center gap-2">
              <span className="hidden sm:inline-block">Ultimate Wagon Whisperer</span>
              <span className="sm:hidden">UWW</span>
            </div>
            <Badge variant="outline" className="text-[10px] hidden md:inline-flex bg-primary/5 border-primary/20 text-primary">Railway UNIT MEMO System</Badge>
            <div className="ml-auto flex items-center gap-2 sm:gap-4">
              {isAdmin && <Badge className="bg-success/10 text-success border-success/20 text-[10px] md:text-xs">Admin</Badge>}
              <Button size="sm" className="text-xs h-8 sm:h-9 shadow-sm" onClick={() => nav("/memos/new")}>
                <Plus className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">New Memo</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden">
            <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
