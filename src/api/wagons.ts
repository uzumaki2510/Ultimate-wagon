import apiClient from "./client";
import { Wagon } from "@/types";

export const wagonApi = {
  createWagon: async (wagon: Partial<Wagon>) => {
    const response = await apiClient.post("/wagons", wagon);
    return response.data;
  },

  getWagons: async () => {
    const response = await apiClient.get("/wagons");
    return response.data;
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
