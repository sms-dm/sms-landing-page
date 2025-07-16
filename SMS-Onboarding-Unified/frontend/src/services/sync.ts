import { OfflineQueue, QueueAction } from '@/types';
import { db, dbUtils } from './db';
import { api } from './api';
import axios from 'axios';

interface SyncResult {
  successful: any[];
  failed: Array<{ item: OfflineQueue; error: string }>;
  errors?: any[];
}

interface ConflictResolution {
  strategy: 'last-write-wins' | 'merge' | 'manual';
  resolver?: (local: any, remote: any) => any;
}

class SyncService {
  private syncInProgress = false;
  private conflictResolution: ConflictResolution = { strategy: 'last-write-wins' };

  // Main sync orchestrator
  async syncAll(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.warn('Sync already in progress');
      return { successful: [], failed: [], errors: [] };
    }

    this.syncInProgress = true;
    const result: SyncResult = { successful: [], failed: [], errors: [] };

    try {
      // 1. Process offline queue first
      const queueResult = await this.processOfflineQueue();
      result.successful.push(...queueResult.successful);
      result.failed.push(...queueResult.failed);

      // 2. Pull latest data from server
      await this.pullLatestData();

      // 3. Clean up expired cache
      await dbUtils.clearExpiredCache();

    } catch (error) {
      console.error('Sync failed:', error);
      result.errors = [error];
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  // Process all items in offline queue
  async processOfflineQueue(): Promise<SyncResult> {
    const queue = await dbUtils.getPendingOperations();
    const result: SyncResult = { successful: [], failed: [] };

    for (const item of queue) {
      try {
        await this.processQueueItem(item);
        result.successful.push(item);
        await dbUtils.removeFromQueue(item.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Increment retry count
        await dbUtils.incrementRetryCount(item.id);
        
        // Check if max retries exceeded
        if (item.retryCount >= item.maxRetries) {
          result.failed.push({ item, error: errorMessage });
          await dbUtils.removeFromQueue(item.id);
        } else {
          // Keep in queue for retry
          result.failed.push({ item, error: `${errorMessage} (will retry)` });
        }
      }
    }

    return result;
  }

  // Process individual queue item
  private async processQueueItem(item: OfflineQueue): Promise<void> {
    switch (item.action) {
      case QueueAction.CREATE_EQUIPMENT:
        await this.syncCreateEquipment(item.payload);
        break;
      
      case QueueAction.UPDATE_EQUIPMENT:
        await this.syncUpdateEquipment(item.payload.id, item.payload);
        break;
      
      case QueueAction.DELETE_EQUIPMENT:
        await this.syncDeleteEquipment(item.payload.id);
        break;
      
      case QueueAction.UPLOAD_DOCUMENT:
        await this.syncUploadDocument(item.payload);
        break;
      
      case QueueAction.DELETE_DOCUMENT:
        await this.syncDeleteDocument(item.payload.id);
        break;
      
      case QueueAction.UPDATE_SPARE_PART:
        await this.syncUpdateSparePart(item.payload.id, item.payload);
        break;
      
      default:
        throw new Error(`Unknown queue action: ${item.action}`);
    }
  }

  // Sync operations
  private async syncCreateEquipment(data: any): Promise<void> {
    const response = await api.post('/equipment', data);
    const created = response.data;
    
    // Update local ID with server ID if different
    if (data.id !== created.id) {
      await db.equipment.delete(data.id);
      await db.equipment.add(created);
    }
    
    await dbUtils.updateSyncMetadata('equipment', created.id, 1);
  }

  private async syncUpdateEquipment(id: string, data: any): Promise<void> {
    // Check for conflicts
    const localData = await db.equipment.get(id);
    const remoteData = await api.get(`/equipment/${id}`).then(r => r.data);
    
    const resolved = await this.resolveConflict(localData, remoteData, data);
    const response = await api.put(`/equipment/${id}`, resolved);
    
    await db.equipment.update(id, response.data);
    await dbUtils.updateSyncMetadata('equipment', id, response.data.version || 1);
  }

  private async syncDeleteEquipment(id: string): Promise<void> {
    await api.delete(`/equipment/${id}`);
    await db.equipment.delete(id);
    await db.syncMetadata.delete(`equipment_${id}`);
  }

  private async syncUploadDocument(data: any): Promise<void> {
    // Get cached file
    const cachedFile = await dbUtils.getCachedFile(data.localUrl);
    if (!cachedFile) {
      throw new Error('File not found in cache');
    }

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', cachedFile.blob, data.filename);
    formData.append('metadata', JSON.stringify(data.metadata));

    const response = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    // Update local document with server URL
    await db.documentation.update(data.id, {
      fileUrl: response.data.fileUrl
    });
  }

  private async syncDeleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
    await db.documentation.delete(id);
  }

  private async syncUpdateSparePart(id: string, data: any): Promise<void> {
    const response = await api.put(`/spare-parts/${id}`, data);
    await db.spareParts.update(id, response.data);
  }

  // Pull latest data from server
  private async pullLatestData(): Promise<void> {
    try {
      // Get current vessel context
      const session = await db.onboardingSessions.orderBy('lastActivityAt').last();
      if (!session) return;

      // Fetch latest data
      const [vessels, equipment, categories] = await Promise.all([
        api.get(`/vessels/${session.vesselId}`),
        api.get(`/vessels/${session.vesselId}/equipment`),
        api.get('/equipment-categories')
      ]);

      // Update local database
      await db.transaction('rw', db.vessels, db.equipment, db.categories, async () => {
        await db.vessels.put(vessels.data);
        await db.equipment.bulkPut(equipment.data);
        await db.categories.bulkPut(categories.data);
      });

    } catch (error) {
      console.error('Failed to pull latest data:', error);
      throw error;
    }
  }

  // Conflict resolution
  private async resolveConflict(local: any, remote: any, changes: any): Promise<any> {
    switch (this.conflictResolution.strategy) {
      case 'last-write-wins':
        // Use local changes (last write wins)
        return { ...remote, ...changes };
      
      case 'merge':
        // Merge non-conflicting fields
        const merged = { ...remote };
        for (const key in changes) {
          if (local[key] === remote[key] || !remote.hasOwnProperty(key)) {
            merged[key] = changes[key];
          }
        }
        return merged;
      
      case 'manual':
        // Use custom resolver if provided
        if (this.conflictResolution.resolver) {
          return this.conflictResolution.resolver(local, remote);
        }
        return changes;
      
      default:
        return changes;
    }
  }

  // Queue operation for offline processing
  async queueOperation(action: QueueAction, payload: any): Promise<void> {
    await dbUtils.queueOperation({ action, payload, maxRetries: 3 });
  }

  // Check if we can sync (online and authenticated)
  async canSync(): Promise<boolean> {
    if (!navigator.onLine) return false;
    
    try {
      // Check API connectivity
      const response = await axios.get('/api/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  // Get sync progress
  getSyncProgress(): { pending: number; processing: boolean } {
    return {
      pending: 0, // Will be updated from store
      processing: this.syncInProgress
    };
  }

  // Set conflict resolution strategy
  setConflictResolution(resolution: ConflictResolution): void {
    this.conflictResolution = resolution;
  }
}

export const syncService = new SyncService();