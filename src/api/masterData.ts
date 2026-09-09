import apiClient from "./client";

export interface MasterDataRecord {
  _id: string;
  category: string;
  value: string;
  description?: string;
  isActive: boolean;
}

export const masterDataApi = {
  getAll: async () => {
    const response = await apiClient.get("/master-data");
    return response.data as MasterDataRecord[];
  },
  
  create: async (data: Omit<MasterDataRecord, "_id" | "isActive">) => {
    const response = await apiClient.post("/master-data", data);
    return response.data as MasterDataRecord;
  },
  
  update: async (id: string, data: Partial<MasterDataRecord>) => {
    const response = await apiClient.put(`/master-data/${id}`, data);
    return response.data as MasterDataRecord;
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/master-data/${id}`);
    return response.data;
  },
};
