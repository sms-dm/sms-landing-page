// Technician-specific types
export interface TechnicianAssignment {
  id: string;
  technicianId: string;
  vesselId: string;
  vessel: {
    id: string;
    name: string;
    imoNumber: string;
    vesselType: string;
    companyName: string;
  };
  assignedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: AssignmentStatus;
  progress: AssignmentProgress;
  qualityScore?: number;
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
}

export enum AssignmentStatus {
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue'
}

export interface AssignmentProgress {
  locationsTotal: number;
  locationsCompleted: number;
  equipmentTotal: number;
  equipmentCompleted: number;
  partsTotal: number;
  partsCompleted: number;
  photosUploaded: number;
  criticalPartsIdentified: number;
}

export interface VesselLocation {
  id: string;
  vesselId: string;
  name: string;
  deck: string;
  zone: string;
  description?: string;
  equipmentCount: number;
  completedCount: number;
  photos: LocationPhoto[];
}

export interface LocationPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  uploadedAt: Date;
  metadata: {
    width: number;
    height: number;
    size: number;
  };
}

export interface OnboardingFlowState {
  currentStep: OnboardingStep;
  vesselId: string;
  selectedLocation?: VesselLocation;
  selectedEquipment?: string;
  pendingUploads: PendingUpload[];
  offlineData: OfflineData[];
}

export enum OnboardingStep {
  SELECT_ASSIGNMENT = 'select_assignment',
  SELECT_LOCATION = 'select_location',
  ADD_EQUIPMENT = 'add_equipment',
  ADD_PARTS = 'add_parts',
  REVIEW = 'review'
}

export interface PendingUpload {
  id: string;
  type: 'photo' | 'document';
  entityType: 'location' | 'equipment' | 'part';
  entityId: string;
  file: File;
  compressedFile?: Blob;
  status: 'pending' | 'uploading' | 'failed' | 'completed';
  retryCount: number;
  error?: string;
}

export interface OfflineData {
  id: string;
  type: 'equipment' | 'part' | 'location';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  synced: boolean;
}

export interface PhotoCaptureConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'webp';
}

export interface QualityScoreBreakdown {
  overall: number;
  dataCompleteness: number;
  photoQuality: number;
  criticalPartsIdentified: number;
  documentationUploaded: number;
  details: QualityDetail[];
}

export interface QualityDetail {
  category: string;
  score: number;
  maxScore: number;
  issues: string[];
  suggestions: string[];
}