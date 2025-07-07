import { OnboardingSession, OnboardingToken, Vessel, Equipment } from '@/types';
import { apiClient } from './axios';
import { getEnv } from '@/config/env';

interface StartSessionResponse {
  session: OnboardingSession;
  token: OnboardingToken;
  vessel: Vessel;
}

interface OnboardingProgress {
  userId: string;
  vesselId: string;
  totalSteps: number;
  completedSteps: number;
  currentStep: string;
  steps: Array<{
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  lastUpdated: Date;
}

interface DocumentMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  uploadedBy: string;
  url: string;
}

class OnboardingService {
  async validateTokenAndStart(token: string): Promise<StartSessionResponse> {
    try {
      return await apiClient.post<StartSessionResponse>('/v1/tokens/validate', { token });
    } catch (error) {
      if (getEnv('enableMockData')) {
        // Mock response for demo mode
        return {
          session: {
            id: 'mock-session-' + Date.now(),
            vesselId: 'vessel-123',
            userId: 'user-123',
            status: 'active',
            progress: {
              currentStep: 'vessel',
              completedSteps: [],
              totalSteps: 5,
            },
            startedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          token: {
            id: token,
            value: token,
            type: 'ONBOARDING',
            status: 'ACTIVE',
            vesselId: 'vessel-123',
            createdBy: 'admin-123',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          vessel: {
            id: 'vessel-123',
            name: 'MV Demo Vessel',
            imo: '1234567',
            type: 'Container Ship',
            yearBuilt: 2020,
            flag: 'Panama',
            status: 'active',
          },
        };
      }
      throw error;
    }
  }

  async updateProgress(sessionId: string, progress: any): Promise<{ progress: any }> {
    try {
      return await apiClient.patch(`/v1/onboarding/sessions/${sessionId}/progress`, progress);
    } catch (error) {
      if (getEnv('enableMockData')) {
        return { progress };
      }
      throw error;
    }
  }

  async completeSession(sessionId: string): Promise<void> {
    try {
      await apiClient.post(`/v1/onboarding/sessions/${sessionId}/complete`);
    } catch (error) {
      if (getEnv('enableMockData')) {
        console.log('Completing session:', sessionId);
        return;
      }
      throw error;
    }
  }

  async getSessionById(sessionId: string): Promise<OnboardingSession> {
    try {
      return await apiClient.get<OnboardingSession>(`/v1/onboarding/sessions/${sessionId}`);
    } catch (error) {
      if (getEnv('enableMockData')) {
        return {
          id: sessionId,
          vesselId: 'vessel-123',
          userId: 'user-123',
          status: 'active',
          progress: {
            currentStep: 'equipment',
            completedSteps: ['vessel'],
            totalSteps: 5,
          },
          startedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      throw error;
    }
  }

  async getOnboardingProgress(userId: string): Promise<OnboardingProgress> {
    try {
      return await apiClient.get<OnboardingProgress>(`/v1/onboarding/progress/${userId}`);
    } catch (error) {
      if (getEnv('enableMockData')) {
        return {
          userId,
          vesselId: 'vessel-123',
          totalSteps: 5,
          completedSteps: 2,
          currentStep: 'equipment',
          steps: [
            { id: 'vessel', name: 'Vessel Selection', status: 'completed' },
            { id: 'equipment', name: 'Equipment Inventory', status: 'in_progress' },
            { id: 'parts', name: 'Parts & Components', status: 'pending' },
            { id: 'documentation', name: 'Documentation', status: 'pending' },
            { id: 'review', name: 'Review & Submit', status: 'pending' },
          ],
          lastUpdated: new Date(),
        };
      }
      throw error;
    }
  }

  async saveVesselSelection(userId: string, vesselId: string): Promise<void> {
    try {
      await apiClient.post('/v1/onboarding/vessel-selection', { userId, vesselId });
    } catch (error) {
      if (getEnv('enableMockData')) {
        console.log('Saving vessel selection:', { userId, vesselId });
        return;
      }
      throw error;
    }
  }

  async saveEquipmentData(vesselId: string, equipment: Equipment): Promise<Equipment> {
    try {
      return await apiClient.post<Equipment>(`/v1/vessels/${vesselId}/equipment`, equipment);
    } catch (error) {
      if (getEnv('enableMockData')) {
        console.log('Saving equipment data:', { vesselId, equipment });
        return {
          ...equipment,
          id: equipment.id || `eq-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      throw error;
    }
  }

  async uploadDocument(
    entityType: 'vessel' | 'equipment' | 'part',
    entityId: string,
    file: File
  ): Promise<DocumentMetadata> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);

      return await apiClient.post<DocumentMetadata>('/v1/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      if (getEnv('enableMockData')) {
        console.log('Uploading document:', { entityType, entityId, file });
        return {
          id: `doc-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
          uploadedBy: 'current-user',
          url: URL.createObjectURL(file),
        };
      }
      throw error;
    }
  }

  async getVessels(companyId: string): Promise<Vessel[]> {
    try {
      return await apiClient.get<Vessel[]>(`/v1/companies/${companyId}/vessels`);
    } catch (error) {
      if (getEnv('enableMockData')) {
        return [
          {
            id: 'vessel-1',
            name: 'MV Atlantic Explorer',
            imo: '9876543',
            type: 'Container Ship',
            yearBuilt: 2018,
            flag: 'Panama',
            status: 'active',
          },
          {
            id: 'vessel-2',
            name: 'MV Pacific Pioneer',
            imo: '9876544',
            type: 'Bulk Carrier',
            yearBuilt: 2020,
            flag: 'Marshall Islands',
            status: 'active',
          },
        ];
      }
      throw error;
    }
  }

  async getEquipmentByVessel(vesselId: string): Promise<Equipment[]> {
    try {
      return await apiClient.get<Equipment[]>(`/v1/vessels/${vesselId}/equipment`);
    } catch (error) {
      if (getEnv('enableMockData')) {
        return [
          {
            id: 'eq-1',
            name: 'Main Engine',
            type: 'Propulsion',
            manufacturer: 'MAN B&W',
            model: '6G70ME-C9.5',
            serialNumber: 'ME-12345',
            installationDate: new Date('2018-01-15'),
            location: 'Engine Room',
            status: 'operational',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'eq-2',
            name: 'Auxiliary Generator #1',
            type: 'Power Generation',
            manufacturer: 'Caterpillar',
            model: 'C32',
            serialNumber: 'AG-67890',
            installationDate: new Date('2018-01-20'),
            location: 'Engine Room',
            status: 'operational',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      }
      throw error;
    }
  }
}

export const onboardingService = new OnboardingService();