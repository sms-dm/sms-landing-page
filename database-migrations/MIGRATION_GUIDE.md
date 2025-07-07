# PostgreSQL Migration Guide for SMS Portals

## Overview

This guide provides step-by-step instructions for migrating both SMS portals from SQLite to PostgreSQL.

## Prerequisites

1. **PostgreSQL Installation**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib

   # macOS
   brew install postgresql
   ```

2. **Python Dependencies** (for data migration)
   ```bash
   pip install psycopg2-binary
   ```

3. **Database Access**
   - PostgreSQL superuser access
   - SQLite database files

## Migration Process

### 1. Maintenance Portal Migration

#### Step 1: Create PostgreSQL Database and User

```bash
# Connect as postgres superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE sms_maintenance;
CREATE USER sms_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE sms_maintenance TO sms_user;

# Enable extensions
\c sms_maintenance
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
\q
```

#### Step 2: Apply Schema

```bash
cd database-migrations/maintenance-portal
psql -U sms_user -d sms_maintenance -f up/001_create_schema.sql
```

#### Step 3: Migrate Data

**Option A: Using Python Script (Recommended)**
```bash
cd database-migrations/maintenance-portal/data

# Edit migrate_data.py to set correct paths and credentials
python migrate_data.py
```

**Option B: Using SQL Export/Import**
```bash
# Export from SQLite
sqlite3 /path/to/sms.db < export_commands.sql

# Import to PostgreSQL
psql -U sms_user -d sms_maintenance -f migrate_from_sqlite.sql
```

#### Step 4: Update Application Configuration

Edit `sms-app/backend/.env`:
```env
# Database Configuration
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://sms_user:your_password@localhost:5432/sms_maintenance

# Hidden Revenue Model (DO NOT EXPOSE)
DEFAULT_PARTS_MARKUP=0.20
PREMIUM_PARTS_MARKUP=0.25
```

#### Step 5: Update Database Connection Code

Update `sms-app/backend/src/config/database.ts`:
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default pool;
```

### 2. Onboarding Portal Migration

#### Step 1: Create PostgreSQL Database

```bash
sudo -u postgres psql

CREATE DATABASE sms_onboarding;
CREATE USER onboarding_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE sms_onboarding TO onboarding_user;
\q
```

#### Step 2: Apply Schema

```bash
cd SMS-Onboarding-Unified
psql -U onboarding_user -d sms_onboarding -f schema.sql

# Apply additional performance indexes
cd ../database-migrations/onboarding-portal
psql -U onboarding_user -d sms_onboarding -f up/001_create_schema.sql
```

#### Step 3: Configure Prisma

Update `SMS-Onboarding-Unified/.env`:
```env
DATABASE_URL="postgresql://onboarding_user:your_password@localhost:5432/sms_onboarding"
```

Generate Prisma client:
```bash
cd SMS-Onboarding-Unified
npx prisma generate
```

## Data Migration Considerations

### 1. Boolean Values
- SQLite: Stored as 0/1
- PostgreSQL: Native boolean type (true/false)
- Migration scripts handle conversion automatically

### 2. Date/Time Values
- SQLite: Stored as TEXT
- PostgreSQL: TIMESTAMPTZ for timezone-aware timestamps
- Ensure proper timezone handling in application

### 3. JSON Data
- SQLite: Stored as TEXT
- PostgreSQL: JSONB for better performance and indexing
- Migration validates JSON structure

### 4. Auto-increment Fields
- SQLite: AUTOINCREMENT
- PostgreSQL: SERIAL with sequences
- Sequences must be updated after data import

### 5. Full-Text Search
- SQLite: FTS5 virtual tables
- PostgreSQL: Native full-text search with GIN indexes
- Requires rebuilding search indexes

## Rollback Procedure

If migration fails, rollback using:

```bash
# Maintenance Portal
psql -U sms_user -d sms_maintenance -f database-migrations/maintenance-portal/down/001_drop_schema.sql

# Onboarding Portal
psql -U onboarding_user -d sms_onboarding -f database-migrations/onboarding-portal/down/001_drop_schema.sql
```

## Verification Steps

### 1. Data Integrity Check
```sql
-- Check record counts
SELECT 'companies' as table_name, COUNT(*) as count FROM companies
UNION ALL
SELECT 'vessels', COUNT(*) FROM vessels
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'equipment', COUNT(*) FROM equipment;
```

### 2. Foreign Key Validation
```sql
-- Check for orphaned records
SELECT 'equipment without vessel' as check, COUNT(*)
FROM equipment e
LEFT JOIN vessels v ON e.vessel_id = v.id
WHERE v.id IS NULL;
```

### 3. Application Testing
- Test user authentication
- Verify equipment CRUD operations
- Check fault reporting workflow
- Validate parts markup calculations
- Test search functionality

## Performance Optimization

### 1. Connection Pooling
Configure appropriate pool settings:
```javascript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 2. Query Optimization
- Use EXPLAIN ANALYZE for slow queries
- Add indexes for frequently filtered columns
- Consider partial indexes for status fields

### 3. Maintenance Tasks
Schedule regular maintenance:
```sql
-- Analyze tables for query planner
ANALYZE;

-- Vacuum to reclaim space
VACUUM ANALYZE;

-- Reindex for optimal performance
REINDEX DATABASE sms_maintenance;
```

## Security Considerations

### 1. Hidden Revenue Model
- Keep markup_percentage field internal
- Never expose markup calculations to frontend
- Use database views to hide sensitive data

### 2. Connection Security
- Use SSL for production connections
- Implement connection rate limiting
- Regular password rotation

### 3. Backup Strategy
```bash
# Daily backup script
pg_dump -U sms_user -d sms_maintenance > backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump -U sms_user -d sms_maintenance | gzip > backup_$(date +%Y%m%d).sql.gz
```

## Troubleshooting

### Common Issues

1. **Sequence out of sync**
   ```sql
   SELECT setval('table_name_id_seq', (SELECT MAX(id) FROM table_name));
   ```

2. **Encoding issues**
   ```sql
   -- Check database encoding
   SELECT datname, pg_encoding_to_char(encoding) FROM pg_database;
   ```

3. **Connection refused**
   - Check PostgreSQL service: `sudo systemctl status postgresql`
   - Verify pg_hba.conf settings
   - Check firewall rules

4. **Performance degradation**
   - Run EXPLAIN ANALYZE on slow queries
   - Check for missing indexes
   - Monitor connection pool usage

## Next Steps

1. Set up automated backups
2. Configure monitoring (pg_stat_statements)
3. Implement read replicas for scaling
4. Set up staging environment
5. Plan zero-downtime migration strategy