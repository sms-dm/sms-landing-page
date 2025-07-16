export interface Company {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  created_at: string;
  updated_at: string;
}

export interface Vessel {
  id: number;
  company_id: number;
  name: string;
  imo_number?: string;
  vessel_type?: string;
  image_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  company_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'technician' | 'manager' | 'admin' | 'hse' | 'hse_manager' | 'electrical_manager' | 'mechanical_manager';
  department?: string;
  manager_id?: number;
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  default_vessel_id?: number;
}

export interface Equipment {
  id: number;
  vessel_id: number;
  qr_code: string;
  name: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  location: string;
  equipment_type: string;
  status: 'operational' | 'maintenance' | 'fault' | 'decommissioned';
  criticality?: 'CRITICAL' | 'IMPORTANT' | 'STANDARD';
  classification?: 'PERMANENT' | 'TEMPORARY' | 'RENTAL';
  installation_date?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  specifications?: any;
  created_at: string;
  updated_at: string;
}

export interface EquipmentTransfer {
  id: number;
  equipment_id: number;
  from_vessel_id: number;
  to_vessel_id: number;
  from_location?: string;
  to_location?: string;
  transfer_reason: string;
  transfer_notes?: string;
  transferred_by: number;
  transfer_date: string;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Additional fields from joins
  equipment_name?: string;
  qr_code?: string;
  from_vessel_name?: string;
  to_vessel_name?: string;
  transferred_by_name?: string;
}

export interface Fault {
  id: number;
  equipment_id: number;
  reported_by: number;
  fault_type: 'critical' | 'minor';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  description: string;
  root_cause?: string;
  resolution?: string;
  started_at: string;
  resolved_at?: string;
  downtime_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface PartUsed {
  id: number;
  fault_id: number;
  part_number: string;
  description: string;
  quantity: number;
  unit_cost?: number;
  markup_percentage?: number;
  created_at: string;
}