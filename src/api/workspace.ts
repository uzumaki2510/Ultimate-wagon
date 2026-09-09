import api from './client';
export interface StaffOption { _id: string; name: string; department?: string; designation?: string }
export interface SavedDocument { _id: string; wagonId: string; name: string; type: string; fileType: string; size: number; version: number; uploadedAt: string; uploadedByName: string; scanStatus: 'clean' | 'quarantined' | 'rejected' }
export interface Readiness { blockers: string[]; documents: SavedDocument[]; integrity: { problems: string[]; canNormalize: boolean }; certifiedAt?: string; releasedAt?: string }
export const workspaceApi = {
  staff: async (): Promise<StaffOption[]> => (await api.get('/workflows/assignees')).data.data,
  assign: async (id: string, body: object) => (await api.patch(`/wagons/${id}/assignment`, body)).data.data,
  reopen: async (id: string, body: object) => (await api.post(`/wagons/${id}/reopen`, body)).data.data,
  readiness: async (id: string): Promise<Readiness> => (await api.get(`/wagons/${id}/readiness`)).data.data,
  integrity: async () => (await api.get('/workflows/integrity')).data.data,
  reconcile: async (id: string, body: object) => (await api.post(`/workflows/${id}/reconcile`, body)).data.data,
  documents: async (id: string): Promise<SavedDocument[]> => (await api.get(`/documents/wagon/${id}`)).data.data,
  upload: async (id: string, file: File, type: string) => (await api.post(`/documents/wagon/${id}`, file, { params: { name: file.name, type }, headers: { 'Content-Type': file.type }, timeout: 60000 })).data.data,
  download: async (id: string) => (await api.get(`/documents/${id}/content`, { responseType: 'blob' })).data,
  scan: async (id: string) => (await api.post(`/documents/${id}/scan`, {}, { timeout: 30000 })).data.data,
  withdraw: async (id: string) => api.delete(`/documents/${id}`),
};
