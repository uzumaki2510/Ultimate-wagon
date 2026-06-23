import apiClient from './client';

export const reportApi = {
  getDashboardStats: async () => {
    const res = await apiClient.get('/reports/dashboard');
    return res.data;
  },

  getReportData: async (type: string, params: any = {}) => {
    const res = await apiClient.get(`/reports/${type}`, { params });
    return res.data;
  },

  exportPDF: async (type: string, filters: any = {}) => {
    const res = await apiClient.post('/reports/export/pdf', { type, ...filters }, { responseType: 'blob' });
    return res.data; // Blob
  },

  exportExcel: async (type: string, filters: any = {}) => {
    const res = await apiClient.post('/reports/export/excel', { type, ...filters }, { responseType: 'blob' });
    return res.data; // Blob
  }
};
