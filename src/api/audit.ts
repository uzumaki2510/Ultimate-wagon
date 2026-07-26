import api from "./client";

export const auditApi = {
  getAuditLogs: (params?: any) => api.get("/audit-logs", { params }),
  createAuditLog: (data: { action: string; metadata: any }) => api.post("/audit-logs", data),
};
