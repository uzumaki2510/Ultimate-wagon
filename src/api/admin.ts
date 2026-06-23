import apiClient from "./client";

export const adminApi = {
  getDashboardMetrics: async () => {
    const response = await apiClient.get("/admin/dashboard");
    return response.data;
  },

  getAllUsers: async (params?: any) => {
    const response = await apiClient.get("/admin/users", { params });
    return response.data;
  },

  getPendingUsers: async () => {
    const response = await apiClient.get("/admin/pending-users");
    return response.data;
  },

  createAdmin: async (data: any) => {
    const response = await apiClient.post("/admin/create-admin", data);
    return response.data;
  },

  approveUser: async (id: string) => {
    const response = await apiClient.put(`/admin/user/${id}/approve`);
    return response.data;
  },

  rejectUser: async (id: string) => {
    const response = await apiClient.put(`/admin/user/${id}/reject`);
    return response.data;
  },

  deactivateUser: async (id: string) => {
    const response = await apiClient.put(`/admin/user/${id}/deactivate`);
    return response.data;
  },

  reactivateUser: async (id: string) => {
    const response = await apiClient.put(`/admin/user/${id}/reactivate`);
    return response.data;
  },

  resetAdminPassword: async (id: string, newPassword: string) => {
    const response = await apiClient.put(`/admin/user/${id}/reset-password`, { newPassword });
    return response.data;
  },

  getAuditLogs: async (params?: any) => {
    const response = await apiClient.get("/admin/audit-logs", { params });
    return response.data;
  },
};
