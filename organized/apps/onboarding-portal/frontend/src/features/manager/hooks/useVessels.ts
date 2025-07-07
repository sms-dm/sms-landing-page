import { useQuery } from '@tanstack/react-query';
import { managerApi } from '../services/managerApi';

export const useGetVesselsNeedingOnboardingQuery = () => {
  return useQuery({
    queryKey: ['vessels', 'needingOnboarding'],
    queryFn: managerApi.getVesselsNeedingOnboarding,
  });
};

export const useGetVesselsQuery = () => {
  return useQuery({
    queryKey: ['vessels'],
    queryFn: managerApi.getVessels,
  });
};