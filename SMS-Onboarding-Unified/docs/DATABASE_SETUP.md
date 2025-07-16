# Database Setup Guide

This guide explains how to set up and manage the database for the SMS Onboarding Portal.

## Overview

The application supports two database configurations:
- **Development**: SQLite (lightweight, file-based)
- **Production**: PostgreSQL (robust, scalable)

## Quick Start

### Development Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Initialize the development database:
   ```bash
   ../scripts/db-init.sh development
   ```

3. Open Prisma Studio to view your database:
   ```bash
   npm run db:studio:dev
   ```

### Production Setup

1. Ensure PostgreSQL is installed and running
2. Update `.env.production` with your database credentials
3. Initialize the production database:
   ```bash
   ../scripts/db-init.sh production
   ```

## Environment Configuration

### Development (.env.development)
```env
DATABASE_URL="file:./dev.db"
```

### Production (.env.production)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/sms_onboarding"
```

## Available Database Commands

All commands should be run from the `backend` directory:

### Development Commands
- `npm run db:migrate:dev` - Run migrations for SQLite
- `npm run db:push:dev` - Push schema changes without migrations
- `npm run db:studio:dev` - Open Prisma Studio
- `npm run db:generate:dev` - Generate Prisma Client
- `npm run db:reset` - Reset development database
- `npm run db:seed` - Seed development database

### Production Commands
- `npm run db:migrate:prod` - Deploy migrations to PostgreSQL
- `npm run db:push:prod` - Push schema changes (use with caution)
- `npm run db:studio:prod` - Open Prisma Studio for production
- `npm run db:generate:prod` - Generate Prisma Client

### General Commands
- `npm run db:validate` - Validate both schema files
- `npm run db:migrate:create` - Create a new migration

## Database Health Monitoring

The application includes built-in database health monitoring:

1. **Health Check Endpoint**: `GET /health`
   - Returns database connection status
   - Shows latency metrics
   - Displays database type and version

2. **Automatic Connection Recovery**
   - Implements exponential backoff
   - Logs connection errors
   - Attempts automatic reconnection

3. **Performance Monitoring**
   - Query logging in development
   - Latency tracking
   - Connection pool monitoring

## Migrations

### Creating a New Migration

1. Make changes to the appropriate schema file:
   - Development: `prisma/schema.dev.prisma`
   - Production: `prisma/schema.prisma`

2. Create a migration:
   ```bash
   npm run db:migrate:create
   ```

3. Apply the migration:
   ```bash
   npm run db:migrate:dev  # Development
   npm run db:migrate:prod # Production
   ```

### Migration Best Practices

1. Always test migrations in development first
2. Review generated SQL before applying
3. Create backups before production migrations
4. Use descriptive migration names

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check DATABASE_URL in environment file
   - Ensure database server is running
   - Verify credentials and permissions

2. **Migration Errors**
   - Check for schema conflicts
   - Ensure database is accessible
   - Review migration SQL for errors

3. **Performance Issues**
   - Monitor query logs
   - Check database indexes
   - Review connection pool settings

### Debug Mode

Enable detailed logging:
```bash
NODE_ENV=development npm run dev
```

This will show:
- All SQL queries
- Query execution times
- Connection events

## Production Considerations

1. **Security**
   - Use strong passwords
   - Enable SSL for PostgreSQL
   - Restrict database access

2. **Performance**
   - Configure connection pooling
   - Add appropriate indexes
   - Monitor query performance

3. **Backup Strategy**
   - Regular automated backups
   - Test restore procedures
   - Keep backup retention policy

## Database Schema

The database schema includes:
- Multi-tenant support with company isolation
- User management with role-based access
- Vessel and equipment tracking
- Document management
- Offline sync support
- Audit logging

See `prisma/schema.prisma` for the complete schema definition.