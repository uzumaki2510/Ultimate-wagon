import apiClient from "./client";
import { WorkflowItem } from "@/types";

export const workflowApi = {
  createWorkflow: async (workflow: Partial<WorkflowItem>) => {
    const response = await apiClient.post("/workflows", workflow);
    return response.data;
  },

  getWorkflows: async () => {
    const response = await apiClient.get("/workflows");
    return response.data;
  },

  updateWorkflow: async (id: string, patch: Partial<WorkflowItem>) => {
    const response = await apiClient.put(`/workflows/${id}`, patch);
    return response.data;
  },

  deleteWorkflow: async (id: string) => {
    const response = await apiClient.delete(`/workflows/${id}`);
    return response.data;
  },
};
