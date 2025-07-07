# Offline Synchronization Guide

## Overview

The SMS Onboarding Portal includes comprehensive offline synchronization capabilities, allowing users to continue working without an internet connection. All data is automatically synced when connectivity is restored.

## Architecture

### Key Components

1. **IndexedDB Storage** (`/frontend/src/services/db.ts`)
   - Local database using Dexie.js
   - Stores all entities: equipment, vessels, documents, etc.
   - Includes sync metadata and file cache

2. **Service Worker** (`/public/sw.js`)
   - Handles offline caching strategies
   - Provides offline fallback pages
   - Manages background sync

3. **Sync Service** (`/frontend/src/services/sync.ts`)
   - Manages offline queue processing
   - Handles conflict resolution (last-write-wins)
   - Orchestrates data synchronization

4. **Offline Data Service** (`/frontend/src/services/offlineData.ts`)
   - Wraps all data operations with offline support
   - Automatically queues operations when offline
   - Provides transparent API for components

## Features

### 1. Offline Data Storage
- All data is stored locally in IndexedDB
- Automatic fallback when API calls fail
- Seamless experience whether online or offline

### 2. File Caching
- Images and documents cached locally
- Configurable TTL for cached files
- Automatic cleanup of expired cache

### 3. Sync Queue Management
- Failed operations queued for retry
- Automatic retry with exponential backoff
- Maximum retry limits to prevent infinite loops

### 4. Conflict Resolution
- Last-write-wins strategy by default
- Configurable conflict resolution strategies
- Version tracking for optimistic concurrency

### 5. Visual Indicators
- Real-time sync status display
- Pending changes counter
- Error notifications
- Offline mode indicator

### 6. Auto-sync
- Automatic sync when coming back online
- Periodic sync every 5 minutes
- Manual sync trigger available

## Usage

### Using Offline Data Hooks

```typescript
import { useOfflineData } from '@/hooks/useOfflineData';

function MyComponent() {
  const { 
    createEquipment, 
    updateEquipment, 
    isOffline,
    syncStats 
  } = useOfflineData();

  const handleCreate = async (data) => {
    try {
      const equipment = await createEquipment(data);
      // Works both online and offline
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      {isOffline && <p>Working offline</p>}
      <p>Pending sync: {syncStats.pendingSync}</p>
    </div>
  );
}
```

### Adding Sync Status Indicator

```typescript
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';

function Layout() {
  return (
    <div>
      {/* Your layout */}
      <SyncStatusIndicator showDetails={true} />
    </div>
  );
}
```

### Uploading Files Offline

```typescript
import { DocumentUploadOffline } from '@/features/equipment/components/DocumentUploadOffline';

function EquipmentDetails({ equipmentId }) {
  return (
    <DocumentUploadOffline
      equipmentId={equipmentId}
      onUploadComplete={(doc) => console.log('Uploaded:', doc)}
    />
  );
}
```

## Configuration

### Service Worker Registration

The service worker is automatically registered in `main.tsx`. No additional configuration needed.

### Conflict Resolution Strategy

```typescript
import { syncService } from '@/services/sync';

// Set custom conflict resolution
syncService.setConflictResolution({
  strategy: 'merge', // or 'last-write-wins' or 'manual'
  resolver: (local, remote) => {
    // Custom resolution logic
    return merged;
  }
});
```

### Cache Configuration

Update cache settings in `vite.config.ts`:

```typescript
workbox: {
  runtimeCaching: [
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
        }
      }
    }
  ]
}
```

## Best Practices

1. **Always use offline-aware hooks**
   - Use `useOfflineData` instead of direct API calls
   - Handle both online and offline states in UI

2. **Provide clear feedback**
   - Show offline status to users
   - Indicate when changes are pending sync
   - Display sync errors clearly

3. **Test offline scenarios**
   - Use Chrome DevTools to simulate offline
   - Test with slow/intermittent connections
   - Verify data integrity after sync

4. **Handle large files carefully**
   - Consider file size limits for offline storage
   - Implement cleanup strategies for old files
   - Monitor IndexedDB quota usage

5. **Plan for sync conflicts**
   - Choose appropriate conflict resolution strategy
   - Consider business rules for data conflicts
   - Log conflicts for debugging

## Troubleshooting

### Common Issues

1. **Service Worker not registering**
   - Check browser console for errors
   - Ensure HTTPS or localhost
   - Clear browser cache and retry

2. **Data not syncing**
   - Check network connectivity
   - Verify API endpoints are accessible
   - Look for errors in sync queue

3. **Storage quota exceeded**
   - Clear expired cache entries
   - Reduce file retention period
   - Implement data cleanup strategies

### Debugging Tools

1. **Chrome DevTools**
   - Application tab → IndexedDB
   - Network tab → Offline checkbox
   - Console for sync logs

2. **Database Utilities**
   ```typescript
   import { dbUtils } from '@/services/db';
   
   // Export database for debugging
   const data = await dbUtils.exportDatabase();
   console.log(data);
   
   // Check database size
   const size = await dbUtils.getDatabaseSize();
   console.log(`DB size: ${size / 1024 / 1024}MB`);
   ```

## Security Considerations

1. **Data Encryption**
   - Consider encrypting sensitive data in IndexedDB
   - Use HTTPS for all API communications
   - Implement proper authentication for sync

2. **Data Validation**
   - Validate data integrity after sync
   - Implement checksums for critical data
   - Log sync operations for audit trail

3. **Access Control**
   - Respect user permissions in offline mode
   - Sync only authorized data
   - Clear local data on logout

## Performance Tips

1. **Optimize sync payload**
   - Use delta sync where possible
   - Compress large data sets
   - Batch small operations

2. **Manage storage efficiently**
   - Implement data retention policies
   - Clean up old sync metadata
   - Monitor storage usage

3. **Minimize sync frequency**
   - Use appropriate sync intervals
   - Debounce rapid changes
   - Prioritize critical data

## Future Enhancements

1. **Background Sync API**
   - Implement periodic background sync
   - Use browser's BackgroundSync API
   - Handle sync when app is closed

2. **Selective Sync**
   - Allow users to choose what to sync
   - Implement sync profiles
   - Prioritize based on data importance

3. **Advanced Conflict Resolution**
   - Three-way merge capabilities
   - User-driven conflict resolution UI
   - Conflict history tracking