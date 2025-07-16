# SMS Onboarding Portal Development Plan

## Project Overview
Build a 3-stage onboarding portal that ensures high-quality vessel data collection before vessels can use the SMS maintenance platform.

## Three-Stage Workflow
1. **Admin Setup**: Company registration, vessel basics, user management, token generation
2. **Tech Discovery**: On-vessel documentation, equipment discovery, photo capture, missing data identification  
3. **Manager Review**: Quality control, approval workflow, change requests, final sign-off

## Technical Architecture

### Frontend Applications
1. **Admin Portal** (Next.js 14+)
   - Desktop-optimized for office use
   - Company/vessel setup wizard
   - Review dashboard
   - Progress monitoring

2. **Tech App** (React PWA with Vite)
   - Mobile-optimized for tablets
   - Offline-first with IndexedDB
   - Camera integration
   - Progressive discovery flow

### Backend (Node.js + Express)
- JWT authentication with refresh tokens
- PostgreSQL with Prisma ORM
- RESTful API
- Webhook integration with maintenance platform

### Design System
- Inherit from sms-app (SMS branded)
- Dark theme with SMS navy (#003366) and cyan (#00CED1)
- Glassmorphism effects
- Mobile-responsive components

## Key Features

### Data Collection
- Tech creates locations as they explore vessel
- Equipment discovery (not predefined lists)
- Photo-first documentation
- Missing data becomes business opportunities

### Quality System
- Real-time scoring (0-100)
- Transparent breakdown by category
- Missing data tracking for upselling
- Manager approval required before submission

### Business Intelligence
- Track missing schematics, manuals, parts lists
- Calculate revenue opportunities
- Automated service proposals
- Quality metrics dashboard

## Integration Points
- Token generation from maintenance platform
- Progress webhooks
- Final data transfer in maintenance platform format
- User provisioning

## Success Criteria
- 15-minute admin setup
- 2-3 hour tech documentation
- 30-minute manager review
- 90%+ data completion rates
- Missing data tracked as opportunities