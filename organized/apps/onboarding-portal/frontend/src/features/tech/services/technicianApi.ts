import { apiClient } from '@/services/axios';
import { TechnicianAssignment, VesselLocation, QualityScoreBreakdown } from '../types';
import { Equipment, SparePart, Vessel } from '@/types';

class TechnicianApiService {
  // Get technician's assignments
  async getMyAssignments(): Promise<TechnicianAssignment[]> {
    return apiClient.get<TechnicianAssignment[]>('/v1/technician/assignments');
  }

  // Get technician's assigned vessels
  async getMyVessels(): Promise<Vessel[]> {
    return apiClient.get<Vessel[]>('/v1/vessels?assignedToMe=true');
  }

  // Get assignment details
  async getAssignmentDetails(assignmentId: string): Promise<TechnicianAssignment> {
    return apiClient.get<TechnicianAssignment>(`/v1/technician/assignments/${assignmentId}`);
  }

  // Start assignment
  async startAssignment(assignmentId: string): Promise<TechnicianAssignment> {
    return apiClient.post<TechnicianAssignment>(`/v1/technician/assignments/${assignmentId}/start`);
  }

  // Get vessel locations
  async getVesselLocations(vesselId: string): Promise<VesselLocation[]> {
    return apiClient.get<VesselLocation[]>(`/v1/technician/vessels/${vesselId}/locations`);
  }

  // Create new location
  async createLocation(vesselId: string, locationData: Partial<VesselLocation>): Promise<VesselLocation> {
    return apiClient.post<VesselLocation>(`/v1/technician/vessels/${vesselId}/locations`, locationData);
  }

  // Get equipment by location
  async getLocationEquipment(locationId: string): Promise<Equipment[]> {
    return apiClient.get<Equipment[]>(`/v1/technician/locations/${locationId}/equipment`);
  }

  // Create equipment
  async createEquipment(locationId: string, equipmentData: Partial<Equipment>): Promise<Equipment> {
    return apiClient.post<Equipment>(`/v1/technician/locations/${locationId}/equipment`, equipmentData);
  }

  // Update equipment
  async updateEquipment(equipmentId: string, updates: Partial<Equipment>): Promise<Equipment> {
    return apiClient.patch<Equipment>(`/v1/equipment/${equipmentId}`, updates);
  }

  // Get spare parts for equipment
  async getEquipmentParts(equipmentId: string): Promise<SparePart[]> {
    return apiClient.get<SparePart[]>(`/v1/technician/equipment/${equipmentId}/parts`);
  }

  // Create spare part
  async createSparePart(equipmentId: string, partData: Partial<SparePart>): Promise<SparePart> {
    return apiClient.post<SparePart>(`/v1/technician/equipment/${equipmentId}/parts`, partData);
  }

  // Upload photo
  async uploadPhoto(entityType: string, entityId: string, file: Blob, metadata?: any): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await apiClient.post<{ url: string }>(
      `/v1/technician/${entityType}/${entityId}/photos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.url;
  }

  // Get quality score
  async getQualityScore(vesselId: string): Promise<QualityScoreBreakdown> {
    return apiClient.get<QualityScoreBreakdown>(`/v1/technician/vessels/${vesselId}/quality-score`);
  }

  // Mark critical part
  async markPartAsCritical(partId: string, reason: string): Promise<SparePart> {
    return apiClient.post<SparePart>(`/v1/technician/parts/${partId}/mark-critical`, { reason });
  }

  // Complete assignment
  async completeAssignment(assignmentId: string): Promise<TechnicianAssignment> {
    return apiClient.post<TechnicianAssignment>(`/v1/technician/assignments/${assignmentId}/complete`);
  }
}

export const technicianApi = new TechnicianApiService();