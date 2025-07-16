# SMS Onboarding Portal API Documentation

## Overview

The SMS Onboarding Portal API is a RESTful API that manages vessel onboarding, equipment documentation, critical parts management, and integration with the maintenance portal. This API follows REST principles and uses JWT for authentication.

## Base URLs

- **Production**: `https://api.sms-onboarding.com/v1`
- **Staging**: `https://staging-api.sms-onboarding.com/v1`
- **Development**: `http://localhost:4000/v1`

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

1. **Register** - Create a new user account
2. **Login** - Authenticate with email and password to receive a JWT token
3. **Refresh** - Use refresh token to get a new access token

## API Specification

The complete OpenAPI 3.0 specification is available at `/api-specification.yaml`. You can view it in Swagger UI at `/api-docs`.

## Core Endpoints

### Authentication (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `GET /auth/me` - Get current user profile
- `PATCH /auth/me` - Update current user profile

### Companies (`/companies`)
- `GET /companies` - List companies (Admin only)
- `POST /companies` - Create company (Admin only)
- `GET /companies/{companyId}` - Get company details
- `PATCH /companies/{companyId}` - Update company (Admin only)
- `DELETE /companies/{companyId}` - Delete company (Admin only)

### Vessels (`/vessels`)
- `GET /vessels` - List vessels with filtering
- `POST /vessels` - Create vessel (Admin only)
- `GET /vessels/{vesselId}` - Get vessel details
- `PATCH /vessels/{vesselId}` - Update vessel (Admin/Manager)
- `DELETE /vessels/{vesselId}` - Delete vessel (Admin only)
- `GET /vessels/{vesselId}/onboarding-progress` - Get onboarding progress
- `GET /vessels/{vesselId}/equipment` - List vessel equipment
- `POST /vessels/{vesselId}/equipment` - Add equipment (Admin/Technician)

### Equipment (`/equipment`)
- `GET /equipment/{equipmentId}` - Get equipment details
- `PATCH /equipment/{equipmentId}` - Update equipment
- `DELETE /equipment/{equipmentId}` - Delete equipment (Admin only)
- `POST /equipment/{equipmentId}/verify` - Verify equipment (Manager only)
- `GET /equipment/{equipmentId}/parts` - List equipment parts
- `POST /equipment/{equipmentId}/parts` - Add part to equipment

### Parts (`/parts`)
- `GET /parts/{partId}` - Get part details
- `PATCH /parts/{partId}` - Update part
- `DELETE /parts/{partId}` - Delete part (Admin only)
- `POST /parts/cross-reference` - Find cross-reference parts

### Files (`/files`)
- `POST /files/upload` - Upload single file
- `POST /files/batch-upload` - Upload multiple files
- `GET /files/{fileId}` - Get file metadata
- `DELETE /files/{fileId}` - Delete file
- `GET /files/{fileId}/download` - Get presigned download URL

### Tokens (`/tokens`)
- `GET /tokens` - List onboarding tokens (Admin/Manager)
- `POST /tokens` - Generate token (Admin only)
- `GET /tokens/{tokenId}` - Get token details
- `DELETE /tokens/{tokenId}` - Revoke token (Admin only)
- `POST /tokens/validate` - Validate token (No auth required)

### Integration (`/integration`)
- `POST /integration/maintenance-portal/export` - Export to maintenance portal
- `POST /integration/maintenance-portal/sync-users` - Sync users from maintenance
- `POST /integration/webhooks/progress` - Webhook for progress updates

### Sync (`/sync`)
- `POST /sync/push` - Push offline changes
- `POST /sync/pull` - Pull latest changes

### Analytics (`/analytics`)
- `GET /analytics/quality-scores` - Get quality score analytics
- `GET /analytics/onboarding-metrics` - Get onboarding metrics

### Batch Operations (`/batch`)
- `POST /batch/equipment` - Batch create/update/delete equipment
- `POST /batch/parts` - Batch create/update/delete parts

## Request/Response Format

### Standard Response Format

```json
{
  "data": { ... },      // Response data
  "pagination": {       // For list endpoints
    "page": 1,
    "limit": 25,
    "total": 100,
    "totalPages": 4
  }
}
```

### Error Response Format

```json
{
  "code": "ERROR_CODE",
  "message": "Human readable error message",
  "details": { ... }    // Optional additional details
}
```

### Common HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `413 Payload Too Large` - File too large
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Pagination

List endpoints support pagination with these query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 25, max: 100)
- `sort` - Sort order (format: `field:asc` or `field:desc`)
- `search` - Search query

## Filtering

Most list endpoints support filtering:
- Vessels: `companyId`, `status`, `onboardingStatus`
- Equipment: `type`, `status`, `criticalLevel`, `location`
- Parts: `category`, `criticalLevel`, `lowStock`
- Tokens: `vesselId`, `status`

## File Upload

### Single File Upload
```bash
curl -X POST /files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/file.jpg" \
  -F "type=photo" \
  -F "entityType=equipment" \
  -F "entityId=<uuid>"
```

### Batch Upload
```bash
curl -X POST /files/batch-upload \
  -H "Authorization: Bearer <token>" \
  -F "files=@file1.jpg" \
  -F "files=@file2.jpg" \
  -F 'metadata=[{"type":"photo","entityType":"equipment","entityId":"..."}]'
```

## Webhooks

### Webhook Security
- All webhooks require signature validation
- Signature is sent in `X-Webhook-Signature` header
- Calculate signature: `HMAC-SHA256(payload, webhook_secret)`

### Webhook Events
- `equipment.added` - New equipment added
- `equipment.updated` - Equipment updated
- `equipment.verified` - Equipment verified by manager
- `vessel.completed` - Vessel onboarding completed

## Offline Sync

### Push Changes
```json
{
  "changes": [
    {
      "id": "change-uuid",
      "entityType": "equipment",
      "entityId": "equipment-uuid",
      "action": "update",
      "data": { ... },
      "timestamp": "2024-01-01T00:00:00Z",
      "version": 1
    }
  ],
  "lastSyncTimestamp": "2024-01-01T00:00:00Z",
  "deviceId": "device-uuid"
}
```

### Pull Changes
```json
{
  "lastSyncTimestamp": "2024-01-01T00:00:00Z",
  "entityTypes": ["vessels", "equipment", "parts"],
  "vesselIds": ["vessel-uuid-1", "vessel-uuid-2"]
}
```

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Authenticated**: 1000 requests per minute per user
- **File uploads**: 10 uploads per minute per user

## Security

### Authentication Requirements
- Passwords must be at least 8 characters
- Must contain uppercase, lowercase, numbers, and special characters
- JWT tokens expire after 7 days (configurable)

### Data Encryption
- All data encrypted at rest (AES-256)
- TLS 1.2+ required for all connections
- Sensitive fields encrypted in database

### Compliance
- IMO 2021 compliance
- IACS UR E26/E27 compliance
- Complete audit trails maintained

## Example Workflows

### 1. Vessel Onboarding Flow

```bash
# 1. Admin generates token
POST /tokens
{
  "vesselId": "vessel-uuid",
  "validUntil": "2024-12-31T23:59:59Z",
  "permissions": ["VIEW_VESSEL", "ADD_EQUIPMENT", "UPLOAD_PHOTOS"]
}

# 2. Technician validates token
POST /tokens/validate
{
  "token": "onboarding-token"
}

# 3. Technician adds equipment
POST /vessels/{vesselId}/equipment
{
  "name": "Main Engine",
  "type": "ENGINE",
  "manufacturer": "MAN B&W",
  ...
}

# 4. Manager verifies equipment
POST /equipment/{equipmentId}/verify
{
  "qualityScore": 85,
  "notes": "Well documented"
}

# 5. Export to maintenance portal
POST /integration/maintenance-portal/export
{
  "vesselId": "vessel-uuid",
  "includePhotos": true
}
```

### 2. Cross-Reference Parts

```bash
POST /parts/cross-reference
{
  "partNumber": "ABC-123",
  "manufacturer": "ACME Corp",
  "vesselId": "vessel-uuid"
}

# Response includes alternative parts and usage across vessels
```

### 3. Offline Sync

```bash
# 1. Pull latest changes before going offline
POST /sync/pull
{
  "lastSyncTimestamp": "2024-01-01T00:00:00Z",
  "vesselIds": ["vessel-uuid"]
}

# 2. Work offline, queue changes locally

# 3. Push changes when back online
POST /sync/push
{
  "changes": [...],
  "lastSyncTimestamp": "2024-01-01T00:00:00Z"
}
```

## SDK Support

Official SDKs available for:
- JavaScript/TypeScript
- Python
- Java
- .NET

## Support

- Email: api-support@sms-portal.com
- Documentation: https://docs.sms-portal.com
- Status Page: https://status.sms-portal.com