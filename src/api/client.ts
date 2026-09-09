import axios from "axios";

declare module "axios" {
  interface InternalAxiosRequestConfig { sessionGeneration?: number; }
}
import { API_BASE_URL } from "../config";
import { toast } from "sonner";
import { getAccessToken, setAccessToken, clearSession, getSessionGeneration } from "./session";

const apiClient = axios.create({ baseURL: API_BASE_URL, withCredentials: true, timeout: 20000 });
let refreshing: Promise<string> | null = null;
export function refreshSession(): Promise<string> {
  if (localStorage.getItem("wagon_signed_out") === "1") return Promise.reject(new Error("Signed out"));
  if (!refreshing) {
    const generation = getSessionGeneration();
    refreshing = axios.post(API_BASE_URL + "/auth/refresh-token", {}, { withCredentials: true, timeout: 15000 })
      .then(res => {
        if (generation !== getSessionGeneration()) throw new Error("Session ended");
        const token = res.data.data.accessToken;
        setAccessToken(token);
        return token;
      }).finally(() => { refreshing = null; });
  }
  return refreshing;
}
apiClient.interceptors.request.use(config => {
  config.sessionGeneration ??= getSessionGeneration();
  if (config.sessionGeneration !== getSessionGeneration()) return Promise.reject(new Error("Session ended"));
  const token = getAccessToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});
apiClient.interceptors.response.use(response => {
  if (response.config.sessionGeneration !== getSessionGeneration()) throw new Error("Session ended");
  return response;
}, async error => {
  const config = error.config;
  if (config?.sessionGeneration !== undefined && config.sessionGeneration !== getSessionGeneration()) return Promise.reject(new Error("Session ended"));
  if (error.response?.status === 401 && config && !config._retried && !config.url?.startsWith("/auth/")) {
    config._retried = true;
    try {
      const token = await refreshSession();
      config.headers.set("Authorization", `Bearer ${token}`);
      return await apiClient(config);
    } catch { clearSession(); }
  }
  if (config && !["get", "head"].includes(config.method) && !config.url?.startsWith("/auth/")) {
    toast.error(error.response?.data?.message || "Unable to save. Please try again.");
  }
  return Promise.reject(error);
});
export default apiClient;
