// User and Authentication Types
export interface User {
  id: string;
  email: string;
  role: UserRole;
  companyId: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  TECHNICIAN = 'technician',
  MANAGER = 'manager',
  SUPER_ADMIN = 'super_admin',
  HSE_OFFICER = 'hse_officer'
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Company and Vessel Types
export interface Company {
  id: string;
  name: string;
  imoNumber?: string;
  address: Address;
  contactEmail: string;
  contactPhone: string;
  subscriptionTier: SubscriptionTier;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vessel {
  id: string;
  companyId: string;
  name: string;
  imoNumber: string;
  vesselType: string;
  flag: string;
  yearBuilt: number;
  grossTonnage: number;
  deadWeight: number;
  engineDetails: EngineDetails;
  onboardingStatus: OnboardingStatus;
  onboardingProgress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EngineDetails {
  mainEngine: {
    manufacturer: string;
    model: string;
    power: number;
    rpm: number;
  };
  auxiliaryEngines: Array<{
    manufacturer: string;
    model: string;
    power: number;
    quantity: number;
  }>;
}

// Equipment Types
export interface Equipment {
  id: string;
  vesselId: string;
  categoryId: string;
  subcategoryId?: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  installationDate?: Date;
  location: string;
  criticalityLevel: CriticalityLevel;
  classification: EquipmentClassification;
  specifications: Record<string, any>;
  documentation: Documentation[];
  spareParts: SparePart[];
  qualityScore: number;
  status: EquipmentStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  subcategories: Subcategory[];
  requiredFields: string[];
  icon: string;
}

export interface Subcategory {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface EquipmentTransfer {
  id: string;
  equipmentId: string;
  fromVesselId: string;
  toVesselId: string;
  fromLocationId?: string;
  toLocationId?: string;
  transferredBy: string;
  transferredAt: Date;
  reason: string;
  notes?: string;
  documentData: any;
  partsData: any;
  qualityScoresData: any;
  metadata: any;
  fromVessel?: Vessel;
  toVessel?: Vessel;
  fromLocation?: any;
  toLocation?: any;
  transferredByUser?: User;
  createdAt: Date;
}

// Spare Parts Types
export interface SparePart {
  id: string;
  equipmentId: string;
  partNumber: string;
  name: string;
  manufacturer: string;
  description: string;
  criticalityLevel: CriticalityLevel;
  quantity: number;
  minimumStock: number;
  location: string;
  suppliers: Supplier[];
  images: string[];
  lastOrderDate?: Date;
  estimatedLeadTime: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  notes?: string;
}

// Documentation Types
export interface Documentation {
  id: string;
  type: DocumentationType;
  title: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  metadata?: Record<string, any>;
}

export enum DocumentationType {
  MANUAL = 'manual',
  CERTIFICATE = 'certificate',
  DRAWING = 'drawing',
  PHOTO = 'photo',
  INVOICE = 'invoice',
  TEST_REPORT = 'test_report',
  OTHER = 'other'
}

// Onboarding Types
export interface OnboardingToken {
  id: string;
  token: string;
  vesselId: string;
  companyId: string;
  createdBy: string;
  expiresAt: Date;
  usedAt?: Date;
  usedBy?: string;
  permissions: TokenPermissions;
}

export interface TokenPermissions {
  canAddEquipment: boolean;
  canEditEquipment: boolean;
  canDeleteEquipment: boolean;
  canUploadDocuments: boolean;
  canManageUsers: boolean;
  accessibleCategories: string[];
}

export interface OnboardingSession {
  id: string;
  tokenId: string;
  userId: string;
  vesselId: string;
  startedAt: Date;
  lastActivityAt: Date;
  completedAt?: Date;
  progress: OnboardingProgress;
  syncStatus: SyncStatus;
}

export interface OnboardingProgress {
  totalEquipment: number;
  completedEquipment: number;
  totalCategories: number;
  completedCategories: number;
  categoriesProgress: Record<string, CategoryProgress>;
}

export interface CategoryProgress {
  total: number;
  completed: number;
  inProgress: number;
  qualityScore: number;
}

// Quality and Validation Types
export interface QualityMetrics {
  overallScore: number;
  completeness: number;
  accuracy: number;
  documentation: number;
  criticalPartsIdentified: number;
  photosQuality: number;
  breakdown: QualityBreakdown[];
}

export interface QualityBreakdown {
  category: string;
  score: number;
  issues: QualityIssue[];
}

export interface QualityIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor';
  category: string;
  description: string;
  equipmentId?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// Sync and Offline Types
export interface SyncStatus {
  lastSyncAt?: Date;
  pendingChanges: number;
  isSyncing: boolean;
  syncErrors: SyncError[];
}

export interface SyncError {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  error: string;
  occurredAt: Date;
  retryCount: number;
}

export interface OfflineQueue {
  id: string;
  action: QueueAction;
  payload: any;
  createdAt: Date;
  retryCount: number;
  maxRetries: number;
}

export enum QueueAction {
  CREATE_EQUIPMENT = 'create_equipment',
  UPDATE_EQUIPMENT = 'update_equipment',
  DELETE_EQUIPMENT = 'delete_equipment',
  UPLOAD_DOCUMENT = 'upload_document',
  DELETE_DOCUMENT = 'delete_document',
  UPDATE_SPARE_PART = 'update_spare_part'
}

// Common Types
export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export enum SubscriptionTier {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}

export enum OnboardingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  APPROVED = 'approved',
  EXPORTED = 'exported'
}

export enum CriticalityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum CriticalLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum EquipmentStatus {
  PLANNED = 'planned',
  ARRIVING = 'arriving',
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  VERIFIED = 'verified',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  REMOVED = 'removed',
  DELETED = 'deleted'
}

export enum EquipmentClassification {
  PERMANENT = 'permanent',
  FLOATING = 'floating',
  RENTAL = 'rental'
}

export enum EquipmentType {
  MAIN_ENGINE = 'main_engine',
  AUXILIARY_ENGINE = 'auxiliary_engine',
  PUMP = 'pump',
  COMPRESSOR = 'compressor',
  GENERATOR = 'generator',
  NAVIGATION = 'navigation',
  SAFETY = 'safety',
  OTHER = 'other'
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

// Form Types
export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string>;
  isDirty: boolean;
  isSubmitting: boolean;
  isValid: boolean;
}

// HSE Types
export interface HSEOnboarding {
  id: string;
  vesselId: string;
  safetyEquipmentStatus: SafetyEquipmentStatus;
  certificates: HSECertificate[];
  emergencyContacts: EmergencyContact[];
  currentSafetyStatus: CurrentSafetyStatus;
  completedBy?: string;
  completedAt?: Date;
  lastUpdatedBy?: string;
  lastUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafetyEquipmentStatus {
  lifeboats: EquipmentCheck;
  lifeRafts: EquipmentCheck;
  fireExtinguishers: EquipmentCheck;
  fireSuits: EquipmentCheck;
  emergencyBeacons: EquipmentCheck;
  medicalKit: EquipmentCheck;
  gasDetectors: EquipmentCheck;
  breathingApparatus: EquipmentCheck;
  additionalNotes?: string;
}

export interface EquipmentCheck {
  available: boolean;
  quantity?: number;
  lastInspection?: Date;
  nextInspection?: Date;
  condition?: 'good' | 'fair' | 'poor';
  notes?: string;
}

export interface HSECertificate {
  id: string;
  type: CertificateType;
  certificateNumber: string;
  issueDate: Date;
  expiryDate: Date;
  issuingAuthority: string;
  documentUrl?: string;
  status: 'valid' | 'expired' | 'pending_renewal';
  notes?: string;
}

export enum CertificateType {
  SOLAS = 'SOLAS',
  MARPOL = 'MARPOL',
  ISM = 'ISM',
  ISPS = 'ISPS',
  MLC = 'MLC',
  OTHER = 'OTHER'
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  available24x7: boolean;
  location?: string;
  notes?: string;
}

export interface CurrentSafetyStatus {
  lastDrillDate?: Date;
  nextDrillDate?: Date;
  openNonConformities: number;
  lastInspectionDate?: Date;
  nextInspectionDate?: Date;
  overallRiskLevel: 'low' | 'medium' | 'high';
  remarks?: string;
}

// Explicit exports for build compatibility
export type { User as UserType };
export { UserRole as UserRoleEnum };
