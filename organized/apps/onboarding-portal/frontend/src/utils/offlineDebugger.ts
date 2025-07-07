import { db, dbUtils } from '@/services/db';
import { syncService } from '@/services/sync';
import { offlineDataService } from '@/services/offlineData';
import { offlineService } from '@/features/tech/services/offlineService';

interface OfflineStats {
  database: {
    totalSize: number;
    tables: {
      name: string;
      count: number;
      estimatedSize: number;
    }[];
  };
  syncQueue: {
    pending: number;
    failed: number;
    operations: any[];
  };
  cache: {
    fileCount: number;
    totalSize: number;
    expired: number;
  };
  network: {
    online: boolean;
    canSync: boolean;
  };
  storage: {
    usage: number;
    quota: number;
    percentage: number;
  };
}

class OfflineDebugger {
  // Get comprehensive offline statistics
  async getStats(): Promise<OfflineStats> {
    const [dbSize, syncStats, cacheStats, networkStatus, storageInfo] = await Promise.all([
      this.getDatabaseStats(),
      this.getSyncQueueStats(),
      this.getCacheStats(),
      this.getNetworkStatus(),
      this.getStorageInfo(),
    ]);

    return {
      database: dbSize,
      syncQueue: syncStats,
      cache: cacheStats,
      network: networkStatus,
      storage: storageInfo,
    };
  }

  // Get database statistics
  private async getDatabaseStats() {
    const tables = [
      'companies', 'vessels', 'equipment', 'spareParts', 
      'documentation', 'offlineQueue', 'onboardingSessions', 
      'categories', 'syncMetadata', 'fileCache'
    ];

    const tableStats = await Promise.all(
      tables.map(async (tableName) => {
        const table = db.table(tableName);
        const count = await table.count();
        const estimatedSize = count * 1024; // Rough estimate
        return { name: tableName, count, estimatedSize };
      })
    );

    const totalSize = await dbUtils.getDatabaseSize();

    return {
      totalSize,
      tables: tableStats,
    };
  }

  // Get sync queue statistics
  private async getSyncQueueStats() {
    const queue = await db.offlineQueue.toArray();
    const pending = queue.filter(item => item.retryCount < item.maxRetries);
    const failed = queue.filter(item => item.retryCount >= item.maxRetries);

    return {
      pending: pending.length,
      failed: failed.length,
      operations: queue.map(item => ({
        id: item.id,
        action: item.action,
        retryCount: item.retryCount,
        maxRetries: item.maxRetries,
        createdAt: item.createdAt,
      })),
    };
  }

  // Get cache statistics
  private async getCacheStats() {
    const files = await db.fileCache.toArray();
    const now = new Date();
    const expired = files.filter(f => f.expiresAt && f.expiresAt < now);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return {
      fileCount: files.length,
      totalSize,
      expired: expired.length,
    };
  }

  // Get network status
  private async getNetworkStatus() {
    const online = navigator.onLine;
    const canSync = await syncService.canSync();

    return {
      online,
      canSync,
    };
  }

  // Get storage information
  private async getStorageInfo(): Promise<{ usage: number; quota: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return {
        usage,
        quota,
        percentage,
      };
    }

    // Fallback for browsers without storage API
    return {
      usage: 0,
      quota: 0,
      percentage: 0,
    };
  }

  // Monitor sync progress
  async monitorSync(callback: (progress: any) => void) {
    const interval = setInterval(async () => {
      const progress = syncService.getSyncProgress();
      const stats = await this.getSyncQueueStats();
      
      callback({
        ...progress,
        total: stats.pending + stats.failed,
        completed: 0, // Would need to track this in sync service
      });

      if (!progress.processing && stats.pending === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }

  // Export all offline data
  async exportOfflineData() {
    const data = await dbUtils.exportDatabase();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offline-data-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Clear specific types of data
  async clearCache() {
    await dbUtils.clearExpiredCache();
    console.log('Expired cache cleared');
  }

  async clearSyncQueue() {
    await db.offlineQueue.clear();
    console.log('Sync queue cleared');
  }

  async clearAllData() {
    if (confirm('This will delete all offline data. Are you sure?')) {
      await dbUtils.clearAll();
      await offlineService.clearAll();
      console.log('All offline data cleared');
    }
  }

  // Simulate offline scenarios
  async simulateOffline() {
    // Override navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    
    // Intercept fetch to simulate network errors
    const originalFetch = window.fetch;
    (window as any).fetch = () => Promise.reject(new Error('Simulated offline'));
    
    console.log('Offline mode simulated');
    
    return () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.fetch = originalFetch;
      console.log('Online mode restored');
    };
  }

  // Test conflict scenarios
  async createConflict(equipmentId: string) {
    // Create a local change
    await offlineDataService.updateEquipment(equipmentId, {
      name: 'Local Change ' + Date.now(),
    });

    console.log('Conflict scenario created. Sync to see conflict resolution.');
  }

  // Visualize sync queue
  async visualizeSyncQueue() {
    const queue = await db.offlineQueue.toArray();
    console.group('Sync Queue Visualization');
    
    queue.forEach((item, index) => {
      console.group(`Operation ${index + 1}: ${item.action}`);
      console.log('ID:', item.id);
      console.log('Created:', item.createdAt);
      console.log('Retries:', `${item.retryCount}/${item.maxRetries}`);
      console.log('Payload:', item.payload);
      console.groupEnd();
    });
    
    console.groupEnd();
  }

  // Performance profiling
  async profileOfflineOperation(operation: () => Promise<any>) {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    try {
      const result = await operation();
      
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      console.group('Performance Profile');
      console.log('Duration:', (endTime - startTime).toFixed(2), 'ms');
      console.log('Memory delta:', ((endMemory - startMemory) / 1024 / 1024).toFixed(2), 'MB');
      console.groupEnd();
      
      return result;
    } catch (error) {
      console.error('Operation failed:', error);
      throw error;
    }
  }

  // Test storage limits
  async testStorageLimits() {
    console.log('Testing storage limits...');
    
    const chunkSize = 1024 * 1024; // 1MB chunks
    let totalWritten = 0;
    
    try {
      while (true) {
        const data = new Uint8Array(chunkSize);
        const blob = new Blob([data]);
        
        await dbUtils.cacheFile(
          `test-${totalWritten}`,
          blob,
          'application/octet-stream'
        );
        
        totalWritten += chunkSize;
        
        if (totalWritten % (10 * chunkSize) === 0) {
          console.log(`Written ${totalWritten / 1024 / 1024}MB`);
        }
      }
    } catch (error: any) {
      console.log(`Storage limit reached at ${totalWritten / 1024 / 1024}MB`);
      console.log('Error:', error.name, error.message);
      
      // Clean up test data
      const files = await db.fileCache.where('url').startsWith('test-').toArray();
      for (const file of files) {
        await db.fileCache.delete(file.id);
      }
    }
  }
}

// Create global instance for debugging
export const offlineDebugger = new OfflineDebugger();

// Expose to window for console access in development
if (process.env.NODE_ENV === 'development') {
  (window as any).offlineDebugger = offlineDebugger;
  console.log('Offline debugger available at window.offlineDebugger');
}