import { api } from './api';
import { Vessel, PaginatedResponse } from '@/types';
import { handleApiError } from '@/utils/errorHandler';

interface VesselFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  companyId?: string;
  status?: string;
  onboardingStatus?: string;
}

interface CreateVesselDto {
  companyId: string;
  name: string;
  imoNumber: string;
  flag: string;
  type: string;
  yearBuilt: number;
  grossTonnage: number;
  deadWeight?: number;
  length?: number;
  beam?: number;
  draft?: number;
  mainEngine?: {
    manufacturer: string;
    model: string;
    power: number;
    rpm: number;
  };
  auxiliaryEngines?: Array<{
    manufacturer: string;
    model: string;
    power: number;
    quantity: number;
  }>;
  classification?: string;
}

interface UpdateVesselDto {
  name?: string;
  flag?: string;
  type?: string;
  status?: string;
  mainEngine?: {
    manufacturer: string;
    model: string;
    power: number;
    rpm: number;
  };
  auxiliaryEngines?: Array<{
    manufacturer: string;
    model: string;
    power: number;
    quantity: number;
  }>;
  classification?: string;
}

interface OnboardingProgress {
  vesselId: string;
  overallProgress: number;
  status: string;
  categories: Array<{
    name: string;
    progress: number;
    itemsCompleted: number;
    totalItems: number;
  }>;
  lastUpdated: Date;
  estimatedCompletion: Date;
}

// Add retry configuration for vessel endpoints
const vesselBaseQuery = api.enhanceEndpoints({
  addTagTypes: ['Vessel', 'Equipment'],
}).injectEndpoints({
  overrideExisting: false,
  endpoints: () => ({}),
});

export const vesselApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all vessels with pagination and filters
    getVessels: builder.query<PaginatedResponse<Vessel>, VesselFilters>({
      query: (filters) => ({
        url: '/vessels',
        params: filters,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Vessel' as const, id })),
              { type: 'Vessel', id: 'LIST' },
            ]
          : [{ type: 'Vessel', id: 'LIST' }],
    }),

    // Get single vessel by ID
    getVessel: builder.query<{ data: Vessel }, string>({
      query: (vesselId) => `/vessels/${vesselId}`,
      providesTags: (result, error, vesselId) => [{ type: 'Vessel', id: vesselId }],
    }),

    // Create new vessel
    createVessel: builder.mutation<{ data: Vessel; message: string }, CreateVesselDto>({
      query: (vesselData) => ({
        url: '/vessels',
        method: 'POST',
        body: vesselData,
      }),
      invalidatesTags: [{ type: 'Vessel', id: 'LIST' }],
    }),

    // Update vessel
    updateVessel: builder.mutation<
      { data: Vessel; message: string },
      { vesselId: string; updates: UpdateVesselDto }
    >({
      query: ({ vesselId, updates }) => ({
        url: `/vessels/${vesselId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { vesselId }) => [
        { type: 'Vessel', id: vesselId },
        { type: 'Vessel', id: 'LIST' },
      ],
    }),

    // Delete vessel
    deleteVessel: builder.mutation<{ message: string }, string>({
      query: (vesselId) => ({
        url: `/vessels/${vesselId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Vessel', id: 'LIST' }],
    }),

    // Get vessel onboarding progress
    getVesselOnboardingProgress: builder.query<{ data: OnboardingProgress }, string>({
      query: (vesselId) => `/vessels/${vesselId}/onboarding-progress`,
      providesTags: (result, error, vesselId) => [{ type: 'Vessel', id: `${vesselId}-progress` }],
    }),

    // Get equipment for a vessel
    getVesselEquipment: builder.query<PaginatedResponse<any>, { vesselId: string; filters?: any }>({
      query: ({ vesselId, filters }) => ({
        url: `/vessels/${vesselId}/equipment`,
        params: filters,
      }),
      providesTags: (result, error, { vesselId }) => [
        { type: 'Equipment', id: `vessel-${vesselId}` },
      ],
    }),

    // Create equipment for a vessel
    createVesselEquipment: builder.mutation<
      { data: any; message: string },
      { vesselId: string; equipment: any }
    >({
      query: ({ vesselId, equipment }) => ({
        url: `/vessels/${vesselId}/equipment`,
        method: 'POST',
        body: equipment,
      }),
      invalidatesTags: (result, error, { vesselId }) => [
        { type: 'Equipment', id: `vessel-${vesselId}` },
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetVesselsQuery,
  useGetVesselQuery,
  useCreateVesselMutation,
  useUpdateVesselMutation,
  useDeleteVesselMutation,
  useGetVesselOnboardingProgressQuery,
  useGetVesselEquipmentQuery,
  useCreateVesselEquipmentMutation,
} = vesselApi;