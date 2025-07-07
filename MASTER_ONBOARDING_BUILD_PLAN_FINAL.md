# SMS Onboarding Portal - MASTER BUILD PLAN (FINAL)
**Date**: 2024-07-03
**Status**: READY TO BUILD - This is the complete, final plan after all discussions

## 🎯 Executive Summary

Building a unified onboarding portal that:
- Combines admin, technician, and manager interfaces in ONE system
- Role-based access from single login
- Production-ready with real functionality (not a demo)
- Integrates seamlessly with maintenance portal
- Focus on critical parts and cross-reference intelligence
- Built for offline-first vessel operations

## 📋 Complete Architecture Decisions

### Decision #001: File Storage Solution
**Decision**: AWS S3 + CloudFront CDN
**Cost**: ~$62/month for 100 vessels
**Note**: Overview photos only, not every component

### Decision #002: Database Architecture  
**Decision**: PostgreSQL with RDS encryption and Row Level Security
**Security**: AES-256, maritime compliant (IMO 2021, IACS UR E26/E27)
**Cost**: ~$70-220/month

### Decision #003: Hosting Infrastructure
**Decision**: AWS multi-region deployment
**Cost**: ~$175-275/month

### Decision #004: Offline Sync Strategy
**Decision**: Progressive Web App (PWA) with IndexedDB
**Cost**: $0 additional

### Decision #005: Integration Architecture
**Decision**: API Gateway + Message Queue (AWS SQS)
**Cost**: Negligible (~$0.40 per million messages)

### Decision #006: Email Service Provider
**Decision**: AWS SES with multiple sender addresses
**Addresses**: notifications@, inspections@, marketing@, support@, alerts@
**Cost**: ~$0.10-1.00/month

### Decision #007: Quality Score Algorithm
**Scoring**: Required (40pts), Photos (30pts), Details (20pts), Documentation (10pts)
**Note**: Each equipment scored individually, vessel gets average

### Decision #008: Critical Parts & Inventory Intelligence
**Key Feature**: Cross-reference showing parts used in multiple locations
**Smart Warnings**: "2 units in stock but used in 4 critical locations"
**NO**: Downtime predictions or cost estimates (not our business)

### Decision #009: UI Framework
**Decision**: React + Tailwind CSS + Shadcn/ui
**Look**: Premium (Stripe/Linear style), 44px touch targets

### Decision #010: Development Strategy
**Decision**: Monorepo structure with shared packages
**CI/CD**: GitHub Actions → AWS ECS

## 🔧 Core Functionality Requirements

### 1. Three-Stage Workflow

#### Stage 1: Admin Setup (Office)
- Company registration with branding
- Vessel basic information
- User management (Excel import)
- Token generation for field access

#### Stage 2: Tech Discovery (Field)  
- Progressive location creation
- Photo-first documentation
- Equipment criticality marking
- Critical parts documentation (if critical)
- Offline-first with sync
- Quality scoring in real-time

#### Stage 3: Manager Review (Office)
- Complete vessel review
- Quality validation
- Comment system
- Approval/rejection workflow
- Export to maintenance portal

### 2. Critical Parts Intelligence

```javascript
// Cross-reference system
partIntelligence = {
  "3RU2126-4AB0": {
    usedIn: ["Ballast Pump 1", "Fire Pump", "Bilge Pump"],
    criticalLocations: 3,
    currentStock: 2,
    warning: "Low stock for critical usage"
  }
}
```

### 3. Smart Stock Management

- Purchase orders create pending stock updates
- Tech confirms delivery with one click
- Automatic stock level updates
- Full audit trail
- Integration with parts ordering (20% hidden markup)

### 4. Quality Scoring System

- Per-equipment scoring (0-100)
- Focus on completeness, not perfection
- "80% components documented" = good score
- Missing items tracked as revenue opportunities

### 5. User Onboarding & Help

- Role-specific welcome tours
- Contextual tooltips throughout
- Value reinforcement messages
- Clear instructions on every page
- "More data now = less headaches later" messaging

## 🏗️ Technical Implementation Details

### Database Schema Additions

```sql
-- Critical fields for equipment
ALTER TABLE equipment ADD criticality VARCHAR(20);
ALTER TABLE equipment ADD quality_score INTEGER;

-- Parts tracking
CREATE TABLE critical_parts (
  equipment_id UUID,
  part_number VARCHAR(100),
  causes_failure BOOLEAN,
  current_stock INTEGER
);

-- Cross-reference intelligence
CREATE TABLE parts_cross_reference (
  part_number VARCHAR(100),
  equipment_id UUID,
  quantity INTEGER
);
```

### API Endpoints Required

```javascript
// Token management
POST /api/onboarding/generate-token
POST /api/onboarding/validate-token

// Progress tracking  
POST /api/webhooks/onboarding-progress
GET /api/onboarding/status/:token

// Data import
POST /api/import/vessel
POST /api/import/equipment/batch

// Parts intelligence
GET /api/parts/cross-reference/:partNumber
POST /api/stock/confirm-delivery
```

### Security Implementation

- JWT authentication with 8-hour tokens
- Row-level security for multi-tenant isolation
- AES-256 encryption at rest
- TLS 1.3 in transit
- Complete audit trails
- Maritime compliance built-in

## 🎨 UI/UX Requirements

### Design Principles
- Mobile-first (techs use tablets/phones)
- Offline-first (vessels have poor internet)
- Touch-friendly (44px minimum targets)
- Photo-centric (visual over typing)
- Progress-driven (gamification elements)

### Key UI Features
- Smooth animations and transitions
- Skeleton screens, not spinners
- Pinch-zoom photo galleries
- Swipe gestures for navigation
- Auto-save everything
- Clear offline/online indicators

### Empty States & Guidance
- Beautiful illustrations when no data
- Clear next actions
- Value propositions ("This saves $50k/year")
- Role-specific messaging

## 📊 Business Intelligence Features

### Manager Dashboard
- Parts cross-reference matrix
- Stock levels vs critical usage
- Spare parts value tracking
- Quality score analytics
- Missing data opportunities ($3k schematics, $1k manuals)
- Export to PDF/Excel/CSV

### Technician Features  
- Real-time quality scoring
- Offline data collection
- Template-based entry
- Bulk component entry
- Pattern generation ("CB-001 to CB-050")

## 🚀 Deployment Plan

### Phase 1: Local Development
- Full functionality in demo mode
- File uploads to local storage
- Emails shown in console
- SQLite database

### Phase 2: Production Deployment
- AWS infrastructure setup
- Domain configuration
- SSL certificates
- Production database
- Real email delivery

### Phase 3: Integration Testing
- Onboarding → Maintenance data flow
- Purchase order → Stock updates
- Email notifications
- Export functionality

## 💰 Revenue Protection

### Hidden Markup System
- 20% markup on standard orders
- 30% markup on emergency orders
- Completely invisible to customers
- Integrated with stock management
- Drives platform adoption

### Upsell Opportunities
- Missing schematics: $3,000
- Missing manuals: $1,000  
- Parts lists: $500
- Professional documentation services

## ✅ Success Criteria

1. **Functional Requirements**
   - All 3 stages working end-to-end
   - Offline sync functioning
   - Quality scoring accurate
   - Data exports correctly to maintenance
   - Stock management integrated

2. **Performance Requirements**
   - Loads in <3 seconds
   - Handles 1000+ components smoothly
   - Photos upload with progress
   - Offline mode seamless

3. **Business Requirements**
   - Professional appearance that sells
   - Clear value proposition throughout
   - Revenue opportunities tracked
   - Integration ready for maintenance portal

## 🔥 CRITICAL REMINDERS

1. **This is PRODUCTION** - Not a demo
2. **Security First** - Maritime compliance required
3. **Mobile First** - Techs use phones/tablets
4. **Offline First** - Vessels have bad internet
5. **Quality Drives Adoption** - Make it beautiful
6. **Integration is Key** - Must flow to maintenance
7. **Revenue Focus** - Enable parts markup

## 📁 Key Documents Created

1. `/ONBOARDING_ARCHITECTURE_DECISIONS.md` - All technical decisions
2. `/DATA_MANAGEMENT_STRATEGY.md` - Handling massive datasets
3. `/SYSTEM_UNDERSTANDING.md` - Complete system overview
4. `/SECURITY_FEATURES_MARKETING.md` - Security selling points
5. `/MAINTENANCE_PORTAL_INTEGRATION_REQUIREMENTS.md` - Integration needs

## 🎯 Ready to Execute

This plan represents hours of detailed discussion and refinement. Every decision has been made with real-world offshore operations in mind. The system is designed to:

- **Solve real problems** (poor handovers, equipment failures)
- **Generate hidden revenue** (parts markup)
- **Protect the business** (quality-first approach)
- **Scale globally** (multi-tenant, secure, compliant)

**Next Step**: Execute Shadow Clone deployment with this plan as the blueprint.

---

*This is the FINAL, COMPLETE plan as of 2024-07-03. All previous versions are superseded by this document.*