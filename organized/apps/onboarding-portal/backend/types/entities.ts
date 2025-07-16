export enum VesselType {
  CONTAINER_SHIP = 'container_ship',
  BULK_CARRIER = 'bulk_carrier',
  TANKER = 'tanker',
  GENERAL_CARGO = 'general_cargo',
  PASSENGER_SHIP = 'passenger_ship',
  OFFSHORE_VESSEL = 'offshore_vessel',
  OTHER = 'other'
}

export enum VesselStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  DECOMMISSIONED = 'decommissioned'
}

export enum OnboardingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  APPROVED = 'approved',
  EXPORTED = 'exported'
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

export enum CriticalLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum PartCategory {
  MECHANICAL = 'mechanical',
  ELECTRICAL = 'electrical',
  HYDRAULIC = 'hydraulic',
  PNEUMATIC = 'pneumatic',
  CONSUMABLE = 'consumable',
  SAFETY = 'safety',
  OTHER = 'other'
}

export enum EquipmentClassification {
  PERMANENT = 'permanent',
  FLOATING = 'floating',
  RENTAL = 'rental'
}