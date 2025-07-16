# PostgreSQL Setup Guide for SMS Maintenance Portal

## Overview
The SMS Maintenance Portal now supports both SQLite (development) and PostgreSQL (production) databases. This guide explains how to set up and migrate to PostgreSQL.

## Features Added

### 1. Database Abstraction Layer
- **Location**: `src/config/database.abstraction.ts`
- Automatically converts queries between SQLite and PostgreSQL syntax
- Handles boolean conversions, placeholder syntax, and data type differences
- Transparent switching between databases based on environment

### 2. Unified Configuration
- **Location**: `src/config/database.config.ts`
- Centralizes all database configuration
- Automatically uses PostgreSQL in production
- Environment variable based configuration

### 3. Connection Pooling
- PostgreSQL connection pooling with configurable limits
- Default pool size: 20 connections
- Automatic connection management and cleanup

### 4. Migration System
- **Runner**: `src/migrations/migration-runner.ts`
- Tracks applied migrations in a migrations table
- Supports both SQL and TypeScript migrations
- Run with: `npm run migrate:run`

## Environment Variables

Add these to your `.env` file:

```env
# Database Type ('sqlite' or 'postgresql')
DATABASE_TYPE=postgresql

# PostgreSQL Connection (Option 1: Connection String)
DATABASE_URL=postgresql://user:password@localhost:5432/sms_db

# PostgreSQL Connection (Option 2: Individual Settings)
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=sms_db
PG_USER=sms_user
PG_PASSWORD=your_secure_password

# Connection Pool Settings (Optional)
PG_POOL_MAX=20
PG_IDLE_TIMEOUT=30000
PG_CONNECTION_TIMEOUT=2000
```

## PostgreSQL Installation

### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
Download and install from: https://www.postgresql.org/download/windows/

## Database Setup

### 1. Create Database and User
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE sms_db;
CREATE USER sms_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE sms_db TO sms_user;

# Grant schema permissions
\c sms_db
GRANT ALL ON SCHEMA public TO sms_user;
```

### 2. Run Initial Migration
```bash
# Set environment to use PostgreSQL
export DATABASE_TYPE=postgresql

# Run migrations
npm run migrate:run
```

### 3. Migrate from SQLite (Optional)
If you have existing SQLite data:
```bash
npm run migrate:sqlite-to-postgres
```

## Verification

### 1. Check Database Health
```bash
# Run health check
npx tsx src/utils/db-health-check.ts

# Or via API
curl http://localhost:3005/api/health
```

### 2. Test Connection
```bash
# Test database connection
npx tsx src/check-db.ts
```

## Query Compatibility

The abstraction layer automatically handles these conversions:

| SQLite | PostgreSQL |
|--------|------------|
| `?` placeholders | `$1, $2, ...` placeholders |
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL PRIMARY KEY` |
| `DATETIME` | `TIMESTAMPTZ` |
| Boolean as 0/1 | Boolean as true/false |
| `JSON` | `JSONB` |

## Troubleshooting

### Connection Refused
- Check PostgreSQL is running: `pg_isready`
- Verify connection details in `.env`
- Check PostgreSQL logs: `sudo journalctl -u postgresql`

### Permission Denied
- Ensure user has proper permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE sms_db TO sms_user;
GRANT ALL ON SCHEMA public TO sms_user;
```

### SSL Issues in Production
- The system automatically enables SSL for production
- Set `NODE_ENV=production` to enable SSL

### Migration Errors
- Check migration logs for specific errors
- Ensure all required extensions are installed:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

## Performance Optimization

### 1. Connection Pool Tuning
Adjust based on your server capacity:
```env
PG_POOL_MAX=50  # For high-traffic production
PG_IDLE_TIMEOUT=60000  # Keep connections longer
```

### 2. Query Performance
The migration creates indexes on commonly queried fields:
- Foreign key columns
- Status and type columns
- Full-text search indexes

### 3. Monitoring
Monitor database performance:
```sql
-- Connection count
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

## Backup and Restore

### Backup
```bash
pg_dump -U sms_user -h localhost sms_db > backup.sql
```

### Restore
```bash
psql -U sms_user -h localhost sms_db < backup.sql
```

## Production Deployment

1. Use environment variables for all sensitive data
2. Enable SSL in production (`NODE_ENV=production`)
3. Use connection pooling appropriate for your load
4. Regular backups with point-in-time recovery
5. Monitor connection pool and query performance

## Next Steps

1. Test your application with PostgreSQL
2. Run performance benchmarks
3. Set up automated backups
4. Configure monitoring and alerts
5. Plan your migration strategy