# Technician Workflow Implementation

## Overview
This document describes the implementation of equipment and parts management for the technician interface in the SMS Onboarding system.

## Components Implemented

### Frontend Components

1. **EquipmentForm** (`/frontend/src/features/tech/components/EquipmentForm.tsx`)
   - Creates new equipment with required fields
   - Supports offline creation
   - Includes criticality level selection
   - Integrates photo capture

2. **PartsManager** (`/frontend/src/features/tech/components/PartsManager.tsx`)
   - Manages spare parts for equipment
   - Critical parts flagging with justification
   - Stock level tracking
   - Low stock warnings

3. **QualityScoreDisplay** (`/frontend/src/features/tech/components/QualityScoreDisplay.tsx`)
   - Visual quality score representation
   - Breakdown by category
   - Improvement suggestions

4. **SyncStatus** (`/frontend/src/features/tech/components/SyncStatus.tsx`)
   - Real-time sync status indicator
   - Manual sync trigger
   - Pending items count

### Backend Implementation

1. **Controllers**
   - `equipment.controller.ts` - Equipment CRUD operations
   - `part.controller.ts` - Parts management and critical marking

2. **Routes**
   - `technician.routes.ts` - Technician-specific endpoints
   - Integrated into main routes index

3. **Services**
   - `quality.service.ts` - Quality score calculation
   - `prisma.ts` - Database service with soft delete support

### Offline Support

1. **Offline Service** (`offlineService.ts`)
   - IndexedDB storage for offline data
   - Queue management for pending uploads
   - Data caching

2. **Sync Service** (`syncService.ts`)
   - Automatic sync every 30 seconds when online
   - Batch sync for offline data
   - Error handling and retry logic

## API Endpoints

### Technician Routes
- `GET /v1/technician/assignments` - Get assignments
- `GET /v1/technician/vessels/:vesselId/locations` - Get vessel locations
- `POST /v1/technician/locations/:locationId/equipment` - Create equipment
- `GET /v1/technician/equipment/:equipmentId/parts` - Get parts
- `POST /v1/technician/equipment/:equipmentId/parts` - Create part
- `POST /v1/technician/parts/:partId/mark-critical` - Mark part as critical
- `GET /v1/technician/vessels/:vesselId/quality-score` - Get quality score

## Quality Score Calculation

The quality score is calculated based on:
1. **Basic Information (20%)** - Name, manufacturer, model, serial number, location
2. **Documentation (20%)** - Uploaded documents, manuals, certificates
3. **Photos (20%)** - Equipment photos (minimum 2 recommended)
4. **Spare Parts (20%)** - Parts list with supplier info and stock levels
5. **Critical Parts (20%)** - Identification of critical parts with justification

## Testing

### Integration Test Component
A test component is provided at `/frontend/src/features/tech/components/TestIntegration.tsx` for verifying:
- Offline data storage
- Equipment creation
- Parts management
- Quality score calculation
- Sync functionality

### Test Script
Run `node test-tech-workflow.js` to test API endpoints (requires authentication token).

## Usage

1. **Equipment Creation**
   ```typescript
   const equipment = await technicianApi.createEquipment(locationId, {
     name: 'Main Engine',
     manufacturer: 'MAN B&W',
     model: '6S60MC-C',
     serialNumber: 'SN-12345',
     criticalityLevel: CriticalityLevel.CRITICAL
   });
   ```

2. **Parts Management**
   ```typescript
   const part = await technicianApi.createSparePart(equipmentId, {
     partNumber: 'PART-001',
     name: 'Oil Filter',
     quantity: 10,
     minimumStock: 5
   });
   
   // Mark as critical
   await technicianApi.markPartAsCritical(partId, 'Essential for engine operation');
   ```

3. **Offline Support**
   - Data is automatically saved offline when no connection
   - Auto-sync occurs every 30 seconds when online
   - Manual sync available through SyncStatus component

## Critical Features

1. **Critical Parts Flagging**
   - Parts can be marked as critical with justification
   - Critical parts affect quality score
   - Visual indicators for critical components

2. **Quality Score**
   - Real-time calculation based on completeness
   - Visual breakdown by category
   - Improvement suggestions

3. **Offline-First Design**
   - All operations work offline
   - Automatic sync when connection restored
   - Conflict resolution handled server-side

## Next Steps

1. Add photo compression for offline storage
2. Implement conflict resolution UI
3. Add bulk operations support
4. Enhanced reporting and analytics
5. Integration with maintenance portal