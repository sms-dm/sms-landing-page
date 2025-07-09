import axios from 'axios';
import { Equipment, Vessel, EquipmentTransfer, PaginatedResponse } from '@/types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const managerApi = {
  // Vessel endpoints
  getVessels: async (): Promise<Vessel[]> => {
    const response = await api.get('/vessels');
    return response.data.data;
  },

  getVessel: async (vesselId: string): Promise<Vessel> => {
    const response = await api.get(`/vessels/${vesselId}`);
    return response.data.data;
  },

  getVesselLocations: async (vesselId: string): Promise<any[]> => {
    const response = await api.get(`/vessels/${vesselId}/locations`);
    return response.data.data;
  },

  // Equipment endpoints
  getVesselEquipment: async (
    vesselId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      classification?: string;
      criticalLevel?: string;
    }
  ): Promise<PaginatedResponse<Equipment>> => {
    const response = await api.get(`/vessels/${vesselId}/equipment`, { params });
    return response.data;
  },

  getEquipment: async (equipmentId: string): Promise<Equipment> => {
    const response = await api.get(`/equipment/${equipmentId}`);
    return response.data.data;
  },

  updateEquipment: async (equipmentId: string, data: Partial<Equipment>): Promise<Equipment> => {
    const response = await api.patch(`/equipment/${equipmentId}`, data);
    return response.data.data;
  },

  verifyEquipment: async (
    equipmentId: string,
    data: { qualityScore: number; notes?: string }
  ): Promise<Equipment> => {
    const response = await api.post(`/equipment/${equipmentId}/verify`, data);
    return response.data.data;
  },

  // Equipment transfer endpoints
  transferEquipment: async (
    equipmentId: string,
    data: {
      toVesselId: string;
      toLocationId?: string;
      reason: string;
      notes?: string;
    }
  ): Promise<{ equipment: Equipment; transfer: EquipmentTransfer }> => {
    const response = await api.post(`/equipment/${equipmentId}/transfer`, data);
    return response.data.data;
  },

  getEquipmentTransferHistory: async (
    equipmentId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<EquipmentTransfer>> => {
    const response = await api.get(`/equipment/${equipmentId}/transfers`, { params });
    return response.data;
  },

  // Quality and review endpoints
  getPendingReviews: async (
    vesselId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Equipment>> => {
    const response = await api.get(`/vessels/${vesselId}/equipment`, {
      params: { ...params, status: 'DOCUMENTED' },
    });
    return response.data;
  },

  approveEquipment: async (equipmentId: string, notes?: string): Promise<Equipment> => {
    const response = await api.post(`/equipment/${equipmentId}/approve`, { notes });
    return response.data.data;
  },

  rejectEquipment: async (equipmentId: string, reason: string): Promise<Equipment> => {
    const response = await api.post(`/equipment/${equipmentId}/reject`, { reason });
    return response.data.data;
  },

  // Analytics endpoints
  getVesselStatistics: async (vesselId: string): Promise<any> => {
    const response = await api.get(`/vessels/${vesselId}/statistics`);
    return response.data.data;
  },

  getQualityMetrics: async (vesselId: string): Promise<any> => {
    const response = await api.get(`/vessels/${vesselId}/quality-metrics`);
    return response.data.data;
  },

  // Export endpoints
  exportEquipmentData: async (vesselId: string, format: 'csv' | 'excel' | 'pdf'): Promise<Blob> => {
    const response = await api.get(`/vessels/${vesselId}/equipment/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};