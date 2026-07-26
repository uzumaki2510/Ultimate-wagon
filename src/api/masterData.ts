import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const apiClient = axios.create({
  baseURL: `${API_URL}/master-data`,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface MasterDataRecord {
  _id: string;
  category: string;
  value: string;
  description?: string;
  isActive: boolean;
}

export const masterDataApi = {
  getAll: async () => {
    const response = await apiClient.get("/");
    return response.data as MasterDataRecord[];
  },
  
  create: async (data: Omit<MasterDataRecord, "_id" | "isActive">) => {
    const response = await apiClient.post("/", data);
    return response.data as MasterDataRecord;
  },
  
  update: async (id: string, data: Partial<MasterDataRecord>) => {
    const response = await apiClient.put(`/${id}`, data);
    return response.data as MasterDataRecord;
  },
  
  delete: async (id: string) => {
    const response = await apiClient.delete(`/${id}`);
    return response.data;
  },
};
