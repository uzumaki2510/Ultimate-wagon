import apiClient from "./client";
import { WorkflowItem } from "@/types";

export const workflowApi = {
  transition: async (id: string, data: object) => (await apiClient.post(`/workflows/${id}/transition`, data)).data,
  correctWorkflow: async (id: string, data: { action: 'undo' | 'branch'; reason: string; expectedUpdatedAt: string; branchingStage?: string; oldBranch?: string; newBranch?: string }) => (await apiClient.post(`/workflows/${id}/correction`, data)).data,
  createWorkflow: async (workflow: Partial<WorkflowItem>) => {
    const response = await apiClient.post("/workflows", workflow);
    return response.data;
  },

  getWorkflows: async (includeArchived = false) => {
    const response = await apiClient.get("/workflows", { params: includeArchived ? { includeArchived: true } : {} });
    return response.data;
  },

  updateWorkflow: async (id: string, patch: Partial<WorkflowItem> & { expectedUpdatedAt?: string; reason?: string }) => {
    const response = await apiClient.put(`/workflows/${id}`, patch);
    return response.data;
  },

  deleteWorkflow: async (id: string) => {
    const response = await apiClient.delete(`/workflows/${id}`);
    return response.data;
  },
};
