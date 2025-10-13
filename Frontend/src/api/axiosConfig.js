import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const createAxiosInstance = (userType) => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

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

      console.log(`📤 ${userType.toUpperCase()} API Request:`, {
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
      console.log(`📥 ${userType.toUpperCase()} API Response:`, {
        status: response.status,
        url: response.config.url
      });
      return response;
    },
    (error) => {
      const { response, config } = error;
      
      console.error(`❌ ${userType.toUpperCase()} API Error:`, {
        status: response?.status,
        url: config?.url,
        message: response?.data?.message
      });

      if (response?.status === 401) {
        if (response.data?.expired) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error('Authentication failed. Please login again.');
        }
        
        clearUserTokens(userType);
        redirectToLogin(userType);
      } else if (response?.status === 403) {
        if (response.data?.blocked) {
          toast.error('Your account has been blocked by the administrator.');
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
    window.location.href = `/${userType}/login`;
  }, 1000);
};

export const userAPI = createAxiosInstance('user');
export const tutorAPI = createAxiosInstance('tutor');
export const adminAPI = createAxiosInstance('admin');

export const publicAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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