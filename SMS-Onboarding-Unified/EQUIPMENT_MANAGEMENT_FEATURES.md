# Equipment Management Features

## Overview

The Equipment Management system provides comprehensive capabilities for managers to handle vessel equipment throughout its lifecycle - from pre-arrival planning to active management and removal.

## Features Implemented

### 1. Manager Equipment Dashboard (`/manager/equipment`)

The main dashboard provides:
- **Equipment Overview**: Total equipment count with status distribution
- **Criticality Breakdown**: Visual representation of equipment by criticality level
- **Assignment Tracking**: See which technicians are assigned to equipment
- **Recent Activity**: Latest equipment updates and changes

### 2. Equipment Management Capabilities

#### Add/Edit/Remove Equipment
- **Single Equipment Creation**: Add individual equipment items with full details
- **Bulk Equipment Creation**: Add multiple equipment items in one operation
- **Pre-arrival Equipment Addition**: Plan equipment before vessel arrival with "PLANNED" status
- **Edit Equipment Details**: Update any equipment information
- **Soft Delete**: Equipment is marked as "REMOVED" rather than permanently deleted

#### Equipment Status Workflow
1. **PLANNED**: Equipment planned but not yet on vessel
2. **ARRIVING**: Equipment in transit to vessel
3. **DRAFT**: Initial documentation started
4. **PENDING_REVIEW**: Awaiting manager review
5. **VERIFIED**: Manager has verified the information
6. **APPROVED**: Final approval given
7. **ACTIVE**: Equipment in active use
8. **REMOVED**: Equipment removed from vessel

#### Assignment Features
- **Assign to Technicians**: Delegate equipment onboarding to specific technicians
- **Self-Assignment**: Managers can assign equipment to themselves
- **Bulk Assignment**: Assign multiple equipment items to a technician at once
- **Assignment Tracking**: View current assignments and workload distribution

### 3. Bulk Operations

The system supports bulk operations for efficiency:
- **Bulk Status Update**: Change status for multiple equipment items
- **Bulk Criticality Update**: Adjust criticality levels in bulk
- **Bulk Assignment**: Assign multiple items to technicians
- **Bulk Deletion**: Remove multiple equipment items at once

### 4. Equipment Filtering & Search

Advanced filtering capabilities:
- **Search**: Full-text search across equipment name, manufacturer, model, serial number
- **Status Filter**: Filter by any equipment status
- **Criticality Filter**: Filter by criticality level (Critical, High, Medium, Low)
- **Vessel Filter**: Filter equipment by vessel
- **Assignee Filter**: Filter by assigned technician
- **Date Range Filter**: Filter by creation or update date

### 5. Parts Management

Each equipment item can have associated parts:
- **Parts List**: View all parts for specific equipment
- **Add Parts**: Add new parts with details
- **Stock Tracking**: Monitor current vs minimum stock levels
- **Criticality Management**: Set part criticality levels
- **Low Stock Alerts**: Visual indicators for parts below minimum stock

### 6. Quality Score Tracking

- **Quality Score Display**: Visual progress bar showing documentation quality
- **Score Calculation**: Based on completeness, accuracy, and documentation
- **Color-Coded Indicators**: Green (80%+), Yellow (60-79%), Red (<60%)

## API Endpoints

### Manager Equipment Routes (`/api/v1/manager/equipment`)

1. **GET /** - List equipment with filters
   - Query params: page, limit, search, vesselId, status, criticalLevel, location, assignedTo, dateFrom, dateTo, sort

2. **POST /bulk-create** - Create multiple equipment items
   - Body: `{ vesselId, equipment: [...] }`

3. **PATCH /:equipmentId** - Update single equipment
   - Body: Equipment update fields

4. **PATCH /bulk-update** - Update multiple equipment items
   - Body: `{ equipmentIds: [...], updates: {...} }`

5. **DELETE /:equipmentId** - Soft delete single equipment

6. **DELETE /bulk-delete** - Soft delete multiple equipment
   - Body: `{ equipmentIds: [...] }`

7. **POST /assign** - Assign equipment to technician
   - Body: `{ equipmentIds: [...], assignToId }`

8. **GET /stats** - Get equipment statistics
   - Query params: vesselId (optional)

## Database Schema Updates

### Equipment Status Enum
```sql
PLANNED
ARRIVING
DRAFT
DOCUMENTED
PENDING_REVIEW
REVIEWED
VERIFIED
APPROVED
ACTIVE
REMOVED
REJECTED
DELETED
```

### New Indexes for Performance
- `idx_equipment_status_vessel`: Composite index on status and vessel_id
- `idx_equipment_documented_by`: Index on assigned technician
- `idx_equipment_created_at`: Index on creation date
- `idx_equipment_updated_at`: Index on update date
- `idx_equipment_listing`: Composite index for efficient listing queries

## Security & Permissions

- All manager equipment routes require `MANAGER` or `ADMIN` role
- Company isolation enforced - managers can only see equipment from their company's vessels
- Audit logging for all equipment changes
- Soft delete preserves data integrity and audit trail

## Frontend Components

### Core Components
1. **EquipmentManagementDashboard**: Main dashboard container
2. **EquipmentStats**: Statistics cards showing equipment metrics
3. **EquipmentTable**: Paginated table with equipment list
4. **BulkOperationsBar**: Bulk action toolbar
5. **AddEquipmentDialog**: Multi-equipment creation form
6. **EquipmentPartsDialog**: Parts management interface

### State Management
- RTK Query for API calls with caching
- Optimistic updates for better UX
- Tag-based cache invalidation

## Usage Examples

### Adding Pre-Arrival Equipment
1. Navigate to Manager > Equipment
2. Click "Add Equipment"
3. Select vessel
4. Set status to "PLANNED"
5. Fill in equipment details
6. Add multiple items if needed
7. Click "Create Equipment"

### Bulk Assignment
1. Select multiple equipment items using checkboxes
2. Click "Assign" in bulk operations bar
3. Select technician from dropdown
4. Click "Assign Equipment"

### Managing Parts
1. Click menu (⋮) on any equipment row
2. Select "Manage Parts"
3. Add/edit parts in the dialog
4. Monitor stock levels

## Future Enhancements

1. **Import/Export**: CSV/Excel import and export functionality
2. **Equipment Templates**: Save common equipment configurations
3. **Automated Alerts**: Low stock notifications, maintenance due alerts
4. **QR Code Integration**: Generate QR codes for equipment tracking
5. **Mobile Optimization**: Enhanced mobile experience for field use
6. **Integration APIs**: Connect with maintenance management systems
7. **Advanced Analytics**: Equipment lifecycle analytics and reports