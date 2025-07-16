import { useState, useEffect, useCallback } from 'react';
import { offlineService } from '../services/offlineService';
import { message } from 'antd';

interface UseOfflineReturn {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  offlineQueue: any[];
  syncInProgress: boolean;
  queueRequest: (request: any) => Promise<void>;
  retrySync: () => Promise<void>;
  clearQueue: () => Promise<void>;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(offlineService.getOnlineStatus());
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Update queue
  const updateQueue = useCallback(async () => {
    const queue = await offlineService.getOfflineQueue();
    setOfflineQueue(queue);
  }, []);

  useEffect(() => {
    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsServiceWorkerReady(true);
      });
    }

    // Subscribe to offline events
    const unsubscribeOnline = offlineService.on('online', () => {
      setIsOnline(true);
      message.success('You are back online! Syncing data...');
    });

    const unsubscribeOffline = offlineService.on('offline', () => {
      setIsOnline(false);
      message.warning('You are offline. Changes will be synced when connection is restored.');
    });

    const unsubscribeSyncSuccess = offlineService.on('sync-success', (data: any) => {
      message.success(`Synced: ${data.method} ${data.url}`);
      updateQueue();
    });

    const unsubscribeSyncFailed = offlineService.on('sync-failed', (data: any) => {
      message.error(`Failed to sync: ${data.method} ${data.url}`);
    });

    const unsubscribeSwUpdated = offlineService.on('sw-updated', () => {
      message.info('App update available. Refresh to get the latest version.');
    });

    // Initial queue load
    updateQueue();

    // Precache important data
    offlineService.precacheData();

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
      unsubscribeSyncSuccess();
      unsubscribeSyncFailed();
      unsubscribeSwUpdated();
    };
  }, [updateQueue]);

  // Queue a request
  const queueRequest = useCallback(async (request: any) => {
    await offlineService.queueRequest(request);
    await updateQueue();
    message.info('Request queued for sync');
  }, [updateQueue]);

  // Retry sync
  const retrySync = useCallback(async () => {
    setSyncInProgress(true);
    try {
      await offlineService.attemptSync();
      await updateQueue();
    } finally {
      setSyncInProgress(false);
    }
  }, [updateQueue]);

  // Clear queue
  const clearQueue = useCallback(async () => {
    await offlineService.clearOfflineQueue();
    await updateQueue();
    message.success('Offline queue cleared');
  }, [updateQueue]);

  return {
    isOnline,
    isServiceWorkerReady,
    offlineQueue,
    syncInProgress,
    queueRequest,
    retrySync,
    clearQueue
  };
}

// Hook for offline-aware API calls
export function useOfflineApi() {
  const { isOnline, queueRequest } = useOffline();

  const offlineApi = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    // Check if this is a request that should be queued when offline
    const shouldQueue = !isOnline && 
      options.method && 
      ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method);

    if (shouldQueue) {
      // Queue the request
      await queueRequest({
        url,
        method: options.method!,
        headers: options.headers as Record<string, string>,
        body: options.body
      });

      // Return a queued response
      return new Response(
        JSON.stringify({
          success: true,
          queued: true,
          message: 'Request queued for offline sync'
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Try the request normally
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      // If it's a GET request and we're offline, try to get cached data
      if (!isOnline && (!options.method || options.method === 'GET')) {
        const cachedData = await offlineService.getCachedData(url);
        if (cachedData) {
          return new Response(
            JSON.stringify(cachedData),
            {
              status: 200,
              headers: { 
                'Content-Type': 'application/json',
                'X-From-Cache': 'true'
              }
            }
          );
        }
      }
      
      throw error;
    }
  }, [isOnline, queueRequest]);

  return offlineApi;
}