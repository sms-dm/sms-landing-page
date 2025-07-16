# Smart Marine System (SMS) - Project Plan

## Executive Summary
Smart Marine System is a revolutionary maintenance platform for offshore vessels with a hidden revenue model through 20% markup on parts procurement. The system addresses isolation challenges faced by offshore technicians while providing comprehensive maintenance management.

## Current Status
- **Maintenance Portal**: Demo complete, needs production deployment
- **Onboarding Portal**: Architecture designed, implementation pending
- **Revenue Model**: Hidden 20% markup on all parts orders
- **Target**: $10M ARR within 16 weeks

## Project Components

### 1. SMS Maintenance Portal (Production-Ready)
**Purpose**: Daily operations and maintenance management
**Status**: 70% complete, needs critical fixes

**Completed Features**:
- Multi-tenant architecture
- Role-based access (Technician, Manager, Admin)
- Authentication system (JWT)
- Vessel selection with rotation tracking
- Basic fault reporting
- Equipment management foundation
- Community board

**Required Fixes**:
- Button click events not responding
- Equipment modal behavior issues
- Frontend-backend integration gaps
- Production hosting setup

**Tech Stack**:
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: SQLite (demo) → PostgreSQL (production)
- Authentication: JWT tokens

### 2. SMS Onboarding Portal (To Be Built)
**Purpose**: One-time vessel setup and data collection
**Status**: Architecture designed, 0% implemented

**Planned Architecture**:
- Admin Portal: Next.js 14+ (desktop)
- Tech App: React PWA with Vite (mobile)
- Offline-first design
- Camera integration for equipment photos
- Progressive wizard interface

**Key Features**:
- Equipment data collection
- Vessel configuration
- Staff role assignment
- Excel import/export
- Gamification elements
- Auto-folder generation

### 3. Business Systems
**Payment Processing**: Stripe integration needed
**Subscription Management**: Tiered pricing ($500-2000/vessel/month)
**Hidden Markup System**: 20% automatic markup on parts
**Multi-tenant Isolation**: Company-specific branding and data

## Technical Requirements

### Infrastructure
- **Hosting**: DigitalOcean (simpler than AWS)
- **Database**: PostgreSQL
- **Storage**: S3-compatible for files
- **SSL**: Required for production
- **Domain**: Custom domains per client

### Security
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Multi-tenant data isolation
- Encryption at rest and in transit
- Audit trail for all actions

### Performance
- Offline capability (PWA)
- Real-time synchronization
- Mobile-responsive design
- Fast search across documents
- Optimized for vessel internet

## Implementation Phases

### Phase 1: Production Deployment (Weeks 1-2)
1. Fix critical UI issues (button events, modals)
2. Complete frontend-backend integration
3. Setup DigitalOcean infrastructure
4. Migrate SQLite to PostgreSQL
5. Configure SSL and domains
6. Deploy production environment

### Phase 2: Business Systems (Weeks 3-4)
1. Integrate Stripe payment processing
2. Implement subscription management
3. Configure hidden markup calculator
4. Setup automated billing
5. Create admin dashboard for billing

### Phase 3: Advanced Features (Weeks 5-8)
1. AI assistant integration for technicians
2. Offline PWA capabilities
3. Real-time synchronization
4. Intelligent drawing search
5. Advanced reporting and analytics

### Phase 4: Onboarding Portal (Weeks 9-12)
1. Build PWA foundation
2. Create progressive wizard
3. Implement camera integration
4. Design mobile UI/UX
5. Excel import/export functionality

### Phase 5: Market Expansion (Weeks 13-16)
1. First 10 paying customers
2. User feedback integration
3. Performance optimization
4. Feature refinement
5. Scale infrastructure

## Success Metrics

### Technical Metrics
- 99.9% uptime
- <2s page load time
- 100% mobile responsive
- Zero critical security vulnerabilities
- 90%+ test coverage

### Business Metrics
- 10 paying customers by week 16
- $50K MRR by week 16
- <30 day sales cycle
- 90%+ customer satisfaction
- <5% monthly churn

### User Metrics
- <5 minute onboarding time
- 80%+ daily active usage
- 95%+ successful handovers
- 90%+ parts ordering accuracy
- 4.5+ app store rating

## Risk Mitigation

### Technical Risks
- **Integration Complexity**: Modular architecture
- **Offline Sync Conflicts**: Conflict resolution system
- **Performance Issues**: Progressive enhancement
- **Security Vulnerabilities**: Regular audits

### Business Risks
- **Slow Adoption**: Free pilot program
- **Competition**: Hidden revenue model
- **Pricing Resistance**: Value demonstration
- **Support Burden**: Self-service features

## Resource Requirements

### Development Team
- Full-stack developers (2-3)
- DevOps engineer (1)
- UI/UX designer (1)
- QA engineer (1)
- Project manager (1)

### Infrastructure Costs
- DigitalOcean: $50-100/month initially
- PostgreSQL: Included
- S3 Storage: $20/month
- SSL Certificates: $10/month
- Domains: $15/year each

### Third-Party Services
- Stripe: 2.9% + $0.30 per transaction
- SendGrid: $15/month (emails)
- Sentry: $26/month (error tracking)
- Analytics: Free tier initially

## Conclusion
SMS is positioned to capture the $223M vessel maintenance software market with its unique hidden revenue model and focus on technician experience. The combination of SaaS fees and parts markup creates a sustainable competitive advantage that competitors cannot easily replicate.

---
*Last Updated: January 2025*