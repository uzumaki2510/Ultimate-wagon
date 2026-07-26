import api from "./client";

export const notificationApi = {
  getNotifications: (params?: any) => api.get("/notifications", { params }),
  createNotification: (data: any) => api.post("/notifications", data),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
};
