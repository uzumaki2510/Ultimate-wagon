import { refreshSession } from '@/api/client';
import { getAccessToken, setAccessToken, clearSession, getSessionGeneration } from '@/api/session';
import { useAppStore } from '@/store/useAppStore';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { authApi } from "@/api/auth";
import { usersApi } from "@/api/users";
import { LoginRecord } from "@/types";

export type UserRole = "super_admin" | "admin" | "employee";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  email: string;
  name: string;
  empCode?: string;
  department: string;
  designation: string;
  role: UserRole;
  status: ApprovalStatus;
  isActive: boolean;
  forcePasswordChange?: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  listEmployees: () => Promise<User[]>;
  listPendingEmployees: () => Promise<User[]>;
  approveEmployee: (userId: string, status: ApprovalStatus) => Promise<void>;
  deleteEmployee: (userId: string) => Promise<void>;
  getLoginRecords: () => LoginRecord[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const generation = getSessionGeneration();
    try {
      if (!getAccessToken()) await refreshSession();
      const res = await authApi.getCurrentUser();
      if (generation === getSessionGeneration() && res.success && res.data) {
        setUser({ ...res.data, id: res.data._id || res.data.id });
      }
    } catch (error) {
      console.error("Failed to fetch current user", error);
      if (generation === getSessionGeneration()) clearSession();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authApi.login(email, password);
      if (res.success && res.data?.accessToken) {
        localStorage.removeItem("wagon_signed_out");
        setAccessToken(res.data.accessToken);
        await fetchUser();
        return { success: true };
      }
      return { success: false, error: res.message || "Login failed" };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || "An error occurred during login. Please try again." 
      };
    }
  };

  const signup = async (data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      // Map frontend fields to backend fields if necessary
      const payload = {
        ...data,
      };
      
      const res = await authApi.register(payload);
      if (res.success) {
        return { success: true };
      }
      return { success: false, error: res.message || "Signup failed" };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || "An error occurred during registration. Please try again." 
      };
    }
  };

  useEffect(() => {
    const ended = () => { setUser(null); useAppStore.getState().resetStore(); };
    window.addEventListener('wagon:session-ended', ended);
    return () => window.removeEventListener('wagon:session-ended', ended);
  }, []);

  const logout = () => {
    localStorage.setItem("wagon_signed_out", "1");
    const pending = authApi.logout();
    clearSession();
    pending.catch(() => { /* Local session is already cleared. */ });
  };
  const updateProfile = async (data: Partial<User>) => {
    const res = await authApi.updateProfile(data);
    setUser({ ...res.data, id: res.data._id || res.data.id });
  };
  const changePassword = async (currentPassword: string, newPassword: string) => {
    const res = await authApi.changePassword(currentPassword, newPassword);
    setAccessToken(res.data.accessToken);
    await fetchUser();
  };

  const listEmployees = async (): Promise<User[]> => {
    try {
      const res = await usersApi.getEmployees();
      return (res.data || []).map((u: any) => ({ ...u, id: u._id || u.id }));
    } catch (error) {
      console.error("Failed to list employees", error);
      return [];
    }
  };

  const listPendingEmployees = async (): Promise<User[]> => {
    try {
      const res = await usersApi.getPendingEmployees();
      return (res.data || []).map((u: any) => ({ ...u, id: u._id || u.id }));
    } catch (error) {
      console.error("Failed to list pending employees", error);
      return [];
    }
  };

  const approveEmployee = async (userId: string, status: ApprovalStatus) => {
    try {
      if (status === 'approved') {
        await usersApi.approveEmployee(userId);
      } else if (status === 'rejected') {
        await usersApi.rejectEmployee(userId);
      }
    } catch (error) {
      console.error("Failed to approve/reject employee", error);
      throw error;
    }
  };

  const deleteEmployee = async (userId: string) => {
    try {
      await usersApi.deleteEmployee(userId);
    } catch (error) {
      console.error("Failed to delete employee", error);
      throw error;
    }
  };

  const getLoginRecords = (): LoginRecord[] => {
    // Needs backend audit log implementation
    return [];
  };

  const isAdmin = user?.role === "super_admin" || user?.role === "admin";
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        isSuperAdmin,
        login,
        signup,
        logout,
        updateProfile,
        changePassword,
        listEmployees,
        listPendingEmployees,
        approveEmployee,
        deleteEmployee,
        getLoginRecords,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
