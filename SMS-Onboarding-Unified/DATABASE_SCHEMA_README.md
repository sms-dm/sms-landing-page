# SMS Onboarding Portal Database Schema

## Overview
This database schema is designed for the SMS Onboarding Portal, a multi-tenant maritime equipment management system with offline sync capabilities and comprehensive audit trails.

## Key Features

### 1. Multi-Tenant Architecture
- Row Level Security (RLS) policies ensure data isolation between companies
- All queries automatically filtered by company context
- Secure tenant isolation at the database level

### 2. Hierarchical Data Structure
- **Companies** → **Vessels** → **Locations** → **Equipment** → **Parts**
- Locations support unlimited nesting with materialized paths for efficient queries
- Equipment criticality levels: CRITICAL, IMPORTANT, STANDARD

### 3. Quality Management
- Quality scores tracked across 5 metrics:
  - Completeness
  - Accuracy
  - Photo Quality
  - Documentation
  - Compliance
- Automatic quality score aggregation at equipment level

### 4. Offline Sync Support
- Dedicated sync queue table for conflict resolution
- Device-based tracking for multi-device scenarios
- Configurable conflict resolution strategies

### 5. Comprehensive Audit Trail
- Automatic audit logging for all critical operations
- Tracks old and new values with full JSONB support
- IP address and user agent capture

## Database Setup

### Prerequisites
- PostgreSQL 14+ with the following extensions:
  - uuid-ossp
  - pgcrypto
  - pg_trgm (for fuzzy search)

### Installation

1. Create the database:
```bash
createdb sms_onboarding
```

2. Run the main schema:
```bash
psql -d sms_onboarding -f schema.sql
```

3. Apply performance optimizations:
```bash
psql -d sms_onboarding -f prisma/migrations/001_performance_indexes.sql
```

4. Install Prisma and generate client:
```bash
npm install @prisma/client prisma
npx prisma generate
```

5. Run seed data (development only):
```bash
npx prisma db seed
```

## Security Configuration

### Setting RLS Context
Before executing queries, set the security context:

```sql
SET app.current_company_id = 'company-uuid-here';
SET app.current_user_id = 'user-uuid-here';
SET app.current_user_role = 'MANAGER';
```

### Role Permissions
- **SUPER_ADMIN**: Full system access
- **ADMIN**: Full company access
- **MANAGER**: Review and approval rights
- **TECHNICIAN**: Documentation and data entry
- **VIEWER**: Read-only access

## Key Tables

### Core Entities
1. **companies**: Tenant organizations
2. **users**: System users with role-based access
3. **vessels**: Ships managed by companies
4. **locations**: Hierarchical vessel locations
5. **equipment**: Machinery and systems
6. **critical_parts**: Spare parts inventory

### Supporting Tables
1. **documents**: File attachments (S3 references)
2. **quality_scores**: Equipment quality metrics
3. **parts_cross_reference**: Parts compatibility matrix
4. **onboarding_tokens**: Secure vessel access tokens
5. **offline_sync_queue**: Offline data synchronization
6. **audit_logs**: Complete audit trail
7. **notifications**: User notifications

## Performance Optimizations

### Indexes
- Composite indexes for common query patterns
- Partial indexes for active records
- GIN indexes for JSONB and full-text search
- Trigram indexes for fuzzy search

### Materialized Views
- `mv_parts_intelligence`: Cross-vessel parts analysis

### Database Functions
- `search_equipment()`: Full-text equipment search
- `get_equipment_hierarchy()`: Hierarchical equipment view
- `calculate_vessel_progress()`: Onboarding progress metrics
- `find_compatible_parts()`: Parts cross-reference search
- `update_daily_statistics()`: Analytics data aggregation

## Prisma Integration

### Generate Prisma Client
```bash
npx prisma generate
```

### Run Migrations
```bash
npx prisma migrate dev
```

### Example Usage
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Set RLS context
await prisma.$executeRaw`SET app.current_company_id = ${companyId}`;
await prisma.$executeRaw`SET app.current_user_id = ${userId}`;

// Query with automatic RLS filtering
const vessels = await prisma.vessel.findMany({
  include: {
    equipment: {
      where: { criticality: 'CRITICAL' }
    }
  }
});
```

## Maintenance

### Regular Tasks
1. Refresh materialized views:
   ```sql
   SELECT refresh_parts_intelligence();
   ```

2. Update daily statistics:
   ```sql
   SELECT update_daily_statistics('company-id');
   ```

3. Clean old audit logs (30+ days):
   ```sql
   DELETE FROM audit_logs 
   WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
   ```

### Monitoring Queries

Check sync queue status:
```sql
SELECT sync_status, COUNT(*) 
FROM offline_sync_queue 
GROUP BY sync_status;
```

Equipment documentation progress:
```sql
SELECT * FROM calculate_vessel_progress('vessel-id');
```

## Test Credentials (Development Only)
- **Admin**: admin@maritimesolutions.com / Admin123!
- **Manager**: manager@maritimesolutions.com / Manager123!
- **Technician**: tech@maritimesolutions.com / Tech123!

## Security Best Practices
1. Always use parameterized queries
2. Enable SSL for database connections
3. Rotate onboarding tokens regularly
4. Monitor audit logs for suspicious activity
5. Use strong passwords with bcrypt hashing
6. Implement rate limiting at application level

## Backup and Recovery
1. Enable continuous archiving (WAL)
2. Schedule regular full backups
3. Test recovery procedures quarterly
4. Store backups in separate geographic location
5. Encrypt backups at rest

## Support
For questions or issues with the database schema, please refer to the main project documentation or contact the development team.