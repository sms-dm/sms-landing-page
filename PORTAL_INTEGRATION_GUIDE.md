# SMS Portal Integration Guide

## Overview
This guide documents the integration process between the SMS Onboarding Portal and Maintenance Portal, including data export/import and authentication bridging.

## Architecture

### Portal Structure
1. **Onboarding Portal** (http://localhost:3001)
   - Frontend: React/Vite on port 3001
   - Backend: Express/TypeScript (integrated with frontend dev server)
   - Database: SQLite (development) / PostgreSQL (production)
   - Purpose: Initial vessel setup, equipment documentation, quality review

2. **Maintenance Portal** (http://localhost:3000)
   - Frontend: React on port 3000
   - Backend: Express/TypeScript on port 3005
   - Database: SQLite/PostgreSQL
   - Purpose: Daily operations, maintenance tracking, fault management

## Integration Flow

### 1. Data Export from Onboarding Portal

#### Export Endpoint
```
POST /api/integration/export-to-maintenance
Authorization: Bearer {onboarding_token}
```

#### Request Body
```json
{
  "vesselId": "uuid",
  "includePhotos": false,
  "format": "json"
}
```

#### Response Structure
```json
{
  "success": true,
  "exportId": "export-uuid",
  "data": {
    "vessel": {
      "id": "uuid",
      "name": "Vessel Name",
      "imo": "IMO1234567",
      "type": "General Cargo",
      "flag": "Panama",
      "company": {
        "id": "uuid",
        "name": "Company Name",
        "code": "CMP"
      },
      "specifications": {},
      "locations": []
    },
    "equipment": [{
      "id": "uuid",
      "name": "Main Engine",
      "code": "ME-001",
      "type": "engine",
      "manufacturer": "MAN",
      "model": "B&W",
      "serialNumber": "12345",
      "criticality": "CRITICAL",
      "location": {},
      "maintenanceSchedule": {
        "intervalDays": 30,
        "lastMaintenance": null,
        "nextMaintenance": "2024-02-01"
      },
      "specifications": {},
      "qualityScore": 85,
      "approvalDetails": {
        "documentedBy": "John Doe",
        "documentedAt": "2024-01-01T10:00:00Z",
        "reviewedBy": "Jane Smith",
        "reviewedAt": "2024-01-02T10:00:00Z",
        "approvedBy": "Manager Name",
        "approvedAt": "2024-01-03T10:00:00Z"
      }
    }],
    "parts": [{
      "id": "uuid",
      "equipmentId": "equipment-uuid",
      "equipmentName": "Main Engine",
      "name": "Oil Filter",
      "partNumber": "OF-123",
      "manufacturer": "Mann",
      "criticality": "CRITICAL",
      "quantity": 5,
      "minimumStock": 2,
      "currentStock": 5
    }],
    "documents": [],
    "metadata": {
      "exportId": "export-uuid",
      "exportDate": "2024-01-15T10:00:00Z",
      "exportedBy": "user-uuid",
      "format": "json",
      "includePhotos": false
    }
  },
  "maintenancePortalUrl": "http://localhost:3000/import/export-uuid"
}
```

### 2. Data Import to Maintenance Portal

#### Import Endpoint
```
POST /api/integration/import
Authorization: Bearer {maintenance_token}
```

#### Request Body
Use the complete `data` object from the export response.

#### Import Process
1. Creates/updates company record
2. Creates/updates vessel record
3. Imports all equipment with:
   - Automatic QR code generation if not provided
   - Status mapping (APPROVED → operational)
   - Location extraction from nested objects
4. Stores critical parts in equipment specifications
5. Returns import summary

#### Response Structure
```json
{
  "success": true,
  "message": "Import completed successfully",
  "data": {
    "importId": "export-uuid",
    "company": {
      "id": 1,
      "name": "Company Name"
    },
    "vessel": {
      "id": 1,
      "name": "Vessel Name",
      "imo": "IMO1234567"
    },
    "imported": {
      "equipment": 25,
      "parts": 150,
      "documents": 0
    }
  }
}
```

## Authentication Bridge

### Purpose
Allows seamless user authentication between portals without requiring separate logins.

### Bridge Token Structure
```typescript
interface BridgeTokenPayload {
  userId: string;
  email: string;
  role: string;
  companyId: string;
  companyName: string;
  portalOrigin: 'onboarding' | 'maintenance';
  issuedAt: number;
  expiresAt: number; // 5 minutes
}
```

### From Onboarding → Maintenance

#### 1. Generate Bridge Token
```
POST /api/auth-bridge/generate
Authorization: Bearer {onboarding_token}
```

Response:
```json
{
  "success": true,
  "bridgeToken": "jwt-token",
  "redirectUrl": "http://localhost:3000/auth/bridge?token=jwt-token",
  "expiresIn": 300
}
```

#### 2. Validate in Maintenance Portal
```
POST /api/auth-bridge/validate
{
  "bridgeToken": "jwt-token"
}
```

Response:
```json
{
  "success": true,
  "token": "maintenance-jwt-token",
  "user": {
    "id": 1,
    "email": "user@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "technician",
    "company": {
      "id": 1,
      "name": "Company Name",
      "slug": "company-name"
    }
  }
}
```

### Role Mapping

| Onboarding Role | Maintenance Role |
|----------------|------------------|
| SUPER_ADMIN    | admin           |
| ADMIN          | admin           |
| MANAGER        | manager         |
| TECHNICIAN     | technician      |
| HSE_OFFICER    | technician      |
| VIEWER         | technician      |

## Integration Testing

### Prerequisites
1. Both portals running
2. At least one vessel with approved equipment in Onboarding Portal
3. Valid user credentials

### Test Script
A test script is provided at `/home/sms/repos/SMS/test-portal-integration.js`

Run it with:
```bash
node test-portal-integration.js
```

### Manual Testing Steps

1. **Login to Onboarding Portal**
   - Navigate to http://localhost:3001
   - Login with admin credentials

2. **Export Vessel Data**
   - Go to vessel details
   - Click "Export to Maintenance"
   - Copy the export ID

3. **Generate Bridge Token**
   - In browser console: 
   ```javascript
   const response = await fetch('/api/auth-bridge/generate', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
   });
   const data = await response.json();
   window.open(data.redirectUrl);
   ```

4. **Verify in Maintenance Portal**
   - You should be automatically logged in
   - Check vessels list for imported vessel
   - Verify equipment and parts

## Common Issues and Solutions

### Issue: Export fails with "No approved equipment"
**Solution**: Ensure equipment has been reviewed and approved in Onboarding Portal

### Issue: Bridge token expired
**Solution**: Bridge tokens expire in 5 minutes. Generate a new one.

### Issue: User not created during bridge auth
**Solution**: Check company exists in target portal, verify role mapping

### Issue: Equipment not appearing after import
**Solution**: Check QR code conflicts, verify equipment status mapping

## API Status Endpoints

### Onboarding Portal
- Health: `GET /api/health`
- Auth Bridge: `GET /api/auth-bridge/health`

### Maintenance Portal  
- Health: `GET /api/health`
- Auth Bridge: `GET /api/auth-bridge/health`

## Security Considerations

1. **Bridge Secret**: Must be the same in both portals
   ```
   BRIDGE_SECRET=shared-bridge-secret-between-portals
   ```

2. **Token Expiry**: Bridge tokens expire in 5 minutes for security

3. **User Creation**: New users created via bridge auth get temporary passwords

4. **Audit Logging**: All exports and imports are logged in audit tables

## Future Enhancements

1. **File Transfer**: Currently documents/photos are not transferred
2. **Webhook Updates**: Progress webhooks are stubbed but not implemented
3. **Batch Operations**: Support for multiple vessel exports
4. **Conflict Resolution**: Better handling of duplicate equipment
5. **Two-way Sync**: Currently one-way from Onboarding to Maintenance