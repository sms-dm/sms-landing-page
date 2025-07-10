# SMS CLIENT JOURNEY - COMPLETE DOCUMENTATION

## Overview
This document details every step of the client journey from initial contact through to successful onboarding and maintenance portal activation. It covers all user interactions, system processes, emails, notifications, and database changes.

---

## PHASE 1: INITIAL CONTACT & SALES

### 1.1 Website First Contact
**Entry Point**: https://smartmaintenancesystems.com

**User Actions**:
1. Visitor lands on Coming Soon page with countdown timer
2. Clicks "Get Early Access" button
3. Enters preview access code (provided through sales outreach)
4. System validates code and shows warp transition animation
5. Redirects to main preview site

**System Actions**:
- Validates preview access code against whitelist
- Sets authentication cookie: `sms-preview-auth=true`
- Logs access attempt with timestamp and IP
- Triggers Google Analytics event: "preview_access_granted"

**Database Changes**:
```sql
INSERT INTO preview_access_logs (code_used, ip_address, user_agent, accessed_at)
VALUES ('PREVIEW2024', '192.168.1.1', 'Mozilla/5.0...', '2024-01-15 10:30:00');
```

### 1.2 Sales Negotiation Process

**Communication Channels**:
- Email: sales@smartmaintenancesystems.com
- Phone: Direct line to founder
- WhatsApp: For international clients
- LinkedIn: Professional outreach

**Sales Workflow**:
1. **Initial Contact Email** (sent manually):
```
Subject: Transform Your Vessel Maintenance - SMS Demo

Hi [Contact Name],

Following our conversation about [specific pain point], I'd like to show you how Smart Maintenance Systems can reduce your maintenance costs by 30% while ensuring 100% compliance.

Our system is specifically built for offshore vessels by someone with 20+ years in the industry. Key benefits:
- Zero maintenance items missed (enforced handovers)
- 48-hour parts procurement
- Complete audit trail
- Works offline

Would you have 30 minutes this week for a personalized demo?

Best regards,
[Founder Name]
Smart Maintenance Systems
```

2. **Demo Scheduling**:
   - Use Calendly for booking
   - 45-minute slots
   - Zoom meeting with screen share
   - Custom demo environment per prospect

3. **Demo Flow**:
   - Show vessel dashboard
   - Create sample fault report
   - Demonstrate handover enforcement
   - Show parts ordering (without markup visibility)
   - Display cost savings calculator

4. **Follow-up Sequence**:
   - Day 1: Thank you email with demo recording
   - Day 3: Case study PDF
   - Day 7: Pricing proposal
   - Day 14: Limited time offer

### 1.3 Terms Agreement & Contract

**Pricing Tiers**:
- **Basic**: $500/vessel/month (up to 5 vessels)
- **Professional**: $750/vessel/month (6-20 vessels)
- **Enterprise**: $1,000/vessel/month (20+ vessels)

**Contract Terms**:
- 12-month minimum commitment
- 30-day notice for cancellation
- Unlimited users per vessel
- All updates included
- 99.9% uptime SLA

**Legal Documents Required**:
1. Master Service Agreement (MSA)
2. Data Processing Agreement (DPA)
3. Service Level Agreement (SLA)
4. Terms of Service acceptance

---

## PHASE 2: PAYMENT & ACTIVATION

### 2.1 Payment Process

**Manual Payment (Current)**:
1. Invoice sent via email (PDF)
2. Payment options:
   - Bank transfer (preferred)
   - Credit card (via Stripe invoice)
   - Purchase order (NET 30 for enterprise)

**Invoice Email**:
```
Subject: SMS Platform Invoice #INV-2024-001

Dear [Client Name],

Please find attached your invoice for Smart Maintenance Systems.

Invoice Details:
- Amount: $15,000 (Annual - 20 vessels)
- Due Date: [Date + 14 days]
- Payment Reference: SMS-[COMPANY]-2024

Payment Options:
1. Bank Transfer:
   Bank: HSBC UK
   Account: Smart Maintenance Systems Ltd
   Sort Code: 40-02-50
   Account: 12345678
   IBAN: GB12HSBC40025012345678
   
2. Credit Card:
   Click here to pay securely via Stripe

Once payment is received, you'll receive your activation code within 24 hours.

Best regards,
SMS Accounts Team
```

**System Actions on Payment**:
1. Finance team marks invoice as paid in accounting system
2. Triggers activation code generation
3. Creates company record in database
4. Sends confirmation email

### 2.2 Activation Code Generation

**Code Format**: `SMS-[COMPANY_INITIALS]-[YEAR]-[RANDOM]`
Example: `SMS-ABC-2024-7H9K2`

**Database Process**:
```sql
-- Create company record
INSERT INTO companies (
  name, subscription_tier, contract_start, contract_end, 
  max_vessels, status, created_at
) VALUES (
  'ABC Shipping Ltd', 'PROFESSIONAL', '2024-01-15', '2025-01-14',
  20, 'PENDING_ACTIVATION', NOW()
);

-- Generate activation token
INSERT INTO activation_tokens (
  company_id, token, expires_at, max_uses, current_uses
) VALUES (
  [company_id], 'SMS-ABC-2024-7H9K2', '2024-02-14', 1, 0
);
```

### 2.3 Activation Email

**Email Sent** (Automated):
```
Subject: Welcome to SMS - Your Activation Code

Dear [Contact Name],

Welcome to Smart Maintenance Systems! Your account is ready for activation.

ACTIVATION DETAILS:
- Activation Code: SMS-ABC-2024-7H9K2
- Portal URL: https://onboarding.smartmaintenancesystems.com
- Valid Until: February 14, 2024

GETTING STARTED:
1. Go to the onboarding portal
2. Click "Activate Account"
3. Enter your activation code
4. Create your admin account

WHAT'S NEXT:
After activation, you'll be guided through:
- Company profile setup
- Vessel configuration
- User invitations
- Equipment documentation

SUPPORT:
- Documentation: https://docs.smartmaintenancesystems.com
- Email: support@smartmaintenancesystems.com
- Phone: +44 20 1234 5678

We're excited to have you onboard!

Best regards,
The SMS Team
```

**System Notifications**:
- Slack notification to support channel
- CRM updated with activation sent status
- Calendar reminder set for follow-up

---

## PHASE 3: FIRST LOGIN & COMPANY SETUP

### 3.1 Activation Process

**User Journey**:
1. User navigates to: https://onboarding.smartmaintenancesystems.com
2. Clicks "Activate Account" button
3. Enters activation code
4. System validates code

**Validation Process**:
```javascript
// Frontend validation
const validateActivationCode = async (code) => {
  const response = await api.post('/auth/activate', { 
    activationCode: code 
  });
  
  if (response.valid) {
    // Store company context
    localStorage.setItem('companyId', response.companyId);
    // Redirect to registration
    navigate('/auth/register');
  }
};
```

**Backend Validation**:
```sql
-- Check token validity
SELECT * FROM activation_tokens 
WHERE token = 'SMS-ABC-2024-7H9K2'
  AND expires_at > NOW()
  AND current_uses < max_uses;

-- Update usage count
UPDATE activation_tokens 
SET current_uses = current_uses + 1,
    last_used_at = NOW()
WHERE token = 'SMS-ABC-2024-7H9K2';
```

### 3.2 Admin Account Creation

**Registration Form Fields**:
- Full Name (required)
- Email Address (required)
- Password (min 8 chars, complexity requirements)
- Phone Number (optional)
- Job Title (optional)

**Password Requirements**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Account Creation Process**:
```sql
-- Create user account
INSERT INTO users (
  email, password_hash, full_name, role, company_id,
  is_active, email_verified, created_at
) VALUES (
  'admin@abcshipping.com', '[bcrypt_hash]', 'John Smith', 'ADMIN',
  [company_id], true, false, NOW()
);

-- Create email verification token
INSERT INTO email_verifications (
  user_id, token, expires_at
) VALUES (
  [user_id], '[uuid]', NOW() + INTERVAL '24 hours'
);
```

**Welcome Email**:
```
Subject: Welcome to SMS - Verify Your Email

Hi John,

Welcome to Smart Maintenance Systems! You've been registered as an Admin for ABC Shipping Ltd.

Please verify your email address by clicking the link below:
[Verify Email Button]

What you can do as an Admin:
✓ Add and manage vessels
✓ Invite team members
✓ Configure company settings
✓ View all reports and analytics
✓ Manage equipment documentation

This link expires in 24 hours.

Best regards,
The SMS Team
```

### 3.3 Company Profile Setup

**Company Setup Wizard** (4 steps):

**Step 1: Company Information**
- Company Name (pre-filled)
- IMO Number (optional)
- Address Fields:
  - Street Address
  - City
  - State/Province
  - Postal Code
  - Country

**Step 2: Contact Information**
- Primary Contact Email
- Primary Contact Phone
- Billing Email
- Technical Contact Email

**Step 3: Branding**
- Primary Brand Color (color picker)
- Company Logo Upload (PNG/JPG, max 2MB)
- Custom Domain (future feature)

**Step 4: Review & Confirm**
- Summary of all entered information
- Terms of Service checkbox
- Privacy Policy checkbox
- Submit button

**Database Updates**:
```sql
UPDATE companies SET
  imo_number = '1234567',
  address = '{"street": "123 Shipping Lane", "city": "London", ...}',
  contact_email = 'ops@abcshipping.com',
  contact_phone = '+44 20 1234 5678',
  branding = '{"primaryColor": "#0066CC", "logoUrl": "..."}',
  setup_completed_at = NOW(),
  status = 'ACTIVE'
WHERE id = [company_id];
```

---

## PHASE 4: VESSEL CONFIGURATION

### 4.1 Vessel Addition Process

**Add Vessel Form**:
- Vessel Name (required)
- IMO Number (required, validated)
- Vessel Type (dropdown):
  - Drillship
  - Semi-Submersible
  - Jack-up Rig
  - Platform Supply Vessel
  - Other
- Flag State (country dropdown)
- Build Year
- Classification Society
- Next Dry Dock Date

**IMO Validation**:
```javascript
const validateIMO = (imo) => {
  // IMO number format: 7 digits
  // Last digit is check digit
  const digits = imo.toString().split('');
  const checkDigit = digits.pop();
  const sum = digits.reduce((acc, digit, index) => {
    return acc + (digit * (7 - index));
  }, 0);
  return (sum % 10) === parseInt(checkDigit);
};
```

**Database Entry**:
```sql
INSERT INTO vessels (
  company_id, name, imo_number, vessel_type, flag_state,
  build_year, class_society, next_dry_dock, status
) VALUES (
  [company_id], 'MV Excellence', '1234567', 'DRILLSHIP', 'UK',
  2015, 'DNV GL', '2026-06-15', 'ACTIVE'
);

-- Create default locations for vessel
INSERT INTO vessel_locations (vessel_id, name, type, sort_order)
VALUES 
  ([vessel_id], 'Bridge', 'DECK', 1),
  ([vessel_id], 'Engine Room', 'MACHINERY', 2),
  ([vessel_id], 'Drill Floor', 'OPERATIONAL', 3),
  ([vessel_id], 'Accommodation', 'ACCOMMODATION', 4);
```

### 4.2 Team Member Invitations

**Invite Team Members Interface**:
- Email address input
- Role selection:
  - Manager (Can approve/review)
  - Technician (Can add equipment)
  - HSE Officer (Safety documentation)
  - Viewer (Read-only access)
- Vessel assignment (multi-select)
- Custom message (optional)

**Invitation Process**:
```sql
-- Create invitation record
INSERT INTO invitations (
  company_id, invited_by_user_id, email, role,
  vessel_ids, token, expires_at, status
) VALUES (
  [company_id], [admin_user_id], 'tech1@contractor.com', 'TECHNICIAN',
  '[vessel_id_array]', '[uuid]', NOW() + INTERVAL '7 days', 'PENDING'
);
```

**Invitation Email**:
```
Subject: You're invited to join ABC Shipping on SMS

Hi there,

John Smith has invited you to join ABC Shipping Ltd on Smart Maintenance Systems as a Technician.

You'll have access to:
- MV Excellence
- Equipment documentation
- Fault reporting system
- Parts ordering

[Accept Invitation Button]

This invitation expires in 7 days.

Message from John:
"Welcome to the team! Please complete the vessel documentation by end of month."

Best regards,
The SMS Team
```

---

## PHASE 5: EQUIPMENT DOCUMENTATION WORKFLOW

### 5.1 Technician Assignment

**Assignment Creation** (by Manager/Admin):
1. Select vessel
2. Select technician(s)
3. Set deadline
4. Add instructions
5. Create assignment

**Assignment Notification Email**:
```
Subject: New Equipment Documentation Assignment - MV Excellence

Hi Sarah,

You have a new assignment for equipment documentation:

Vessel: MV Excellence
Deadline: January 31, 2024
Assigned by: John Smith

Instructions:
"Please document all critical equipment in the engine room and drill floor. 
Focus on rotating equipment first."

[Start Documentation Button]

The SMS Mobile App is available for offline use:
- Android: [Play Store Link]
- iOS: [App Store Link]

Best regards,
The SMS Team
```

### 5.2 Equipment Entry Process

**Technician Workflow**:

1. **Login to Mobile App**
   - Email/password authentication
   - Biometric option after first login
   - Automatic offline mode detection

2. **Select Assignment**
   - Shows list of active assignments
   - Download vessel data for offline use
   - 50MB typical download size

3. **Select Location**
   - Hierarchical location browser
   - Custom location creation allowed
   - GPS tagging (if available)

4. **Add Equipment**
   - Equipment name
   - Type (dropdown or custom)
   - Manufacturer
   - Model number
   - Serial number
   - Installation date
   - Criticality (Critical/Important/Standard)
   - Running hours (if applicable)
   - Maintenance interval

5. **Add Parts**
   - Part name
   - Part number
   - Quantity on board
   - Minimum stock level
   - Supplier
   - Last price (hidden from technician view)
   - Location in stores

6. **Documentation**
   - Photos (multiple, compressed)
   - Manuals (PDF upload)
   - Drawings (PDF/DWG)
   - Certificates
   - Notes/special instructions

**Offline Data Storage**:
```javascript
// IndexedDB structure
const offlineData = {
  id: 'equip_[timestamp]',
  type: 'equipment',
  action: 'create',
  data: {
    name: 'Main Engine #1',
    type: 'Diesel Engine',
    manufacturer: 'MAN',
    // ... all equipment data
  },
  attachments: [
    {
      type: 'photo',
      data: 'base64_encoded_image',
      metadata: { takenAt: '...', size: 1024000 }
    }
  ],
  timestamp: '2024-01-20T10:30:00Z',
  synced: false
};
```

### 5.3 Data Synchronization

**Auto-Sync Process** (when online):
1. Check for pending offline data every 30 seconds
2. Batch upload in chunks of 10 items
3. Compress images before upload
4. Handle conflicts (server wins)
5. Update local sync status

**Sync Notification**:
```javascript
// In-app notification
showToast({
  type: 'success',
  message: 'Synced 15 equipment items',
  duration: 3000
});
```

---

## PHASE 6: MANAGER REVIEW & APPROVAL

### 6.1 Review Dashboard

**Manager Login**:
- Same portal URL
- Role-based dashboard display
- Real-time sync status

**Review Dashboard Elements**:
- Vessels with pending items
- Progress bars per vessel
- Quick stats:
  - Total equipment entered
  - Pending review
  - Approved
  - Rejected

### 6.2 Equipment Review Process

**Review Interface**:
- Equipment list with filters
- Photo gallery view
- Quick approve/reject buttons
- Bulk actions available
- Comment system for feedback

**Review Workflow**:
1. Manager selects vessel
2. Views equipment list
3. Clicks on equipment item
4. Reviews:
   - All entered data
   - Photos
   - Parts list
   - Documentation
5. Actions:
   - Approve
   - Reject (with reason)
   - Request more info

**Approval Process**:
```sql
-- Update equipment status
UPDATE equipment SET
  status = 'APPROVED',
  reviewed_by_user_id = [manager_id],
  reviewed_at = NOW(),
  review_notes = 'All documentation complete'
WHERE id = [equipment_id];

-- Create audit log
INSERT INTO audit_logs (
  entity_type, entity_id, action, user_id, metadata
) VALUES (
  'equipment', [equipment_id], 'approved', [manager_id],
  '{"previous_status": "pending", "new_status": "approved"}'
);
```

**Rejection Email** (to Technician):
```
Subject: Equipment Documentation - Revision Required

Hi Sarah,

The following equipment documentation needs revision:

Equipment: Main Engine #1
Vessel: MV Excellence
Reason: "Missing nameplate photo and model number"

Please update and resubmit.

[View Equipment Button]

Best regards,
John Smith
Engineering Manager
```

### 6.3 Vessel Completion

**Completion Criteria**:
- All equipment reviewed
- Minimum 90% approved
- No critical equipment rejected
- All mandatory fields complete

**Ready for Export Notification**:
```
Subject: MV Excellence Ready for Maintenance Portal Export

Hi John,

Great news! MV Excellence documentation is complete:
- Equipment documented: 156
- Parts catalogued: 1,247
- Photos uploaded: 892
- Documents attached: 234

The vessel is ready for export to the maintenance portal.

[Review & Export Button]

Best regards,
SMS System
```

---

## PHASE 7: EXPORT TO MAINTENANCE PORTAL

### 7.1 Export Preview

**Preview Interface Shows**:
- Vessel summary
- Equipment statistics
- Parts inventory value
- Documentation count
- Estimated export size
- Warning about data lock

### 7.2 Export Process

**Export Steps**:
1. Manager clicks "Export to Maintenance"
2. System generates export package
3. Validates all data
4. Creates export record
5. Transfers to maintenance database
6. Locks onboarding data
7. Sends notifications

**Data Transfer Process**:
```sql
-- In Onboarding DB
INSERT INTO exports (
  vessel_id, exported_by_user_id, export_format,
  total_equipment, total_parts, total_documents,
  status, started_at
) VALUES (
  [vessel_id], [manager_id], 'JSON',
  156, 1247, 234, 'IN_PROGRESS', NOW()
);

-- In Maintenance DB
INSERT INTO vessels (
  company_id, name, imo_number, source_system,
  import_id, imported_at
) VALUES (
  [company_id], 'MV Excellence', '1234567', 'ONBOARDING',
  [export_id], NOW()
);

-- Bulk insert equipment, parts, etc.
```

### 7.3 Completion Notifications

**Email to Company Admin**:
```
Subject: MV Excellence Successfully Onboarded!

Dear John,

Congratulations! MV Excellence has been successfully onboarded to your maintenance portal.

ONBOARDING SUMMARY:
✓ Equipment documented: 156
✓ Parts catalogued: 1,247  
✓ Photos uploaded: 892
✓ Documents attached: 234
✓ Team members with access: 12

WHAT'S NEXT:
1. Login to your maintenance portal
2. Review imported data
3. Set up maintenance schedules
4. Configure notifications

ACCESS YOUR MAINTENANCE PORTAL:
URL: https://maintain.smartmaintenancesystems.com
Use your existing login credentials

IMPORTANT NOTES:
- The onboarding data is now locked
- Any changes must be made in the maintenance portal
- Historical data starts from today
- All team members have been notified

Need help getting started? We're here:
- Support: support@smartmaintenancesystems.com
- Documentation: https://docs.smartmaintenancesystems.com/maintenance
- Training videos: https://training.smartmaintenancesystems.com

Welcome to smarter maintenance!

Best regards,
The SMS Team
```

**Email to All Vessel Team Members**:
```
Subject: Maintenance Portal Now Active - MV Excellence

Hi [Name],

Good news! The maintenance portal for MV Excellence is now active.

YOUR ACCESS:
- URL: https://maintain.smartmaintenancesystems.com
- Username: [your email]
- Password: [unchanged from onboarding]

WHAT YOU CAN DO NOW:
✓ Report faults
✓ View equipment details
✓ Order parts
✓ Complete maintenance tasks
✓ Generate reports

[Access Portal Button]

Best regards,
The SMS Team
```

---

## PHASE 8: DATABASE STATE THROUGHOUT JOURNEY

### 8.1 Key Database Tables & Changes

**Companies Table**:
```sql
-- After payment
status: 'PENDING_ACTIVATION'

-- After activation code used
status: 'ACTIVE'
activated_at: [timestamp]

-- After setup complete
setup_completed_at: [timestamp]

-- After first vessel added
vessel_count: 1

-- After export complete
onboarding_completed_at: [timestamp]
```

**Users Table**:
```sql
-- After each user registration
total_users incrementing
last_login_at updated on each login
email_verified_at set after email verification
```

**Vessels Table**:
```sql
-- Status progression
status: 'DRAFT' -> 'DOCUMENTING' -> 'REVIEWING' -> 'EXPORTED'
documentation_progress: 0 -> 100%
```

**Activity Logs** (throughout):
```sql
INSERT INTO activity_logs (
  user_id, action, entity_type, entity_id, metadata, ip_address
) VALUES (
  [user_id], 'equipment.created', 'equipment', [id], '{...}', '192.168.1.1'
);
```

### 8.2 Permissions Matrix

| Role | Onboarding Portal | Maintenance Portal |
|------|-------------------|-------------------|
| Admin | Full access | Full access |
| Manager | Review & approve | View all, edit schedules |
| Technician | Add equipment | Report faults, complete tasks |
| HSE Officer | Add safety docs | View safety data |
| Viewer | Read only | Read only |

### 8.3 File Storage Structure

```
/company_[id]/
  /vessels/
    /vessel_[id]/
      /equipment/
        /equipment_[id]/
          /photos/
            - photo_[timestamp].jpg (compressed)
          /documents/
            - manual_[id].pdf
            - certificate_[id].pdf
      /exports/
        - export_[timestamp].json
        - export_[timestamp].log
```

---

## PHASE 9: INTEGRATION POINTS

### 9.1 Email Service Integration
- Provider: SendGrid
- Templates: 15 different types
- Tracking: Opens, clicks, bounces
- Failover: SMTP backup

### 9.2 File Storage
- Provider: AWS S3 / DigitalOcean Spaces
- CDN: CloudFlare
- Compression: Images reduced 70%
- Encryption: AES-256 at rest

### 9.3 Payment Processing
- Provider: Stripe
- Methods: Card, bank transfer
- Invoicing: Automated
- Reconciliation: Daily

### 9.4 Analytics & Monitoring
- User Analytics: Google Analytics 4
- Error Tracking: Sentry
- Uptime: UptimeRobot
- Performance: New Relic

### 9.5 Communication
- Support: Intercom widget
- Internal: Slack webhooks
- SMS: Twilio (critical alerts)
- Push: Firebase Cloud Messaging

---

## PHASE 10: ERROR HANDLING & RECOVERY

### 10.1 Common Error Scenarios

**Activation Code Issues**:
- Expired: Show renewal instructions
- Already used: Contact support
- Invalid: Check for typos

**Upload Failures**:
- Retry with exponential backoff
- Queue for later if offline
- Notify user after 3 failures

**Payment Failures**:
- Retry declined cards
- Send payment reminder emails
- Grace period: 7 days
- Account suspension after 14 days

### 10.2 Data Recovery

**Backup Schedule**:
- Database: Every 6 hours
- Files: Daily incremental
- Full backup: Weekly
- Retention: 90 days

**Disaster Recovery**:
- RPO: 6 hours
- RTO: 4 hours
- Tested quarterly
- Documented procedures

---

## APPENDIX: EMAIL TEMPLATES

### A1. Complete Email Sequence

1. Sales Introduction
2. Demo Follow-up
3. Contract Sent
4. Payment Reminder
5. Payment Received
6. Activation Code
7. Welcome Email
8. Email Verification
9. Team Invitation
10. Assignment Notification
11. Review Required
12. Approval Notification
13. Export Ready
14. Export Complete
15. Maintenance Portal Active

### A2. System Notifications

1. Password reset
2. Login from new device
3. Account locked
4. Subscription expiring
5. Storage limit warning
6. Sync conflicts
7. Scheduled maintenance
8. New feature announcements

### A3. Support Templates

1. Ticket received
2. Ticket updated
3. Ticket resolved
4. Satisfaction survey
5. Knowledge base articles

---

## CONCLUSION

This document represents the complete client journey from initial contact through successful onboarding. The system is designed to be intuitive while maintaining strict data quality standards. The hidden revenue model (20% parts markup) operates seamlessly in the background, providing additional revenue without client awareness.

Key success factors:
- Automated workflows reduce manual intervention
- Role-based permissions ensure data security
- Offline capability critical for vessel operations
- Email notifications keep all parties informed
- Comprehensive audit trail for compliance

The journey typically takes 2-4 weeks from activation to maintenance portal access, depending on vessel size and team efficiency.