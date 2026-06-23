import apiClient from "./client";
import { Rake } from "@/types";

export const rakeApi = {
  createRake: async (rake: Partial<Rake>) => {
    const response = await apiClient.post("/rakes", rake);
    return response.data;
  },

  getRakes: async () => {
    const response = await apiClient.get("/rakes");
    return response.data;
  },

  updateRake: async (id: string, patch: Partial<Rake>) => {
    const response = await apiClient.put(`/rakes/${id}`, patch);
    return response.data;
  },

  deleteRake: async (id: string) => {
    const response = await apiClient.delete(`/rakes/${id}`);
    return response.data;
  },
};
