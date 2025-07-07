# SMS Onboarding Portal - Unified Production Build

## Overview
Build a production-ready onboarding portal that combines admin, technician, and manager interfaces in a single application with role-based access.

## Core Requirements

### Architecture
- Single application with role-based routing
- PostgreSQL database with Row Level Security
- AWS S3 + CloudFront for file storage
- Progressive Web App for offline capability
- API Gateway + SQS for maintenance portal integration

### Three-Stage Workflow
1. **Admin Setup** - Company registration, vessel setup, token generation
2. **Tech Discovery** - Offline-first equipment documentation with photos
3. **Manager Review** - Quality validation and approval

### Key Features
- **Critical Parts Intelligence**: Cross-reference parts across equipment
- **Quality Scoring**: Real-time 0-100 scoring per equipment
- **Smart Stock Management**: PO integration with delivery confirmation
- **Offline-First**: Full functionality without internet
- **Professional UI**: React + Tailwind + Shadcn/ui

### Integration
- Generate tokens from maintenance portal
- Export approved data to maintenance format
- Webhook progress updates
- Shared user provisioning

### Security
- JWT authentication with role-based access
- AES-256 encryption at rest
- Maritime compliance (IMO 2021, IACS UR E26/E27)
- Complete audit trails

## Success Criteria
1. Production-ready code (not a demo)
2. All 3 stages fully functional
3. Offline sync working perfectly
4. Professional UI that sells the product
5. Ready for real vessel onboarding