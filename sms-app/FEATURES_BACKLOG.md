# SMS Features Backlog

## Overview
This document tracks feature ideas and enhancements discussed but not yet implemented.

## Notification System

### Handover Reminders
**Priority**: High  
**Discussion Date**: 2025-01-07  
**Description**: Automated notifications as technicians approach rotation end
- Email/SMS at 48 hours before disembark
- Reminder at 24 hours 
- Urgent reminder at 4 hours
- Escalation to manager if handover not started 12 hours before
- Mobile push notifications for app users
- Include direct link to handover form

### Implementation Notes
- Use background job scheduler (e.g., node-cron)
- SMS via Twilio API
- Email via SendGrid/AWS SES
- Store notification preferences per user
- Log all notifications sent for compliance

---

## Rotation Management Flexibility

### Dynamic Rotation Adjustments
**Priority**: Critical  
**Discussion Date**: 2025-01-07  
**Description**: Handle real-world rotation changes
- **Extended Stay**: 
  - "Extend Rotation" button when weather/operational needs require
  - Automatic notification to relief technician
  - Recalculate handover deadline
  - Track overtime/extra days for payroll
  
- **Early Departure**:
  - Medical emergency/family emergency options
  - Expedited handover process
  - "Critical items only" handover template
  - Flag incomplete tasks for incoming tech
  
- **Weather Delays**:
  - "Weather Hold" status
  - Pause countdown timer
  - Auto-notify shore management
  - Keep both techs (outgoing/incoming) informed
  
- **Crew Change Disruptions**:
  - Helicopter cancellations
  - Port closures
  - COVID/illness replacements
  - "Temporary Coverage" assignments

### System Requirements
- Rotation status: Active, Extended, Weather Hold, Early Departure
- Audit trail of all changes with reasons
- Integration with crew management systems
- Automatic handover deadline adjustments
- Overtime/compensation tracking
- Multiple technicians on same vessel during transitions

### UI Changes Needed
- "Modify Rotation" button on dashboard
- Reason selection dropdown
- New end date picker
- Management approval workflow for some changes
- Status indicators for abnormal rotations

---

## Vessel Selection Enhancements

### Large Fleet Navigation (50+ vessels)
**Priority**: Medium  
**Discussion Date**: 2025-01-07  
**Description**: For companies with many vessels
- Search/filter by vessel name, type, location
- Group by region (North Sea, Gulf of Mexico, etc.)
- "My Recent Vessels" quick access
- Vessel assignment restrictions (only show assigned vessels)

---

## AI Counseling Feature
**Priority**: High  
**Description**: Private mental health support for isolated offshore workers
- Completely confidential (no data shared with employer)
- 24/7 availability
- Context-aware (understands offshore life challenges)
- Crisis support protocols
- Multiple language support

---

## Revenue Tracking
**Priority**: Critical  
**Description**: Hidden 20% markup system
- Transparent to vessel operators
- Tracked in internal portal only
- Automated invoice generation with markup
- Parts marketplace integration
- Supplier relationship management

---

## Cross-Fleet Learning
**Priority**: High  
**Description**: AI learns from faults across all vessels
- Pattern recognition for common failures
- Predictive maintenance suggestions
- Success rate tracking for repairs
- Knowledge base auto-population

---

## Future Expansion Markets
**Priority**: Long-term  
**Description**: Beyond marine sector
- Manufacturing plants
- Mining operations  
- Power generation facilities
- Airport ground equipment
- Any industry with:
  - Remote/isolated operations
  - Expensive equipment
  - Skilled technicians
  - Complex maintenance needs

---

## Technical Debt & Improvements
- Migrate from SQLite to PostgreSQL for production
- Add comprehensive test suite
- Implement real-time updates (WebSockets)
- Offline mode with sync
- Multi-language support
- Advanced analytics dashboard
- API rate limiting
- Audit logging

---

## Recently Implemented (Demo)
- **Custom Rotation Lengths**: Can now enter any number of days (not just 14/21/28/35)
- **Manual End Date Selection**: End date can be manually adjusted
- **Smart Re-login**: System remembers active rotation and skips vessel selection
- **Vessel Introduction**: First-time vessel joiners get onboarding slides

## Notes
- Update this file as new ideas emerge
- Mark items as "In Development" when started
- Move to CHANGELOG.md when completed