import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { syncData, processOfflineQueue } from '@/store/slices/syncSlice';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { syncService } from '@/services/sync';
import { 
  WifiIcon, 
  WifiOffIcon, 
  CloudIcon, 
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  className,
  showDetails = false 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const isOffline = useOfflineStatus();
  const { status, queue, isProcessingQueue } = useSelector((state: RootState) => state.sync);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Update last sync time
  useEffect(() => {
    if (status.lastSyncAt) {
      const updateTime = () => {
        const now = new Date();
        const lastSync = new Date(status.lastSyncAt!);
        const diff = now.getTime() - lastSync.getTime();
        
        if (diff < 60000) {
          setLastSyncTime('Just now');
        } else if (diff < 3600000) {
          const minutes = Math.floor(diff / 60000);
          setLastSyncTime(`${minutes}m ago`);
        } else if (diff < 86400000) {
          const hours = Math.floor(diff / 3600000);
          setLastSyncTime(`${hours}h ago`);
        } else {
          const days = Math.floor(diff / 86400000);
          setLastSyncTime(`${days}d ago`);
        }
      };

      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }
  }, [status.lastSyncAt]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOffline && queue.length > 0) {
      dispatch(processOfflineQueue());
    }
  }, [isOffline, queue.length, dispatch]);

  // Periodic sync check
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isOffline && await syncService.canSync()) {
        dispatch(syncData());
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [isOffline, dispatch]);

  const handleSync = async () => {
    if (!isOffline) {
      dispatch(syncData());
    }
  };

  const getSyncStatus = () => {
    if (isOffline) {
      return {
        icon: <WifiOffIcon className="w-4 h-4" />,
        text: 'Offline',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        description: 'Changes saved locally'
      };
    }

    if (status.isSyncing || isProcessingQueue) {
      return {
        icon: <RefreshCwIcon className="w-4 h-4 animate-spin" />,
        text: 'Syncing',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        description: 'Uploading changes...'
      };
    }

    if (status.syncErrors.length > 0) {
      return {
        icon: <AlertCircleIcon className="w-4 h-4" />,
        text: 'Sync Error',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        description: `${status.syncErrors.length} errors`
      };
    }

    if (status.pendingChanges > 0) {
      return {
        icon: <CloudIcon className="w-4 h-4" />,
        text: 'Pending',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        description: `${status.pendingChanges} changes pending`
      };
    }

    return {
      icon: <CheckCircleIcon className="w-4 h-4" />,
      text: 'Synced',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: lastSyncTime ? `Last sync: ${lastSyncTime}` : 'All changes saved'
    };
  };

  const syncStatus = getSyncStatus();

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => showDetails && setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
          syncStatus.bgColor,
          syncStatus.color,
          showDetails && 'cursor-pointer hover:opacity-80'
        )}
        disabled={!showDetails}
      >
        <span className="flex items-center gap-1.5">
          {syncStatus.icon}
          <span className="text-sm font-medium">{syncStatus.text}</span>
        </span>
        {showDetails && (
          <span className="text-xs opacity-75">{syncStatus.description}</span>
        )}
      </button>

      {/* Expanded Details */}
      {showDetails && isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Sync Status</h3>
              <button
                onClick={handleSync}
                disabled={isOffline || status.isSyncing || isProcessingQueue}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded transition-colors',
                  isOffline || status.isSyncing || isProcessingQueue
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                {status.isSyncing || isProcessingQueue ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            {/* Connection Status */}
            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <span className="text-sm text-gray-600">Connection</span>
              <span className={cn(
                'flex items-center gap-1.5 text-sm font-medium',
                isOffline ? 'text-gray-500' : 'text-green-600'
              )}>
                {isOffline ? <WifiOffIcon className="w-4 h-4" /> : <WifiIcon className="w-4 h-4" />}
                {isOffline ? 'Offline' : 'Online'}
              </span>
            </div>

            {/* Pending Changes */}
            {status.pendingChanges > 0 && (
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Pending Changes</span>
                <span className="text-sm font-medium text-yellow-600">
                  {status.pendingChanges}
                </span>
              </div>
            )}

            {/* Last Sync */}
            {status.lastSyncAt && (
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Last Sync</span>
                <span className="text-sm text-gray-900">{lastSyncTime}</span>
              </div>
            )}

            {/* Sync Errors */}
            {status.syncErrors.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <h4 className="text-sm font-medium text-red-600 mb-2">
                  Sync Errors ({status.syncErrors.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {status.syncErrors.slice(0, 5).map((error) => (
                    <div key={error.id} className="text-xs text-gray-600">
                      <span className="font-medium">{error.entityType}:</span> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Mode Info */}
            {isOffline && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  You're working offline. All changes are being saved locally and will sync automatically when you're back online.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};