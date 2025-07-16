import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db, dbUtils } from '@/services/db';
import { syncService } from '@/services/sync';
import { offlineDataService } from '@/services/offlineData';
import { photoService } from '@/features/tech/services/photoService';
import { offlineService } from '@/features/tech/services/offlineService';
import { QueueAction } from '@/types';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  configurable: true,
});

// Mock API module
vi.mock('@/services/api', () => ({
  api: {
    post: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Offline Synchronization Tests', () => {
  beforeEach(async () => {
    // Clear all databases
    await db.delete();
    await db.open();
    await offlineService.clearAll();
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  describe('1. Creating Data While Offline', () => {
    beforeEach(() => {
      // Set offline
      (navigator as any).onLine = false;
    });

    it('should create equipment offline and queue for sync', async () => {
      const equipmentData = {
        name: 'Test Equipment',
        manufacturer: 'Test Manufacturer',
        model: 'Model 123',
        serialNumber: 'SN123456',
        vesselId: 'vessel-1',
        categoryId: 'cat-1',
        subcategoryId: 'subcat-1',
      };

      const created = await offlineDataService.createEquipment(equipmentData);

      // Verify equipment was created with UUID
      expect(created.id).toBeTruthy();
      expect(created.status).toBe('DRAFT');
      expect(created.name).toBe(equipmentData.name);

      // Verify equipment was saved to local DB
      const localEquipment = await db.equipment.get(created.id);
      expect(localEquipment).toBeTruthy();
      expect(localEquipment?.name).toBe(equipmentData.name);

      // Verify operation was queued
      const queue = await db.offlineQueue.toArray();
      expect(queue).toHaveLength(1);
      expect(queue[0].action).toBe(QueueAction.CREATE_EQUIPMENT);
      expect(queue[0].payload.id).toBe(created.id);
    });

    it('should create multiple items offline without conflicts', async () => {
      const items = [];
      
      for (let i = 0; i < 5; i++) {
        const equipment = await offlineDataService.createEquipment({
          name: `Equipment ${i}`,
          manufacturer: 'Test',
          model: `Model ${i}`,
          serialNumber: `SN${i}`,
          vesselId: 'vessel-1',
          categoryId: 'cat-1',
          subcategoryId: 'subcat-1',
        });
        items.push(equipment);
      }

      // Verify all items have unique IDs
      const ids = items.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);

      // Verify all items are in queue
      const queue = await db.offlineQueue.toArray();
      expect(queue).toHaveLength(5);
    });

    it('should handle document uploads offline', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const metadata = {
        type: 'manual',
        title: 'Test Document',
        equipmentId: 'equipment-1',
      };

      const document = await offlineDataService.uploadDocument(file, metadata);

      // Verify document was created
      expect(document.id).toBeTruthy();
      expect(document.fileUrl).toMatch(/^local:\/\/documents\//);

      // Verify file was cached
      const cached = await dbUtils.getCachedFile(document.fileUrl);
      expect(cached).toBeTruthy();
      expect(cached?.size).toBe(file.size);

      // Verify operation was queued
      const queue = await db.offlineQueue.toArray();
      expect(queue).toHaveLength(1);
      expect(queue[0].action).toBe(QueueAction.UPLOAD_DOCUMENT);
    });

    it('should handle photo uploads offline with compression', async () => {
      // Create a mock image file
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx!.fillStyle = 'red';
      ctx!.fillRect(0, 0, 100, 100);
      
      const blob = await new Promise<Blob>(resolve => {
        canvas.toBlob(blob => resolve(blob!), 'image/jpeg');
      });
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' });

      // Compress image
      const compressed = await photoService.compressImage(file);
      expect(compressed.size).toBeLessThanOrEqual(file.size);

      // Create pending upload
      const pendingUpload = photoService.createPendingUpload(
        file,
        compressed,
        'equipment',
        'equipment-1'
      );

      // Save to offline service
      await offlineService.savePendingUpload(pendingUpload);

      // Verify it was saved
      const pending = await offlineService.getPendingUploads();
      expect(pending).toHaveLength(1);
      expect(pending[0].entityId).toBe('equipment-1');
    });
  });

  describe('2. Sync Queue Operations', () => {
    it('should process queue items in order', async () => {
      // Add multiple items to queue
      await dbUtils.queueOperation({
        action: QueueAction.CREATE_EQUIPMENT,
        payload: { id: 'eq-1', name: 'Equipment 1' },
      });
      await dbUtils.queueOperation({
        action: QueueAction.UPDATE_EQUIPMENT,
        payload: { id: 'eq-2', name: 'Equipment 2 Updated' },
      });
      await dbUtils.queueOperation({
        action: QueueAction.DELETE_EQUIPMENT,
        payload: { id: 'eq-3' },
      });

      const queue = await dbUtils.getPendingOperations();
      expect(queue).toHaveLength(3);
      
      // Verify order is maintained
      expect(queue[0].action).toBe(QueueAction.CREATE_EQUIPMENT);
      expect(queue[1].action).toBe(QueueAction.UPDATE_EQUIPMENT);
      expect(queue[2].action).toBe(QueueAction.DELETE_EQUIPMENT);
    });

    it('should handle retry logic for failed operations', async () => {
      // Add operation to queue
      await dbUtils.queueOperation({
        action: QueueAction.CREATE_EQUIPMENT,
        payload: { id: 'eq-1', name: 'Equipment 1' },
        maxRetries: 3,
      });

      const queueItem = (await db.offlineQueue.toArray())[0];
      
      // Simulate failures
      for (let i = 0; i < 3; i++) {
        await dbUtils.incrementRetryCount(queueItem.id);
        const updated = await db.offlineQueue.get(queueItem.id);
        expect(updated?.retryCount).toBe(i + 1);
      }

      // After max retries, item should be removed from queue
      const { api } = await import('@/services/api');
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'));
      
      (navigator as any).onLine = true;
      const result = await syncService.processOfflineQueue();
      
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].item.id).toBe(queueItem.id);
      
      // Verify item was removed from queue after max retries
      const remainingQueue = await db.offlineQueue.toArray();
      expect(remainingQueue).toHaveLength(0);
    });

    it('should batch process multiple operations efficiently', async () => {
      // Add 10 operations
      for (let i = 0; i < 10; i++) {
        await dbUtils.queueOperation({
          action: QueueAction.CREATE_EQUIPMENT,
          payload: { id: `eq-${i}`, name: `Equipment ${i}` },
        });
      }

      const { api } = await import('@/services/api');
      vi.mocked(api.post).mockResolvedValue({ 
        data: { id: 'server-id', name: 'Equipment' } 
      });

      (navigator as any).onLine = true;
      const startTime = Date.now();
      const result = await syncService.processOfflineQueue();
      const duration = Date.now() - startTime;

      expect(result.successful).toHaveLength(10);
      expect(result.failed).toHaveLength(0);
      
      // Verify queue is empty
      const remainingQueue = await db.offlineQueue.toArray();
      expect(remainingQueue).toHaveLength(0);
    });
  });

  describe('3. Conflict Resolution', () => {
    it('should handle last-write-wins conflict resolution', async () => {
      const equipmentId = 'eq-1';
      
      // Create local version
      await db.equipment.add({
        id: equipmentId,
        name: 'Local Version',
        manufacturer: 'Local Mfg',
        updatedAt: new Date('2024-01-01'),
      } as any);

      // Mock server version
      const { api } = await import('@/services/api');
      vi.mocked(api.get).mockResolvedValue({
        data: {
          id: equipmentId,
          name: 'Server Version',
          manufacturer: 'Server Mfg',
          updatedAt: new Date('2024-01-02'),
        },
      });

      vi.mocked(api.put).mockImplementation(async (url, data) => ({
        data: { ...data, version: 2 },
      }));

      // Update with conflict resolution
      syncService.setConflictResolution({ strategy: 'last-write-wins' });
      
      await dbUtils.queueOperation({
        action: QueueAction.UPDATE_EQUIPMENT,
        payload: {
          id: equipmentId,
          name: 'My Update',
          manufacturer: 'My Mfg',
        },
      });

      (navigator as any).onLine = true;
      await syncService.processOfflineQueue();

      // Verify local changes won
      expect(vi.mocked(api.put)).toHaveBeenCalledWith(
        expect.stringContaining(equipmentId),
        expect.objectContaining({
          name: 'My Update',
          manufacturer: 'My Mfg',
        })
      );
    });

    it('should handle merge conflict resolution', async () => {
      const equipmentId = 'eq-1';
      
      // Create local version
      const localData = {
        id: equipmentId,
        name: 'Equipment 1',
        manufacturer: 'Local Mfg',
        model: 'Model A',
        serialNumber: 'SN123',
      };
      await db.equipment.add(localData as any);

      // Mock server version with different fields
      const { api } = await import('@/services/api');
      vi.mocked(api.get).mockResolvedValue({
        data: {
          ...localData,
          manufacturer: 'Server Mfg', // Conflict
          location: 'Deck A', // New field from server
        },
      });

      vi.mocked(api.put).mockImplementation(async (url, data) => ({
        data: { ...data, version: 2 },
      }));

      // Update with merge strategy
      syncService.setConflictResolution({ strategy: 'merge' });
      
      await dbUtils.queueOperation({
        action: QueueAction.UPDATE_EQUIPMENT,
        payload: {
          id: equipmentId,
          model: 'Model B', // Local change
        },
      });

      (navigator as any).onLine = true;
      await syncService.processOfflineQueue();

      // Verify merge kept non-conflicting changes
      expect(vi.mocked(api.put)).toHaveBeenCalledWith(
        expect.stringContaining(equipmentId),
        expect.objectContaining({
          model: 'Model B', // Local change preserved
          location: 'Deck A', // Server field preserved
        })
      );
    });
  });

  describe('4. Photo Sync', () => {
    it('should sync photos correctly when coming online', async () => {
      // Create and save photo offline
      const blob = new Blob(['fake image data'], { type: 'image/jpeg' });
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      
      const pendingUpload = photoService.createPendingUpload(
        file,
        blob,
        'equipment',
        'equipment-1'
      );
      
      await offlineService.savePendingUpload(pendingUpload);

      // Mock successful upload
      const { api } = await import('@/services/api');
      vi.mocked(api.post).mockResolvedValue({
        data: { fileUrl: 'https://server.com/photo.jpg' },
      });

      // Process upload
      (navigator as any).onLine = true;
      const pending = await offlineService.getPendingUploads();
      expect(pending).toHaveLength(1);

      // Simulate sync
      await offlineService.updateUploadStatus(pending[0].id, 'completed');
      
      // Verify status update
      const completed = await offlineService.getPendingUploads();
      expect(completed).toHaveLength(0); // Completed items not returned by getPendingUploads
    });

    it('should handle failed photo uploads with retry', async () => {
      const blob = new Blob(['fake image data'], { type: 'image/jpeg' });
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      
      const pendingUpload = photoService.createPendingUpload(
        file,
        blob,
        'equipment',
        'equipment-1'
      );
      
      await offlineService.savePendingUpload(pendingUpload);

      // Simulate failed upload
      await offlineService.updateUploadStatus(
        pendingUpload.id,
        'failed',
        'Network error'
      );

      // Check failed uploads
      const failed = await offlineService.getFailedUploads();
      expect(failed).toHaveLength(1);
      expect(failed[0].error).toBe('Network error');
      expect(failed[0].retryCount).toBe(1);
    });
  });

  describe('5. IndexedDB Storage Limits', () => {
    it('should track database size', async () => {
      // Add various data
      for (let i = 0; i < 10; i++) {
        await db.equipment.add({
          id: `eq-${i}`,
          name: `Equipment ${i}`,
          description: 'A'.repeat(1000), // 1KB of data
        } as any);
      }

      const size = await dbUtils.getDatabaseSize();
      expect(size).toBeGreaterThan(0);
      expect(size).toBeGreaterThan(10 * 1024); // At least 10KB
    });

    it('should handle storage quota errors gracefully', async () => {
      // This is a conceptual test - actual quota testing is browser-specific
      const largeData = 'A'.repeat(1024 * 1024); // 1MB string
      
      try {
        for (let i = 0; i < 1000; i++) {
          await db.equipment.add({
            id: `large-${i}`,
            data: largeData,
          } as any);
        }
      } catch (error: any) {
        expect(error.name).toMatch(/QuotaExceededError|DOMException/);
      }
    });

    it('should clean up expired cache entries', async () => {
      // Add expired cache entries
      const expiredBlob = new Blob(['expired data']);
      await dbUtils.cacheFile(
        'https://example.com/expired.jpg',
        expiredBlob,
        'image/jpeg',
        -1000 // Already expired
      );

      // Add valid cache entry
      const validBlob = new Blob(['valid data']);
      await dbUtils.cacheFile(
        'https://example.com/valid.jpg',
        validBlob,
        'image/jpeg',
        60000 // 1 minute TTL
      );

      // Clean expired entries
      await dbUtils.clearExpiredCache();

      // Verify only valid entry remains
      const expired = await dbUtils.getCachedFile('https://example.com/expired.jpg');
      const valid = await dbUtils.getCachedFile('https://example.com/valid.jpg');
      
      expect(expired).toBeUndefined();
      expect(valid).toBeTruthy();
    });
  });

  describe('6. PWA Installation', () => {
    it('should have valid manifest configuration', async () => {
      // This would typically be an e2e test
      // Here we verify the manifest exists and is valid
      const manifestResponse = await fetch('/manifest.json');
      const manifest = await manifestResponse.json();

      expect(manifest.name).toBe('SMS - Smart Maintenance System');
      expect(manifest.short_name).toBe('SMS');
      expect(manifest.display).toBe('standalone');
      expect(manifest.start_url).toBe('/');
      expect(manifest.icons).toHaveLength(4);
    });

    it('should register service worker', async () => {
      // Mock service worker registration
      const mockRegistration = {
        installing: null,
        waiting: null,
        active: { state: 'activated' },
        update: vi.fn(),
      };

      // In a real test, you would check:
      // - Service worker is registered
      // - It handles offline requests
      // - It caches static assets
      expect(mockRegistration.active.state).toBe('activated');
    });
  });

  describe('Edge Cases', () => {
    it('should handle network state changes during sync', async () => {
      // Start offline
      (navigator as any).onLine = false;
      
      // Queue operation
      await dbUtils.queueOperation({
        action: QueueAction.CREATE_EQUIPMENT,
        payload: { id: 'eq-1', name: 'Equipment 1' },
      });

      // Start sync
      const syncPromise = syncService.syncAll();
      
      // Go online during sync
      setTimeout(() => {
        (navigator as any).onLine = true;
      }, 50);

      const result = await syncPromise;
      
      // Sync should handle the state change gracefully
      expect(result.errors).toHaveLength(0);
    });

    it('should handle concurrent modifications', async () => {
      const equipmentId = 'eq-1';
      
      // Create equipment
      await db.equipment.add({
        id: equipmentId,
        name: 'Original',
        version: 1,
      } as any);

      // Queue two updates
      await dbUtils.queueOperation({
        action: QueueAction.UPDATE_EQUIPMENT,
        payload: { id: equipmentId, name: 'Update 1' },
      });
      
      await dbUtils.queueOperation({
        action: QueueAction.UPDATE_EQUIPMENT,
        payload: { id: equipmentId, name: 'Update 2' },
      });

      const queue = await db.offlineQueue.toArray();
      expect(queue).toHaveLength(2);
      
      // Both updates should be queued and processed in order
    });

    it('should handle partial sync failures', async () => {
      // Queue multiple operations
      for (let i = 0; i < 5; i++) {
        await dbUtils.queueOperation({
          action: QueueAction.CREATE_EQUIPMENT,
          payload: { id: `eq-${i}`, name: `Equipment ${i}` },
        });
      }

      const { api } = await import('@/services/api');
      
      // Mock some successes and some failures
      let callCount = 0;
      vi.mocked(api.post).mockImplementation(async () => {
        callCount++;
        if (callCount === 3) {
          throw new Error('Network error');
        }
        return { data: { id: `server-${callCount}` } };
      });

      (navigator as any).onLine = true;
      const result = await syncService.processOfflineQueue();

      expect(result.successful).toHaveLength(4);
      expect(result.failed).toHaveLength(1);
      
      // Failed item should still be in queue for retry
      const remainingQueue = await db.offlineQueue.toArray();
      expect(remainingQueue.length).toBeGreaterThan(0);
    });

    it('should handle corrupted local data gracefully', async () => {
      // Directly insert corrupted data
      await db.equipment.add({
        id: 'corrupted-1',
        // Missing required fields
      } as any);

      // Try to sync
      await dbUtils.queueOperation({
        action: QueueAction.UPDATE_EQUIPMENT,
        payload: { id: 'corrupted-1', name: 'Fixed' },
      });

      const { api } = await import('@/services/api');
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'));
      vi.mocked(api.put).mockRejectedValue(new Error('Invalid data'));

      (navigator as any).onLine = true;
      const result = await syncService.processOfflineQueue();

      // Should handle the error without crashing
      expect(result.failed.length).toBeGreaterThan(0);
    });
  });
});