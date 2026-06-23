import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, AdminRoute, SuperAdminRoute } from "@/components/RouteGuards";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import WagonRegister from "@/pages/WagonRegister";
import WagonMaster from "@/pages/WagonMaster";
import MemoList from "@/pages/MemoList";
import MemoEditor from "@/pages/MemoEditor";
import MemoPrint from "@/pages/MemoPrint";
import QuickBoard from "@/pages/QuickBoard";

import SickLine from "@/pages/SickLine";
import Employees from "@/pages/Employees";
import Archives from "@/pages/Archives";
import Reports from "@/pages/Reports";
import ReportGenerator from "@/pages/Reports/ReportGenerator";
import Profile from "@/pages/Profile";
import Deleted from "@/pages/Deleted";
import Auth from "@/pages/Auth";
import AdminLog from "@/pages/AdminLog";
import NotFound from "@/pages/NotFound";

// Super Admin Pages
import SuperAdminDashboard from "@/pages/SuperAdmin/Dashboard";
import AdminManagement from "@/pages/SuperAdmin/AdminManagement";
import EmployeeApprovals from "@/pages/SuperAdmin/EmployeeApprovals";
import UserDirectory from "@/pages/SuperAdmin/UserDirectory";
import AuditLogs from "@/pages/SuperAdmin/AuditLogs";

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
              <Route path="/wagon-directory" element={<WagonMaster />} />
              <Route path="/memos" element={<MemoList />} />
              <Route path="/memos/new" element={<MemoEditor />} />
              <Route path="/memos/:id" element={<MemoEditor />} />
              <Route path="/memos/:id/print" element={<MemoPrint />} />
              <Route path="/sickline" element={<SickLine />} />
              <Route path="/quick-board" element={<QuickBoard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/generate" element={<AdminRoute><ReportGenerator /></AdminRoute>} />

              {/* Super Admin Guarded Routes */}
              <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
              <Route path="/super-admin/admins" element={<SuperAdminRoute><AdminManagement /></SuperAdminRoute>} />
              <Route path="/super-admin/approvals" element={<SuperAdminRoute><EmployeeApprovals /></SuperAdminRoute>} />
              <Route path="/super-admin/users" element={<SuperAdminRoute><UserDirectory /></SuperAdminRoute>} />
              <Route path="/super-admin/logs" element={<SuperAdminRoute><AuditLogs /></SuperAdminRoute>} />

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
