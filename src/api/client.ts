import axios from "axios";

// Create an Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://ultimate-wagon-backend.onrender.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("wagon_access_token");
    if (token) {
      config.headers = config.headers || ({} as any);
      if (config.headers.set && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional: Handle token refresh or logout here
      // localStorage.removeItem("wagon_access_token");
      // window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
