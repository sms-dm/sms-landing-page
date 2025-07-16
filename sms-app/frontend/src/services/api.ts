import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('sms_access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('sms_refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('sms_access_token', accessToken);
          localStorage.setItem('sms_refresh_token', newRefreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('sms_access_token');
          localStorage.removeItem('sms_refresh_token');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  getMe: () => api.get('/auth/me'),
  
  logout: (refreshToken?: string) => {
    return api.post('/auth/logout', { refreshToken });
  },
  
  refreshToken: (refreshToken: string) => 
    api.post('/auth/refresh', { refreshToken }),
  
  logoutAll: () => api.post('/auth/logout-all'),
};

// Company API
export const companyAPI = {
  getBySlug: (slug: string) =>
    api.get(`/companies/slug/${slug}`),
  
  getVessels: (companyId: number) =>
    api.get(`/companies/${companyId}/vessels`),
  
  getAll: () => api.get('/companies'),
};

// Equipment API
export const equipmentAPI = {
  getByQR: (qrCode: string) =>
    api.get(`/equipment/qr/${qrCode}`),
  
  getByVessel: (vesselId: number, params?: any) =>
    api.get(`/equipment/vessel/${vesselId}`, { params }),
  
  getById: (id: number) =>
    api.get(`/equipment/${id}`),
  
  create: (data: any) =>
    api.post('/equipment', data),
  
  getLocations: (vesselId: number) =>
    api.get(`/equipment/vessel/${vesselId}/locations`),
  
  getTypes: (vesselId: number) =>
    api.get(`/equipment/vessel/${vesselId}/types`),
};

// Fault API
export const faultAPI = {
  create: (data: any) =>
    api.post('/faults', data),
  
  getActiveByVessel: (vesselId: number) =>
    api.get(`/faults/vessel/${vesselId}/active`),
  
  updateStatus: (id: number, data: any) =>
    api.patch(`/faults/${id}/status`, data),
  
  getStats: (vesselId: number) =>
    api.get(`/faults/stats/${vesselId}`),
  
  getRevenue: (vesselId: number) =>
    api.get(`/faults/revenue/${vesselId}`),
};

export default api;