import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOfflineData } from '@/hooks/useOfflineData';
import { Equipment } from '@/types';
import { toast } from '@/utils/toast';

export function useEquipmentOffline(vesselId: string) {
  const queryClient = useQueryClient();
  const { 
    getEquipmentByVessel, 
    createEquipment, 
    updateEquipment, 
    deleteEquipment,
    isOffline 
  } = useOfflineData();

  // Query for equipment list
  const equipmentQuery = useQuery({
    queryKey: ['equipment', vesselId],
    queryFn: () => getEquipmentByVessel(vesselId),
    staleTime: isOffline ? Infinity : 5 * 60 * 1000, // Don't refetch when offline
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  // Create equipment mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Equipment>) => createEquipment(data),
    onSuccess: (newEquipment) => {
      queryClient.setQueryData(['equipment', vesselId], (old: Equipment[] = []) => {
        return [...old, newEquipment];
      });
      
      toast({
        title: 'Equipment Added',
        description: isOffline 
          ? 'Equipment saved locally. Will sync when online.' 
          : 'Equipment successfully created.',
        variant: isOffline ? 'warning' : 'success'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create equipment',
        variant: 'destructive'
      });
    }
  });

  // Update equipment mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Equipment> }) => 
      updateEquipment(id, data),
    onSuccess: (updatedEquipment) => {
      queryClient.setQueryData(['equipment', vesselId], (old: Equipment[] = []) => {
        return old.map(item => item.id === updatedEquipment.id ? updatedEquipment : item);
      });
      
      toast({
        title: 'Equipment Updated',
        description: isOffline 
          ? 'Changes saved locally. Will sync when online.' 
          : 'Equipment successfully updated.',
        variant: isOffline ? 'warning' : 'success'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update equipment',
        variant: 'destructive'
      });
    }
  });

  // Delete equipment mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEquipment(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['equipment', vesselId], (old: Equipment[] = []) => {
        return old.filter(item => item.id !== deletedId);
      });
      
      toast({
        title: 'Equipment Deleted',
        description: isOffline 
          ? 'Deletion queued. Will sync when online.' 
          : 'Equipment successfully deleted.',
        variant: isOffline ? 'warning' : 'success'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete equipment',
        variant: 'destructive'
      });
    }
  });

  return {
    equipment: equipmentQuery.data || [],
    isLoading: equipmentQuery.isLoading,
    isError: equipmentQuery.isError,
    error: equipmentQuery.error,
    refetch: equipmentQuery.refetch,
    
    createEquipment: createMutation.mutate,
    isCreating: createMutation.isPending,
    
    updateEquipment: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    
    deleteEquipment: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    
    isOffline
  };
}