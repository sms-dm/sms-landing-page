# Equipment Verification Schedule System

## Overview
The verification schedule system ensures equipment data accuracy over time by implementing periodic verification requirements and automatic quality score degradation for overdue verifications.

## Key Features

### 1. Verification Fields (Database)
Added to the equipment table:
- `verification_interval_days` - How often equipment needs verification
- `last_verified_at` - Timestamp of last verification
- `next_verification_date` - Calculated next verification date
- `verified_by` - User who performed last verification
- `verification_notes` - Notes from last verification
- `data_quality_degradation_rate` - Percentage degradation per month when overdue (default 5%)

### 2. Manager Interface
Managers can:
- Set verification intervals for equipment (e.g., every 90 days)
- Configure quality degradation rates
- View verification schedules
- Perform verifications with findings and corrective actions

### 3. Verification Dashboard
Located at `/dashboard/manager/verifications`, displays:
- Total equipment with verification schedules
- Overdue verifications (highlighted in red)
- Due soon verifications (next 30 days)
- Recent verification activity
- Average quality scores

### 4. Auto-Degradation System
- Quality scores automatically degrade when equipment is overdue
- Degradation rate is configurable per equipment (default 5% per month)
- Calculated dynamically based on days overdue
- Example: 30 days overdue with 5% rate = 5% quality reduction

### 5. Notification System
Automated notifications for:
- **Due Soon**: Equipment due within 30 days
- **Overdue**: Equipment past verification date
- **Critical Overdue**: Equipment overdue by 30+ days

Notifications are:
- Created daily via scheduled tasks (8 AM)
- Sent to managers and admins
- Displayed in the UI notification bell
- Can be acknowledged by users

## API Endpoints

### Verification Management
- `POST /api/v1/verification/schedule` - Set verification schedule
- `GET /api/v1/verification/due` - Get equipment due for verification
- `POST /api/v1/verification/perform` - Perform verification
- `GET /api/v1/verification/history` - Get verification history
- `GET /api/v1/verification/dashboard` - Get dashboard statistics

### Notifications
- `GET /api/v1/verification/notifications` - Get notifications
- `POST /api/v1/verification/notifications/acknowledge` - Acknowledge notification

## Scheduled Tasks

Two automated tasks run daily:

1. **Notification Creation (8 AM)**
   - Finds equipment due within 30 days or overdue
   - Creates notifications for managers/admins
   - Prevents duplicate notifications

2. **Quality Score Degradation (2 AM)**
   - Finds overdue equipment
   - Calculates degradation based on days overdue
   - Updates quality scores
   - Creates audit records

## Database Schema

### New Tables
1. `equipment_verifications` - Verification history records
2. `verification_notifications` - Notification tracking

### Database Functions
- `calculate_degraded_quality_score()` - Calculates degraded score
- `update_next_verification_date()` - Auto-updates next date
- `create_verification_notifications()` - Creates notifications

## Frontend Components

### Manager Components
1. **VerificationDashboard** - Main dashboard with stats and due equipment
2. **VerificationScheduleDialog** - Set verification intervals
3. **PerformVerificationDialog** - Record verification results
4. **VerificationNotifications** - Notification dropdown
5. **VerificationManagementPage** - Full management interface

### Key Features
- Color-coded status indicators (red for overdue, yellow for due soon)
- Real-time quality score degradation display
- Verification type selection (Scheduled, Manual, Corrective)
- Findings and corrective action tracking
- Pagination for history views

## Usage Example

1. **Setting a Schedule**:
   - Manager selects equipment
   - Sets 90-day verification interval
   - Sets 5% monthly degradation rate
   - System calculates next verification date

2. **Automatic Degradation**:
   - Equipment due date passes
   - Daily task runs at 2 AM
   - Quality score degrades by configured rate
   - Notification created for managers

3. **Performing Verification**:
   - Manager reviews overdue equipment
   - Performs verification inspection
   - Records new quality score and findings
   - System updates next verification date

## Benefits

1. **Data Accuracy**: Ensures equipment data remains current
2. **Proactive Management**: Notifications prevent oversight
3. **Quality Tracking**: Degradation reflects data staleness
4. **Audit Trail**: Complete history of verifications
5. **Flexibility**: Configurable per equipment type/criticality

## Security

- Role-based access (Managers and Admins only)
- Row-level security for multi-tenant isolation
- Audit logging for all verification activities
- Secure notification acknowledgment

## Future Enhancements

1. Batch verification operations
2. Mobile app integration
3. Customizable notification schedules
4. Integration with maintenance systems
5. Predictive verification scheduling based on usage patterns