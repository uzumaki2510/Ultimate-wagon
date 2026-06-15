import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, AdminRoute } from "@/components/RouteGuards";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import WagonRegister from "@/pages/WagonRegister";
import MemoList from "@/pages/MemoList";
import MemoEditor from "@/pages/MemoEditor";
import MemoPrint from "@/pages/MemoPrint";
import WagonDirectory from "@/pages/WagonDirectory";
import QuickBoard from "@/pages/QuickBoard";

import SickLine from "@/pages/SickLine";
import Employees from "@/pages/Employees";
import Archives from "@/pages/Archives";
import Reports from "@/pages/Reports";
import Profile from "@/pages/Profile";
import Deleted from "@/pages/Deleted";
import Auth from "@/pages/Auth";
import AdminLog from "@/pages/AdminLog";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/register" element={<WagonRegister />} />
              <Route path="/memos" element={<MemoList />} />
              <Route path="/memos/new" element={<MemoEditor />} />
              <Route path="/memos/:id" element={<MemoEditor />} />
              <Route path="/memos/:id/print" element={<MemoPrint />} />
              <Route path="/sickline" element={<SickLine />} />
              <Route path="/wagon-directory" element={<WagonDirectory />} />
              <Route path="/quick-board" element={<QuickBoard />} />
              
              {/* Admin Guarded Routes */}
              <Route path="/employees" element={<AdminRoute><Employees /></AdminRoute>} />
              <Route path="/archives" element={<AdminRoute><Archives /></AdminRoute>} />
              <Route path="/admin-log" element={<AdminRoute><AdminLog /></AdminRoute>} />

              {/* All authenticated users */}
              <Route path="/deleted" element={<Deleted />} />
              
              {/* Profile Route */}
              <Route path="/profile" element={<Profile />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
