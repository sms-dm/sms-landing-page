# SMS Project - API & Integration Mapping

## Table of Contents
1. [System Overview](#system-overview)
2. [API Architecture](#api-architecture)
3. [Portal APIs](#portal-apis)
4. [Authentication & Security](#authentication--security)
5. [External Service Integrations](#external-service-integrations)
6. [Portal-to-Portal Integration](#portal-to-portal-integration)
7. [WebSocket Real-time Communication](#websocket-real-time-communication)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Integration Requirements](#integration-requirements)

## System Overview

The SMS project consists of two main portals that need to communicate and share data:

1. **Maintenance Portal** (`/sms-app`)
   - Backend: Express.js on port 3001
   - Frontend: React on port 3000
   - Database: SQLite (sms.db)
   - Purpose: Operational maintenance management

2. **Onboarding Portal** (`/SMS-Onboarding`)
   - Backend: Express.js API
   - Frontend: Multiple apps (Admin Portal, Tech App)
   - Database: PostgreSQL with Prisma ORM
   - Purpose: Vessel and equipment onboarding

## API Architecture

### Base URLs
```
Maintenance Portal API: http://localhost:3001/api
Onboarding Portal API: http://localhost:3001/api
Tech App API: http://localhost:3001/api
```

### API Standards
- RESTful design principles
- JSON request/response format
- JWT-based authentication
- Rate limiting on sensitive endpoints
- CORS enabled for cross-origin requests

## Portal APIs

### Maintenance Portal APIs

#### Authentication Endpoints
```
POST   /api/auth/login
       Body: { email, password }
       Response: { token, user, dashboardUrl }

GET    /api/auth/me
       Headers: Authorization: Bearer <token>
       Response: { user details }

POST   /api/auth/logout
       Headers: Authorization: Bearer <token>
       Response: { message }
```

#### Company Management
```
GET    /api/companies
       Response: [{ id, name, slug, vessel_count, user_count }]

GET    /api/companies/slug/:slug
       Response: { id, name, slug, logo_url, colors }

GET    /api/companies/:companyId/vessels
       Response: [{ id, name, imo_number, vessel_type, status }]
```

#### Equipment Management
```
GET    /api/equipment/qr/:qrCode
       Response: { equipment details with vessel info }

GET    /api/equipment/vessel/:vesselId
       Query: ?location=&type=&status=
       Response: [{ equipment list }]

GET    /api/equipment/:id
       Response: { equipment details, documents, faults, maintenance }

POST   /api/equipment
       Body: { vessel_id, name, manufacturer, model, etc. }
       Response: { id, qr_code }

GET    /api/equipment/vessel/:vesselId/locations
       Response: [{ location, equipment_count }]

GET    /api/equipment/vessel/:vesselId/types
       Response: [{ equipment_type, equipment_count }]
```

#### Fault Management
```
POST   /api/faults
       Body: { equipment_id, reported_by, fault_type, description, parts_used }
       Response: { id, message }

GET    /api/faults/vessel/:vesselId/active
       Response: [{ active faults with equipment info }]

PATCH  /api/faults/:id/status
       Body: { status, resolution, root_cause }
       Response: { message }

GET    /api/faults/stats/:vesselId
       Response: { statusCounts, avgResolutionTime, typeCounts, topLocations }

GET    /api/faults/revenue/:vesselId
       Response: { parts: [], totals: { costs and markup } }
```

### Onboarding Portal APIs

#### Authentication & Authorization
```
POST   /api/auth/login
       Body: { email, password }
       Response: { accessToken, refreshToken (httpOnly cookie), user }

POST   /api/auth/register
       Body: { email, password, name, role }
       Response: { user }

POST   /api/auth/refresh
       Cookie/Body: refreshToken
       Response: { accessToken, refreshToken }

POST   /api/auth/logout
       Headers: Authorization: Bearer <token>
       Response: { message }

POST   /api/auth/change-password
       Body: { currentPassword, newPassword }
       Response: { message }

GET    /api/auth/me
       Headers: Authorization: Bearer <token>
       Response: { user }

POST   /api/auth/forgot-password
       Body: { email }
       Response: { message }

POST   /api/auth/reset-password
       Body: { token, newPassword }
       Response: { message }
```

#### Tech Authentication
```
POST   /api/auth/tech/login
       Body: { accessCode, deviceId, deviceInfo }
       Response: { token, techId, permissions, profile }

POST   /api/auth/tech/validate
       Headers: Authorization: Bearer <tech-token>
       Response: { valid, techId, permissions }

POST   /api/auth/tech/refresh
       Body: { deviceId }
       Response: { token }

POST   /api/auth/tech/generate-code
       Body: { techId, expiresIn }
       Response: { accessCode, techId, expiresAt }

GET    /api/auth/tech/permissions
       Response: { techId, permissions }
```

#### Admin Management
```
GET    /api/admin/dashboard
       Response: { stats, recentActivity, alerts }

GET    /api/admin/users
       Query: ?page=&limit=&role=&search=
       Response: { users[], pagination }

PUT    /api/admin/users/:userId/role
       Body: { role }
       Response: { user }

POST   /api/admin/users/:userId/deactivate
       Response: { message }

GET    /api/admin/technicians
       Query: ?status=&page=&limit=
       Response: { technicians[], pagination }

GET    /api/admin/security/sessions
       Response: { sessions[] }

DELETE /api/admin/security/sessions/:sessionId
       Response: { message }

GET    /api/admin/audit-log
       Query: ?page=&limit=&userId=&action=
       Response: { logs[], pagination }
```

#### Onboarding Process
```
GET    /api/onboarding/progress
       Query: ?companyId=&vesselId=&stage=&status=
       Response: { progress details }

POST   /api/onboarding/start
       Body: { companyId, vesselId }
       Response: { session details }

PUT    /api/onboarding/:id/progress
       Body: { completedSteps, qualityScore, missingData, metadata }
       Response: { updated progress }

POST   /api/onboarding/:id/next-stage
       Body: { notes }
       Response: { stage transition details }

POST   /api/onboarding/:id/assign
       Body: { technicianId }
       Response: { assignment details }

POST   /api/onboarding/:id/review
       Body: { action: 'approve'|'reject', comments }
       Response: { review result }

GET    /api/onboarding/analytics
       Response: { analytics data }
```

#### Integration & Export
```
POST   /api/integrations/export/:vesselId
       Body: { format, include_photos, include_documents, chunk_size, compress }
       Response: { exportData }

POST   /api/integrations/import
       Body: { import data }
       Response: { success, imported[], errors[] }

GET    /api/integrations/progress/:vesselId
       Response: { progress data }

POST   /api/integrations/webhooks/:vesselId
       Body: { url, secret, events[], active, retry_count, retry_delay }
       Response: { message }

GET    /api/integrations/webhooks/:vesselId/status
       Response: { webhook status }

POST   /api/integrations/webhooks/:vesselId/test
       Body: { event_type }
       Response: { message }

POST   /api/integrations/validate
       Body: { data to validate }
       Response: { validation result }

GET    /api/integrations/limits/:count
       Response: { limits validation }
```

#### Analytics & Reporting
```
GET    /api/analytics/dashboard
       Query: ?startDate=&endDate=&vesselId=
       Response: { analytics data }

GET    /api/analytics/reports/:type
       Query: ?filters
       Response: { report data }

POST   /api/analytics/export
       Body: { reportType, filters, format }
       Response: { download URL }
```

#### Opportunities & Revenue
```
GET    /api/opportunities/vessel/:id
       Response: { opportunity report }

GET    /api/opportunities/vessel/:id/documents
       Response: { missing documents }

POST   /api/opportunities/track
       Body: { equipmentId, vesselId, documentType, equipmentName, etc. }
       Response: { tracked document }

POST   /api/opportunities/track/bulk
       Body: { documents[] }
       Response: { tracked count and documents }

GET    /api/opportunities
       Query: ?vesselId=&companyId=&documentType=&status=&minValue=&maxValue=
       Response: { opportunities[] }

GET    /api/opportunities/statistics
       Response: { statistics }

PUT    /api/opportunities/:id/status
       Body: { status }
       Response: { updated document }

DELETE /api/opportunities/:id
       Response: 204 No Content

GET    /api/opportunities/projection
       Query: ?period=&companyId=&vesselId=
       Response: { revenue projections }
```

#### Proposals
```
POST   /api/proposals/generate
       Body: { vesselId, opportunityIds[], template }
       Response: { proposal }

GET    /api/proposals/:id
       Response: { proposal details }

PUT    /api/proposals/:id
       Body: { updates }
       Response: { updated proposal }

POST   /api/proposals/:id/send
       Body: { recipients[], message }
       Response: { send status }
```

## Authentication & Security

### JWT Token Structure
```javascript
// Access Token Payload
{
  userId: string,
  email: string,
  role: 'admin' | 'manager' | 'technician',
  companyId?: string,
  permissions?: string[],
  iat: number,
  exp: number
}

// Tech Token Payload
{
  techId: string,
  deviceId: string,
  permissions: string[],
  iat: number,
  exp: number
}
```

### Security Features
1. **Token Management**
   - Access tokens: 15-minute expiry
   - Refresh tokens: 7-day expiry (httpOnly cookies)
   - Token blacklisting on logout
   - Device-specific tokens for tech app

2. **Rate Limiting**
   - Login endpoints: 5 attempts per 15 minutes
   - API endpoints: 100 requests per 15 minutes per user
   - Tech login: 3 attempts per device per 15 minutes

3. **Session Management**
   - Server-side session tracking
   - Session invalidation on security events
   - Concurrent session limits

4. **Middleware Stack**
   ```javascript
   authenticate → authorize(roles) → sessionMiddleware → rateLimitByUser → endpoint
   ```

## External Service Integrations

### AWS S3 Storage
```javascript
// Configuration
{
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: process.env.AWS_S3_BUCKET
}

// Usage
- Equipment photos
- Document storage
- Export files
- Backup storage
```

### Email Service (Planned)
```javascript
// Email Templates
- Welcome emails
- Password reset
- Notifications
- Reports

// Integration Options
- AWS SES
- SendGrid
- SMTP
```

### Payment Systems (Not Implemented)
Currently, the system tracks revenue through parts markup and opportunities but doesn't process payments directly.

## Portal-to-Portal Integration

### Integration Points

1. **Data Export/Import**
   - Onboarding → Maintenance: Equipment and vessel data
   - Format: JSON with optional compression
   - Validation: Schema-based validation
   - Chunking: Support for large datasets

2. **Webhook Communication**
   ```javascript
   // Webhook Events
   - ONBOARDING_PROGRESS
   - ONBOARDING_COMPLETED
   - QUALITY_SCORE_CHANGED
   - EQUIPMENT_UPDATED
   - DOCUMENT_UPLOADED
   ```

3. **Authentication Sharing**
   - Shared JWT secret for inter-portal communication
   - Service-to-service authentication tokens
   - Cross-portal user session validation

4. **Data Synchronization**
   ```javascript
   // Sync Points
   - User accounts
   - Company information
   - Vessel details
   - Equipment registry
   - Maintenance history
   ```

## WebSocket Real-time Communication

### WebSocket Events
```javascript
// Workflow Events
workflow:updated
workflow:stage_changed
workflow:deadline_approaching

// Notification Events
notification:new
notification:read

// Sync Events
sync:started
sync:progress
sync:completed
sync:failed

// Connection Events
connection:connected
connection:disconnected
connection:reconnecting
connection:error
```

### WebSocket Message Format
```javascript
{
  type: WebSocketEventType,
  payload: any,
  timestamp: Date,
  userId?: string
}
```

### Connection Management
- Automatic reconnection with exponential backoff
- Message queuing during disconnection
- Heartbeat mechanism (30-second intervals)
- Authentication via query parameters

## Data Flow Diagrams

### 1. Onboarding to Maintenance Flow
```
Tech App → Capture Data → Onboarding API → Review Process → 
Export API → Validation → Import to Maintenance → Active Operations
```

### 2. Authentication Flow
```
User Login → Validate Credentials → Generate Tokens → 
Set Refresh Cookie → Return Access Token → Authenticated Requests
```

### 3. Real-time Update Flow
```
Client Action → API Update → Database Change → 
WebSocket Broadcast → Connected Clients → UI Update
```

### 4. File Upload Flow
```
Client Select File → Validate Type/Size → Upload to API → 
Store in S3/Local → Generate URL → Save Reference → Return URL
```

## Integration Requirements

### Technical Requirements
1. **API Gateway** (Recommended)
   - Centralized routing
   - Rate limiting
   - API key management
   - Request/response transformation

2. **Message Queue** (For async operations)
   - Webhook delivery
   - Export processing
   - Email notifications
   - Background jobs

3. **Caching Layer**
   - Redis for session storage
   - API response caching
   - Real-time data caching

4. **Monitoring & Logging**
   - API request logging
   - Error tracking
   - Performance monitoring
   - Security audit logs

### Security Requirements
1. **API Security**
   - HTTPS enforcement
   - API key rotation
   - IP whitelisting for service-to-service
   - Request signing for webhooks

2. **Data Protection**
   - Encryption at rest
   - Encryption in transit
   - PII data masking
   - GDPR compliance

### Scalability Considerations
1. **Load Balancing**
   - Multiple API instances
   - WebSocket server clustering
   - Database read replicas

2. **Performance Optimization**
   - Connection pooling
   - Query optimization
   - Lazy loading
   - Pagination on all list endpoints

### Integration Testing
1. **API Testing**
   - Unit tests for all endpoints
   - Integration tests for workflows
   - Load testing for performance
   - Security testing

2. **Portal Integration Testing**
   - End-to-end workflow tests
   - Data consistency validation
   - Webhook delivery verification
   - Error handling scenarios