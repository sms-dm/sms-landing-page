import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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
    const token = localStorage.getItem('sms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sms_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  getMe: () => api.get('/auth/me'),
  
  logout: () => {
    localStorage.removeItem('sms_token');
    return api.post('/auth/logout');
  },
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