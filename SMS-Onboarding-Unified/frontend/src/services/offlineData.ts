import { db, dbUtils } from './db';
import { syncService } from './sync';
import { api } from './api';
import { 
  Equipment, 
  QueueAction, 
  Documentation,
  SparePart,
  Vessel
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

class OfflineDataService {
  // Equipment operations
  async createEquipment(data: Partial<Equipment>): Promise<Equipment> {
    const equipment: Equipment = {
      ...data,
      id: data.id || uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      qualityScore: 0,
      status: 'DRAFT'
    } as Equipment;

    if (!navigator.onLine) {
      // Save locally and queue for sync
      await db.equipment.add(equipment);
      await syncService.queueOperation(QueueAction.CREATE_EQUIPMENT, equipment);
      return equipment;
    }

    try {
      // Try to create on server
      const response = await api.post('/equipment', equipment);
      const created = response.data;
      
      // Save to local DB
      await db.equipment.add(created);
      await dbUtils.updateSyncMetadata('equipment', created.id, 1);
      
      return created;
    } catch (error) {
      // Fallback to offline mode
      await db.equipment.add(equipment);
      await syncService.queueOperation(QueueAction.CREATE_EQUIPMENT, equipment);
      return equipment;
    }
  }

  async updateEquipment(id: string, data: Partial<Equipment>): Promise<Equipment> {
    const existing = await db.equipment.get(id);
    if (!existing) throw new Error('Equipment not found');

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };

    if (!navigator.onLine) {
      // Update locally and queue for sync
      await db.equipment.update(id, updated);
      await syncService.queueOperation(QueueAction.UPDATE_EQUIPMENT, updated);
      return updated;
    }

    try {
      // Try to update on server
      const response = await api.put(`/equipment/${id}`, data);
      const serverUpdated = response.data;
      
      // Update local DB
      await db.equipment.update(id, serverUpdated);
      await dbUtils.updateSyncMetadata('equipment', id, serverUpdated.version || 1);
      
      return serverUpdated;
    } catch (error) {
      // Fallback to offline mode
      await db.equipment.update(id, updated);
      await syncService.queueOperation(QueueAction.UPDATE_EQUIPMENT, updated);
      return updated;
    }
  }

  async deleteEquipment(id: string): Promise<void> {
    if (!navigator.onLine) {
      // Mark for deletion and queue
      await db.equipment.update(id, { status: 'DELETED' as any });
      await syncService.queueOperation(QueueAction.DELETE_EQUIPMENT, { id });
      return;
    }

    try {
      // Try to delete on server
      await api.delete(`/equipment/${id}`);
      
      // Remove from local DB
      await db.equipment.delete(id);
      await db.syncMetadata.delete(`equipment_${id}`);
    } catch (error) {
      // Fallback to offline mode
      await db.equipment.update(id, { status: 'DELETED' as any });
      await syncService.queueOperation(QueueAction.DELETE_EQUIPMENT, { id });
    }
  }

  async getEquipment(id: string): Promise<Equipment | undefined> {
    // Always check local first
    const local = await db.equipment.get(id);
    
    if (!navigator.onLine || local) {
      return local;
    }

    try {
      // Try to fetch from server
      const response = await api.get(`/equipment/${id}`);
      const equipment = response.data;
      
      // Update local DB
      await db.equipment.put(equipment);
      await dbUtils.updateSyncMetadata('equipment', id, equipment.version || 1);
      
      return equipment;
    } catch (error) {
      return local;
    }
  }

  async getEquipmentByVessel(vesselId: string): Promise<Equipment[]> {
    // Get from local DB
    const local = await db.equipment
      .where('vesselId')
      .equals(vesselId)
      .filter(e => e.status !== 'DELETED')
      .toArray();

    if (!navigator.onLine) {
      return local;
    }

    try {
      // Try to fetch from server
      const response = await api.get(`/vessels/${vesselId}/equipment`);
      const equipment = response.data;
      
      // Update local DB
      await db.transaction('rw', db.equipment, async () => {
        // Remove deleted items
        const serverIds = equipment.map((e: Equipment) => e.id);
        const localIds = local.map(e => e.id);
        const toDelete = localIds.filter(id => !serverIds.includes(id));
        
        for (const id of toDelete) {
          await db.equipment.delete(id);
        }
        
        // Update/add items
        await db.equipment.bulkPut(equipment);
      });
      
      return equipment;
    } catch (error) {
      return local;
    }
  }

  // Document operations
  async uploadDocument(
    file: File,
    metadata: Partial<Documentation>
  ): Promise<Documentation> {
    const document: Documentation = {
      ...metadata,
      id: metadata.id || uuidv4(),
      fileUrl: '', // Will be updated after upload
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date()
    } as Documentation;

    // Read file as blob
    const blob = new Blob([file], { type: file.type });
    
    // Cache file locally
    const cacheId = await dbUtils.cacheFile(
      `local://documents/${document.id}`,
      blob,
      file.type,
      7 * 24 * 60 * 60 * 1000 // 7 days TTL
    );

    document.fileUrl = `local://documents/${document.id}`;

    if (!navigator.onLine) {
      // Save locally and queue for sync
      await db.documentation.add(document);
      await syncService.queueOperation(QueueAction.UPLOAD_DOCUMENT, {
        ...document,
        localUrl: document.fileUrl,
        filename: file.name,
        metadata
      });
      return document;
    }

    try {
      // Try to upload to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploaded = response.data;
      
      // Update local DB with server URL
      document.fileUrl = uploaded.fileUrl;
      await db.documentation.add(uploaded);
      
      return uploaded;
    } catch (error) {
      // Fallback to offline mode
      await db.documentation.add(document);
      await syncService.queueOperation(QueueAction.UPLOAD_DOCUMENT, {
        ...document,
        localUrl: document.fileUrl,
        filename: file.name,
        metadata
      });
      return document;
    }
  }

  async getDocumentUrl(document: Documentation): Promise<string> {
    // Check if it's a local URL
    if (document.fileUrl.startsWith('local://')) {
      const cached = await dbUtils.getCachedFile(document.fileUrl);
      if (cached) {
        return URL.createObjectURL(cached.blob);
      }
    }

    // For remote URLs, try to cache them
    if (navigator.onLine && !document.fileUrl.startsWith('blob:')) {
      try {
        const response = await fetch(document.fileUrl);
        const blob = await response.blob();
        
        // Cache for offline use
        await dbUtils.cacheFile(
          document.fileUrl,
          blob,
          document.mimeType,
          7 * 24 * 60 * 60 * 1000 // 7 days TTL
        );
        
        return URL.createObjectURL(blob);
      } catch (error) {
        // Check cache
        const cached = await dbUtils.getCachedFile(document.fileUrl);
        if (cached) {
          return URL.createObjectURL(cached.blob);
        }
      }
    }

    return document.fileUrl;
  }

  // Spare parts operations
  async updateSparePart(id: string, data: Partial<SparePart>): Promise<SparePart> {
    const existing = await db.spareParts.get(id);
    if (!existing) throw new Error('Spare part not found');

    const updated = {
      ...existing,
      ...data
    };

    if (!navigator.onLine) {
      // Update locally and queue for sync
      await db.spareParts.update(id, updated);
      await syncService.queueOperation(QueueAction.UPDATE_SPARE_PART, updated);
      return updated;
    }

    try {
      // Try to update on server
      const response = await api.put(`/spare-parts/${id}`, data);
      const serverUpdated = response.data;
      
      // Update local DB
      await db.spareParts.update(id, serverUpdated);
      
      return serverUpdated;
    } catch (error) {
      // Fallback to offline mode
      await db.spareParts.update(id, updated);
      await syncService.queueOperation(QueueAction.UPDATE_SPARE_PART, updated);
      return updated;
    }
  }

  // Vessel operations
  async getVessel(id: string): Promise<Vessel | undefined> {
    // Always check local first
    const local = await db.vessels.get(id);
    
    if (!navigator.onLine || local) {
      return local;
    }

    try {
      // Try to fetch from server
      const response = await api.get(`/vessels/${id}`);
      const vessel = response.data;
      
      // Update local DB
      await db.vessels.put(vessel);
      
      return vessel;
    } catch (error) {
      return local;
    }
  }

  // Batch operations for initial data load
  async loadInitialData(vesselId: string): Promise<void> {
    if (!navigator.onLine) {
      console.log('Offline - using cached data');
      return;
    }

    try {
      const [vessel, equipment, categories] = await Promise.all([
        api.get(`/vessels/${vesselId}`),
        api.get(`/vessels/${vesselId}/equipment`),
        api.get('/equipment-categories')
      ]);

      await db.transaction('rw', db.vessels, db.equipment, db.categories, async () => {
        await db.vessels.put(vessel.data);
        await db.equipment.bulkPut(equipment.data);
        await db.categories.bulkPut(categories.data);
      });

      console.log('Initial data loaded successfully');
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  // Search operations (local only when offline)
  async searchEquipment(query: string, vesselId: string): Promise<Equipment[]> {
    const equipment = await this.getEquipmentByVessel(vesselId);
    
    const lowerQuery = query.toLowerCase();
    return equipment.filter(e => 
      e.name.toLowerCase().includes(lowerQuery) ||
      e.manufacturer.toLowerCase().includes(lowerQuery) ||
      e.model.toLowerCase().includes(lowerQuery) ||
      e.serialNumber.toLowerCase().includes(lowerQuery)
    );
  }

  // Get sync statistics
  async getSyncStats(): Promise<{
    totalLocal: number;
    pendingSync: number;
    lastSync?: Date;
  }> {
    const [equipmentCount, queueCount] = await Promise.all([
      db.equipment.count(),
      db.offlineQueue.count()
    ]);

    const lastSync = await db.syncMetadata
      .orderBy('lastSyncedAt')
      .reverse()
      .first();

    return {
      totalLocal: equipmentCount,
      pendingSync: queueCount,
      lastSync: lastSync?.lastSyncedAt
    };
  }
}

export const offlineDataService = new OfflineDataService();