import { OfflineData, PendingUpload } from '../types';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  offlineData: {
    key: string;
    value: OfflineData;
    indexes: { 'by-synced': boolean; 'by-type': string };
  };
  pendingUploads: {
    key: string;
    value: PendingUpload;
    indexes: { 'by-status': string; 'by-entity': string };
  };
  cachedData: {
    key: string;
    value: {
      id: string;
      type: string;
      data: any;
      timestamp: Date;
      expiresAt: Date;
    };
  };
}

class OfflineService {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private readonly DB_NAME = 'sms-technician-offline';
  private readonly DB_VERSION = 1;

  async init() {
    if (!this.db) {
      this.db = await openDB<OfflineDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Offline data store
          if (!db.objectStoreNames.contains('offlineData')) {
            const offlineStore = db.createObjectStore('offlineData', {
              keyPath: 'id',
            });
            offlineStore.createIndex('by-synced', 'synced');
            offlineStore.createIndex('by-type', 'type');
          }

          // Pending uploads store
          if (!db.objectStoreNames.contains('pendingUploads')) {
            const uploadStore = db.createObjectStore('pendingUploads', {
              keyPath: 'id',
            });
            uploadStore.createIndex('by-status', 'status');
            uploadStore.createIndex('by-entity', 'entityType');
          }

          // Cached data store
          if (!db.objectStoreNames.contains('cachedData')) {
            db.createObjectStore('cachedData', {
              keyPath: 'id',
            });
          }
        },
      });
    }
    return this.db;
  }

  // Offline data operations
  async saveOfflineData(data: OfflineData): Promise<void> {
    const db = await this.init();
    await db.put('offlineData', data);
  }

  async getUnsyncedData(): Promise<OfflineData[]> {
    const db = await this.init();
    const index = db.transaction('offlineData').store.index('by-synced');
    return await index.getAll(false);
  }

  async markDataAsSynced(id: string): Promise<void> {
    const db = await this.init();
    const tx = db.transaction('offlineData', 'readwrite');
    const data = await tx.store.get(id);
    if (data) {
      data.synced = true;
      await tx.store.put(data);
    }
    await tx.done;
  }

  async deleteOfflineData(id: string): Promise<void> {
    const db = await this.init();
    await db.delete('offlineData', id);
  }

  // Pending uploads operations
  async savePendingUpload(upload: PendingUpload): Promise<void> {
    const db = await this.init();
    await db.put('pendingUploads', upload);
  }

  async getPendingUploads(): Promise<PendingUpload[]> {
    const db = await this.init();
    const index = db.transaction('pendingUploads').store.index('by-status');
    return await index.getAll('pending');
  }

  async updateUploadStatus(
    id: string,
    status: PendingUpload['status'],
    error?: string
  ): Promise<void> {
    const db = await this.init();
    const tx = db.transaction('pendingUploads', 'readwrite');
    const upload = await tx.store.get(id);
    if (upload) {
      upload.status = status;
      if (error) upload.error = error;
      if (status === 'failed') upload.retryCount++;
      await tx.store.put(upload);
    }
    await tx.done;
  }

  async getFailedUploads(): Promise<PendingUpload[]> {
    const db = await this.init();
    const index = db.transaction('pendingUploads').store.index('by-status');
    return await index.getAll('failed');
  }

  // Cache operations
  async cacheData(type: string, id: string, data: any, ttl: number = 3600000): Promise<void> {
    const db = await this.init();
    await db.put('cachedData', {
      id: `${type}-${id}`,
      type,
      data,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + ttl),
    });
  }

  async getCachedData(type: string, id: string): Promise<any | null> {
    const db = await this.init();
    const cached = await db.get('cachedData', `${type}-${id}`);
    if (cached && cached.expiresAt > new Date()) {
      return cached.data;
    }
    return null;
  }

  async clearExpiredCache(): Promise<void> {
    const db = await this.init();
    const tx = db.transaction('cachedData', 'readwrite');
    const all = await tx.store.getAll();
    const now = new Date();
    
    for (const item of all) {
      if (item.expiresAt < now) {
        await tx.store.delete(item.id);
      }
    }
    await tx.done;
  }

  // Clear all offline data
  async clearAll(): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(['offlineData', 'pendingUploads', 'cachedData'], 'readwrite');
    await Promise.all([
      tx.objectStore('offlineData').clear(),
      tx.objectStore('pendingUploads').clear(),
      tx.objectStore('cachedData').clear(),
    ]);
    await tx.done;
  }
}

export const offlineService = new OfflineService();