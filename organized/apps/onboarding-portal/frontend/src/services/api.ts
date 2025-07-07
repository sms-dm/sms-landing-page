import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getEnv } from '@/config/env';
import { tokenStorage } from '@/utils/tokenStorage';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: getEnv('apiBaseUrl'),
    timeout: getEnv('apiTimeout'),
    prepareHeaders: (headers) => {
      const token = tokenStorage.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'User',
    'Company',
    'Vessel',
    'Equipment',
    'Token',
    'Session',
    'QualityReport',
  ],
  endpoints: () => ({}),
});

// Export hooks for usage in functional components
export const {} = api;