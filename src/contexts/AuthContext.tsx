import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "admin" | "employee";

export interface User {
  id: string;
  email: string;
  name: string;
  employeeId: string;
  department: string;
  designation: string;
  role: UserRole;
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
  deleteEmployee: (email: string) => void;
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
  createdAt: new Date(0).toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // Backfill role for legacy records
      if (!parsed.role) parsed.role = "employee";
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

    // Preset admin check
    if (emailLower === PRESET_ADMIN_EMAIL) {
      if (password !== PRESET_ADMIN_PASSWORD) {
        return { success: false, error: "Invalid admin password" };
      }
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

    const u = { ...userRecord.user, role: userRecord.user.role || ("employee" as UserRole) };
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
      createdAt: new Date().toISOString(),
    };

    users[emailLower] = { user: newUser, password: data.password };
    saveUsers(users);

    setUser(newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
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

    if (user.id === PRESET_ADMIN.id) return; // preset admin not stored in users map

    const users = getUsers();
    if (users[user.email]) {
      users[user.email].user = updatedUser;
      saveUsers(users);
    }
  };

  const listEmployees = (): User[] => {
    const users = getUsers();
    return Object.values(users)
      .map((r) => ({ ...r.user, role: r.user.role || ("employee" as UserRole) }))
      .filter((u) => u.role === "employee");
  };

  const deleteEmployee = (email: string) => {
    const users = getUsers();
    delete users[email.toLowerCase()];
    saveUsers(users);
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
        deleteEmployee,
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
