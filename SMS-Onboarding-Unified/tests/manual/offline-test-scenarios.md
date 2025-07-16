# Offline Synchronization Test Scenarios

This document provides manual testing scenarios for the SMS Onboarding Portal's offline functionality.

## Prerequisites

1. Chrome DevTools open (F12)
2. Application tab selected
3. Service Workers section visible
4. IndexedDB section visible

## Test Scenarios

### 1. Creating Data While Offline

#### Test 1.1: Create Equipment Offline
1. Go online and log in as a technician
2. Navigate to equipment creation page
3. Open DevTools > Network tab
4. Set to "Offline" mode
5. Fill out equipment form:
   - Name: "Test Pump Offline"
   - Manufacturer: "ABC Corp"
   - Model: "XYZ-123"
   - Serial Number: "SN-OFFLINE-001"
6. Submit the form
7. **Expected**: 
   - Success message shows
   - Equipment appears in list with "Pending Sync" indicator
   - Check IndexedDB > SMSOnboardingDB > equipment table - entry exists
   - Check IndexedDB > SMSOnboardingDB > offlineQueue table - CREATE_EQUIPMENT action exists

#### Test 1.2: Upload Photos Offline
1. While still offline, select an equipment item
2. Click "Add Photo"
3. Select an image file (preferably > 2MB)
4. **Expected**:
   - Photo uploads successfully
   - Thumbnail appears with "Pending Upload" indicator
   - Check IndexedDB > fileCache table - compressed image blob exists
   - Check pending uploads in offlineService DB

#### Test 1.3: Create Multiple Items Offline
1. Create 5+ equipment items while offline
2. Add photos to at least 3 items
3. Update spare parts for 2 items
4. **Expected**:
   - All operations succeed
   - Sync queue shows correct count
   - No ID conflicts between items

### 2. Sync Queue Testing

#### Test 2.1: Basic Sync
1. Create several items offline (as in Test 1.3)
2. Go back online (uncheck "Offline" in Network tab)
3. Wait for automatic sync or trigger manual sync
4. **Expected**:
   - Sync indicator shows progress
   - Items sync one by one
   - Success notifications appear
   - Queue empties after sync
   - Server IDs replace local IDs

#### Test 2.2: Partial Sync Failure
1. Create 5 items offline
2. In Network tab, add request blocking for specific API endpoints
3. Go online and trigger sync
4. **Expected**:
   - Some items sync successfully
   - Failed items remain in queue
   - Error messages are user-friendly
   - Retry button appears

#### Test 2.3: Retry Logic
1. Have failed items in queue from Test 2.2
2. Remove network blocking
3. Click retry or wait for automatic retry
4. **Expected**:
   - Failed items retry up to 3 times
   - After max retries, items marked as permanently failed
   - User can manually retry permanently failed items

### 3. Conflict Resolution Testing

#### Test 3.1: Concurrent Edit Conflict
1. On Device A: Edit equipment "Pump 123" - change manufacturer to "Company A"
2. On Device B: While offline, edit same equipment - change manufacturer to "Company B"
3. On Device B: Add additional changes (model, location)
4. Sync Device B
5. **Expected**:
   - Conflict detected
   - Based on strategy (last-write-wins), Device B changes win
   - Non-conflicting fields from both devices are preserved

#### Test 3.2: Delete Conflict
1. On Device A: Delete equipment "Valve 456"
2. On Device B: While offline, edit the same equipment
3. Sync Device B
4. **Expected**:
   - Sync detects item was deleted on server
   - User notified of conflict
   - Local changes can be recovered if needed

### 4. Photo Sync Testing

#### Test 4.1: Large Photo Sync
1. While offline, add 10+ photos (each > 3MB)
2. Go online
3. Monitor sync progress
4. **Expected**:
   - Photos compressed before upload
   - Progress indicator shows upload status
   - Network usage is reasonable
   - All photos eventually sync

#### Test 4.2: Photo Sync Interruption
1. Start syncing large photos
2. Go offline mid-sync
3. Go back online
4. **Expected**:
   - Sync resumes from where it left off
   - No duplicate uploads
   - Completed uploads not re-sent

### 5. Storage Limit Testing

#### Test 5.1: IndexedDB Quota Check
1. Open DevTools > Application > Storage
2. Note current usage
3. Add many large photos while offline
4. **Expected**:
   - Storage usage displayed in app
   - Warning when approaching limit (e.g., 80%)
   - Graceful handling when limit reached

#### Test 5.2: Cache Cleanup
1. Use app extensively for a week
2. Check IndexedDB size
3. Trigger cache cleanup (or wait for automatic cleanup)
4. **Expected**:
   - Old cached files removed
   - Expired sync metadata cleaned
   - Storage usage reduced

### 6. PWA Installation Testing

#### Test 6.1: Install PWA
1. Open site in Chrome
2. Look for install prompt in address bar
3. Click "Install"
4. **Expected**:
   - App installs successfully
   - Desktop/home screen icon created
   - App opens in standalone mode
   - Offline functionality works immediately

#### Test 6.2: PWA Update
1. With PWA installed, deploy a new version
2. Open PWA
3. **Expected**:
   - Update prompt appears
   - Can update without losing offline data
   - Service worker updates smoothly

### 7. Edge Cases

#### Test 7.1: Rapid Online/Offline Switching
1. Create item while offline
2. Rapidly toggle online/offline status during sync
3. **Expected**:
   - No data corruption
   - Sync completes eventually
   - No duplicate operations

#### Test 7.2: Browser Crash Recovery
1. Create several items offline
2. Force close browser (End Task)
3. Reopen application
4. **Expected**:
   - All offline data preserved
   - Queue intact
   - Can continue working

#### Test 7.3: Multi-Tab Sync
1. Open app in two tabs
2. Create items in both tabs while offline
3. Go online in both tabs
4. **Expected**:
   - No duplicate syncs
   - Both tabs update correctly
   - Sync coordination between tabs

#### Test 7.4: Time-based Conflicts
1. Change system clock while offline
2. Create/edit items
3. Restore correct time and sync
4. **Expected**:
   - Timestamps handled correctly
   - No sync failures due to time issues

## Performance Benchmarks

### Expected Performance Metrics:
- Equipment creation offline: < 100ms
- Photo compression (5MB image): < 2s
- Sync 10 items: < 5s on 4G
- IndexedDB query (1000 items): < 50ms
- Cache lookup: < 10ms

## Debugging Tools

### Check Sync Status
```javascript
// In console:
const stats = await offlineDataService.getSyncStats();
console.log(stats);
```

### View Queue
```javascript
// In console:
const queue = await db.offlineQueue.toArray();
console.table(queue);
```

### Force Sync
```javascript
// In console:
await syncService.syncAll();
```

### Clear All Offline Data
```javascript
// In console:
await dbUtils.clearAll();
await offlineService.clearAll();
```

## Common Issues and Solutions

1. **Sync not triggering automatically**
   - Check service worker is active
   - Verify background sync permission
   - Check network detection

2. **Photos not uploading**
   - Check file size limits
   - Verify MIME type support
   - Check available storage

3. **Conflicts not resolving**
   - Verify conflict strategy setting
   - Check server timestamps
   - Review merge logic

4. **Storage quota exceeded**
   - Clear expired cache
   - Remove old sync data
   - Compress images more aggressively