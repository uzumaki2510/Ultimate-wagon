import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, AdminRoute, SuperAdminRoute } from "@/components/RouteGuards";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DensityProvider } from "@/contexts/DensityContext";

// Eager load layout/auth/core to prevent flicker
import AppLayout from "@/components/AppLayout";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import WorkflowBuilder from "@/pages/WorkflowBuilder";

// Lazy load everything else
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const WagonRegister = lazy(() => import("@/pages/WagonRegister"));
const WagonMaster = lazy(() => import("@/pages/WagonMaster"));
const WagonDetails = lazy(() => import("@/pages/WagonDetails"));
const WorkshopLine = lazy(() => import("@/pages/WorkshopLine"));
const MemoList = lazy(() => import("@/pages/MemoList"));
const MemoEditor = lazy(() => import("@/pages/MemoEditor"));
const MemoPrint = lazy(() => import("@/pages/MemoPrint"));
const QuickBoard = lazy(() => import("@/pages/QuickBoard"));
const SickLine = lazy(() => import("@/pages/SickLine"));
const LiveSickLineBoard = lazy(() => import("@/pages/LiveSickLineBoard"));
const Employees = lazy(() => import("@/pages/Employees"));
const Archives = lazy(() => import("@/pages/Archives"));
const AuditLog = lazy(() => import("@/pages/AuditLog"));
const Reports = lazy(() => import("@/pages/Reports"));
const ReportGenerator = lazy(() => import("@/pages/Reports/ReportGenerator"));
const Profile = lazy(() => import("@/pages/Profile"));
const Deleted = lazy(() => import("@/pages/Deleted"));
const DeletedRegister = lazy(() => import("@/pages/DeletedRegister"));
const AdminLog = lazy(() => import("@/pages/AdminLog"));
const WagonDirectory = lazy(() => import("@/pages/WagonDirectory"));

const SuperAdminDashboard = lazy(() => import("@/pages/SuperAdmin/Dashboard"));
const AdminManagement = lazy(() => import("@/pages/SuperAdmin/AdminManagement"));
const EmployeeApprovals = lazy(() => import("@/pages/SuperAdmin/EmployeeApprovals"));
const UserDirectory = lazy(() => import("@/pages/SuperAdmin/UserDirectory"));
const MasterData = lazy(() => import("@/pages/SuperAdmin/MasterData"));
const AuditLogs = lazy(() => import("@/pages/SuperAdmin/AuditLogs"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="flex h-[50vh] w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <DensityProvider>
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />

              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/register" element={<WagonRegister />} />
                <Route path="/wagon-directory" element={<WagonMaster />} />
                <Route path="/wagon/:id" element={<WagonDetails />} />
                <Route path="/workshop/:lineId" element={<WorkshopLine />} />
                <Route path="/memos" element={<MemoList />} />
                <Route path="/memos/new" element={<MemoEditor />} />
                <Route path="/memos/:id" element={<MemoEditor />} />
                <Route path="/memos/:id/print" element={<MemoPrint />} />
                <Route path="/sickline" element={<SickLine />} />
                <Route path="/live-sick-line" element={<LiveSickLineBoard />} />
                <Route path="/quick-board" element={<QuickBoard />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/reports/generate" element={<AdminRoute><ReportGenerator /></AdminRoute>} />
                <Route path="/workflow-builder" element={<AdminRoute><WorkflowBuilder /></AdminRoute>} />

                {/* Super Admin Guarded Routes */}
                <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
                <Route path="/super-admin/admins" element={<SuperAdminRoute><AdminManagement /></SuperAdminRoute>} />
                <Route path="/super-admin/approvals" element={<SuperAdminRoute><EmployeeApprovals /></SuperAdminRoute>} />
                <Route path="/super-admin/users" element={<SuperAdminRoute><UserDirectory /></SuperAdminRoute>} />
                <Route path="/super-admin/master-data" element={<SuperAdminRoute><MasterData /></SuperAdminRoute>} />
                <Route path="/super-admin/logs" element={<SuperAdminRoute><AuditLogs /></SuperAdminRoute>} />

                {/* Admin Guarded Routes */}
                <Route path="/employees" element={<AdminRoute><Employees /></AdminRoute>} />
                <Route path="/archives" element={<AdminRoute><Archives /></AdminRoute>} />
                <Route path="/admin-log" element={<AdminRoute><AdminLog /></AdminRoute>} />
                <Route path="/audit-logs" element={<AdminRoute><AuditLog /></AdminRoute>} />

                {/* All authenticated users */}
                <Route path="/deleted" element={<Deleted />} />

                {/* Profile Route */}
                <Route path="/profile" element={<Profile />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </QueryClientProvider>
    </DensityProvider>
  </ThemeProvider>
);

export default App;
