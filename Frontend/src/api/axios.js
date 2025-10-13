import axios from 'axios';
import { toast } from 'react-toastify';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add token to requests
axiosInstance.interceptors.request.use((config) => {
  let accessToken = null;
  
  if (config.url?.includes('/api/users/')) {
    accessToken = localStorage.getItem('authToken');
  } else if (config.url?.includes('/api/tutors/')) {
    accessToken = localStorage.getItem('tutorAuthToken');
  } else if (config.url?.includes('/api/admin/')) {
    accessToken = localStorage.getItem('adminAuthToken');
  }

  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor - Handle errors and refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh token for login requests - let login components handle 401 errors
      if (error.config?.url?.includes('/login') || error.config?.url?.includes('/google-auth')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axiosInstance.post('/api/auth/refresh', { refreshToken });
        
        localStorage.setItem('authToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }

        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        processQueue(null, data.accessToken);
        
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        toast.error('Session expired. Please log in again.');
        
        // Determine which login page to redirect to based on current URL
        const currentPath = window.location.pathname;
        if (currentPath.includes('/tutor/')) {
          window.location.href = '/tutor/login';
        } else if (currentPath.includes('/admin/')) {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/user/login';
        }
        
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) {
      // Don't show toast or redirect if this is a login request
      // Let the login component handle the error message and stay on the page
      if (error.config?.url?.includes('/login') || error.config?.url?.includes('/google-auth')) {
        return Promise.reject(error);
      }
      
      // For other 403 errors (like blocked users accessing protected routes)
      toast.error('Your account has been blocked.');
      localStorage.clear();
      
      // Determine which login page to redirect to based on current URL
      const currentPath = window.location.pathname;
      if (currentPath.includes('/tutor/')) {
        window.location.href = '/tutor/login';
      } else if (currentPath.includes('/admin/')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/user/login';
      }
    }

    return Promise.reject(error);
  }
);

// Export both for compatibility
export default axiosInstance;
export const axiosPublic = axiosInstance;