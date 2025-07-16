import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getEnv } from '@/config/env';
import { tokenStorage } from '@/utils/tokenStorage';
import { toast } from '@/utils/toast';

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: getEnv('apiBaseUrl'),
  timeout: getEnv('apiTimeout'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Helper to notify all subscribers when token is refreshed
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Helper to add subscribers to the refresh queue
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Log request in debug mode
    if (getEnv('enableDebugMode')) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response in debug mode
    if (getEnv('enableDebugMode')) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log error in debug mode
    if (getEnv('enableDebugMode')) {
      console.error(`[API Error] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint
        const response = await axios.post(`${getEnv('apiBaseUrl')}/v1/auth/refresh`, {
          refreshToken,
        });

        const { token, refreshToken: newRefreshToken } = response.data;

        // Update tokens
        tokenStorage.setToken(token);
        tokenStorage.setRefreshToken(newRefreshToken);

        // Notify all queued requests
        onTokenRefreshed(token);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        tokenStorage.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other error status codes
    if (error.response) {
      switch (error.response.status) {
        case 400:
          toast.error(error.response.data?.message || 'Bad request. Please check your input.');
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('The requested resource was not found.');
          break;
        case 422:
          // Validation errors
          const validationErrors = error.response.data?.errors;
          if (validationErrors) {
            Object.values(validationErrors).forEach((messages: any) => {
              if (Array.isArray(messages)) {
                messages.forEach((msg) => toast.error(msg));
              } else {
                toast.error(messages);
              }
            });
          } else {
            toast.error('Validation error. Please check your input.');
          }
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(error.response.data?.message || 'An unexpected error occurred.');
      }
    } else if (error.request) {
      // Check if we're in demo mode
      const isDemoMode = window.location.search.includes('demo=true');
      if (!isDemoMode) {
        // Request was made but no response received
        toast.error('Network error. Please check your connection.');
      }
    } else {
      // Something else happened
      toast.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

// Export typed versions of common methods
export const apiClient = {
  get: <T = any>(url: string, config?: any) => 
    axiosInstance.get<T>(url, config).then(res => res.data),
  
  post: <T = any>(url: string, data?: any, config?: any) => 
    axiosInstance.post<T>(url, data, config).then(res => res.data),
  
  put: <T = any>(url: string, data?: any, config?: any) => 
    axiosInstance.put<T>(url, data, config).then(res => res.data),
  
  patch: <T = any>(url: string, data?: any, config?: any) => 
    axiosInstance.patch<T>(url, data, config).then(res => res.data),
  
  delete: <T = any>(url: string, config?: any) => 
    axiosInstance.delete<T>(url, config).then(res => res.data),
};