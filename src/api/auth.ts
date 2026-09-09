import apiClient from "./client";
import { getAccessToken } from "./session";
import { User } from "@/contexts/AuthContext"; // We'll update User type in AuthContext later if needed

export const authApi = {
  logout: async () => {
    // Capture before the caller clears memory; Axios request interceptors run later.
    const token = getAccessToken();
    return (await apiClient.post('/auth/logout', {}, { headers: token ? { Authorization: `Bearer ${token}` } : {} })).data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => (await apiClient.put('/auth/change-password', { currentPassword, newPassword })).data,
  updateProfile: async (data: Partial<User>) => (await apiClient.put('/auth/me', data)).data,
  login: async (email: string, password: string) => {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (data: any) => {
    const response = await apiClient.post("/auth/register", data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },
};
