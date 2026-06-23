import axios from "axios";

// Create an Axios instance
const apiClient = axios.create({
  baseURL: "https://ultimate-wagon-backend.onrender.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach the JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("wagon_access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
