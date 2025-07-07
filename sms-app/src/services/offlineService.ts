// Offline Service for SMS Maintenance Portal
// Handles service worker registration, offline detection, and sync management

interface OfflineQueueItem {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
}

class OfflineService {
  private isOnline: boolean = navigator.onLine;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private db: IDBDatabase | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.initializeOfflineDetection();
    this.initializeServiceWorker();
    this.initializeDatabase();
  }

  // Initialize offline detection
  private initializeOfflineDetection() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
      this.attemptSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
    });
  }

  // Initialize service worker
  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        this.serviceWorkerRegistration = registration;
        console.log('Service Worker registered successfully');

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                this.emit('sw-updated');
              }
            });
          }
        });

        // Request periodic sync if available
        if ('periodicSync' in registration) {
          try {
            await (registration as any).periodicSync.register('sms-content-sync', {
              minInterval: 24 * 60 * 60 * 1000 // 24 hours
            });
          } catch (error) {
            console.log('Periodic sync not available:', error);
          }
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Initialize IndexedDB
  private async initializeDatabase() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('sms_offline', 1);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Create offline queue store
        if (!db.objectStoreNames.contains('offline_queue')) {
          const store = db.createObjectStore('offline_queue', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('timestamp', 'timestamp');
        }

        // Create cached data store
        if (!db.objectStoreNames.contains('cached_data')) {
          const store = db.createObjectStore('cached_data', {
            keyPath: 'key'
          });
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  // Handle messages from service worker
  private handleServiceWorkerMessage(data: any) {
    switch (data.type) {
      case 'sync-success':
        this.emit('sync-success', data.data);
        break;
      case 'sync-failed':
        this.emit('sync-failed', data.data);
        break;
      default:
        console.log('Unknown service worker message:', data);
    }
  }

  // Public methods

  // Check if currently online
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Register event listener
  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  // Emit event
  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Queue request for offline sync
  public async queueRequest(request: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
  }): Promise<void> {
    if (!this.db) {
      throw new Error('Offline database not initialized');
    }

    const tx = this.db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');

    const queueItem: OfflineQueueItem = {
      url: request.url,
      method: request.method,
      headers: request.headers || {},
      body: typeof request.body === 'string' ? request.body : JSON.stringify(request.body),
      timestamp: Date.now()
    };

    await new Promise<void>((resolve, reject) => {
      const addRequest = store.add(queueItem);
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    });

    // Trigger sync
    this.attemptSync();
  }

  // Get offline queue
  public async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    if (!this.db) {
      return [];
    }

    const tx = this.db.transaction('offline_queue', 'readonly');
    const store = tx.objectStore('offline_queue');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear offline queue
  public async clearOfflineQueue(): Promise<void> {
    if (!this.db) {
      return;
    }

    const tx = this.db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Attempt to sync offline data
  public async attemptSync(): Promise<void> {
    if (!this.isOnline || !this.serviceWorkerRegistration) {
      return;
    }

    try {
      // Trigger background sync
      if ('sync' in this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.sync.register('sms-sync-data');
        console.log('Background sync triggered');
      } else {
        // Fallback: manually sync
        await this.manualSync();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  // Manual sync fallback
  private async manualSync(): Promise<void> {
    const queue = await this.getOfflineQueue();
    
    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.method !== 'GET' ? item.body : undefined
        });

        if (response.ok) {
          // Remove from queue
          await this.removeFromQueue(item.id!);
          this.emit('sync-success', { url: item.url, method: item.method });
        }
      } catch (error) {
        console.error('Failed to sync request:', item.url, error);
      }
    }
  }

  // Remove item from queue
  private async removeFromQueue(id: number): Promise<void> {
    if (!this.db) {
      return;
    }

    const tx = this.db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cache data for offline use
  public async cacheData(key: string, data: any): Promise<void> {
    if (!this.db) {
      throw new Error('Offline database not initialized');
    }

    const tx = this.db.transaction('cached_data', 'readwrite');
    const store = tx.objectStore('cached_data');

    const cacheItem = {
      key,
      data,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cacheItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached data
  public async getCachedData(key: string): Promise<any> {
    if (!this.db) {
      return null;
    }

    const tx = this.db.transaction('cached_data', 'readonly');
    const store = tx.objectStore('cached_data');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Clear old cached data
  public async clearOldCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) {
      return;
    }

    const cutoff = Date.now() - maxAge;
    const tx = this.db.transaction('cached_data', 'readwrite');
    const store = tx.objectStore('cached_data');
    const index = store.index('timestamp');

    const range = IDBKeyRange.upperBound(cutoff);
    const request = index.openCursor(range);

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
  }

  // Precache important data
  public async precacheData(): Promise<void> {
    const endpoints = [
      '/api/equipment',
      '/api/vessels',
      '/api/faults',
      '/api/users/profile'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          await this.cacheData(endpoint, data);
        }
      } catch (error) {
        console.log('Failed to precache:', endpoint);
      }
    }
  }

  // Update service worker
  public async updateServiceWorker(): Promise<void> {
    if (this.serviceWorkerRegistration) {
      await this.serviceWorkerRegistration.update();
    }
  }

  // Skip waiting service worker
  public async skipWaiting(): Promise<void> {
    if (this.serviceWorkerRegistration?.waiting) {
      this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
}

// Export singleton instance
export const offlineService = new OfflineService();