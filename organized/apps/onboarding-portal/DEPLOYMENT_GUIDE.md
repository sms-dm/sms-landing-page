# SMS Onboarding Portal - Deployment Guide

This guide provides step-by-step instructions for deploying the SMS Onboarding Portal.

## Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+
- Redis (optional, for production)
- Git

## Quick Start (Development)

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd SMS-Onboarding-Unified
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Start all services:**
   ```bash
   chmod +x start-all.sh
   ./start-all.sh
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api
   - Health Check: http://localhost:3000/health

## Manual Setup

### Backend Setup

1. **Navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup database:**
   ```bash
   # Generate Prisma client
   npm run db:generate:dev
   
   # Run migrations
   npm run db:push:dev
   
   # (Optional) Seed database
   npm run db:seed
   ```

4. **Start backend:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **From project root:**
   ```bash
   # Install dependencies
   npm install
   ```

2. **Configure frontend environment:**
   ```bash
   # Create frontend/.env if it doesn't exist
   echo "VITE_API_URL=http://localhost:3000/api" > frontend/.env
   echo "VITE_WS_URL=ws://localhost:3000" >> frontend/.env
   ```

3. **Start frontend:**
   ```bash
   npm run dev
   ```

## Production Deployment

### 1. Build Process

**Backend:**
```bash
cd backend
npm run build
```

**Frontend:**
```bash
# From project root
npm run build
```

### 2. Environment Configuration

Create production environment files:
- `.env.production` for backend
- `frontend/.env.production` for frontend

See [Environment Variables Documentation](docs/ENVIRONMENT_VARIABLES.md) for details.

### 3. Database Setup

```bash
# Use production schema
cd backend
npm run db:migrate:prod
```

### 4. Start Production Servers

**Backend:**
```bash
cd backend
NODE_ENV=production npm start
```

**Frontend:**
```bash
# Serve the built files from dist/
npm run preview
# Or use a web server like nginx
```

## Docker Deployment (Coming Soon)

```bash
docker-compose up -d
```

## Deployment Checklist

- [ ] PostgreSQL database is running and accessible
- [ ] Environment variables are configured
- [ ] JWT secrets are set to strong, unique values
- [ ] CORS origins are properly configured
- [ ] Database migrations are run
- [ ] File upload directory has proper permissions (if using local storage)
- [ ] SSL/TLS certificates are configured (for production)
- [ ] Firewall rules allow required ports
- [ ] Monitoring and logging are configured
- [ ] Backup strategy is in place

## Common Issues

### Port Already in Use
```bash
# Stop services using the ports
./stop-all.sh
# Or manually:
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Database Connection Failed
- Check PostgreSQL is running: `sudo service postgresql status`
- Verify DATABASE_URL in .env
- Check database exists: `psql -U postgres -c "\l"`

### CORS Errors
- Ensure CORS_ORIGIN in backend .env matches frontend URL
- For multiple origins, use comma-separated values

### File Upload Issues
- Check AWS credentials if using S3
- Ensure upload directory exists and has write permissions for local storage
- Verify MAX_FILE_SIZE setting

## Monitoring

### Health Checks
- Backend: `curl http://localhost:3000/health`
- Database: Check the health endpoint response

### Logs
- Backend logs: Check console output or configure Winston
- Frontend logs: Browser developer console

## Security Recommendations

1. Use HTTPS in production
2. Enable rate limiting
3. Configure proper CORS origins
4. Use strong JWT secrets
5. Enable helmet security headers
6. Regular security updates
7. Database connection over SSL
8. Implement proper logging and monitoring

## Performance Optimization

1. Enable gzip compression
2. Configure CDN for static assets
3. Enable Redis for caching
4. Optimize database queries with indexes
5. Use PM2 or similar for process management
6. Configure proper memory limits

## Backup and Recovery

1. Regular database backups
2. Backup uploaded files (S3 or local)
3. Document recovery procedures
4. Test restore processes regularly

## Support

For issues or questions:
1. Check the logs
2. Review environment configuration
3. Consult the API documentation
4. Check the database connection

## Next Steps

After deployment:
1. Configure user accounts
2. Set up vessels and equipment
3. Test the onboarding workflow
4. Train users
5. Monitor system performance