import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Plus, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export default function AppLayout() {
  const seed = useAppStore((s) => s.seedDemo);
  const seeded = useAppStore((s) => s.seeded);
  const reset = useAppStore((s) => s.resetAll);
  const nav = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();

  useEffect(() => { 
    if (!seeded) seed(); 
  }, [seeded, seed]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect handled by Router or local check
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b bg-card px-3 sticky top-0 z-20">
            <SidebarTrigger />
            <div className="font-semibold tracking-tight text-sm md:text-base">Ultimate Wagon Whisperer</div>
            <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">Railway UNIT MEMO System</Badge>
            <div className="ml-auto flex items-center gap-2">
              {isAdmin && <Badge className="bg-success text-success-foreground text-[10px] md:text-xs">Admin</Badge>}
              <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => reset()}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Demo
              </Button>
              <Button size="sm" className="text-xs h-8" onClick={() => nav("/memos/new")}>
                <Plus className="h-3.5 w-3.5 mr-1" /> New Memo
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-x-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
