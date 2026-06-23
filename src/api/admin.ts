import apiClient from "./client";

export const adminApi = {
  createAdmin: async (data: any) => {
    const response = await apiClient.post("/admin/create-admin", data);
    return response.data;
  },
};
