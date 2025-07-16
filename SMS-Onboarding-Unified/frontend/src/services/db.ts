import Dexie, { Table } from 'dexie';
import { 
  Equipment, 
  Vessel, 
  Company, 
  SparePart, 
  Documentation,
  OfflineQueue,
  OnboardingSession,
  EquipmentCategory
} from '@/types';

// Define the database schema
export interface DBSchema {
  companies: Company;
  vessels: Vessel;
  equipment: Equipment;
  spareParts: SparePart;
  documentation: Documentation;
  offlineQueue: OfflineQueue;
  onboardingSessions: OnboardingSession;
  categories: EquipmentCategory;
  syncMetadata: SyncMetadata;
  fileCache: FileCache;
}

export interface SyncMetadata {
  id: string;
  entityType: keyof DBSchema;
  entityId: string;
  lastSyncedAt: Date;
  version: number;
  checksum?: string;
}

export interface FileCache {
  id: string;
  url: string;
  blob: Blob;
  mimeType: string;
  size: number;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt?: Date;
}

class SMSDatabase extends Dexie {
  // Declare tables
  companies!: Table<Company>;
  vessels!: Table<Vessel>;
  equipment!: Table<Equipment>;
  spareParts!: Table<SparePart>;
  documentation!: Table<Documentation>;
  offlineQueue!: Table<OfflineQueue>;
  onboardingSessions!: Table<OnboardingSession>;
  categories!: Table<EquipmentCategory>;
  syncMetadata!: Table<SyncMetadata>;
  fileCache!: Table<FileCache>;

  constructor() {
    super('SMSOnboardingDB');
    
    // Define schema version and indexes
    this.version(1).stores({
      companies: 'id, name, imoNumber',
      vessels: 'id, companyId, name, imoNumber, onboardingStatus',
      equipment: 'id, vesselId, categoryId, subcategoryId, name, serialNumber, status',
      spareParts: 'id, equipmentId, partNumber, name',
      documentation: 'id, type, title, fileUrl',
      offlineQueue: 'id, action, createdAt',
      onboardingSessions: 'id, tokenId, userId, vesselId',
      categories: 'id, code, name',
      syncMetadata: 'id, [entityType+entityId], lastSyncedAt',
      fileCache: 'id, url, createdAt, expiresAt'
    });
  }
}

// Create database instance
export const db = new SMSDatabase();

// Database utility functions
export const dbUtils = {
  // Clear all data
  async clearAll(): Promise<void> {
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map(table => table.clear()));
    });
  },

  // Clear expired cache entries
  async clearExpiredCache(): Promise<void> {
    const now = new Date();
    await db.fileCache.where('expiresAt').below(now).delete();
  },

  // Get database size
  async getDatabaseSize(): Promise<number> {
    let totalSize = 0;
    
    await db.transaction('r', db.tables, async () => {
      for (const table of db.tables) {
        const count = await table.count();
        // Rough estimate: 1KB per record
        totalSize += count * 1024;
      }
    });

    // Add file cache size
    const files = await db.fileCache.toArray();
    files.forEach(file => {
      totalSize += file.size;
    });

    return totalSize;
  },

  // Export database for debugging
  async exportDatabase(): Promise<any> {
    const data: any = {};
    
    await db.transaction('r', db.tables, async () => {
      for (const table of db.tables) {
        data[table.name] = await table.toArray();
      }
    });

    return data;
  },

  // Import data (for testing/migration)
  async importDatabase(data: any): Promise<void> {
    await db.transaction('rw', db.tables, async () => {
      for (const tableName in data) {
        const table = db.table(tableName);
        if (table) {
          await table.clear();
          await table.bulkAdd(data[tableName]);
        }
      }
    });
  },

  // Check if entity exists locally
  async entityExists(entityType: keyof DBSchema, entityId: string): Promise<boolean> {
    const table = db.table(entityType);
    const count = await table.where('id').equals(entityId).count();
    return count > 0;
  },

  // Get sync metadata for entity
  async getSyncMetadata(entityType: keyof DBSchema, entityId: string): Promise<SyncMetadata | undefined> {
    return await db.syncMetadata
      .where(['entityType', 'entityId'])
      .equals([entityType, entityId])
      .first();
  },

  // Update sync metadata
  async updateSyncMetadata(
    entityType: keyof DBSchema,
    entityId: string,
    version: number,
    checksum?: string
  ): Promise<void> {
    const id = `${entityType}_${entityId}`;
    await db.syncMetadata.put({
      id,
      entityType,
      entityId,
      lastSyncedAt: new Date(),
      version,
      checksum
    });
  },

  // Cache file locally
  async cacheFile(url: string, blob: Blob, mimeType: string, ttl?: number): Promise<string> {
    const id = btoa(url).replace(/[^a-zA-Z0-9]/g, '');
    const now = new Date();
    const expiresAt = ttl ? new Date(now.getTime() + ttl) : undefined;

    await db.fileCache.put({
      id,
      url,
      blob,
      mimeType,
      size: blob.size,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt
    });

    return id;
  },

  // Get cached file
  async getCachedFile(url: string): Promise<FileCache | undefined> {
    const id = btoa(url).replace(/[^a-zA-Z0-9]/g, '');
    const file = await db.fileCache.get(id);
    
    if (file) {
      // Update last accessed time
      await db.fileCache.update(id, { lastAccessedAt: new Date() });
      
      // Check if expired
      if (file.expiresAt && file.expiresAt < new Date()) {
        await db.fileCache.delete(id);
        return undefined;
      }
    }
    
    return file;
  },

  // Get all pending offline operations
  async getPendingOperations(): Promise<OfflineQueue[]> {
    return await db.offlineQueue.orderBy('createdAt').toArray();
  },

  // Add operation to offline queue
  async queueOperation(operation: Omit<OfflineQueue, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
    await db.offlineQueue.add({
      ...operation,
      id: Date.now().toString(),
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: operation.maxRetries || 3
    });
  },

  // Remove operation from queue
  async removeFromQueue(id: string): Promise<void> {
    await db.offlineQueue.delete(id);
  },

  // Increment retry count
  async incrementRetryCount(id: string): Promise<void> {
    const item = await db.offlineQueue.get(id);
    if (item) {
      await db.offlineQueue.update(id, { retryCount: item.retryCount + 1 });
    }
  }
};

// Initialize database on import
db.open().catch(err => {
  console.error('Failed to open database:', err);
});

// Export database instance and utilities
export default db;