import apiClient from "./client";
import { UnitMemo } from "@/types";

export const memoApi = {
  createMemo: async (memo: Partial<UnitMemo>) => {
    const response = await apiClient.post("/memos", memo);
    return response.data;
  },

  getMemos: async () => {
    const response = await apiClient.get("/memos");
    return response.data;
  },

  updateMemo: async (id: string, patch: Partial<UnitMemo>) => {
    const response = await apiClient.put(`/memos/${id}`, patch);
    return response.data;
  },

  deleteMemo: async (id: string) => {
    const response = await apiClient.delete(`/memos/${id}`);
    return response.data;
  },
};
