import apiClient from "./client";

export const usersApi = {
  getEmployees: async () => {
    // Only fetch approved users
    const response = await apiClient.get("/users?status=approved");
    return response.data;
  },

  getPendingEmployees: async () => {
    const response = await apiClient.get("/users/pending");
    return response.data;
  },

  approveEmployee: async (userId: string) => {
    const response = await apiClient.put(`/users/${userId}/approve`);
    return response.data;
  },

  rejectEmployee: async (userId: string) => {
    const response = await apiClient.put(`/users/${userId}/reject`);
    return response.data;
  },

  deleteEmployee: async (userId: string) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },
};
