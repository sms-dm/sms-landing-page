# SMS Shadow Clone Deployment Plan

## System Overview

SMS (Smart Marine Systems) is a comprehensive marine maintenance management platform consisting of three interconnected applications:

1. **Landing Website** (Port 3002) - Marketing and entry point
2. **Onboarding Portal** (Port 3001) - Company/vessel setup
3. **Maintenance Portal** (Port 3005) - Daily operations

## Architecture Summary

```
┌─────────────────┐     ┌────────────────────┐     ┌───────────────────┐
│  Landing Page   │────▶│ Onboarding Portal  │────▶│ Maintenance Portal│
│   (React/Vite)  │     │  (Next.js/Prisma)  │     │ (React/Express)   │
│   Port: 3002    │     │    Port: 3001      │     │   Port: 3005      │
└─────────────────┘     └────────────────────┘     └───────────────────┘
                               │                              │
                               ▼                              ▼
                        ┌──────────────┐              ┌──────────────┐
                        │  PostgreSQL  │              │  PostgreSQL  │
                        │   Database   │              │   Database   │
                        └──────────────┘              └──────────────┘
```

## Deployment Requirements

### 1. Landing Website (`/sms-landing`)

**Technology Stack:**
- React 18 with TypeScript
- Vite build system
- Tailwind CSS
- Framer Motion animations
- React Router DOM

**Build Commands:**
```bash
cd sms-landing
npm install
npm run build
```

**Environment Variables:**
None required (static site)

**Deployment Notes:**
- Static site deployment (dist folder)
- Requires serving index.html for all routes (SPA)
- Coming soon page with hidden login (5 clicks on logo)
- Preview mode requires localStorage auth

### 2. Onboarding Portal (`/SMS-Onboarding-Unified`)

**Technology Stack:**
- Next.js 14 with TypeScript
- Prisma ORM
- PostgreSQL database
- JWT authentication
- File upload support

**Build Commands:**
```bash
cd SMS-Onboarding-Unified
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# Frontend
cd ../frontend
npm install
npm run build
```

**Environment Variables (Backend):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/sms_onboarding
JWT_SECRET=your-secret-key-min-32-chars
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# File uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Sync with maintenance portal
MAINTENANCE_API_URL=https://yourdomain.com:3005/api
MAINTENANCE_API_KEY=sync-api-key-2024
```

**Environment Variables (Frontend):**
```env
VITE_API_URL=https://yourdomain.com:3001/api/v1
```

**Database Setup:**
```sql
CREATE DATABASE sms_onboarding;
-- Run migrations with: npx prisma migrate deploy
```

**Deployment Notes:**
- Requires persistent storage for file uploads
- WebSocket support needed for real-time features
- CORS configuration for portal communication

### 3. Maintenance Portal (`/sms-app`)

**Technology Stack:**
- React 18 with TypeScript
- Express.js backend
- PostgreSQL database
- Socket.io for real-time
- JWT authentication

**Build Commands:**
```bash
cd sms-app
# Backend
cd backend
npm install
npm run build

# Frontend
cd ../src
npm install
npm run build
```

**Environment Variables (Backend):**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sms_maintenance
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sms_maintenance
DB_USER=user
DB_PASSWORD=password

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
SESSION_SECRET=your-session-secret

# Server
PORT=3005
NODE_ENV=production

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM="SMS System <your.email@gmail.com>"
EMAIL_QUEUE_BATCH_SIZE=10
EMAIL_QUEUE_RETRY_ATTEMPTS=3

# Sync with onboarding portal
ONBOARDING_API_URL=https://yourdomain.com:3001/api
ONBOARDING_API_KEY=sync-api-key-2024
WEBHOOK_SECRET=sync-webhook-secret-2024
ENABLE_SCHEDULED_SYNC=true
SYNC_SCHEDULE_CRON=0 */4 * * *

# Hidden revenue model
PARTS_MARKUP_PERCENTAGE=20
SMS_NOTIFICATION_DELAY_MINUTES=30
```

**Environment Variables (Frontend):**
```env
REACT_APP_API_URL=https://yourdomain.com:3005/api
REACT_APP_WS_URL=wss://yourdomain.com:3005
```

**Database Setup:**
```sql
CREATE DATABASE sms_maintenance;
-- Run all migrations in order:
-- 001_initial_schema.sql through 008_add_analytics_schema.sql
```

**Deployment Notes:**
- Requires WebSocket support for real-time features
- Service worker for offline capability
- Scheduled jobs for analytics and notifications
- File storage for documents/images

## Deployment Order

1. **Deploy Databases First**
   - Create both PostgreSQL databases
   - Run migrations for each

2. **Deploy Backend Services**
   - Onboarding Portal API (Port 3001)
   - Maintenance Portal API (Port 3005)
   - Test sync endpoints between portals

3. **Deploy Frontend Applications**
   - Landing Website (Port 3002)
   - Onboarding Portal Frontend
   - Maintenance Portal Frontend

4. **Configure Reverse Proxy/Load Balancer**
   ```nginx
   # Landing page
   server {
     server_name yourdomain.com;
     location / {
       proxy_pass http://localhost:3002;
     }
   }
   
   # Onboarding portal
   server {
     server_name onboarding.yourdomain.com;
     location / {
       proxy_pass http://localhost:3001;
     }
   }
   
   # Maintenance portal
   server {
     server_name app.yourdomain.com;
     location / {
       proxy_pass http://localhost:3005;
     }
     location /socket.io {
       proxy_pass http://localhost:3005;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
     }
   }
   ```

## Critical Configuration

### 1. **Hidden Revenue Model**
The system includes a hidden 20% markup on parts. Ensure:
- `PARTS_MARKUP_PERCENTAGE=20` is set
- `SMS_NOTIFICATION_DELAY_MINUTES=30` gives SMS first notification
- Database user for vessels CANNOT see markup fields

### 2. **Authentication Flow**
- Landing page → Coming soon (5 clicks for preview)
- After payment → Activation code sent
- Activation → Company registration
- Configuration phase → MUST complete before technician access
- Portal bridge → Auto-login between portals

### 3. **Data Sync**
- Equipment data flows: Onboarding → Maintenance
- Sync happens on manager approval
- First technician login triggers maintenance status gate
- WebSocket for real-time updates

### 4. **Offline Capability**
- Service worker caches critical assets
- IndexedDB stores offline changes
- Sync on reconnect
- Conflict resolution for concurrent edits

## Security Considerations

1. **JWT Secrets**: Use strong, unique secrets for each portal
2. **CORS**: Configure exact origins, no wildcards
3. **File Uploads**: Validate types and scan for malware
4. **Database**: Use separate users with minimal permissions
5. **SSL/TLS**: Required for all endpoints
6. **Rate Limiting**: Implement on all APIs

## Monitoring & Maintenance

### Health Check Endpoints:
- Landing: `GET /health`
- Onboarding: `GET /api/v1/health`
- Maintenance: `GET /api/health`

### Critical Scheduled Jobs:
- **Hourly**: Low stock checks, analytics snapshots
- **Daily**: Maintenance reminders, certificate warnings
- **Monthly**: Compliance calculations, revenue reports

### Logs to Monitor:
- Authentication failures
- Sync errors
- Payment/invoice generation
- Email delivery status
- WebSocket connections

## Post-Deployment Testing

1. **Full User Journey**:
   - Access landing page
   - Use hidden login (5 clicks)
   - Create test company with activation code
   - Complete configuration phase
   - Add test vessel
   - Document equipment with maintenance schedules
   - Approve and sync to maintenance portal
   - First login maintenance status gate
   - Test all features

2. **Revenue Model Test**:
   - Create low stock situation
   - Verify SMS notified first
   - Test order approval with markup
   - Generate invoice
   - Verify markup hidden from customer

3. **Offline Test**:
   - Disconnect internet
   - Make changes
   - Reconnect
   - Verify sync

## Rollback Plan

1. Database backups before deployment
2. Previous version tags in Git
3. Blue-green deployment if possible
4. Feature flags for new functionality

## Support Information

- Default admin: `admin` / `admin123`
- Sync issues: Check `/api/sync/status`
- Email issues: Check SMTP settings and Gmail app password
- Performance: Monitor analytics job duration

This deployment plan ensures all three components work together seamlessly while protecting the hidden revenue model and providing reliable maritime operations support.