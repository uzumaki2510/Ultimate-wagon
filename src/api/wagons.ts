import apiClient from "./client";
import { Wagon } from "@/types";

export const wagonApi = {
  getDeleted: async () => (await apiClient.get('/wagons/deleted')).data,
  restoreWagon: async (id: string) => (await apiClient.post(`/wagons/${id}/restore`)).data,
  createWagon: async (wagon: Partial<Wagon>) => {
    const response = await apiClient.post("/wagons", wagon);
    return response.data;
  },

  getWagon: async (id: string) => (await apiClient.get(`/wagons/${id}`)).data,
  getWagons: async (archived = false) => {
    const records: Wagon[] = [];
    let page = 1;
    while (true) {
      const { data } = await apiClient.get("/wagons", { params: { page, limit: 100, sort: "_id", ...(archived ? { archived: true } : {}) } });
      records.push(...data.data);
      if (!data.pagination?.hasNextPage) return { data: records };
      page += 1;
    }
  },

  updateWagon: async (id: string, patch: Partial<Wagon>) => {
    const response = await apiClient.put(`/wagons/${id}`, patch);
    return response.data;
  },

  deleteWagon: async (id: string) => {
    const response = await apiClient.delete(`/wagons/${id}`);
    return response.data;
  },
};
