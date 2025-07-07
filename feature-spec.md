# SMS Demo System Feature Specification

## Feature Overview
Build a demonstration system for Smart Maintenance Systems (SMS) that showcases the complete maritime maintenance management platform to potential clients.

## Demo Requirements

### 1. Pre-populated Demo Data
Create realistic demo data that showcases system capabilities:

#### Demo Company: "Pacific Maritime Services"
- 3 demo vessels with different types
- 15-20 equipment items per vessel
- Maintenance history spanning 6 months
- Mix of completed, overdue, and upcoming maintenance
- Various fault reports (resolved and active)

#### Demo Users:
- Admin: demo@pacific-maritime.com / Demo123!
- Manager: manager@pacific-maritime.com / Demo123!
- Technician: tech@pacific-maritime.com / Demo123!
- HSE Officer: hse@pacific-maritime.com / Demo123!

### 2. Showcase Features

#### Landing Page Flow:
- Professional coming soon page (current)
- Hidden login demo (5 clicks on logo)
- Smooth transition to main system

#### Onboarding Portal Demo:
- Pre-configured company
- Configuration already approved
- Sample equipment with maintenance schedules
- Historical data upload examples

#### Maintenance Portal Demo:
- Live dashboard with real calculated metrics
- Active team chat with sample conversations
- HSE board with safety alerts
- Equipment with QR codes
- Parts inventory with low stock alerts
- Maintenance calendar with various tasks

### 3. Key Demonstration Scenarios

#### Scenario 1: Revenue Model (Hidden)
- Show low stock notification to SMS admin
- Demonstrate order approval with markup
- Generate professional invoice
- Highlight how vessel sees only final price

#### Scenario 2: Team Communication
- Real-time chat between departments
- HSE safety alert acknowledgment
- Fault reporting workflow
- Team coordination example

#### Scenario 3: Analytics & Performance
- Real metrics calculated from demo data
- Technician performance comparisons
- Fleet-wide analytics
- Trend charts over 6 months

#### Scenario 4: Mobile & Offline
- QR code scanning demonstration
- Offline mode with queued actions
- Sync when reconnected
- Mobile-responsive interface

### 4. Demo Data Details

#### Vessels:
1. **MV Pacific Pioneer** (Container Ship)
   - 25 equipment items
   - 85% maintenance compliance
   - 2 active faults
   
2. **MV Pacific Explorer** (Research Vessel)
   - 20 equipment items
   - 92% maintenance compliance
   - 1 overdue maintenance

3. **MV Pacific Endeavor** (Supply Vessel)
   - 18 equipment items
   - 78% maintenance compliance
   - 3 active faults

#### Equipment Types:
- Main Engine
- Auxiliary Generators
- Fire Suppression Systems
- Navigation Equipment
- Safety Equipment
- Pumps and Compressors

#### Maintenance History:
- Oil changes (every 500 hours)
- Filter replacements (every 90 days)
- Annual inspections
- Certificates with various expiry dates

### 5. Demo Script Support

Create demo-friendly features:
- Quick data reset button (admin only)
- Time travel for maintenance dates
- Instant notification triggers
- Pre-written chat messages
- Sample fault scenarios

### 6. Performance Metrics to Highlight

Show impressive metrics:
- 95% reduction in paperwork
- 30% reduction in maintenance costs
- 20% increase in equipment uptime
- 100% compliance achievement
- 3.2 hour average MTTR

### 7. Integration Points

Demonstrate:
- Email notifications (to demo inbox)
- PDF report generation
- Data export capabilities
- API availability

### 8. Security & Compliance

Highlight:
- Role-based access control
- Audit trail demonstration
- Offline capability for sea operations
- Data encryption

## Technical Implementation

### Database Seeding:
- Create comprehensive seed script
- Realistic timestamps and patterns
- Proper relationships between data
- Performance optimization for demo

### Demo Mode Features:
- Fast-forward time for maintenance
- Instant notification delivery
- Reset to clean state
- Skip waiting periods

### Client Customization Preview:
- Show configuration options
- Demonstrate custom branding
- Display flexible workflows
- Highlight scalability

## Success Criteria

The demo should:
1. Load quickly and run smoothly
2. Show real calculations, not mock data
3. Demonstrate all major features
4. Handle common client questions
5. Reset easily between demos
6. Work offline for trade shows
7. Impress within 15 minutes

## Demo Environment

- Separate demo database
- Demo-specific email accounts
- Isolated from production
- Easy to deploy/replicate
- Mobile devices ready

This specification provides a complete blueprint for building an impressive demonstration system that showcases SMS's capabilities while keeping the 20% revenue model properly hidden.