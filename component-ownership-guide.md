# Component Ownership Guide for Shadow Clone System

## Overview

This guide defines clear boundaries and ownership responsibilities for each component in the Smart Maintenance System, enabling effective parallel development by multiple specialized agents.

## 1. Service Boundaries and Ownership

### 1.1 Core Platform Services

#### Equipment Management Service
**Owner**: Backend Lead Agent (Team 1)
**Repository**: `sms-equipment-service`
**Port**: 3001

```yaml
Responsibilities:
  - Equipment CRUD operations
  - Equipment hierarchy management
  - Specification management
  - QR code generation/scanning
  - Equipment history tracking

API Endpoints:
  - /api/v1/equipment
  - /api/v1/equipment-types
  - /api/v1/equipment-specifications
  - /api/v1/equipment-history

Database Tables:
  - equipment
  - equipment_types
  - equipment_specifications
  - equipment_history
  - equipment_documents

External Dependencies:
  - Auth Service (for user context)
  - File Storage Service (for documents)
  - Notification Service (for alerts)
```

#### Fault Management Service
**Owner**: Backend Lead Agent (Team 1)
**Repository**: `sms-fault-service`
**Port**: 3002

```yaml
Responsibilities:
  - Fault ticket lifecycle
  - Priority management
  - Assignment workflow
  - Status tracking
  - Root cause analysis

API Endpoints:
  - /api/v1/faults
  - /api/v1/fault-categories
  - /api/v1/fault-assignments
  - /api/v1/fault-history

Database Tables:
  - faults
  - fault_categories
  - fault_assignments
  - fault_history
  - fault_attachments

External Dependencies:
  - Equipment Service (for equipment data)
  - User Service (for assignments)
  - Diagnostic Engine (for AI analysis)
  - Notification Service (for alerts)
```

#### User & Auth Service
**Owner**: Security Specialist Agent (Team 3)
**Repository**: `sms-auth-service`
**Port**: 3003

```yaml
Responsibilities:
  - User authentication
  - Authorization (RBAC)
  - Session management
  - API key management
  - Audit logging

API Endpoints:
  - /api/v1/auth/login
  - /api/v1/auth/logout
  - /api/v1/auth/refresh
  - /api/v1/users
  - /api/v1/roles
  - /api/v1/permissions

Database Tables:
  - users
  - roles
  - permissions
  - user_roles
  - sessions
  - api_keys
  - audit_logs

External Dependencies:
  - Redis (for session storage)
  - Notification Service (for auth emails)
```

### 1.2 AI/ML Services

#### Diagnostic Engine
**Owner**: ML Engineer Agent (Team 2)
**Repository**: `sms-diagnostic-engine`
**Port**: 8001

```yaml
Responsibilities:
  - Fault pattern analysis
  - Diagnostic recommendations
  - Confidence scoring
  - Model serving
  - Continuous learning

API Endpoints:
  - /api/v1/diagnose
  - /api/v1/recommendations
  - /api/v1/patterns
  - /api/v1/models/status

ML Models:
  - Fault classification model
  - Root cause analysis model
  - Recommendation engine
  - Anomaly detection model

External Dependencies:
  - Fault Service (for training data)
  - Equipment Service (for specifications)
  - Model Registry (for model versioning)
```

#### Predictive Maintenance Service
**Owner**: ML Engineer Agent (Team 2)
**Repository**: `sms-predictive-maintenance`
**Port**: 8002

```yaml
Responsibilities:
  - Failure prediction
  - Maintenance scheduling
  - Cost optimization
  - Performance tracking

API Endpoints:
  - /api/v1/predictions
  - /api/v1/maintenance-schedules
  - /api/v1/risk-assessment
  - /api/v1/optimization

ML Models:
  - Time series forecasting
  - Survival analysis
  - Optimization algorithms

External Dependencies:
  - TimescaleDB (for sensor data)
  - Equipment Service (for equipment data)
  - Analytics Service (for reporting)
```

### 1.3 Frontend Applications

#### Web Application
**Owner**: Frontend Lead Agent (Team 1)
**Repository**: `sms-web-app`
**Port**: 3000

```yaml
Technology Stack:
  - Next.js 13+ (App Router)
  - React 18+
  - TypeScript
  - Redux Toolkit
  - Material-UI v5
  - React Query

Key Features:
  - Dashboard views
  - Equipment management UI
  - Fault reporting interface
  - Analytics dashboards
  - User management
  - Real-time notifications

Folder Structure:
  /app              # Next.js app router
  /components       # Reusable components
  /features         # Feature-specific code
  /hooks           # Custom React hooks
  /lib             # Utilities and helpers
  /services        # API client services
  /store           # Redux store
  /styles          # Global styles
```

#### Mobile Application
**Owner**: UI/UX Developer Agent (Team 4)
**Repository**: `sms-mobile-app`

```yaml
Technology Stack:
  - React Native
  - TypeScript
  - Redux Toolkit
  - React Navigation
  - React Native Paper

Key Features:
  - Offline-first architecture
  - QR code scanning
  - Push notifications
  - Photo/video capture
  - Location services

Platform Support:
  - iOS 13+
  - Android 8+
```

### 1.4 Infrastructure Services

#### API Gateway
**Owner**: Integration Specialist Agent (Team 4)
**Repository**: `sms-api-gateway`
**Port**: 8080

```yaml
Responsibilities:
  - Request routing
  - Authentication validation
  - Rate limiting
  - API versioning
  - Request/response transformation

Configuration:
  - Kong configuration
  - Route definitions
  - Plugin configurations
  - Rate limit rules
```

#### Message Queue Service
**Owner**: Integration Specialist Agent (Team 4)
**Repository**: `sms-message-queue`

```yaml
Components:
  - Kafka setup and configuration
  - Topic definitions
  - Consumer groups
  - Schema registry

Topics:
  - equipment-events
  - fault-events
  - notification-events
  - analytics-events
  - sync-events
```

## 2. Shared Components and Libraries

### 2.1 Common Libraries

#### SMS Common Library
**Owner**: Backend Lead Agent
**Repository**: `sms-common`
**Package**: `@sms/common`

```typescript
// Shared interfaces
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Shared utilities
export const utilities = {
  validation: ValidationHelpers,
  formatting: FormatHelpers,
  crypto: CryptoHelpers,
};

// Shared constants
export const constants = {
  API_VERSIONS: ['v1', 'v2'],
  DEFAULT_PAGE_SIZE: 50,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};
```

#### SMS UI Component Library
**Owner**: UI/UX Developer Agent
**Repository**: `sms-ui-components`
**Package**: `@sms/ui-components`

```typescript
// Reusable components
export { Button } from './Button';
export { DataTable } from './DataTable';
export { Chart } from './Chart';
export { FormField } from './FormField';
export { Card } from './Card';
export { Modal } from './Modal';

// Theme configuration
export { theme } from './theme';
export { ThemeProvider } from './ThemeProvider';
```

## 3. Database Schema Ownership

### 3.1 Schema Organization

```sql
-- Core schemas
CREATE SCHEMA core;      -- Shared core tables
CREATE SCHEMA equipment; -- Equipment service tables
CREATE SCHEMA faults;    -- Fault service tables
CREATE SCHEMA users;     -- User service tables
CREATE SCHEMA analytics; -- Analytics service tables

-- Tenant schemas (dynamic)
CREATE SCHEMA tenant_${tenant_id};
```

### 3.2 Cross-Service Data Access

```yaml
Read-Only Access Patterns:
  - Equipment Service → Users (for created_by)
  - Fault Service → Equipment (for equipment details)
  - Analytics Service → All services (for reporting)

API-Based Access:
  - Services must use APIs for write operations
  - Direct database access only for reads within service
  - Materialized views for cross-service reporting
```

## 4. Integration Points

### 4.1 Service-to-Service Communication

```yaml
Synchronous (REST):
  - User authentication checks
  - Equipment details lookup
  - Real-time validations

Asynchronous (Message Queue):
  - Fault creation notifications
  - Analytics event streaming
  - Background processing tasks
  - Data synchronization

GraphQL Federation:
  - Unified API for frontend
  - Service-specific schemas
  - Automatic schema stitching
```

### 4.2 Event Definitions

```typescript
// Equipment Events
interface EquipmentCreatedEvent {
  eventType: 'equipment.created';
  payload: {
    equipmentId: string;
    vesselId: string;
    type: string;
    specifications: Record<string, any>;
  };
  metadata: EventMetadata;
}

// Fault Events
interface FaultCreatedEvent {
  eventType: 'fault.created';
  payload: {
    faultId: string;
    equipmentId: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
  };
  metadata: EventMetadata;
}

// Common Event Metadata
interface EventMetadata {
  timestamp: string;
  userId: string;
  tenantId: string;
  correlationId: string;
}
```

## 5. Development Workflow

### 5.1 Repository Structure

```
sms-platform/
├── services/
│   ├── equipment-service/
│   ├── fault-service/
│   ├── auth-service/
│   ├── diagnostic-engine/
│   └── ...
├── applications/
│   ├── web-app/
│   └── mobile-app/
├── libraries/
│   ├── common/
│   └── ui-components/
├── infrastructure/
│   ├── kubernetes/
│   ├── terraform/
│   └── docker/
└── docs/
    ├── architecture/
    ├── api/
    └── deployment/
```

### 5.2 CI/CD Pipeline Ownership

```yaml
Pipeline Stages:
  - Code Quality: All agents
  - Unit Tests: Service owner
  - Integration Tests: Integration Specialist
  - Security Scan: Security Specialist
  - Build & Package: DevOps Engineer
  - Deploy to Staging: DevOps Engineer
  - E2E Tests: QA Automation Agent
  - Deploy to Production: DevOps Engineer
```

## 6. Communication Protocols

### 6.1 API Contracts

```yaml
Contract Definition:
  - OpenAPI 3.0 specifications
  - Shared in central repository
  - Version controlled
  - Auto-generated client SDKs

Contract Testing:
  - Consumer-driven contracts
  - Pact framework
  - Automated validation
```

### 6.2 Data Formats

```yaml
Request/Response:
  - Format: JSON
  - Date Format: ISO 8601
  - Pagination: Cursor-based
  - Errors: RFC 7807 (Problem Details)

Events:
  - Format: CloudEvents 1.0
  - Serialization: JSON/Avro
  - Schema Registry: Confluent
```

## 7. Security Boundaries

### 7.1 Service Authentication

```yaml
Internal Services:
  - mTLS between services
  - Service accounts with limited scope
  - Short-lived tokens
  - Audit logging

External APIs:
  - API Gateway authentication
  - OAuth2 for third-party access
  - Rate limiting per client
  - IP whitelisting (optional)
```

### 7.2 Data Access Control

```yaml
Database Access:
  - Service-specific database users
  - Read-only replicas for analytics
  - Encrypted connections
  - Row-level security for multi-tenancy

File Storage:
  - Pre-signed URLs for uploads
  - Bucket policies per service
  - Encryption at rest
  - Access logging
```

## 8. Monitoring & Observability Ownership

### 8.1 Service Metrics

```yaml
Service Owner Responsibilities:
  - Application metrics (custom)
  - Business metrics
  - SLI/SLO definition
  - Alert rules

DevOps Responsibilities:
  - Infrastructure metrics
  - Platform monitoring
  - Incident response
  - Capacity planning
```

### 8.2 Distributed Tracing

```yaml
Implementation:
  - OpenTelemetry SDK in each service
  - Trace context propagation
  - Sampling configuration
  - Custom span attributes

Ownership:
  - Service owners: Instrument code
  - DevOps: Maintain infrastructure
  - Integration team: Cross-service traces
```

## 9. Testing Strategy

### 9.1 Test Ownership

```yaml
Unit Tests:
  - Owner: Service developer
  - Coverage: 80% minimum
  - Location: Within service repo

Integration Tests:
  - Owner: Service developer + Integration team
  - Scope: Service boundaries
  - Location: Service repo

E2E Tests:
  - Owner: QA Automation team
  - Scope: User journeys
  - Location: Separate test repo

Performance Tests:
  - Owner: Performance team + Service owner
  - Scope: Service-specific + system-wide
  - Location: Performance test repo
```

### 9.2 Test Data Management

```yaml
Strategies:
  - Fixtures for unit tests
  - Test containers for integration tests
  - Synthetic data for E2E tests
  - Anonymized production data for performance tests

Ownership:
  - Test data generation: Service owners
  - Test environment: DevOps team
  - Data privacy: Security team
```

## 10. Documentation Ownership

### 10.1 Documentation Types

```yaml
API Documentation:
  - Owner: Service developer
  - Format: OpenAPI + examples
  - Location: Within service repo

Architecture Documentation:
  - Owner: Architecture team
  - Format: ADRs + diagrams
  - Location: Central docs repo

Runbooks:
  - Owner: Service owner + DevOps
  - Format: Markdown + scripts
  - Location: Service repo + wiki

User Documentation:
  - Owner: Technical writers + Product team
  - Format: User guides + videos
  - Location: Documentation portal
```

This component ownership guide provides clear boundaries and responsibilities for each team member in the Shadow Clone System, enabling effective parallel development while maintaining system coherence and quality.