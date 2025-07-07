import React, { useEffect, useState } from 'react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { offlineService } from '../services/offlineService';
import { syncService } from '../services/syncService';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';

export const SyncStatus: React.FC = () => {
  const isOffline = useOfflineStatus();
  const [syncStatus, setSyncStatus] = useState({
    pendingItems: 0,
    isSyncing: false,
    lastSyncTime: null as Date | null,
  });

  useEffect(() => {
    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkSyncStatus = async () => {
    const unsyncedData = await offlineService.getUnsyncedData();
    const pendingUploads = await offlineService.getPendingUploads();
    const { isSyncing, lastSyncTime } = syncService.getSyncStatus();
    
    setSyncStatus({
      pendingItems: unsyncedData.length + pendingUploads.length,
      isSyncing,
      lastSyncTime,
    });
  };

  const triggerSync = async () => {
    if (isOffline) return;
    
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    
    try {
      const results = await syncService.syncAll();
      console.log('Sync results:', results);
      await checkSyncStatus();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  if (isOffline) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
        <CloudOff className="w-4 h-4" />
        <span className="text-sm font-medium">Offline Mode</span>
        {syncStatus.pendingItems > 0 && (
          <span className="text-xs">({syncStatus.pendingItems} pending)</span>
        )}
      </div>
    );
  }

  if (syncStatus.isSyncing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">Syncing...</span>
      </div>
    );
  }

  if (syncStatus.pendingItems > 0) {
    return (
      <button
        onClick={triggerSync}
        className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors"
      >
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-medium">{syncStatus.pendingItems} items to sync</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
      <Cloud className="w-4 h-4" />
      <span className="text-sm font-medium">All synced</span>
      <Check className="w-3 h-3" />
    </div>
  );
};