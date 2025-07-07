import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToQueue } from '@/store/slices/syncSlice';
import { offlineDataService } from '@/services/offlineData';
import { useOfflineStatus } from './useOfflineStatus';
import { 
  Equipment, 
  Documentation, 
  SparePart, 
  Vessel,
  QueueAction 
} from '@/types';

interface UseOfflineDataReturn {
  // Equipment operations
  createEquipment: (data: Partial<Equipment>) => Promise<Equipment>;
  updateEquipment: (id: string, data: Partial<Equipment>) => Promise<Equipment>;
  deleteEquipment: (id: string) => Promise<void>;
  getEquipment: (id: string) => Promise<Equipment | undefined>;
  getEquipmentByVessel: (vesselId: string) => Promise<Equipment[]>;
  
  // Document operations
  uploadDocument: (file: File, metadata: Partial<Documentation>) => Promise<Documentation>;
  getDocumentUrl: (document: Documentation) => Promise<string>;
  
  // Spare part operations
  updateSparePart: (id: string, data: Partial<SparePart>) => Promise<SparePart>;
  
  // Vessel operations
  getVessel: (id: string) => Promise<Vessel | undefined>;
  
  // Search
  searchEquipment: (query: string, vesselId: string) => Promise<Equipment[]>;
  
  // Status
  isOffline: boolean;
  syncStats: {
    totalLocal: number;
    pendingSync: number;
    lastSync?: Date;
  };
}

export function useOfflineData(): UseOfflineDataReturn {
  const dispatch = useDispatch<AppDispatch>();
  const isOffline = useOfflineStatus();
  const [syncStats, setSyncStats] = useState({
    totalLocal: 0,
    pendingSync: 0,
    lastSync: undefined as Date | undefined
  });

  // Update sync stats periodically
  useEffect(() => {
    const updateStats = async () => {
      const stats = await offlineDataService.getSyncStats();
      setSyncStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Equipment operations
  const createEquipment = useCallback(async (data: Partial<Equipment>) => {
    const equipment = await offlineDataService.createEquipment(data);
    
    if (isOffline) {
      dispatch(addToQueue({
        action: QueueAction.CREATE_EQUIPMENT,
        payload: equipment,
        maxRetries: 3
      }));
    }
    
    return equipment;
  }, [dispatch, isOffline]);

  const updateEquipment = useCallback(async (id: string, data: Partial<Equipment>) => {
    const equipment = await offlineDataService.updateEquipment(id, data);
    
    if (isOffline) {
      dispatch(addToQueue({
        action: QueueAction.UPDATE_EQUIPMENT,
        payload: equipment,
        maxRetries: 3
      }));
    }
    
    return equipment;
  }, [dispatch, isOffline]);

  const deleteEquipment = useCallback(async (id: string) => {
    await offlineDataService.deleteEquipment(id);
    
    if (isOffline) {
      dispatch(addToQueue({
        action: QueueAction.DELETE_EQUIPMENT,
        payload: { id },
        maxRetries: 3
      }));
    }
  }, [dispatch, isOffline]);

  const getEquipment = useCallback(async (id: string) => {
    return await offlineDataService.getEquipment(id);
  }, []);

  const getEquipmentByVessel = useCallback(async (vesselId: string) => {
    return await offlineDataService.getEquipmentByVessel(vesselId);
  }, []);

  // Document operations
  const uploadDocument = useCallback(async (
    file: File, 
    metadata: Partial<Documentation>
  ) => {
    const document = await offlineDataService.uploadDocument(file, metadata);
    
    if (isOffline) {
      dispatch(addToQueue({
        action: QueueAction.UPLOAD_DOCUMENT,
        payload: {
          ...document,
          localUrl: document.fileUrl,
          filename: file.name,
          metadata
        },
        maxRetries: 3
      }));
    }
    
    return document;
  }, [dispatch, isOffline]);

  const getDocumentUrl = useCallback(async (document: Documentation) => {
    return await offlineDataService.getDocumentUrl(document);
  }, []);

  // Spare part operations
  const updateSparePart = useCallback(async (id: string, data: Partial<SparePart>) => {
    const sparePart = await offlineDataService.updateSparePart(id, data);
    
    if (isOffline) {
      dispatch(addToQueue({
        action: QueueAction.UPDATE_SPARE_PART,
        payload: sparePart,
        maxRetries: 3
      }));
    }
    
    return sparePart;
  }, [dispatch, isOffline]);

  // Vessel operations
  const getVessel = useCallback(async (id: string) => {
    return await offlineDataService.getVessel(id);
  }, []);

  // Search operations
  const searchEquipment = useCallback(async (query: string, vesselId: string) => {
    return await offlineDataService.searchEquipment(query, vesselId);
  }, []);

  return {
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getEquipment,
    getEquipmentByVessel,
    uploadDocument,
    getDocumentUrl,
    updateSparePart,
    getVessel,
    searchEquipment,
    isOffline,
    syncStats
  };
}