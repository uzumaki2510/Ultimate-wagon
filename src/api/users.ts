import apiClient from "./client";

export const usersApi = {
  getEmployees: async () => {
    // Requires backend implementation, assuming /users exists or we'll filter
    const response = await apiClient.get("/users");
    return response.data;
  },

  approveEmployee: async (userId: string, status: string) => {
    const response = await apiClient.put(`/users/${userId}/approve`, { status });
    return response.data;
  },

  deleteEmployee: async (userId: string) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },
};
