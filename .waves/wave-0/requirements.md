# SMS Platform - Comprehensive Requirements Document

## Executive Summary
The SMS Platform consists of two integrated systems:
1. **Maintenance Portal** - Active production system for vessel maintenance management
2. **Onboarding Portal** - New system for high-quality vessel data collection

Both systems are designed for the maritime industry, specifically offshore drilling vessels, with a focus on ease of use, offline capability, and revenue generation through parts management.

---

## 1. FUNCTIONAL REQUIREMENTS MATRIX

### 1.1 Maintenance Portal Features

| Feature | Status | Priority | Description | Revenue Impact |
|---------|--------|----------|-------------|----------------|
| **User Authentication** | ✅ Implemented | P1 | Role-based login with auto-populate | - |
| **Role-Based Dashboards** | ✅ Implemented | P1 | Different UI for each role (Tech, Manager, Admin) | - |
| **Equipment Management** | ✅ Implemented | P1 | Browse, add, edit equipment by area | Medium |
| **QR Code System** | ✅ Implemented | P1 | Generate and scan QR codes for equipment | - |
| **Fault Reporting** | ✅ Implemented | P1 | Report and track equipment faults | HIGH |
| **Parts Management** | ✅ Implemented | P1 | Catalog with pricing (hidden markup) | CRITICAL |
| **Document Management** | ✅ Implemented | P1 | Upload/download manuals, certificates | - |
| **Real-time Notifications** | ✅ Implemented | P1 | Alert system for critical issues | - |
| **Mobile Responsive** | ✅ Implemented | P1 | Works on tablets and phones | - |
| **Parts Intelligence** | 🚧 Planned | P1 | Cross-reference parts across equipment | HIGH |
| **PO Integration** | 🚧 Planned | P1 | Auto-update stock on delivery | CRITICAL |
| **Email Notifications** | 🚧 Planned | P1 | Multiple sender addresses, automated alerts | Medium |
| **Manager Analytics** | 🚧 Planned | P1 | Spare parts value, stock intelligence | Medium |
| **Critical Parts Mgmt** | 🚧 Planned | P1 | Track failure-causing parts | HIGH |
| **Handover System** | 🚧 Planned | P1 | Enforced shift handover with logs | Medium |
| **Community Chat** | 🚧 Planned | P2 | Global support chat by trade | Low |
| **Drawing Search** | 🚧 Planned | P2 | OCR-based technical drawing search | Medium |
| **AI Suggestions** | 🚧 Planned | P3 | Fault diagnosis and predictive maintenance | Low |
| **Advanced Analytics** | 🚧 Planned | P3 | Fleet comparison, cost optimization | Medium |
| **Offline Mode** | 🚧 Planned | P3 | Full offline capability with sync | Low |

### 1.2 Onboarding Portal Features

| Feature | Status | Priority | Description | Business Value |
|---------|--------|----------|-------------|----------------|
| **Company Registration** | ✅ Built | P1 | Wizard-based company/vessel setup | Critical |
| **User Management** | ✅ Built | P1 | Excel import, role assignment | High |
| **Token Generation** | ✅ Built | P1 | Secure tokens for tech access | Critical |
| **Progress Monitoring** | ✅ Built | P1 | Real-time onboarding tracking | High |
| **Tech Mobile App** | ✅ Built | P1 | PWA for offline equipment documentation | Critical |
| **Photo Capture** | ✅ Built | P1 | Camera integration with compression | Critical |
| **Offline Sync** | ✅ Built | P1 | Work without internet, sync later | Critical |
| **Manager Review** | ✅ Built | P1 | Quality validation interface | High |
| **Comment System** | ✅ Built | P1 | Feedback between manager and tech | Medium |
| **Bulk Actions** | ✅ Built | P1 | Approve/reject multiple items | Medium |
| **Quality Scoring** | ✅ Built | P1 | 0-100 scoring per equipment | High |
| **Missing Data Flags** | ✅ Built | P1 | Identify revenue opportunities | Critical |
| **Business Tracking** | ✅ Built | P1 | Track opportunities from missing data | Critical |
| **Auto-Save System** | 🚧 Planned | P1 | Save progress automatically | High |
| **Excel Export** | 🚧 Planned | P1 | Export collected data to Excel | Medium |
| **Preview System** | 🚧 Planned | P1 | Review before submission | Medium |
| **Equipment Recognition** | 🚧 Planned | P2 | AI-based photo analysis | Low |
| **Voice Notes** | 🚧 Planned | P3 | Audio documentation | Low |
| **Barcode Scanning** | 🚧 Planned | P3 | Scan equipment barcodes | Low |

### 1.3 Integration Features

| Feature | Status | Priority | Description |
|---------|--------|----------|-------------|
| **Token Validation** | 🚧 Required | P1 | Maintenance portal generates, onboarding validates |
| **Data Export** | 🚧 Required | P1 | Onboarding → Maintenance format |
| **Progress Webhooks** | 🚧 Required | P1 | Real-time status updates |
| **User Provisioning** | 🚧 Required | P1 | Shared user management |
| **Photo Transfer** | 🚧 Required | P1 | S3 URLs passed between systems |
| **Quality Metrics** | 🚧 Required | P2 | Share quality scores |
| **Audit Trail Sync** | 🚧 Required | P2 | Unified compliance reporting |

---

## 2. TECHNICAL REQUIREMENTS

### 2.1 Architecture Requirements

| Component | Maintenance Portal | Onboarding Portal |
|-----------|-------------------|-------------------|
| **Frontend** | React + JavaScript | React + TypeScript |
| **Backend** | Express.js | Express.js + Prisma |
| **Database** | SQLite (current) → PostgreSQL (planned) | PostgreSQL with RLS |
| **File Storage** | Local (current) → S3 (planned) | AWS S3 + CloudFront |
| **Authentication** | Session-based | JWT with roles |
| **API Style** | RESTful | RESTful + GraphQL |
| **Deployment** | Single server | AWS multi-region |

### 2.2 Performance Requirements

| Metric | Requirement | Current Status |
|--------|-------------|----------------|
| **Page Load Time** | <2 seconds | ✅ Maintenance, 🚧 Onboarding |
| **API Response Time** | <200ms | ✅ Both systems |
| **Concurrent Users** | 100+ per vessel | 🚧 Testing needed |
| **File Upload Size** | 50MB max | ✅ Configured |
| **Offline Data Sync** | <5 min for 100 items | ✅ Onboarding only |
| **Database Queries** | <100ms | ✅ Optimized |
| **CDN Coverage** | Global | 🚧 Onboarding only |

### 2.3 Security Requirements

| Requirement | Description | Compliance |
|-------------|-------------|------------|
| **Data Encryption** | AES-256 at rest, TLS 1.3 in transit | Required |
| **Multi-tenancy** | Complete data isolation per company | Critical |
| **Authentication** | MFA support, session management | Required |
| **Authorization** | Role-based access control (RBAC) | Required |
| **Audit Logging** | 7-year retention, tamper-proof | IMO 2021 |
| **Backup Strategy** | Hourly backups, point-in-time recovery | Required |
| **Maritime Compliance** | IMO 2021, IACS UR E26/E27 | Required |
| **Data Privacy** | GDPR compliant, data residency options | Required |

### 2.4 Scalability Requirements

| Aspect | Requirement | Strategy |
|--------|-------------|----------|
| **Multi-vessel** | Support 50+ vessels per company | Database partitioning |
| **User Growth** | 10,000+ total users | Horizontal scaling |
| **Data Volume** | 1TB+ per company | S3 tiered storage |
| **API Traffic** | 1M+ requests/day | API Gateway + caching |
| **Photo Storage** | 100k+ photos/vessel | CloudFront CDN |
| **Concurrent Editing** | 20+ users/vessel | Optimistic locking |

---

## 3. USER STORIES BY ROLE

### 3.1 Technician Stories

#### Maintenance Portal
- As a technician, I want to quickly report faults so I can get back to work
- As a technician, I want to scan QR codes to access equipment info instantly
- As a technician, I want to see which parts are available before ordering
- As a technician, I want to attach photos to fault reports for clarity
- As a technician, I want to receive my handover tasks clearly

#### Onboarding Portal
- As a technician, I want to document equipment offline during vessel tours
- As a technician, I want to take photos that automatically compress
- As a technician, I want to see my progress to stay motivated
- As a technician, I want to flag missing data for later
- As a technician, I want to respond to manager feedback easily

### 3.2 Manager Stories

#### Maintenance Portal
- As a manager, I want to see all active faults in my department
- As a manager, I want to track repair times (hidden from techs)
- As a manager, I want to approve parts orders with budget visibility
- As a manager, I want to export reports for meetings
- As a manager, I want to see spare parts inventory value

#### Onboarding Portal
- As a manager, I want to review all documented equipment before approval
- As a manager, I want to provide feedback on data quality
- As a manager, I want to track onboarding progress in real-time
- As a manager, I want to identify business opportunities from gaps
- As a manager, I want to bulk approve validated data

### 3.3 Admin Stories

#### Maintenance Portal
- As an admin, I want to manage all company vessels from one dashboard
- As an admin, I want to see parts markup revenue (hidden from clients)
- As an admin, I want to configure email notification rules
- As an admin, I want to generate compliance reports
- As an admin, I want to manage user permissions across vessels

#### Onboarding Portal
- As an admin, I want to generate secure onboarding tokens
- As an admin, I want to track token usage and expiry
- As an admin, I want to monitor data quality scores
- As an admin, I want to configure company-specific workflows
- As an admin, I want to export onboarding data to maintenance system

### 3.4 Company/Fleet Manager Stories

- As a fleet manager, I want to compare maintenance costs across vessels
- As a fleet manager, I want to see aggregated spare parts value
- As a fleet manager, I want to track compliance status for all vessels
- As a fleet manager, I want to identify standardization opportunities
- As a fleet manager, I want to monitor onboarding quality scores

---

## 4. INTEGRATION TOUCHPOINTS

### 4.1 API Endpoints Required

#### Maintenance Portal Must Provide:
```javascript
// Token Management
POST /api/onboarding/generate-token
POST /api/onboarding/validate-token
GET  /api/onboarding/status/:token

// User Management  
POST /api/users/provision
GET  /api/users/roles
POST /api/users/sync

// Data Import
POST /api/import/vessel
POST /api/import/equipment/batch
POST /api/import/validate

// Parts Intelligence
GET  /api/parts/cross-reference/:partNumber
GET  /api/parts/where-used/:partNumber
POST /api/parts/stock-levels

// Notifications
POST /api/webhooks/onboarding-progress
POST /api/notifications/send
```

#### Onboarding Portal Must Provide:
```javascript
// Progress Updates
POST /api/progress/update
GET  /api/progress/summary/:vesselId

// Data Export
GET  /api/export/vessel/:vesselId
GET  /api/export/equipment/:vesselId
GET  /api/export/validation-report/:vesselId

// Quality Metrics
GET  /api/quality/score/:vesselId
GET  /api/quality/missing-data/:vesselId
GET  /api/quality/opportunities/:vesselId
```

### 4.2 Data Exchange Format

```typescript
interface VesselExport {
  vessel: {
    id: string;
    name: string;
    imo_number: string;
    vessel_type: string;
    company_id: string;
  };
  
  equipment: Array<{
    id: string;
    name: string;
    area: string;
    type: string;
    criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    quality_score: number;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    qr_code: string;
    photos: Array<{
      url: string;
      type: 'overview' | 'nameplate' | 'detail';
      taken_date: string;
    }>;
    critical_parts?: Array<{
      part_number: string;
      description: string;
      causes_failure: boolean;
      minimum_stock: number;
    }>;
  }>;
  
  users: Array<{
    email: string;
    name: string;
    role: string;
    department: string;
  }>;
  
  metadata: {
    onboarding_started: string;
    onboarding_completed: string;
    quality_score: number;
    data_completeness: number;
  };
}
```

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Usability Requirements

| Requirement | Description | Measurement |
|-------------|-------------|-------------|
| **Mobile-First** | All features work on mobile | Touch targets ≥44px |
| **Intuitive Navigation** | Users succeed without training | <5 min to first action |
| **Clear Feedback** | Users know what's happening | Loading states, confirmations |
| **Error Recovery** | Users can fix mistakes easily | Undo actions, clear errors |
| **Accessibility** | WCAG 2.1 AA compliant | Screen reader support |

### 5.2 Reliability Requirements

| Requirement | Target | Method |
|-------------|--------|--------|
| **Uptime** | 99.9% | Multi-region deployment |
| **Data Durability** | 99.999999999% | S3 storage with versioning |
| **Backup Recovery** | <1 hour | Automated restore testing |
| **Failover Time** | <30 seconds | Health check automation |
| **Data Integrity** | Zero corruption | Checksums, validation |

### 5.3 Maintainability Requirements

| Requirement | Description |
|-------------|-------------|
| **Code Standards** | ESLint, Prettier, TypeScript strict mode |
| **Documentation** | API docs, code comments, user guides |
| **Testing Coverage** | >80% unit tests, E2E tests for critical paths |
| **Deployment** | CI/CD pipeline, blue-green deployments |
| **Monitoring** | APM, error tracking, performance metrics |

### 5.4 Portability Requirements

| Requirement | Description |
|-------------|-------------|
| **Browser Support** | Chrome, Safari, Firefox, Edge (latest 2 versions) |
| **Device Support** | Desktop, tablet, mobile (iOS/Android) |
| **Data Export** | Full data export in JSON/Excel formats |
| **API Standards** | RESTful, OpenAPI 3.0 documentation |
| **Database Migration** | Support PostgreSQL, MySQL (future) |

---

## 6. COMPLIANCE REQUIREMENTS

### 6.1 Maritime Industry Standards

| Standard | Requirements | Implementation |
|----------|--------------|----------------|
| **IMO 2021** | Cyber security risk management | Audit trails, access control |
| **IACS UR E26** | Software maintenance | Version control, testing |
| **IACS UR E27** | Cyber resilience | Backup, recovery, monitoring |
| **ISM Code** | Safety management documentation | Document control, approvals |
| **MARPOL** | Environmental compliance tracking | Maintenance records |

### 6.2 Data Protection Regulations

| Regulation | Requirements | Implementation |
|------------|--------------|----------------|
| **GDPR** | EU data protection | Consent, deletion, portability |
| **CCPA** | California privacy | Disclosure, opt-out |
| **Data Residency** | Location requirements | Regional deployment |
| **Data Retention** | 7-year maritime requirement | Automated archival |

### 6.3 Financial Compliance

| Requirement | Description | Implementation |
|-------------|-------------|----------------|
| **Revenue Tracking** | Hidden markup accounting | Separate reporting |
| **Audit Trail** | All financial transactions | Immutable logs |
| **Multi-currency** | USD, EUR, GBP support | Exchange rate updates |
| **Tax Compliance** | Regional tax handling | Configurable rates |

---

## 7. BUSINESS REQUIREMENTS

### 7.1 Revenue Model Integration

| Feature | Revenue Impact | Implementation Priority |
|---------|----------------|------------------------|
| **Parts Markup** | 20-30% hidden markup | CRITICAL - Already implemented |
| **Emergency Orders** | Premium pricing | HIGH - Next sprint |
| **Maintenance Plans** | Subscription upsell | MEDIUM - Q2 2024 |
| **Training Services** | Professional services | LOW - When scaled |
| **API Access** | Enterprise tier | LOW - Year 2 |

### 7.2 Competitive Differentiators

| Feature | Our Advantage | Competitor Gap |
|---------|---------------|----------------|
| **Handover System** | Enforced, tracked | None have this |
| **Drawing Search** | AI-powered OCR | Manual only |
| **Offline-First** | Full functionality | Limited/none |
| **Hidden Revenue** | Parts markup invisible | Transparent pricing |
| **Onboarding Wizard** | Guided setup | Excel sheets |
| **Community Support** | 24/7 peer help | Email only |

### 7.3 Success Metrics

| Metric | Target | Current | Measurement |
|--------|--------|---------|-------------|
| **Onboarding Time** | <2 hours | 2 days | Time to first fault |
| **Daily Active Users** | >60% | New | Login frequency |
| **Fault Resolution** | -40% time | New | MTTR tracking |
| **Parts Orders** | 10+/month/vessel | New | Order volume |
| **User Satisfaction** | >8/10 NPS | New | Quarterly survey |
| **Churn Rate** | <5% annual | New | Subscription renewal |

---

## 8. IMPLEMENTATION PRIORITIES

### Phase 1: Critical Integration (Weeks 1-4)
1. PostgreSQL migration for maintenance portal
2. S3 file storage implementation
3. API Gateway setup
4. Token-based integration
5. Basic data import/export
6. Email notification system

### Phase 2: Revenue Features (Weeks 5-8)
1. Parts intelligence system
2. PO → Stock integration
3. Markup tracking/reporting
4. Critical parts management
5. Manager analytics dashboards
6. Automated stock alerts

### Phase 3: Enhanced UX (Weeks 9-12)
1. Onboarding wizard improvements
2. Drawing search MVP
3. Community chat system
4. Advanced analytics
5. Mobile app optimization
6. Offline mode for maintenance

### Phase 4: Scale & Optimize (Months 4-6)
1. AI integration for predictions
2. Multi-region deployment
3. Advanced security features
4. Enterprise API tier
5. Compliance automation
6. Performance optimization

---

## 9. RISK MITIGATION

### Technical Risks
- **Risk**: SQLite to PostgreSQL migration
  - **Mitigation**: Phased migration with fallback
- **Risk**: Offline sync conflicts
  - **Mitigation**: Last-write-wins + audit trail
- **Risk**: S3 costs explosion
  - **Mitigation**: Lifecycle policies, CDN caching

### Business Risks
- **Risk**: Users bypass parts ordering
  - **Mitigation**: Make it easier than alternatives
- **Risk**: Competitors copy features
  - **Mitigation**: Continuous innovation, network effects
- **Risk**: Slow adoption
  - **Mitigation**: Onboarding wizard, success team

### Compliance Risks
- **Risk**: Maritime regulation changes
  - **Mitigation**: Flexible architecture, regular audits
- **Risk**: Data breach
  - **Mitigation**: Encryption, access controls, insurance
- **Risk**: International data laws
  - **Mitigation**: Regional deployment, legal review

---

## 10. DEFINITIONS & GLOSSARY

- **MTTR**: Mean Time To Repair (hidden KPI)
- **RLS**: Row Level Security (PostgreSQL feature)
- **PWA**: Progressive Web App (offline-capable web app)
- **IMO**: International Maritime Organization
- **IACS**: International Association of Classification Societies
- **QR Code**: Quick Response code for equipment identification
- **Shadow Clone**: Parallel deployment system used for onboarding portal
- **Parts Intelligence**: System to cross-reference parts across equipment
- **Quality Score**: 0-100 rating of equipment documentation completeness

---

*Document Version: 1.0*
*Last Updated: 2025-01-05*
*Next Review: After Phase 1 Implementation*