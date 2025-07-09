import { offlineService } from './offlineService';
import { technicianApi } from './technicianApi';
import { OfflineData, PendingUpload } from '../types';

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: Date | null = null;

  // Start automatic sync
  startAutoSync(intervalMs: number = 30000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (!this.isSyncing && navigator.onLine) {
        this.syncAll();
      }
    }, intervalMs);

    // Initial sync if online
    if (navigator.onLine) {
      this.syncAll();
    }
  }

  // Stop automatic sync
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
    };
  }

  // Sync all pending data
  async syncAll(): Promise<{ success: number; failed: number; errors: any[] }> {
    if (!navigator.onLine || this.isSyncing) {
      return { success: 0, failed: 0, errors: [] };
    }

    this.isSyncing = true;
    const results = { success: 0, failed: 0, errors: [] as any[] };

    try {
      // Sync offline data (equipment, parts, etc.)
      const dataResults = await this.syncOfflineData();
      results.success += dataResults.success;
      results.failed += dataResults.failed;
      results.errors.push(...dataResults.errors);

      // Sync pending uploads (photos, documents)
      const uploadResults = await this.syncPendingUploads();
      results.success += uploadResults.success;
      results.failed += uploadResults.failed;
      results.errors.push(...uploadResults.errors);

      this.lastSyncTime = new Date();
    } finally {
      this.isSyncing = false;
    }

    return results;
  }

  // Sync offline data
  private async syncOfflineData(): Promise<{ success: number; failed: number; errors: any[] }> {
    const unsyncedData = await offlineService.getUnsyncedData();
    const results = { success: 0, failed: 0, errors: [] as any[] };

    for (const data of unsyncedData) {
      try {
        await this.syncDataItem(data);
        await offlineService.markDataAsSynced(data.id);
        results.success++;
      } catch (error) {
        console.error(`Failed to sync ${data.type} ${data.id}:`, error);
        results.failed++;
        results.errors.push({
          id: data.id,
          type: data.type,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  // Sync individual data item
  private async syncDataItem(data: OfflineData): Promise<void> {
    switch (data.type) {
      case 'equipment':
        await this.syncEquipment(data);
        break;
      case 'part':
        await this.syncPart(data);
        break;
      case 'location':
        await this.syncLocation(data);
        break;
      default:
        throw new Error(`Unknown data type: ${data.type}`);
    }
  }

  // Sync equipment
  private async syncEquipment(data: OfflineData): Promise<void> {
    const { locationId, ...equipmentData } = data.data;

    switch (data.action) {
      case 'create':
        await technicianApi.createEquipment(locationId, equipmentData);
        break;
      case 'update':
        await technicianApi.updateEquipment(equipmentData.id, equipmentData);
        break;
      default:
        throw new Error(`Unknown action: ${data.action}`);
    }
  }

  // Sync part
  private async syncPart(data: OfflineData): Promise<void> {
    switch (data.action) {
      case 'create':
        const { equipmentId, ...partData } = data.data;
        await technicianApi.createSparePart(equipmentId, partData);
        break;
      case 'update':
        if (data.data.criticalLevel === 'critical' && data.data.criticalReason) {
          await technicianApi.markPartAsCritical(data.data.id, data.data.criticalReason);
        } else {
          // Update other part data
          const { id, ...updateData } = data.data;
          // Note: You might need to add an updatePart method to technicianApi
        }
        break;
      default:
        throw new Error(`Unknown action: ${data.action}`);
    }
  }

  // Sync location
  private async syncLocation(data: OfflineData): Promise<void> {
    if (data.action === 'create') {
      const { vesselId, ...locationData } = data.data;
      await technicianApi.createLocation(vesselId, locationData);
    }
  }

  // Sync pending uploads
  private async syncPendingUploads(): Promise<{ success: number; failed: number; errors: any[] }> {
    const pendingUploads = await offlineService.getPendingUploads();
    const results = { success: 0, failed: 0, errors: [] as any[] };

    for (const upload of pendingUploads) {
      try {
        await this.syncUpload(upload);
        await offlineService.updateUploadStatus(upload.id, 'completed');
        results.success++;
      } catch (error) {
        console.error(`Failed to sync upload ${upload.id}:`, error);
        await offlineService.updateUploadStatus(
          upload.id,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
        results.failed++;
        results.errors.push({
          id: upload.id,
          type: 'upload',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  // Sync individual upload
  private async syncUpload(upload: PendingUpload): Promise<void> {
    // Convert base64 to blob
    const base64Data = upload.base64Data.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: upload.mimeType });

    // Upload the file
    await technicianApi.uploadPhoto(
      upload.entityType,
      upload.entityId,
      blob,
      upload.metadata
    );
  }

  // Clear all offline data after successful sync
  async clearSyncedData(): Promise<void> {
    const unsyncedData = await offlineService.getUnsyncedData();
    
    for (const data of unsyncedData) {
      if (data.synced) {
        await offlineService.deleteOfflineData(data.id);
      }
    }

    // Clear completed uploads
    const uploads = await offlineService.getPendingUploads();
    for (const upload of uploads) {
      if (upload.status === 'completed') {
        await offlineService.updateUploadStatus(upload.id, 'completed');
      }
    }
  }
}

export const syncService = new SyncService();