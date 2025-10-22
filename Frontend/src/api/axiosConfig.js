import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, newToken = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(newToken);
  });
  failedQueue = [];
};

const clearUserTokens = (userType) => {
  const prefix = userType === "user" ? "" : userType;
  localStorage.removeItem(`${prefix}AuthToken`);
  localStorage.removeItem(`${prefix}Info`);
};

const redirectToLogin = (userType) => {
  setTimeout(() => {
    const path = userType === "admin" ? "/admin/login" : `/${userType}/login`;
    window.location.href = path;
  }, 1000);
};

const createAxiosInstance = (userType) => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  instance.interceptors.request.use((config) => {
    let token = null;
    if (userType === "user") token = localStorage.getItem("authToken");
    if (userType === "tutor") token = localStorage.getItem("tutorAuthToken");
    if (userType === "admin") token = localStorage.getItem("adminAuthToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { response, config } = error;

      if (!response) {
        toast.error("Network error. Please check your connection.");
        return Promise.reject(error);
      }

      if (response.status === 401) {
        const originalRequest = config;
        if (
          originalRequest.url.includes("/login") ||
          originalRequest.url.includes("/google-auth") ||
          originalRequest.url.includes("/refresh-token")
        ) {
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          });
        }

        isRefreshing = true;
        originalRequest._retry = true;

        try {
          const { data } = await publicAPI.post(`/api/${userType}s/refresh-token`);
          const tokenKey = userType === "user" ? "authToken" : `${userType}AuthToken`;
          localStorage.setItem(tokenKey, data.accessToken);
          instance.defaults.headers.Authorization = `Bearer ${data.accessToken}`;
          processQueue(null, data.accessToken);
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          clearUserTokens(userType);
          toast.error("Session expired. Please login again.");
          redirectToLogin(userType);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      if (response.status === 403) {
        if (response.data?.blocked) {
          toast.error("Your account has been blocked by the admin.");
          clearUserTokens(userType);
          redirectToLogin(userType);
        } else {
          toast.error("Access denied.");
        }
      }

      if (response.status === 500) {
        toast.error("Server error. Please try again later.");
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const publicAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

publicAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 500)
      toast.error("Server error. Please try again later.");
    else if (!error.response)
      toast.error("Network error. Please check your connection.");
    return Promise.reject(error);
  }
);

export const userAPI = createAxiosInstance("user");
export const tutorAPI = createAxiosInstance("tutor");
export const adminAPI = createAxiosInstance("admin");

export default publicAPI;
