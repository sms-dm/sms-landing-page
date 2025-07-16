import { api } from '@/services/api';
import type { ApiResponse, PaginatedResponse } from '@/types';
import { EquipmentStatus, CriticalLevel, EquipmentType } from '@/types';

export interface Equipment {
  id: string;
  vesselId: string;
  vessel?: {
    id: string;
    name: string;
    imoNumber?: string;
  };
  locationId?: string;
  location?: {
    id: string;
    name: string;
    path: string;
  };
  name: string;
  code?: string;
  equipmentType?: EquipmentType;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  criticality: CriticalLevel;
  status: EquipmentStatus;
  installationDate?: string;
  warrantyExpiry?: string;
  specifications?: Record<string, any>;
  maintenanceIntervalDays?: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  qualityScore: number;
  documentedBy?: string;
  documentedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewedBy?: string;
  reviewedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedBy?: string;
  approvedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  documentedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  criticalParts?: any[];
  documents?: any[];
  qualityScores?: any[];
}

export interface EquipmentFilters {
  search?: string;
  vesselId?: string;
  status?: EquipmentStatus;
  criticalLevel?: CriticalLevel;
  location?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
}

export interface BulkCreateEquipmentRequest {
  vesselId: string;
  equipment: Array<{
    name: string;
    type: EquipmentType;
    manufacturer: string;
    model: string;
    serialNumber?: string;
    locationId?: string;
    criticality: CriticalLevel;
    status?: EquipmentStatus;
    installationDate?: string;
    assignedTo?: string;
    metadata?: Record<string, any>;
  }>;
}

export interface BulkUpdateRequest {
  equipmentIds: string[];
  updates: {
    status?: EquipmentStatus;
    criticality?: CriticalLevel;
    locationId?: string;
    metadata?: Record<string, any>;
  };
}

export interface AssignEquipmentRequest {
  equipmentIds: string[];
  assignToId: string;
}

export interface EquipmentStats {
  total: number;
  byStatus: Record<EquipmentStatus, number>;
  byCriticality: Record<CriticalLevel, number>;
  byAssignee: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    count: number;
  }>;
  recentActivity: Equipment[];
}

const managerEquipmentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // List equipment with filters
    listManagerEquipment: builder.query<PaginatedResponse<Equipment>, EquipmentFilters & { page?: number; limit?: number }>({
      query: (params) => ({
        url: '/manager/equipment',
        method: 'GET',
        params
      }),
      providesTags: (result) => 
        result?.data 
          ? [...result.data.map(({ id }) => ({ type: 'Equipment' as const, id })), { type: 'Equipment', id: 'LIST' }]
          : [{ type: 'Equipment', id: 'LIST' }]
    }),

    // Create equipment in bulk
    bulkCreateEquipment: builder.mutation<ApiResponse<{ count: number }>, BulkCreateEquipmentRequest>({
      query: (data) => ({
        url: '/manager/equipment/bulk-create',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Equipment', id: 'LIST' }]
    }),

    // Update single equipment
    updateManagerEquipment: builder.mutation<ApiResponse<Equipment>, { id: string; data: Partial<Equipment> }>({
      query: ({ id, data }) => ({
        url: `/manager/equipment/${id}`,
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Equipment', id },
        { type: 'Equipment', id: 'LIST' }
      ]
    }),

    // Bulk update equipment
    bulkUpdateEquipment: builder.mutation<ApiResponse<{ count: number }>, BulkUpdateRequest>({
      query: (data) => ({
        url: '/manager/equipment/bulk-update',
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: [{ type: 'Equipment', id: 'LIST' }]
    }),

    // Delete single equipment
    deleteManagerEquipment: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/manager/equipment/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Equipment', id },
        { type: 'Equipment', id: 'LIST' }
      ]
    }),

    // Bulk delete equipment
    bulkDeleteEquipment: builder.mutation<ApiResponse<{ count: number }>, string[]>({
      query: (equipmentIds) => ({
        url: '/manager/equipment/bulk-delete',
        method: 'DELETE',
        body: { equipmentIds }
      }),
      invalidatesTags: [{ type: 'Equipment', id: 'LIST' }]
    }),

    // Assign equipment to technician
    assignEquipment: builder.mutation<ApiResponse<{ count: number; assignee: any }>, AssignEquipmentRequest>({
      query: (data) => ({
        url: '/manager/equipment/assign',
        method: 'POST',
        body: data
      }),
      invalidatesTags: [{ type: 'Equipment', id: 'LIST' }]
    }),

    // Get equipment statistics
    getEquipmentStats: builder.query<ApiResponse<EquipmentStats>, { vesselId?: string }>({
      query: (params) => ({
        url: '/manager/equipment/stats',
        method: 'GET',
        params
      }),
      providesTags: [{ type: 'Equipment', id: 'STATS' }]
    })
  })
});

export const {
  useListManagerEquipmentQuery,
  useBulkCreateEquipmentMutation,
  useUpdateManagerEquipmentMutation,
  useBulkUpdateEquipmentMutation,
  useDeleteManagerEquipmentMutation,
  useBulkDeleteEquipmentMutation,
  useAssignEquipmentMutation,
  useGetEquipmentStatsQuery
} = managerEquipmentApi;