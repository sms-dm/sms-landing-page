# Maintenance Task Sync Documentation

## Overview
This document describes the maintenance task synchronization feature between the SMS Onboarding Portal and the Maintenance Portal.

## What's New
The sync service now transfers maintenance schedules/tasks defined in the onboarding portal to the maintenance portal, ensuring that all equipment comes with predefined maintenance requirements.

## Database Changes

### Onboarding Portal
- Already has `maintenance_tasks` table (existing)
- Stores maintenance schedules for equipment during onboarding

### Maintenance Portal
- New `maintenance_tasks` table added via migration `006_add_maintenance_tasks.sql`
- Structure matches onboarding portal with additional `sync_id` field for tracking

## Updated Files

### Onboarding Portal
1. **`/SMS-Onboarding-Unified/backend/api/controllers/sync.controller.ts`**
   - Updated `getEquipment` endpoint to include maintenance tasks
   - Updated `exportVessel` endpoint to include maintenance tasks for equipment

### Maintenance Portal
1. **`/sms-app/backend/src/services/sync.service.ts`**
   - Added `maintenanceTasks` to sync result tracking
   - New `syncMaintenanceTasks` method to handle task synchronization
   - Updated `syncSingleEquipment` to sync maintenance tasks after equipment

2. **`/sms-app/backend/src/controllers/sync.controller.ts`**
   - Updated sync history endpoint to include `maintenance_tasks_synced` count

3. **`/sms-app/backend/src/migrations/006_add_maintenance_tasks.sql`**
   - New migration to create `maintenance_tasks` table in maintenance portal

4. **`/sms-app/backend/src/migrations/add-maintenance-tasks.ts`**
   - TypeScript migration runner for the SQL migration

## How It Works

### Sync Flow
1. When equipment is synced from onboarding to maintenance portal:
   - Equipment data is transferred first
   - Associated maintenance tasks are then synced
   - Tasks are linked to equipment via `equipment_id`

2. Each maintenance task includes:
   - Task name and description
   - Interval value and unit (HOURS, DAYS, MONTHS, YEARS)
   - Priority (LOW, MEDIUM, HIGH, CRITICAL)
   - Estimated hours
   - Required parts (JSON array)
   - Instructions and safety notes

### Data Mapping
- Tasks are uniquely identified by `equipment_id` + `task_name`
- Updates preserve existing task data while syncing changes
- `sync_id` field tracks the original task ID from onboarding portal

## Running the Migration

### PostgreSQL (Production)
```bash
cd /home/sms/repos/SMS/sms-app/backend
npm run migrate
```

### SQLite (Development)
The migration runner automatically detects SQLite and creates a compatible schema.

## Testing

### Manual Testing
1. Start both portals:
   ```bash
   ./start-all.sh
   ```

2. Run the test script:
   ```bash
   node test-maintenance-sync.js
   ```

3. Check the database:
   ```sql
   -- PostgreSQL
   SELECT COUNT(*) FROM maintenance_tasks;
   SELECT * FROM maintenance_tasks WHERE equipment_id = 1;
   
   -- Check sync logs
   SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 1;
   ```

### API Testing
1. Get equipment with maintenance tasks from onboarding:
   ```bash
   curl -H "Authorization: Bearer development-sync-key-2024" \
        http://localhost:3001/api/sync/equipment
   ```

2. Trigger sync in maintenance portal:
   ```bash
   curl -X POST -H "Authorization: Bearer <token>" \
        http://localhost:3000/api/sync/trigger
   ```

## Benefits
1. **Consistency**: Maintenance schedules defined during onboarding are automatically available in the maintenance portal
2. **Efficiency**: No need to manually recreate maintenance tasks
3. **Compliance**: Ensures all equipment has proper maintenance schedules from day one
4. **Tracking**: Full audit trail of synced tasks

## Future Enhancements
1. Sync maintenance task completions back to onboarding portal
2. Support for task templates by equipment type
3. Automatic task scheduling based on equipment installation date
4. Integration with parts inventory for required parts