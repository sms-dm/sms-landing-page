# Backend Systems Analysis - Wave 1

## Executive Summary

This document provides a comprehensive analysis of the SMS backend systems, covering both the main maintenance application backend (`/sms-app/backend/`) and the onboarding portal backend (`/SMS-Onboarding-Unified/backend/`). The analysis reveals two distinct backend architectures serving different purposes within the SMS ecosystem.

## System Overview

### 1. SMS Maintenance Backend (`/sms-app/backend/`)
- **Technology Stack**: Node.js, Express, SQLite3, TypeScript
- **Purpose**: Core maintenance system for vessel equipment management
- **Architecture**: Monolithic REST API with SQLite database
- **Port**: 3001 (default)

### 2. SMS Onboarding Backend (`/SMS-Onboarding-Unified/backend/`)
- **Technology Stack**: Node.js, Express, PostgreSQL (via Prisma), TypeScript
- **Purpose**: Equipment onboarding and data quality management
- **Architecture**: Microservices-ready REST API with PostgreSQL
- **Port**: 3000 (default)

## API Architecture Overview

### SMS Maintenance Backend

#### Core Components
1. **Entry Point**: `src/index.ts`
   - Express server setup
   - CORS configuration
   - Route mounting
   - Error handling middleware
   - Static file serving for uploads

2. **Database Layer**: SQLite3
   - File-based database: `data/sms.db`
   - Promisified database methods
   - Schema initialization on startup
   - Foreign key constraints enabled

3. **Authentication**: JWT-based
   - Simple JWT implementation
   - Role-based access control
   - Demo user support

#### API Routes Structure
```
/api/
├── /auth
│   ├── POST /login
│   ├── GET /me
│   └── POST /logout
├── /companies
├── /equipment
│   ├── GET /qr/:qrCode
│   ├── GET /vessel/:vesselId
│   ├── GET /:id
│   ├── POST /
│   ├── GET /vessel/:vesselId/locations
│   └── GET /vessel/:vesselId/types
├── /faults
└── /health
```

### SMS Onboarding Backend

#### Core Components
1. **Entry Point**: `src/server.ts`
   - Advanced Express server setup
   - WebSocket support via Socket.io
   - Comprehensive security middleware (Helmet)
   - Compression and request logging
   - Graceful shutdown handling

2. **Database Layer**: PostgreSQL with Prisma ORM
   - Advanced schema with enums and relations
   - Row-level security support
   - Database health monitoring
   - Migration support

3. **Authentication**: Advanced JWT with refresh tokens
   - Access and refresh token separation
   - Token rotation on refresh
   - Password reset functionality
   - Session management

#### API Routes Structure (v1)
```
/api/v1/
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /refresh
│   ├── POST /logout
│   ├── POST /forgot-password
│   ├── POST /reset-password
│   ├── GET /me
│   ├── PATCH /me
│   └── POST /change-password
├── /companies
├── /vessels
├── /equipment
│   ├── GET /:equipmentId
│   ├── PATCH /:equipmentId
│   ├── DELETE /:equipmentId
│   ├── POST /:equipmentId/verify
│   ├── GET /:equipmentId/parts
│   ├── POST /:equipmentId/parts
│   ├── POST /:equipmentId/transfer
│   └── GET /:equipmentId/transfers
├── /parts
├── /files
├── /tokens
├── /integration
├── /sync
├── /analytics
├── /batch
├── /webhooks
├── /hse
├── /technician
├── /manager
│   └── /equipment
└── /verification
```

## Database Schema Analysis

### SMS Maintenance Backend (SQLite)

#### Core Tables
1. **companies**
   - Basic company information
   - Branding (colors, logo)
   - Unique slug identifier

2. **vessels**
   - Company association
   - IMO number tracking
   - Vessel type and status

3. **users**
   - Company association
   - Role-based permissions (technician, manager, admin)
   - Authentication credentials
   - Activity tracking

4. **equipment**
   - Vessel association
   - QR code tracking
   - Maintenance scheduling
   - Status management
   - Specifications (JSON)

5. **equipment_documents**
   - Document type categorization
   - File management
   - User upload tracking

6. **faults**
   - Equipment association
   - Fault type (critical/minor)
   - Status workflow
   - Resolution tracking
   - Downtime calculation

7. **parts_used**
   - Fault association
   - Cost tracking with markup
   - Quantity management

8. **maintenance_logs**
   - Equipment maintenance history
   - Parts replacement tracking
   - Next maintenance scheduling

9. **search_index & search_fts**
   - Full-text search capability
   - Document content indexing

### SMS Onboarding Backend (PostgreSQL)

#### Key Enums
- **UserRole**: SUPER_ADMIN, ADMIN, MANAGER, TECHNICIAN, HSE_OFFICER, VIEWER
- **EquipmentCriticality**: CRITICAL, IMPORTANT, STANDARD
- **EquipmentStatus**: PLANNED through DELETED (11 states)
- **EquipmentClassification**: PERMANENT, FLOATING, RENTAL
- **OnboardingStatus**: NOT_STARTED through EXPORTED

#### Core Models
1. **Company**
   - Multi-tenant support
   - Timezone and settings
   - Contact information

2. **User**
   - Advanced role management
   - Preferences (JSON)
   - Comprehensive audit trail
   - Multiple relationship types

3. **Vessel**
   - Detailed vessel information
   - IMO number tracking
   - Onboarding status
   - Metadata support

4. **Location**
   - Hierarchical structure
   - Path-based navigation
   - Sort ordering

5. **Equipment**
   - Comprehensive tracking
   - Quality scoring
   - Verification workflow
   - Document/review/approval tracking
   - Verification scheduling

6. **CriticalPart**
   - Inventory management
   - Stock tracking
   - Cross-referencing support

7. **Additional Models**
   - Document management
   - Quality scoring
   - Audit logging
   - Notifications
   - Equipment transfers
   - Offline sync support

## Authentication & Authorization

### SMS Maintenance Backend
- **Method**: Simple JWT with hardcoded secret
- **Token Expiry**: 7 days
- **Roles**: technician, manager, admin
- **Demo Support**: Hardcoded demo passwords
- **Specializations**: Electrician, Mechanic, HSE Officer, various managers

### SMS Onboarding Backend
- **Method**: Advanced JWT with separate access/refresh tokens
- **Access Token Expiry**: 7 days (configurable)
- **Refresh Token Expiry**: 30 days (configurable)
- **Token Rotation**: On refresh
- **Password Requirements**: Min 8 chars, upper/lower/digit/special
- **Rate Limiting**: Login, registration, password reset
- **Session Management**: Redis-based
- **Security Features**: Bcrypt hashing, token blacklisting

## Middleware Configuration

### SMS Maintenance Backend
1. **CORS**: Simple origin configuration
2. **Body Parsing**: JSON and URL-encoded
3. **Static Files**: Local uploads directory
4. **Error Handling**: Basic error middleware

### SMS Onboarding Backend
1. **Security (Helmet)**:
   - CSP configuration
   - Cross-origin resource policy
   - WebSocket support

2. **CORS**: Multi-origin support
3. **Compression**: Response compression
4. **Logging**: Morgan with Winston integration
5. **Rate Limiting**: 
   - Global API limiting
   - Endpoint-specific limits
   - Redis-backed for distributed systems

6. **File Upload**: 
   - Multer configuration
   - S3 integration (optional)
   - Local storage fallback

## Business Logic Organization

### SMS Maintenance Backend
- **Pattern**: Route handlers with inline logic
- **Database**: Direct SQL queries
- **Validation**: Manual in route handlers
- **Error Handling**: Try-catch blocks

### SMS Onboarding Backend
- **Pattern**: MVC with separate controllers
- **Database**: Prisma ORM with type safety
- **Validation**: Express-validator middleware
- **Error Handling**: Centralized error handling
- **Services**: 
  - Email service
  - Export service
  - Logger service
  - Quality service
  - S3 service
  - Scheduled tasks
  - Session management
  - WebSocket service

## Integration Points

### External Services
1. **Email Integration** (Onboarding):
   - SMTP configuration
   - Template-based emails
   - Password reset flow

2. **Storage Integration**:
   - AWS S3 (Onboarding)
   - Local file system (Both)

3. **Real-time Communication**:
   - WebSocket via Socket.io (Onboarding)

### Inter-system Communication
- Currently no direct integration between systems
- Separate authentication mechanisms
- Different database systems
- Potential for future webhook integration

## Performance Considerations

### SMS Maintenance Backend
1. **Database**: SQLite limitations for concurrent writes
2. **File Storage**: Local filesystem constraints
3. **Caching**: No caching layer implemented
4. **Connection Pooling**: Not applicable (SQLite)

### SMS Onboarding Backend
1. **Database**: 
   - PostgreSQL with connection pooling
   - Prisma query optimization
   - Database health monitoring

2. **Caching**:
   - Redis for session management
   - Rate limit tracking

3. **Scheduled Tasks**:
   - Cron-based task scheduling
   - Background job processing

4. **File Handling**:
   - Streaming for large files
   - S3 pre-signed URLs
   - Chunked uploads support

## Security Analysis

### Common Security Features
- JWT-based authentication
- Password hashing (bcrypt in Onboarding)
- CORS protection
- Input validation

### SMS Maintenance Backend Vulnerabilities
1. **Hardcoded Secrets**: JWT secret in code
2. **Demo Passwords**: Plain text comparison
3. **SQL Injection**: Raw SQL queries (though parameterized)
4. **No Rate Limiting**: Potential brute force attacks

### SMS Onboarding Backend Security
1. **Advanced Security**:
   - Helmet.js protection
   - Rate limiting
   - Input sanitization
   - SQL injection protection (Prisma)

2. **Authentication Security**:
   - Token rotation
   - Refresh token management
   - Password complexity requirements
   - Account lockout potential

## API Documentation

### Response Formats

#### Success Response (Maintenance)
```json
{
  "data": {...},
  "message": "Success"
}
```

#### Error Response (Maintenance)
```json
{
  "error": "Error message"
}
```

#### Success Response (Onboarding)
```json
{
  "data": {...},
  "message": "Success",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

#### Error Response (Onboarding)
```json
{
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "errors": [...] // Validation errors
}
```

## Recommendations

### Short-term Improvements
1. **Maintenance Backend**:
   - Move secrets to environment variables
   - Implement proper password hashing
   - Add rate limiting
   - Implement request validation

2. **Onboarding Backend**:
   - Complete TODO implementations
   - Add API documentation (Swagger)
   - Implement comprehensive logging
   - Add monitoring endpoints

### Long-term Considerations
1. **System Integration**:
   - Unified authentication system
   - Shared user management
   - Data synchronization
   - Event-driven architecture

2. **Scalability**:
   - Migrate Maintenance to PostgreSQL
   - Implement caching strategy
   - Add load balancing support
   - Consider microservices split

3. **Monitoring & Observability**:
   - APM integration
   - Distributed tracing
   - Centralized logging
   - Performance metrics

## Conclusion

The SMS backend consists of two separate systems serving different purposes. The Maintenance backend provides core functionality with a simpler architecture, while the Onboarding backend offers advanced features with better scalability and security. Both systems would benefit from integration and standardization to provide a unified platform for vessel equipment management.