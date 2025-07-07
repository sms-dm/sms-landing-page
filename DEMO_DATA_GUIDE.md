# SMS Demo Data Guide

## Overview
This guide provides complete information about the demo data setup for the SMS (Smart Marine Systems) project, including credentials, data structure, and testing procedures.

## Demo Company Details

**Company Name:** Demo Marine Services  
**Company Code:** DMS  
**Email:** demo@demomarineservices.com  
**Phone:** +1-555-DEMO-001  
**Address:** 123 Demo Harbor, Demo Port, DP 54321  

## Demo User Credentials

All demo users use the same password: **Demo123!**

| Role | Email | Username | Access Level |
|------|-------|----------|--------------|
| Admin | admin@demo.com | admin | Full system access |
| Manager | manager@demo.com | manager | Vessel & equipment management |
| Technician | tech@demo.com | tech | Equipment documentation |

## Demo Vessel Information

**Vessel Name:** MV Demo Explorer  
**IMO Number:** 1234567  
**Type:** Container Ship  
**Flag:** United States  
**Gross Tonnage:** 50,000 MT  
**Year Built:** 2022  
**Class Society:** ABS  

### Pre-configured Equipment
1. **Main Engine (ME-001)**
   - Manufacturer: MAN B&W
   - Model: 7S80ME-C
   - Status: Operational
   - Criticality: Critical

2. **Auxiliary Engine #1 (AE-001)**
   - Manufacturer: Caterpillar
   - Model: C32
   - Status: Operational
   - Criticality: Critical

3. **Navigation Radar (NAV-001)**
   - Manufacturer: Furuno
   - Model: FAR-2228
   - Status: Operational
   - Criticality: Critical

## Portal Access URLs

### Development Environment
- **Onboarding Portal:** http://localhost:5173
- **Maintenance Portal:** http://localhost:3002
- **Landing Page:** http://localhost:5174

### API Endpoints
- **Onboarding API:** http://localhost:5001/api
- **Maintenance API:** http://localhost:3001/api

## Setup Instructions

### 1. Initial Setup
```bash
# Ensure both portals are running
./start-all.sh

# Run the demo data setup
./setup-demo-data.js
```

### 2. Verify Installation
```bash
# Run integration tests
./test-demo-integration.js
```

## Testing Workflows

### Complete Onboarding Flow
1. Open Onboarding Portal: http://localhost:5173
2. Login with: tech@demo.com / Demo123!
3. Use token: DEMO-TOKEN-2025
4. Navigate to Equipment section
5. Add new equipment or edit existing
6. Submit for manager review

### Manager Review Flow
1. Login with: manager@demo.com / Demo123!
2. Navigate to Review Dashboard
3. Review pending equipment
4. Approve or request changes
5. Check quality scores

### Portal Switching Flow
1. Login to Onboarding Portal as any user
2. Click user menu (top right)
3. Select "Switch to Maintenance Portal"
4. Verify automatic login to Maintenance Portal
5. Confirm same user context maintained

### Data Sync Test
1. Make changes in Onboarding Portal
2. Navigate to Admin Dashboard
3. Click "Export to Maintenance"
4. Verify data appears in Maintenance Portal

## Database Access

### SQLite (Maintenance Portal)
```bash
sqlite3 sms-app/backend/data/sms.db
.tables
SELECT * FROM companies WHERE name = 'Demo Marine Services';
SELECT * FROM users WHERE company_id = 1;
SELECT * FROM vessels WHERE company_id = 1;
```

### Prisma Studio (Onboarding Portal)
```bash
cd SMS-Onboarding-Unified
npx prisma studio
# Opens at http://localhost:5555
```

## Common Tasks

### Reset Demo Data
```bash
# Re-run setup to reset all demo data
./setup-demo-data.js
```

### Add More Demo Equipment
```sql
-- In Maintenance Portal SQLite
INSERT INTO equipment (vessel_id, name, manufacturer, model, serial_number, location, status, criticality)
VALUES (
  (SELECT id FROM vessels WHERE imo_number = '1234567'),
  'Fire Pump #1',
  'Alfa Laval',
  'MK200',
  'DEMO-FP-001',
  'Engine Room',
  'operational',
  'critical'
);
```

### Create Additional Demo Users
```javascript
// Add to DEMO_USERS array in setup-demo-data.js
{
  email: 'engineer@demo.com',
  password: 'Demo123!',
  firstName: 'Demo',
  lastName: 'Engineer',
  role: 'MANAGER',
  phone: '+1-555-100-1004'
}
```

## Troubleshooting

### Services Not Running
```bash
# Check service status
ps aux | grep node

# Restart all services
./stop-all.sh
./start-all.sh
```

### Database Connection Issues
```bash
# Test database connections
node test-database-connections.js

# Check PostgreSQL status (if using)
sudo systemctl status postgresql
```

### Authentication Issues
```bash
# Test auth bridge
node test-auth-bridge.js

# Clear browser cache and cookies
# Or use incognito/private browsing
```

## API Testing with cURL

### Login to Onboarding Portal
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo123!"}'
```

### Get Vessels
```bash
curl http://localhost:5001/api/vessels \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Switch Portals via Bridge
```bash
# Get bridge token
curl -X POST http://localhost:5001/api/auth/bridge/token \
  -H "Authorization: Bearer YOUR_ONBOARDING_TOKEN"

# Use bridge token for Maintenance Portal
curl -X POST http://localhost:3001/api/auth/bridge/validate \
  -H "Content-Type: application/json" \
  -d '{"bridgeToken":"YOUR_BRIDGE_TOKEN"}'
```

## Features to Demonstrate

1. **Multi-Portal Architecture**
   - Seamless authentication between portals
   - Shared user context
   - Role-based access control

2. **Equipment Management**
   - Add/Edit equipment with photos
   - Quality scoring system
   - Approval workflow

3. **Data Synchronization**
   - Export from Onboarding
   - Import to Maintenance
   - Maintain relationships

4. **Offline Capability** (Onboarding Portal)
   - Work without internet
   - Queue changes locally
   - Sync when connected

5. **Hidden Revenue Model**
   - 20% markup on parts (not visible to users)
   - Transparent pricing display
   - Backend profit tracking

## Demo Scenarios

### Scenario 1: New Vessel Onboarding
1. Admin creates onboarding token
2. Technician uses token to access vessel
3. Documents all equipment with photos
4. Manager reviews and approves
5. Data synced to maintenance portal

### Scenario 2: Emergency Repair
1. Technician reports critical fault
2. System notifies manager immediately
3. Parts ordered with hidden markup
4. Repair tracked and documented
5. Automatic maintenance schedule update

### Scenario 3: Compliance Audit
1. HSE Manager logs in
2. Reviews all safety equipment
3. Checks maintenance records
4. Exports compliance report
5. Schedules follow-up inspections

## Notes
- Demo data includes fully approved equipment for immediate testing
- All timestamps are recent to simulate active system
- Quality scores are set high (85-95%) for approved items
- Onboarding token (DEMO-TOKEN-2025) has 1-year validity
- Bridge configuration saved to `demo-bridge-config.json`

## Support
For issues or questions about the demo setup:
1. Check `RUNNING_SERVICES.md` for service management
2. Review `PROJECT_CONTEXT.md` for system overview
3. See individual portal README files for specific features