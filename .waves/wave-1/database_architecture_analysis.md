# SMS Database Architecture Analysis
## Wave 1: Complete Database & Data Architecture Documentation

### Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Database Systems Comparison](#database-systems-comparison)
4. [SQLite Schema (Maintenance Portal)](#sqlite-schema-maintenance-portal)
5. [PostgreSQL Schema (Onboarding Portal)](#postgresql-schema-onboarding-portal)
6. [Data Flow Architecture](#data-flow-architecture)
7. [Data Migration Strategy](#data-migration-strategy)
8. [Performance Optimization](#performance-optimization)
9. [Data Integrity & Security](#data-integrity--security)
10. [Integration Requirements](#integration-requirements)
11. [Recommendations](#recommendations)

---

## Executive Summary

The SMS project utilizes a dual-database architecture:
- **SQLite** for the Maintenance Portal (lightweight, embedded, single-tenant)
- **PostgreSQL** for the Onboarding Portal (robust, multi-tenant, enterprise-grade)

This analysis documents both database schemas comprehensively, identifies data flow patterns, and provides recommendations for optimization and integration.

### Key Findings
- Both systems share similar domain models but differ in implementation complexity
- PostgreSQL system includes advanced features: RLS, materialized views, audit trails
- SQLite system is simpler but lacks multi-tenancy and advanced security features
- Data migration path exists but requires careful transformation

---

## System Overview

### Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         SMS System Architecture                   │
├─────────────────────────────┬───────────────────────────────────┤
│   Maintenance Portal        │      Onboarding Portal            │
├─────────────────────────────┼───────────────────────────────────┤
│   SQLite Database           │      PostgreSQL Database          │
│   - Single tenant           │      - Multi-tenant               │
│   - Embedded                │      - Client-server              │
│   - Simple schema           │      - Complex schema             │
│   - Local file storage      │      - S3/Cloud storage           │
└─────────────────────────────┴───────────────────────────────────┘
```

### Technology Stack

| Component | Maintenance Portal | Onboarding Portal |
|-----------|-------------------|-------------------|
| Database | SQLite 3.x | PostgreSQL 14+ |
| ORM | None (raw SQL) | Prisma |
| File Storage | Local filesystem | S3/DigitalOcean Spaces |
| Authentication | JWT (simple) | JWT with RLS |
| API Framework | Express.js | Express.js + Prisma |

---

## Database Systems Comparison

### Feature Comparison

| Feature | SQLite (Maintenance) | PostgreSQL (Onboarding) |
|---------|---------------------|-------------------------|
| **Multi-tenancy** | ❌ Single company | ✅ Multiple companies with RLS |
| **Scalability** | Limited (file-based) | High (client-server) |
| **Concurrent Users** | Low (file locks) | High (MVCC) |
| **Full-text Search** | Basic FTS5 | Advanced with GIN indexes |
| **JSON Support** | Basic | Advanced JSONB with indexing |
| **Audit Trail** | ❌ Not implemented | ✅ Comprehensive audit_logs |
| **Offline Support** | ✅ Native | ⚠️ Requires sync queue |
| **Backup Strategy** | File copy | pg_dump, streaming replication |
| **Performance** | Good for <1GB | Excellent for TB+ |
| **Security** | Application-level | Database-level RLS |

### Use Case Alignment

**SQLite (Maintenance Portal)**
- Perfect for: Small vessel deployments, offline-first scenarios
- Limitations: Single vessel/company, limited concurrent users

**PostgreSQL (Onboarding Portal)**
- Perfect for: Enterprise SaaS, multi-vessel fleets, cloud deployment
- Limitations: Requires internet connectivity, more complex setup

---

## SQLite Schema (Maintenance Portal)

### Core Tables

#### 1. Companies Table
```sql
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#0066CC',
    secondary_color TEXT DEFAULT '#E6F2FF',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Business Rules:**
- Single company per database instance
- Slug used for URL routing
- Custom branding via color configuration

#### 2. Vessels Table
```sql
CREATE TABLE vessels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    imo_number TEXT UNIQUE,
    vessel_type TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'operational',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```

**Business Rules:**
- IMO number globally unique
- Status: operational, maintenance, decommissioned
- Cascade delete removes all vessel data

#### 3. Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('technician', 'manager', 'admin')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```

**Role Hierarchy:**
- `admin`: Full system access
- `manager`: Approve work, view reports
- `technician`: Create faults, log maintenance

#### 4. Equipment Table
```sql
CREATE TABLE equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vessel_id INTEGER NOT NULL,
    qr_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    manufacturer TEXT,
    model TEXT,
    serial_number TEXT,
    location TEXT NOT NULL,
    equipment_type TEXT NOT NULL,
    status TEXT DEFAULT 'operational' 
        CHECK (status IN ('operational', 'maintenance', 'fault', 'decommissioned')),
    installation_date DATE,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    specifications JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vessel_id) REFERENCES vessels(id) ON DELETE CASCADE
);
```

**Key Features:**
- QR code for mobile scanning
- JSON specifications for flexibility
- Maintenance scheduling built-in

#### 5. Faults Table
```sql
CREATE TABLE faults (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_id INTEGER NOT NULL,
    reported_by INTEGER NOT NULL,
    fault_type TEXT NOT NULL CHECK (fault_type IN ('critical', 'minor')),
    status TEXT DEFAULT 'open' 
        CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    description TEXT NOT NULL,
    root_cause TEXT,
    resolution TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    downtime_minutes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(id)
);
```

**Workflow States:**
- `open`: Initial report
- `in_progress`: Being worked on
- `resolved`: Fixed but not verified
- `closed`: Verified and complete

#### 6. Parts Used Table
```sql
CREATE TABLE parts_used (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fault_id INTEGER NOT NULL,
    part_number TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost DECIMAL(10,2),
    markup_percentage DECIMAL(5,2) DEFAULT 20.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fault_id) REFERENCES faults(id) ON DELETE CASCADE
);
```

**Financial Tracking:**
- Cost + markup for billing
- Links to fault for job costing

#### 7. Maintenance Logs Table
```sql
CREATE TABLE maintenance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_id INTEGER NOT NULL,
    performed_by INTEGER NOT NULL,
    maintenance_type TEXT NOT NULL,
    description TEXT,
    parts_replaced JSON,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    next_due_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id)
);
```

#### 8. Search Index Tables
```sql
-- Document search index
CREATE TABLE search_index (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    page_number INTEGER,
    content TEXT NOT NULL,
    highlights JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES equipment_documents(id) ON DELETE CASCADE
);

-- Full-text search virtual table
CREATE VIRTUAL TABLE search_fts USING fts5(
    content, 
    document_id UNINDEXED,
    page_number UNINDEXED,
    tokenize = 'porter'
);
```

### SQLite Schema Summary

**Strengths:**
- Simple, straightforward design
- Good for single-vessel operations
- Embedded database requires no server
- FTS5 for document search

**Limitations:**
- No multi-tenancy
- Limited concurrent access
- No advanced features (RLS, triggers, functions)
- Basic audit capabilities

---

## PostgreSQL Schema (Onboarding Portal)

### Advanced Features

#### 1. Multi-Tenant Architecture with RLS
```sql
-- Row Level Security setup
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Policy for company isolation
CREATE POLICY equipment_company_isolation ON equipment
    USING (vessel_id IN (
        SELECT id FROM vessels 
        WHERE company_id = current_setting('app.current_company_id')::uuid
    ));
```

#### 2. Comprehensive Enum Types
```sql
-- User roles with hierarchy
CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',    -- System administrator
    'ADMIN',          -- Company administrator
    'MANAGER',        -- Review and approve
    'TECHNICIAN',     -- Data entry
    'HSE_OFFICER',    -- Health, Safety, Environment
    'VIEWER'          -- Read-only access
);

-- Equipment criticality levels
CREATE TYPE equipment_criticality AS ENUM (
    'CRITICAL',       -- Mission critical
    'IMPORTANT',      -- Important but not critical
    'STANDARD'        -- Standard equipment
);

-- Equipment status workflow
CREATE TYPE equipment_status AS ENUM (
    'PLANNED',        -- Not yet installed
    'ARRIVING',       -- In transit
    'DRAFT',          -- Initial entry
    'DOCUMENTED',     -- Fully documented
    'PENDING_REVIEW', -- Awaiting manager review
    'REVIEWED',       -- Manager reviewed
    'VERIFIED',       -- Field verified
    'APPROVED',       -- Final approval
    'ACTIVE',         -- In service
    'REMOVED',        -- Decommissioned
    'REJECTED',       -- Failed review
    'DELETED'         -- Soft deleted
);
```

### Core Tables (Enhanced)

#### 1. Companies Table (Multi-tenant)
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    timezone VARCHAR(50) DEFAULT 'UTC',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_companies_code ON companies(code);
CREATE INDEX idx_companies_active ON companies(is_active);
```

#### 2. Users Table (Enhanced)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'VIEWER',
    phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multiple indexes for query optimization
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### 3. Vessels Table (Enhanced)
```sql
CREATE TABLE vessels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    imo_number VARCHAR(20) UNIQUE,
    vessel_type VARCHAR(100),
    flag VARCHAR(100),
    gross_tonnage DECIMAL(10,2),
    year_built INTEGER,
    class_society VARCHAR(100),
    onboarding_status onboarding_status DEFAULT 'NOT_STARTED',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Compound unique constraint
    UNIQUE(company_id, name)
);
```

#### 4. Hierarchical Locations
```sql
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    level INTEGER DEFAULT 0,
    path TEXT NOT NULL,  -- Materialized path for fast queries
    description TEXT,
    metadata JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(vessel_id, code)
);

-- Optimized indexes for hierarchical queries
CREATE INDEX idx_locations_vessel ON locations(vessel_id);
CREATE INDEX idx_locations_parent ON locations(parent_id);
CREATE INDEX idx_locations_path ON locations(path);
```

#### 5. Equipment Table (Advanced)
```sql
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    equipment_type VARCHAR(100),
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    criticality equipment_criticality DEFAULT 'STANDARD',
    status equipment_status DEFAULT 'DRAFT',
    classification equipment_classification DEFAULT 'PERMANENT',
    
    -- Dates
    installation_date DATE,
    warranty_expiry DATE,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    
    -- Verification system
    verification_interval_days INTEGER,
    last_verified_at TIMESTAMPTZ,
    next_verification_date DATE,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verification_notes TEXT,
    data_quality_degradation_rate INTEGER DEFAULT 5,
    
    -- Workflow tracking
    quality_score INTEGER DEFAULT 0,
    documented_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    documented_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    
    -- Flexible data
    specifications JSONB DEFAULT '{}',
    maintenance_interval_days INTEGER,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comprehensive indexing strategy
CREATE INDEX idx_equipment_vessel ON equipment(vessel_id);
CREATE INDEX idx_equipment_location ON equipment(location_id);
CREATE INDEX idx_equipment_criticality ON equipment(criticality);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_quality ON equipment(quality_score);
CREATE INDEX idx_equipment_code ON equipment(code);
CREATE INDEX idx_equipment_manufacturer ON equipment(manufacturer);
CREATE INDEX idx_equipment_verification ON equipment(next_verification_date);
```

#### 6. Critical Parts Management
```sql
CREATE TABLE critical_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    part_number VARCHAR(255),
    manufacturer VARCHAR(255),
    description TEXT,
    criticality equipment_criticality DEFAULT 'STANDARD',
    quantity INTEGER DEFAULT 1,
    unit_of_measure VARCHAR(50),
    minimum_stock INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    specifications JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parts cross-reference for compatibility
CREATE TABLE parts_cross_reference (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
    original_part_id UUID NOT NULL REFERENCES critical_parts(id) ON DELETE CASCADE,
    compatible_part_id UUID NOT NULL REFERENCES critical_parts(id) ON DELETE CASCADE,
    compatibility_type VARCHAR(50), -- EXACT, COMPATIBLE, SUBSTITUTE
    notes TEXT,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(original_part_id, compatible_part_id)
);
```

#### 7. Quality Management System
```sql
-- Quality metrics tracking
CREATE TABLE quality_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    metric quality_metric NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    details JSONB DEFAULT '{}',
    evaluated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality metric enum
CREATE TYPE quality_metric AS ENUM (
    'COMPLETENESS',    -- All required fields filled
    'ACCURACY',        -- Data accuracy verification
    'PHOTO_QUALITY',   -- Image quality and relevance
    'DOCUMENTATION',   -- Manual and certificate presence
    'COMPLIANCE'       -- Regulatory compliance
);
```

#### 8. Offline Sync Support
```sql
CREATE TABLE offline_sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
    data JSONB NOT NULL,
    sync_status sync_status DEFAULT 'PENDING',
    sync_attempts INTEGER DEFAULT 0,
    last_sync_attempt TIMESTAMPTZ,
    sync_error TEXT,
    client_timestamp TIMESTAMPTZ NOT NULL,
    server_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sync performance
CREATE INDEX idx_sync_queue_user ON offline_sync_queue(user_id);
CREATE INDEX idx_sync_queue_device ON offline_sync_queue(device_id);
CREATE INDEX idx_sync_queue_status ON offline_sync_queue(sync_status);
CREATE INDEX idx_sync_queue_entity ON offline_sync_queue(entity_type, entity_id);
```

#### 9. Comprehensive Audit Trail
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimized for audit queries
CREATE INDEX idx_audit_company ON audit_logs(company_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

#### 10. Equipment Transfer System
```sql
CREATE TABLE equipment_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    from_vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
    to_vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
    from_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    to_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    transferred_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    transferred_at TIMESTAMPTZ NOT NULL,
    reason TEXT,
    notes TEXT,
    document_data JSONB DEFAULT '{}',  -- Snapshot of documents
    parts_data JSONB DEFAULT '{}',     -- Snapshot of parts
    quality_scores_data JSONB DEFAULT '{}', -- Snapshot of quality
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Advanced Database Features

#### 1. Materialized Views
```sql
-- Parts intelligence across vessels
CREATE MATERIALIZED VIEW mv_parts_intelligence AS
WITH part_equipment AS (
    SELECT 
        cp.id as part_id,
        cp.part_number,
        cp.name as part_name,
        cp.manufacturer,
        cp.criticality,
        cp.quantity,
        cp.current_stock,
        e.vessel_id,
        e.equipment_type,
        e.name as equipment_name
    FROM critical_parts cp
    JOIN equipment e ON cp.equipment_id = e.id
    WHERE e.status IN ('DOCUMENTED', 'REVIEWED', 'APPROVED')
)
SELECT 
    pe.part_id,
    pe.part_number,
    pe.part_name,
    pe.manufacturer,
    pe.criticality,
    pe.vessel_id,
    v.name as vessel_name,
    COUNT(DISTINCT pe.equipment_name) as equipment_count,
    SUM(pe.quantity) as total_quantity,
    SUM(pe.current_stock) as total_stock,
    ARRAY_AGG(DISTINCT pe.equipment_type) as equipment_types,
    ARRAY_AGG(DISTINCT pe.equipment_name) as equipment_names
FROM part_equipment pe
JOIN vessels v ON pe.vessel_id = v.id
GROUP BY 
    pe.part_id, pe.part_number, pe.part_name,
    pe.manufacturer, pe.criticality, pe.vessel_id, v.name;

-- Indexes on materialized view
CREATE INDEX idx_mv_parts_part_number ON mv_parts_intelligence(part_number);
CREATE INDEX idx_mv_parts_manufacturer ON mv_parts_intelligence(manufacturer);
CREATE INDEX idx_mv_parts_vessel ON mv_parts_intelligence(vessel_id);
```

#### 2. Database Functions
```sql
-- Calculate degraded quality score
CREATE OR REPLACE FUNCTION calculate_degraded_quality_score(p_equipment_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_current_score INTEGER;
    v_next_verification_date DATE;
    v_degradation_rate INTEGER;
    v_days_overdue INTEGER;
    v_degraded_score INTEGER;
BEGIN
    SELECT 
        quality_score,
        next_verification_date,
        COALESCE(data_quality_degradation_rate, 5)
    INTO 
        v_current_score,
        v_next_verification_date,
        v_degradation_rate
    FROM equipment
    WHERE id = p_equipment_id;
    
    IF v_next_verification_date IS NULL OR v_next_verification_date >= CURRENT_DATE THEN
        RETURN v_current_score;
    END IF;
    
    v_days_overdue := CURRENT_DATE - v_next_verification_date;
    v_degraded_score := v_current_score - (v_current_score * v_degradation_rate * v_days_overdue / 30 / 100);
    
    RETURN GREATEST(v_degraded_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Auto-update next verification date
CREATE OR REPLACE FUNCTION update_next_verification_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_verified_at IS NOT NULL AND NEW.verification_interval_days IS NOT NULL THEN
        NEW.next_verification_date := (NEW.last_verified_at::DATE + NEW.verification_interval_days * INTERVAL '1 day')::DATE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for verification date
CREATE TRIGGER update_equipment_next_verification
BEFORE INSERT OR UPDATE OF last_verified_at, verification_interval_days ON equipment
FOR EACH ROW EXECUTE FUNCTION update_next_verification_date();
```

#### 3. Row Level Security Policies
```sql
-- Company isolation for all tables
CREATE POLICY companies_isolation ON companies
    USING (id = current_setting('app.current_company_id')::uuid OR 
           current_setting('app.current_user_role') = 'SUPER_ADMIN');

CREATE POLICY vessels_isolation ON vessels
    USING (company_id = current_setting('app.current_company_id')::uuid OR 
           current_setting('app.current_user_role') = 'SUPER_ADMIN');

CREATE POLICY equipment_isolation ON equipment
    USING (EXISTS (
        SELECT 1 FROM vessels v 
        WHERE v.id = equipment.vessel_id 
        AND v.company_id = current_setting('app.current_company_id')::uuid
    ) OR current_setting('app.current_user_role') = 'SUPER_ADMIN');

-- Role-based access for sensitive operations
CREATE POLICY equipment_update_managers ON equipment
    FOR UPDATE USING (
        current_setting('app.current_user_role') IN ('MANAGER', 'ADMIN', 'SUPER_ADMIN')
    );
```

---

## Data Flow Architecture

### 1. Data Input Flows

```
┌─────────────────────────────────────────────────────────────────┐
│                     Data Input Methods                          │
├─────────────────────┬───────────────────┬─────────────────────┤
│  Onboarding Wizard  │   Excel Import    │    API Import       │
├─────────────────────┼───────────────────┼─────────────────────┤
│  - Progressive UI   │  - Bulk upload    │  - System integration│
│  - Photo capture    │  - Validation     │  - Automated sync   │
│  - Real-time save   │  - Error report   │  - Webhooks         │
└─────────────────────┴───────────────────┴─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Validation Layer   │
                    │  - Required fields  │
                    │  - Business rules   │
                    │  - Data types       │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Transformation Layer│
                    │  - Normalization    │
                    │  - Enrichment       │
                    │  - Deduplication    │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   PostgreSQL DB     │
                    │  - Transactional    │
                    │  - Audit trail      │
                    │  - RLS security     │
                    └─────────────────────┘
```

### 2. Data Synchronization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  Offline/Online Sync Flow                       │
├─────────────────────────────────────────────────────────────────┤
│  Offline Mode                    │    Online Mode               │
├──────────────────────────────────┼──────────────────────────────┤
│  1. User makes changes           │    1. Direct API calls       │
│  2. Store in IndexedDB           │    2. Real-time validation   │
│  3. Add to sync queue            │    3. Immediate feedback     │
│  4. Track conflicts              │    4. Live collaboration     │
└──────────────────────────────────┴──────────────────────────────┘
                    │                              │
                    └──────────────┬───────────────┘
                                   ▼
                         ┌─────────────────────┐
                         │   Sync Engine       │
                         │  - Conflict resolve │
                         │  - Batch upload     │
                         │  - Retry logic      │
                         └─────────────────────┘
```

### 3. Data Export Flow

```
PostgreSQL → Export Service → Format Conversion → Output
                                      │
                           ┌──────────┴──────────┐
                           │                     │
                      Excel Export          Maintenance Portal
                      - XLSX format         - JSON format
                      - Formatted           - Compressed
                      - Human readable      - System readable
```

---

## Data Migration Strategy

### 1. Onboarding to Maintenance Migration

```sql
-- Migration script example
WITH vessel_data AS (
    SELECT 
        v.id,
        v.name,
        v.imo_number,
        v.vessel_type,
        c.name as company_name,
        c.code as company_code
    FROM vessels v
    JOIN companies c ON v.company_id = c.id
    WHERE v.id = $1
),
equipment_data AS (
    SELECT 
        e.*,
        l.name as location_name,
        l.path as location_path
    FROM equipment e
    LEFT JOIN locations l ON e.location_id = l.id
    WHERE e.vessel_id = $1
    AND e.status IN ('APPROVED', 'ACTIVE')
)
SELECT json_build_object(
    'vessel', vessel_data,
    'equipment', array_agg(equipment_data),
    'export_date', NOW(),
    'version', '1.0'
) as export_data
FROM vessel_data, equipment_data
GROUP BY vessel_data;
```

### 2. Data Transformation Rules

| Onboarding Field | Maintenance Field | Transformation |
|------------------|-------------------|----------------|
| equipment.id (UUID) | equipment.id (INTEGER) | Generate new ID, map reference |
| equipment.status (ENUM) | equipment.status (TEXT) | Map enum to text |
| equipment.criticality | Not used | Store in specifications JSON |
| equipment.quality_score | Not tracked | Omit from export |
| locations.path | equipment.location | Flatten hierarchy |
| critical_parts | Not supported | Export as separate table |

### 3. Migration Process

```javascript
// Migration service
class DataMigrationService {
    async migrateVesselToMaintenance(vesselId: string) {
        // 1. Extract data from PostgreSQL
        const vesselData = await this.extractVesselData(vesselId);
        
        // 2. Transform to SQLite format
        const transformed = await this.transformData(vesselData);
        
        // 3. Validate against SQLite schema
        const validation = await this.validateData(transformed);
        
        // 4. Generate SQLite import file
        const importFile = await this.generateImportFile(transformed);
        
        // 5. Create migration report
        const report = {
            vesselId,
            equipmentCount: transformed.equipment.length,
            warnings: validation.warnings,
            exportDate: new Date(),
            checksum: this.calculateChecksum(importFile)
        };
        
        return { importFile, report };
    }
}
```

---

## Performance Optimization

### 1. PostgreSQL Optimizations

#### Index Strategy
```sql
-- Composite indexes for common queries
CREATE INDEX idx_equipment_vessel_status ON equipment(vessel_id, status);
CREATE INDEX idx_equipment_vessel_criticality ON equipment(vessel_id, criticality);
CREATE INDEX idx_equipment_location_type ON equipment(location_id, equipment_type);

-- Partial indexes for active records
CREATE INDEX idx_active_equipment ON equipment(vessel_id) 
WHERE status IN ('ACTIVE', 'APPROVED');

-- GIN indexes for JSONB search
CREATE INDEX idx_equipment_specs_gin ON equipment USING gin(specifications);
CREATE INDEX idx_equipment_metadata_gin ON equipment USING gin(metadata);

-- Trigram indexes for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_equipment_name_trgm ON equipment USING gin(name gin_trgm_ops);
```

#### Query Optimization
```sql
-- Use CTEs for complex queries
WITH equipment_summary AS (
    SELECT 
        vessel_id,
        COUNT(*) as total_equipment,
        COUNT(*) FILTER (WHERE criticality = 'CRITICAL') as critical_count,
        AVG(quality_score) as avg_quality
    FROM equipment
    WHERE status = 'ACTIVE'
    GROUP BY vessel_id
)
SELECT 
    v.name,
    v.imo_number,
    es.total_equipment,
    es.critical_count,
    es.avg_quality
FROM vessels v
JOIN equipment_summary es ON v.id = es.vessel_id
WHERE v.company_id = $1;
```

### 2. SQLite Optimizations

```sql
-- Enable query optimizer
PRAGMA optimize;

-- Increase cache size
PRAGMA cache_size = -64000; -- 64MB

-- Use WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- Create covering indexes
CREATE INDEX idx_equipment_vessel_all ON equipment(
    vessel_id, name, location, equipment_type, status
);

-- Analyze tables for query planning
ANALYZE;
```

### 3. Application-Level Caching

```javascript
// Redis caching strategy
const cacheStrategy = {
    // Cache vessel summary data
    vesselSummary: {
        key: (vesselId) => `vessel:${vesselId}:summary`,
        ttl: 300, // 5 minutes
        refresh: async (vesselId) => {
            return await db.getVesselSummary(vesselId);
        }
    },
    
    // Cache equipment lists with pagination
    equipmentList: {
        key: (vesselId, page) => `vessel:${vesselId}:equipment:${page}`,
        ttl: 60, // 1 minute
        refresh: async (vesselId, page) => {
            return await db.getEquipmentPage(vesselId, page);
        }
    }
};
```

---

## Data Integrity & Security

### 1. Data Validation Rules

```typescript
// Shared validation schema
const EquipmentValidation = {
    name: {
        required: true,
        maxLength: 255,
        pattern: /^[a-zA-Z0-9\s\-#\.]+$/
    },
    manufacturer: {
        maxLength: 255,
        pattern: /^[a-zA-Z0-9\s\-\.&]+$/
    },
    serialNumber: {
        maxLength: 255,
        unique: true, // Within vessel
        pattern: /^[a-zA-Z0-9\-]+$/
    },
    criticality: {
        required: true,
        enum: ['CRITICAL', 'IMPORTANT', 'STANDARD']
    }
};
```

### 2. Security Measures

#### PostgreSQL Security
- Row Level Security (RLS) for multi-tenancy
- SSL/TLS connections required
- Encrypted passwords with bcrypt
- JWT tokens with expiration
- Audit trail for all changes

#### SQLite Security
- File-level encryption (optional)
- Application-level access control
- Password hashing with bcrypt
- JWT tokens for API access

### 3. Backup Strategies

#### PostgreSQL Backup
```bash
# Continuous archiving with WAL
archive_mode = on
archive_command = 'test ! -f /backup/wal/%f && cp %p /backup/wal/%f'

# Daily full backup
pg_dump -Fc -f /backup/daily/sms_$(date +%Y%m%d).dump sms_onboarding

# Point-in-time recovery capability
restore_command = 'cp /backup/wal/%f %p'
```

#### SQLite Backup
```bash
# Simple file copy with lock
sqlite3 sms.db ".backup /backup/sms_$(date +%Y%m%d).db"

# Or using the backup API
sqlite3 sms.db "VACUUM INTO '/backup/sms_backup.db'"
```

---

## Integration Requirements

### 1. API Integration Points

```typescript
// Onboarding to Maintenance Portal API
interface DataExportAPI {
    // Export vessel data
    POST /api/export/vessel/:vesselId
    Response: {
        exportId: string,
        format: 'json' | 'sqlite',
        downloadUrl: string,
        expiresAt: Date
    }
    
    // Check export status
    GET /api/export/status/:exportId
    Response: {
        status: 'pending' | 'processing' | 'complete' | 'failed',
        progress: number,
        error?: string
    }
}
```

### 2. Webhook Integration

```typescript
// Equipment status change webhook
interface EquipmentWebhook {
    event: 'equipment.status.changed',
    data: {
        equipmentId: string,
        vesselId: string,
        previousStatus: string,
        newStatus: string,
        changedBy: string,
        changedAt: Date
    }
}

// Vessel onboarding complete webhook
interface OnboardingWebhook {
    event: 'vessel.onboarding.complete',
    data: {
        vesselId: string,
        completedAt: Date,
        statistics: {
            equipmentCount: number,
            documentCount: number,
            photoCount: number,
            qualityScore: number
        }
    }
}
```

### 3. File Storage Integration

```javascript
// S3/Cloud storage configuration
const storageConfig = {
    onboarding: {
        bucket: 'sms-onboarding-files',
        structure: '/{companyId}/{vesselId}/{equipmentId}/{type}/{filename}',
        cdn: 'https://cdn.sms-onboarding.com'
    },
    maintenance: {
        localStorage: '/var/sms/files',
        structure: '/{vesselId}/{equipmentId}/{type}/{filename}',
        maxSize: '10GB'
    }
};
```

---

## Recommendations

### 1. Short-term Improvements

#### For SQLite (Maintenance Portal)
1. **Add Audit Trail**: Implement basic audit logging
2. **Implement Soft Deletes**: Add deleted_at column
3. **Add Indexes**: Create missing indexes for performance
4. **Enable FTS5**: Already implemented, ensure it's used
5. **Add Backup Script**: Automated daily backups

#### For PostgreSQL (Onboarding Portal)
1. **Optimize Indexes**: Review and add missing indexes
2. **Partition Large Tables**: Consider partitioning equipment table
3. **Implement Archiving**: Move old data to archive tables
4. **Add Monitoring**: Query performance monitoring
5. **Cache Strategy**: Implement Redis caching layer

### 2. Long-term Strategy

#### Unified Data Platform
Consider migrating to a unified PostgreSQL platform:
- Single source of truth
- Consistent features across portals
- Better scalability
- Simplified maintenance

#### Migration Path
1. **Phase 1**: Implement PostgreSQL in Maintenance Portal
2. **Phase 2**: Migrate existing SQLite data
3. **Phase 3**: Unify schemas with namespace separation
4. **Phase 4**: Implement cross-portal features

### 3. Best Practices

#### Data Governance
1. **Version Control**: Track schema changes with migrations
2. **Documentation**: Keep schema docs updated
3. **Testing**: Automated tests for data integrity
4. **Monitoring**: Track data quality metrics
5. **Security**: Regular security audits

#### Performance Management
1. **Query Analysis**: Regular EXPLAIN ANALYZE
2. **Index Review**: Monthly index usage review
3. **Vacuum Schedule**: Automated vacuum for PostgreSQL
4. **Cache Strategy**: Implement intelligent caching
5. **Load Testing**: Regular performance testing

### 4. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data Loss | High | Automated backups, replication |
| Security Breach | High | RLS, encryption, audit trails |
| Performance Degradation | Medium | Monitoring, indexing, caching |
| Schema Drift | Medium | Migration tools, version control |
| Integration Failure | Low | Webhook retries, error handling |

---

## Conclusion

The SMS project's dual-database architecture serves different use cases effectively:
- SQLite for simple, offline-capable maintenance operations
- PostgreSQL for complex, multi-tenant onboarding workflows

While both systems work well independently, there's an opportunity to unify them for better maintainability and feature parity. The comprehensive schema documentation provided here should serve as the foundation for future development and optimization efforts.

### Key Takeaways
1. PostgreSQL schema is more mature and feature-rich
2. SQLite schema is simpler but adequate for single-vessel operations
3. Data migration path exists but requires careful transformation
4. Performance optimization opportunities exist in both systems
5. Security measures are stronger in PostgreSQL implementation

### Next Steps
1. Implement recommended short-term improvements
2. Develop unified data governance policies
3. Create automated testing for data integrity
4. Plan for long-term platform unification
5. Establish regular review cycles for schema optimization