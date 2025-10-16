import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let isRefreshing = false;
let failedQueue = [];

const createAxiosInstance = (userType) => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

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

  instance.interceptors.request.use(
    (config) => {
      let token = null;
      switch (userType) {
        case 'user':
          token = localStorage.getItem('authToken');
          break;
        case 'tutor':
          token = localStorage.getItem('tutorAuthToken');
          break;
        case 'admin':
          token = localStorage.getItem('adminAuthToken');
          break;
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      console.log(` ${userType.toUpperCase()} API Request:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasToken: !!token
      });

      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => {
      console.log(` ${userType.toUpperCase()} API Response:`, {
        status: response.status,
        url: response.config.url
      });
      return response;
    },
    (error) => {
      const { response, config } = error;
      
      console.error(` ${userType.toUpperCase()} API Error:`, {
        status: response?.status,
        url: config?.url,
        message: response?.data?.message
      });

      if (response?.status === 401) {
        const originalRequest = error.config;

        // Don't retry for login or token refresh endpoints
        if (originalRequest.url.includes('/login') || originalRequest.url.includes('/google-auth') || originalRequest.url.includes('/refresh-token') || originalRequest._retry) {
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return instance(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        return new Promise((resolve, reject) => {
          // Use publicAPI to avoid circular interceptor calls
          // Assuming a generic refresh endpoint. Adjust if needed.
          publicAPI.post(`/api/${userType}s/refresh-token`)
            .then(({ data }) => {
              const tokenKey = userType === 'user' ? 'authToken' : `${userType}AuthToken`;
              localStorage.setItem(tokenKey, data.accessToken);
              instance.defaults.headers.common['Authorization'] = 'Bearer ' + data.accessToken;
              originalRequest.headers['Authorization'] = 'Bearer ' + data.accessToken;
              processQueue(null, data.accessToken);
              resolve(instance(originalRequest));
            })
            .catch(err => {
              processQueue(err, null);
              clearUserTokens(userType);
              redirectToLogin(userType);
              toast.error('Session expired. Please login again.');
              reject(err);
            })
            .finally(() => {
              isRefreshing = false;
            });
        });

      } else if (response?.status === 403) {
        if (response.data?.blocked) {
          // Let login components handle their own blocked messages
          if (config.url.includes('/login') || config.url.includes('/google-auth')) {
            return Promise.reject(error);
          }
          
          // For other 403 errors (like blocked users accessing protected routes)
          if (!toast.isActive('blocked-error')) {
            toast.error('Your account has been blocked by the administrator.', { id: 'blocked-error' });
          }
          clearUserTokens(userType);
          redirectToLogin(userType);
        } else {
          toast.error('Access denied.');
        }
      } else if (response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else if (!response) {
        toast.error('Network error. Please check your connection.');
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const clearUserTokens = (userType) => {
  switch (userType) {
    case 'user':
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      break;
    case 'tutor':
      localStorage.removeItem('tutorAuthToken');
      localStorage.removeItem('tutorInfo');
      break;
    case 'admin':
      localStorage.removeItem('adminAuthToken');
      localStorage.removeItem('adminInfo');
      break;
  }
};

const redirectToLogin = (userType) => {
  setTimeout(() => {
    const path = userType === 'admin' ? '/admin/login' : `/${userType}/login`;
    window.location.href = path;
  }, 1000);
};

export const userAPI = createAxiosInstance('user');
export const tutorAPI = createAxiosInstance('tutor');
export const adminAPI = createAxiosInstance('admin');

export const publicAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials:true,
  headers: {
    'Content-Type': 'application/json',
  },
});

publicAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

export default publicAPI;