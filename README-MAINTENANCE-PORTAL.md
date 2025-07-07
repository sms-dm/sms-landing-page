# SMS Maintenance Portal - CURRENT PRODUCTION VERSION

## ⚠️ IMPORTANT: This is the ACTIVE maintenance portal
**Location:** `/home/sms/repos/SMS/sms-app/`

## Quick Start

### Option 1: Using Terminal (Recommended)
```bash
# Terminal 1 - Start Backend
cd /home/sms/repos/SMS/sms-app/backend
npm run dev

# Terminal 2 - Start Frontend  
cd /home/sms/repos/SMS/sms-app/frontend
PORT=3000 npm start
```

### Option 2: Using Start Script
```bash
cd /home/sms/repos/SMS
./start-all.sh
```

## Access Points
- **Frontend:** http://localhost:3000/oceanic
- **Backend API:** http://localhost:3001

## Demo Accounts
All passwords are: **demo123**

### Technician Accounts
- **john.doe@oceanic.com** - Electrician Dashboard
- **mike.chen@oceanic.com** - Mechanic Dashboard  
- **sarah.williams@oceanic.com** - HSE Officer Dashboard

### Manager Accounts
- **tom.rodriguez@oceanic.com** - Electrical Manager Dashboard
- **james.wilson@oceanic.com** - Mechanical Manager Dashboard
- **lisa.anderson@oceanic.com** - HSE Manager Dashboard

### Admin Account
- **admin@smsportal.com** - SMS Portal Admin Dashboard

## Key Features
- Role-based dashboards (each user sees different interface)
- Auto-populating login credentials
- QR code equipment management
- Fault reporting and tracking
- Parts management with pricing
- Document management system
- Real-time notifications
- Mobile responsive design

## File Structure
```
sms-app/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── pages/    # All dashboard pages
│   │   ├── components/
│   │   └── services/
│   └── public/
├── backend/          # Express.js API
│   ├── src/
│   │   ├── routes/
│   │   ├── config/   # Database configuration
│   │   └── middleware/
│   └── data/         # SQLite database location
└── README.md

```

## Making Changes
1. Frontend changes: Edit files in `sms-app/frontend/src/`
2. Backend changes: Edit files in `sms-app/backend/src/`
3. Database: SQLite file at `sms-app/backend/data/sms.db`

## Common Issues
- If login fails: Password is 'demo123' not 'password123'
- If page won't load: Make sure both backend (3001) and frontend (3000) are running
- Clear browser cache if seeing old version: Ctrl+F5

## DO NOT CONFUSE WITH:
- ❌ SMS-Onboarding (separate new project)
- ❌ Any backup directories
- ❌ Any folders with dates in names