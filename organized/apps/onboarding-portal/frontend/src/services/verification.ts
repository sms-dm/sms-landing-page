import axios from './axios';

export interface VerificationSchedule {
  equipmentId: string;
  verificationIntervalDays: number;
  dataQualityDegradationRate?: number;
}

export interface PerformVerification {
  equipmentId: string;
  verificationType: 'SCHEDULED' | 'MANUAL' | 'CORRECTIVE';
  findings?: string;
  correctiveActions?: string;
  newQualityScore: number;
}

export interface EquipmentDue {
  id: string;
  name: string;
  code?: string;
  qualityScore: number;
  degradedQualityScore: number;
  nextVerificationDate: Date;
  lastVerifiedAt?: Date;
  daysUntilDue: number;
  vessel: {
    name: string;
  };
  location?: {
    name: string;
    path: string;
  };
  verifiedByUser?: {
    firstName: string;
    lastName: string;
  };
}

export interface VerificationHistory {
  id: string;
  verificationDate: Date;
  verificationType: string;
  qualityScoreBefore: number;
  qualityScoreAfter: number;
  findings?: string;
  correctiveActions?: string;
  equipment: {
    name: string;
    code?: string;
    vessel: {
      name: string;
    };
  };
  verifiedByUser: {
    firstName: string;
    lastName: string;
  };
}

export interface VerificationNotification {
  id: string;
  notificationType: 'DUE_SOON' | 'OVERDUE' | 'CRITICAL_OVERDUE';
  daysUntilDue?: number;
  sentAt: Date;
  acknowledgedAt?: Date;
  equipment: {
    name: string;
    code?: string;
    nextVerificationDate: Date;
    vessel: {
      name: string;
    };
  };
}

export interface VerificationDashboardStats {
  totalEquipment: number;
  overdueCount: number;
  dueSoonCount: number;
  recentVerifications: number;
  averageQualityScore: number;
}

class VerificationService {
  // Set verification schedule
  async setVerificationSchedule(data: VerificationSchedule) {
    const response = await axios.post('/api/v1/verification/schedule', data);
    return response.data;
  }

  // Get equipment due for verification
  async getEquipmentDue(params?: {
    vesselId?: string;
    daysAhead?: number;
    overdue?: boolean;
  }) {
    const response = await axios.get<{
      equipment: EquipmentDue[];
      total: number;
    }>('/api/v1/verification/due', { params });
    return response.data;
  }

  // Perform verification
  async performVerification(data: PerformVerification) {
    const response = await axios.post('/api/v1/verification/perform', data);
    return response.data;
  }

  // Get verification history
  async getVerificationHistory(params?: {
    equipmentId?: string;
    vesselId?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await axios.get<{
      verifications: VerificationHistory[];
      total: number;
      limit: number;
      offset: number;
    }>('/api/v1/verification/history', { params });
    return response.data;
  }

  // Get notifications
  async getNotifications(unacknowledged = true) {
    const response = await axios.get<{
      notifications: VerificationNotification[];
    }>('/api/v1/verification/notifications', {
      params: { unacknowledged },
    });
    return response.data;
  }

  // Acknowledge notification
  async acknowledgeNotification(notificationId: string) {
    const response = await axios.post('/api/v1/verification/notifications/acknowledge', {
      notificationId,
    });
    return response.data;
  }

  // Get dashboard statistics
  async getDashboardStats(vesselId?: string) {
    const response = await axios.get<{
      statistics: VerificationDashboardStats;
    }>('/api/v1/verification/dashboard', {
      params: vesselId ? { vesselId } : undefined,
    });
    return response.data;
  }
}

export const verificationService = new VerificationService();