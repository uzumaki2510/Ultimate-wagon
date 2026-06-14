import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { LoginRecord } from "@/types";

export type UserRole = "admin" | "employee";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  email: string;
  name: string;
  employeeId: string;
  department: string;
  designation: string;
  role: UserRole;
  approved: ApprovalStatus;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  listEmployees: () => User[];
  listPendingEmployees: () => User[];
  approveEmployee: (email: string, status: ApprovalStatus) => void;
  deleteEmployee: (email: string) => void;
  getLoginRecords: () => LoginRecord[];
}

interface SignupData {
  email: string;
  password: string;
  name: string;
  employeeId: string;
  department: string;
  designation: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = "wagon_app_users";
const CURRENT_USER_KEY = "wagon_app_current_user";
const LOGIN_RECORDS_KEY = "wagon_app_login_records";

const PRESET_ADMIN_EMAIL = "admin@railway.gov.in";
const PRESET_ADMIN_PASSWORD = "admin123";
const PRESET_ADMIN: User = {
  id: "preset-admin",
  email: PRESET_ADMIN_EMAIL,
  name: "System Administrator",
  employeeId: "ADMIN",
  department: "C&W Department",
  designation: "Administrator",
  role: "admin",
  approved: "approved",
  createdAt: new Date(0).toISOString(),
};

/** Persist a login event for the given user */
function recordLogin(user: User) {
  const raw = localStorage.getItem(LOGIN_RECORDS_KEY);
  const records: Record<string, LoginRecord> = raw ? JSON.parse(raw) : {};
  const existing = records[user.id];
  records[user.id] = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    lastLogin: new Date().toISOString(),
    loginCount: (existing?.loginCount ?? 0) + 1,
  };
  localStorage.setItem(LOGIN_RECORDS_KEY, JSON.stringify(records));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (!parsed.role) parsed.role = "employee";
      // Backfill: legacy accounts without approved field are treated as approved
      if (!parsed.approved) parsed.approved = "approved";
      setUser(parsed);
    }
    setIsLoading(false);
  }, []);

  const getUsers = (): Record<string, { user: User; password: string }> => {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : {};
  };

  const saveUsers = (users: Record<string, { user: User; password: string }>) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const emailLower = email.toLowerCase().trim();

    if (emailLower === PRESET_ADMIN_EMAIL) {
      if (password !== PRESET_ADMIN_PASSWORD) {
        return { success: false, error: "Invalid admin password" };
      }
      recordLogin(PRESET_ADMIN);
      setUser(PRESET_ADMIN);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(PRESET_ADMIN));
      return { success: true };
    }

    const users = getUsers();
    const userRecord = users[emailLower];

    if (!userRecord) {
      return { success: false, error: "No account found with this email" };
    }

    if (userRecord.password !== password) {
      return { success: false, error: "Invalid password" };
    }

    const u: User = {
      ...userRecord.user,
      role: userRecord.user.role || ("employee" as UserRole),
      approved: userRecord.user.approved ?? "approved", // backfill legacy
    };

    if (u.approved === "pending") {
      return { success: false, error: "Your account is awaiting admin approval. Please try again after approval." };
    }

    if (u.approved === "rejected") {
      return { success: false, error: "Your account registration was rejected. Please contact the administrator." };
    }

    recordLogin(u);
    setUser(u);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(u));
    return { success: true };
  };

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
    const users = getUsers();
    const emailLower = data.email.toLowerCase();

    if (emailLower === PRESET_ADMIN_EMAIL) {
      return { success: false, error: "This email is reserved" };
    }

    if (users[emailLower]) {
      return { success: false, error: "An account with this email already exists" };
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email: emailLower,
      name: data.name,
      employeeId: data.employeeId,
      department: data.department,
      designation: data.designation,
      role: "employee",
      approved: "pending", // ← must wait for admin approval
      createdAt: new Date().toISOString(),
    };

    users[emailLower] = { user: newUser, password: data.password };
    saveUsers(users);

    // Do NOT log user in or set session — they must wait for approval
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

    if (user.id === PRESET_ADMIN.id) return;

    const users = getUsers();
    if (users[user.email]) {
      users[user.email].user = updatedUser;
      saveUsers(users);
    }
  };

  const listEmployees = (): User[] => {
    const users = getUsers();
    return Object.values(users)
      .map((r) => ({
        ...r.user,
        role: r.user.role || ("employee" as UserRole),
        approved: r.user.approved ?? "approved",
      }))
      .filter((u) => u.approved === "approved");
  };

  const listPendingEmployees = (): User[] => {
    const users = getUsers();
    return Object.values(users)
      .map((r) => ({
        ...r.user,
        role: r.user.role || ("employee" as UserRole),
        approved: r.user.approved ?? "approved",
      }))
      .filter((u) => u.approved === "pending")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const approveEmployee = (email: string, status: ApprovalStatus) => {
    const users = getUsers();
    const key = email.toLowerCase();
    if (users[key]) {
      users[key].user = { ...users[key].user, approved: status };
      saveUsers(users);
    }
  };

  const deleteEmployee = (email: string) => {
    const users = getUsers();
    delete users[email.toLowerCase()];
    saveUsers(users);
  };

  const getLoginRecords = (): LoginRecord[] => {
    const raw = localStorage.getItem(LOGIN_RECORDS_KEY);
    const records: Record<string, LoginRecord> = raw ? JSON.parse(raw) : {};
    return Object.values(records).sort(
      (a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.role === "admin",
        login,
        signup,
        logout,
        updateProfile,
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
