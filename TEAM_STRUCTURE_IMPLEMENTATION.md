# Team Structure Implementation Summary

## Database Updates Completed

### 1. Onboarding Portal (SQLite/Prisma)
- **Migration created**: `SMS-Onboarding-Unified/backend/prisma/migrations/20250107_add_team_structure/migration.sql`
- **Schema updated**: Added `department` and `managerId` fields to User model
- **Indexes added**: For department and managerId for better query performance

### 2. Maintenance Portal (PostgreSQL)
- **Migration created**: `database-migrations/maintenance-portal/up/002_add_department_field.sql`
- **Rollback script**: `database-migrations/maintenance-portal/down/002_drop_department_field.sql`
- **Note**: manager_id field already exists in the maintenance portal

## Code Updates Completed

### Backend (Onboarding Portal)
1. **Types Updated** (`types/auth.ts`):
   - Added `Department` enum with values: Engineering, Deck, Electrical, Catering, Safety, Navigation
   - Updated `User` interface to include `department` and `managerId`
   - Updated `RegisterRequest` interface to accept department and managerId

2. **User Service** (`services/user.service.ts`):
   - Updated `createUser` method to handle department and managerId
   - Added `getManagersByCompany()` - retrieves all managers/admins for a company
   - Added `getTeamMembers()` - retrieves team members for a specific manager
   - Added `getUsersByDepartment()` - retrieves users by department

3. **Team API** (New):
   - Created `api/controllers/team.controller.ts` with endpoints for team management
   - Created `api/routes/team.routes.ts` with the following routes:
     - GET `/api/v1/team/managers` - Get all managers
     - GET `/api/v1/team/managers/:managerId/members` - Get team members
     - GET `/api/v1/team/departments/:department/users` - Get users by department
     - GET `/api/v1/team/departments` - Get available departments

4. **Auth Controller** (`api/controllers/auth.controller.ts`):
   - Updated registration to accept and store department and managerId
   - Updated response objects to include team information

### Frontend Types (Maintenance Portal)
- Updated `User` interface in `sms-app/frontend/src/types.ts` to include department and manager_id

## Migration Instructions

### For Onboarding Portal:
```bash
cd SMS-Onboarding-Unified/backend
npx prisma migrate dev
```

### For Maintenance Portal:
```bash
# Connect to PostgreSQL
psql -U your_user -d your_database

# Run migration
\i /path/to/database-migrations/maintenance-portal/up/002_add_department_field.sql

# To rollback if needed:
\i /path/to/database-migrations/maintenance-portal/down/002_drop_department_field.sql
```

## Next Steps for Frontend Implementation

### 1. Update User Creation Forms
Add these fields to user creation/registration forms:
- Department dropdown (using the departments from API)
- Manager selection dropdown (populated based on company managers)

### 2. Display Team Information
- Show department on user profiles
- Show manager name on user profiles
- Create team view for managers to see their team members

### 3. Sync Service Updates
Update the sync service to transfer department and managerId fields between portals.

## API Usage Examples

### Get all managers for dropdown:
```javascript
const response = await fetch('/api/v1/team/managers', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const managers = await response.json();
```

### Get team members for a manager:
```javascript
const response = await fetch(`/api/v1/team/managers/${managerId}/members`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const teamMembers = await response.json();
```

### Get available departments:
```javascript
const response = await fetch('/api/v1/team/departments', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const departments = await response.json();
```

## Important Notes

1. **Department Values**: Currently hardcoded as: Engineering, Deck, Electrical, Catering, Safety, Navigation. These can be made configurable later.

2. **Manager Assignment**: Only users with roles MANAGER, ADMIN, or SUPER_ADMIN can be assigned as managers.

3. **Team Hierarchy**: The current implementation supports a single-level hierarchy (manager -> team members). Multi-level hierarchy can be added later if needed.

4. **Data Migration**: Existing users will have NULL values for department and managerId. You may want to run a data migration to assign default values.

5. **Validation**: Frontend should validate that technicians have a manager assigned before allowing user creation.