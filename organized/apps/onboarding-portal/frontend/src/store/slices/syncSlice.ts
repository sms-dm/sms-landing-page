import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SyncStatus, SyncError, OfflineQueue } from '@/types';
import { syncService } from '@/services/sync';

interface SyncState {
  status: SyncStatus;
  queue: OfflineQueue[];
  isProcessingQueue: boolean;
}

const initialState: SyncState = {
  status: {
    lastSyncAt: undefined,
    pendingChanges: 0,
    isSyncing: false,
    syncErrors: [],
  },
  queue: [],
  isProcessingQueue: false,
};

export const syncData = createAsyncThunk(
  'sync/syncData',
  async () => {
    const result = await syncService.syncAll();
    return result;
  }
);

export const processOfflineQueue = createAsyncThunk(
  'sync/processQueue',
  async (_, { getState }) => {
    const state = getState() as { sync: SyncState };
    const queue = state.sync.queue;
    
    const results = await syncService.processQueue(queue);
    return results;
  }
);

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    addToQueue: (state, action: PayloadAction<Omit<OfflineQueue, 'id' | 'createdAt' | 'retryCount'>>) => {
      const queueItem: OfflineQueue = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date(),
        retryCount: 0,
      };
      state.queue.push(queueItem);
      state.status.pendingChanges = state.queue.length;
    },
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter((item) => item.id !== action.payload);
      state.status.pendingChanges = state.queue.length;
    },
    clearQueue: (state) => {
      state.queue = [];
      state.status.pendingChanges = 0;
    },
    addSyncError: (state, action: PayloadAction<Omit<SyncError, 'id' | 'occurredAt'>>) => {
      const error: SyncError = {
        ...action.payload,
        id: Date.now().toString(),
        occurredAt: new Date(),
      };
      state.status.syncErrors.push(error);
    },
    clearSyncErrors: (state) => {
      state.status.syncErrors = [];
    },
    updateSyncStatus: (state, action: PayloadAction<Partial<SyncStatus>>) => {
      state.status = { ...state.status, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // Sync data
    builder
      .addCase(syncData.pending, (state) => {
        state.status.isSyncing = true;
      })
      .addCase(syncData.fulfilled, (state, action) => {
        state.status.isSyncing = false;
        state.status.lastSyncAt = new Date();
        state.status.syncErrors = action.payload.errors || [];
      })
      .addCase(syncData.rejected, (state, action) => {
        state.status.isSyncing = false;
        const error: SyncError = {
          id: Date.now().toString(),
          entityType: 'sync',
          entityId: 'all',
          operation: 'create',
          error: action.error.message || 'Sync failed',
          occurredAt: new Date(),
          retryCount: 0,
        };
        state.status.syncErrors.push(error);
      });
    
    // Process offline queue
    builder
      .addCase(processOfflineQueue.pending, (state) => {
        state.isProcessingQueue = true;
      })
      .addCase(processOfflineQueue.fulfilled, (state, action) => {
        state.isProcessingQueue = false;
        // Remove successfully processed items from queue
        const successfulIds = action.payload.successful.map((item) => item.id);
        state.queue = state.queue.filter((item) => !successfulIds.includes(item.id));
        state.status.pendingChanges = state.queue.length;
        
        // Add failed items as sync errors
        action.payload.failed.forEach((failure) => {
          const error: SyncError = {
            id: Date.now().toString(),
            entityType: failure.item.action,
            entityId: failure.item.id,
            operation: 'create',
            error: failure.error,
            occurredAt: new Date(),
            retryCount: failure.item.retryCount,
          };
          state.status.syncErrors.push(error);
        });
      })
      .addCase(processOfflineQueue.rejected, (state) => {
        state.isProcessingQueue = false;
      });
  },
});

export const {
  addToQueue,
  removeFromQueue,
  clearQueue,
  addSyncError,
  clearSyncErrors,
  updateSyncStatus,
} = syncSlice.actions;

export default syncSlice.reducer;