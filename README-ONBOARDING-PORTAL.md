# SMS Onboarding Portal - IN DEVELOPMENT

## ⚠️ IMPORTANT: This is the NEW onboarding system
**Location:** `/home/sms/repos/SMS/SMS-Onboarding/`
**Status:** 🚧 In Development (Shadow Clone deployment completed)

## Overview
3-stage onboarding workflow that ensures high-quality vessel data:
1. **Admin Setup** - Company registration, vessel basics, token generation
2. **Tech Discovery** - On-vessel documentation with offline capability
3. **Manager Review** - Quality control before data enters maintenance system

## Quick Start

### Option 1: Using Start Script (Recommended)
```bash
cd /home/sms/repos/SMS
./start-all.sh
```

### Option 2: Manual Start
```bash
# Terminal 1 - API (Port 3002)
cd /home/sms/repos/SMS/SMS-Onboarding/api
npm run dev

# Terminal 2 - Admin Portal (Port 3003)
cd /home/sms/repos/SMS/SMS-Onboarding/admin-portal
PORT=3003 npm run dev

# Terminal 3 - Tech App (Port 5173)
cd /home/sms/repos/SMS/SMS-Onboarding/tech-app
npm run dev
```

## Access Points
- **Admin Portal:** http://localhost:3003
- **Tech App:** http://localhost:5173 (Mobile PWA)
- **API:** http://localhost:3002

## Key Features Built
### Admin Portal
- Company/vessel registration wizard
- User management with Excel import
- Token generation for technicians
- Real-time progress monitoring
- Manager review dashboard
- Business opportunity tracking

### Tech App (Mobile PWA)
- Offline-first architecture
- Progressive discovery flow
- Camera integration
- Equipment documentation
- Missing data flagging
- Review feedback handling

### Manager Review System
- Photo gallery view
- Data validation interface
- Comment system
- Bulk approval actions
- Change request workflow
- Sign-off with accountability

## Business Model Integration
- Missing data = Revenue opportunities
- Automated proposal generation
- Quality scoring (0-100)
- Progressive enhancement model

## File Structure
```
SMS-Onboarding/
├── admin-portal/      # Next.js desktop app
├── tech-app/         # React PWA mobile app
├── api/              # Express backend
├── shared/           # Shared components & types
├── auth/             # Authentication system
├── database/         # Prisma schema & migrations
└── .waves/           # Shadow Clone deliverables
```

## Development Notes
- Built using Shadow Clone deployment system
- 24 specialized agents created this in parallel
- All features from chat conversation implemented
- Ready for testing and customization

## Testing Credentials
First run database setup:
```bash
cd SMS-Onboarding/database
npm install
npx prisma migrate dev
npx prisma db seed
```

Demo accounts will be created with seed data.

## DO NOT CONFUSE WITH:
- ❌ sms-app (that's the maintenance portal)
- ❌ Any backup directories
- ❌ Older onboarding attempts