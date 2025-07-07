// HSE (Health, Safety & Environment) API service
import { api } from './api';
import { 
  HSEOnboarding, 
  HSECertificate, 
  EmergencyContact,
  ApiResponse,
  PaginatedResponse 
} from '../types';

export const hseService = {
  // Get HSE onboarding data for a vessel
  async getHSEOnboarding(vesselId: string): Promise<HSEOnboarding> {
    const response = await api.get<ApiResponse<HSEOnboarding>>(
      `/hse/vessels/${vesselId}/onboarding`
    );
    return response.data.data;
  },

  // Update HSE onboarding data
  async updateHSEOnboarding(
    vesselId: string, 
    data: Partial<HSEOnboarding>
  ): Promise<HSEOnboarding> {
    const response = await api.put<ApiResponse<HSEOnboarding>>(
      `/hse/vessels/${vesselId}/onboarding`,
      data
    );
    return response.data.data;
  },

  // Certificate management
  async addCertificate(
    vesselId: string, 
    certificate: Omit<HSECertificate, 'id'>,
    file?: File
  ): Promise<HSECertificate> {
    const formData = new FormData();
    Object.entries(certificate).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    if (file) {
      formData.append('document', file);
    }

    const response = await api.post<ApiResponse<HSECertificate>>(
      `/hse/vessels/${vesselId}/certificates`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  async updateCertificate(
    certificateId: string,
    updates: Partial<HSECertificate>,
    file?: File
  ): Promise<HSECertificate> {
    const formData = new FormData();
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    if (file) {
      formData.append('document', file);
    }

    const response = await api.put<ApiResponse<HSECertificate>>(
      `/hse/certificates/${certificateId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  async deleteCertificate(certificateId: string): Promise<void> {
    await api.delete(`/hse/certificates/${certificateId}`);
  },

  // Emergency contact management
  async addEmergencyContact(
    vesselId: string,
    contact: Omit<EmergencyContact, 'id'>
  ): Promise<EmergencyContact> {
    const response = await api.post<ApiResponse<EmergencyContact>>(
      `/hse/vessels/${vesselId}/emergency-contacts`,
      contact
    );
    return response.data.data;
  },

  async updateEmergencyContact(
    contactId: string,
    updates: Partial<EmergencyContact>
  ): Promise<EmergencyContact> {
    const response = await api.put<ApiResponse<EmergencyContact>>(
      `/hse/emergency-contacts/${contactId}`,
      updates
    );
    return response.data.data;
  },

  async deleteEmergencyContact(contactId: string): Promise<void> {
    await api.delete(`/hse/emergency-contacts/${contactId}`);
  },

  // Dashboard data
  async getDashboardData(): Promise<{
    vesselsCount: number;
    certificatesExpiringSoon: number;
    overdueInspections: number;
    upcomingDrills: number;
    openNonConformities: number;
    recentActivity: Array<{
      id: string;
      type: string;
      vesselName: string;
      description: string;
      timestamp: Date;
      user: string;
    }>;
  }> {
    const response = await api.get<ApiResponse<any>>('/hse/dashboard');
    return response.data.data;
  }
};