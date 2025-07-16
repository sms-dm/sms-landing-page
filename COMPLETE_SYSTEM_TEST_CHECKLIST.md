# SMS Complete System Test Checklist

## Testing Approach
We'll go through each component systematically, testing every feature and fixing issues as we find them.

---

## Phase 1: Landing Page (sms-landing)

### 1.1 Initial Load
- [ ] Navigate to https://yourdomain.com
- [ ] **Expected**: Matrix-style animated background loads
- [ ] **Expected**: SMS logo appears with glow effect
- [ ] **Check**: Page loads under 3 seconds
- [ ] **Check**: No console errors (F12 → Console)

### 1.2 Navigation
- [ ] Click each nav menu item
- [ ] **Expected**: Smooth scroll to sections
- [ ] **Check**: Mobile menu works (resize browser)
- [ ] **Test**: Features, How it Works, Stats, Contact

### 1.3 Hero Section
- [ ] **Check**: "Contact Sales" button visible
- [ ] **Check**: "Customer Portal" button visible
- [ ] Click "Contact Sales"
- [ ] **Expected**: Scrolls to contact form
- [ ] Click "Customer Portal"
- [ ] **Expected**: Redirects to /login

### 1.4 Features Section
- [ ] Count features displayed
- [ ] **Expected**: 9 features with icons
- [ ] **Check**: Hover effects work
- [ ] **Verify**: No "anomaly detection" mentioned

### 1.5 Contact Form
- [ ] Fill out all fields
- [ ] Submit with empty fields
- [ ] **Expected**: Validation messages appear
- [ ] Submit with valid data
- [ ] **Expected**: Success message
- [ ] **Check**: Email received (if configured)

---

## Phase 2: Customer Journey - New Company

### 2.1 Activation Flow
- [ ] Navigate to https://yourdomain.com/activate
- [ ] **Expected**: Activation code input page
- [ ] Enter invalid code "XXXX-XXXX-XXXX-XXXX"
- [ ] **Expected**: "Invalid code" error
- [ ] Enter valid code "TEST-2024-DEMO-CODE"
- [ ] **Expected**: Redirects to registration

### 2.2 Company Registration
- [ ] Fill company details:
  - [ ] Company Name: "Test Shipping Co"
  - [ ] Contact Email: your.email@gmail.com
  - [ ] IMO Number: 1234567
  - [ ] Fleet Size: 5
- [ ] **Expected**: Form validates IMO (7 digits)
- [ ] Submit
- [ ] **Expected**: Creates company and admin user

### 2.3 Admin User Setup
- [ ] Enter admin details:
  - [ ] First Name
  - [ ] Last Name
  - [ ] Email
  - [ ] Password (test: Admin123!)
- [ ] **Expected**: Password strength indicator
- [ ] Submit
- [ ] **Expected**: Redirects to vessel setup

---

## Phase 3: Onboarding Portal

### 3.1 Vessel Setup (Admin)
- [ ] Click "Add Vessel"
- [ ] Enter vessel details:
  - [ ] Name: "MV Test Vessel"
  - [ ] Type: General Cargo
  - [ ] Year Built: 2015
  - [ ] Flag: Singapore
- [ ] Submit
- [ ] **Expected**: Vessel appears in list
- [ ] **Check**: Can edit vessel details
- [ ] **Check**: Can delete vessel

### 3.2 User Management (Admin)
- [ ] Navigate to Users section
- [ ] Click "Invite User"
- [ ] Add Manager:
  - [ ] Email: manager@test.com
  - [ ] Role: Manager
  - [ ] Vessel: MV Test Vessel
- [ ] **Expected**: Invitation sent
- [ ] Add Technician:
  - [ ] Email: tech@test.com
  - [ ] Role: Technician
- [ ] **Expected**: User appears as "Invited"

### 3.3 Technician Login
- [ ] Logout as admin
- [ ] Login as technician (use invite link)
- [ ] **Expected**: Sees assigned vessel
- [ ] **Check**: Cannot see Users section
- [ ] Navigate to Equipment

### 3.4 Equipment Documentation
- [ ] Click "Add Equipment"
- [ ] Fill details:
  - [ ] Name: "Main Engine"
  - [ ] Manufacturer: "MAN B&W"
  - [ ] Model: "6S60MC"
  - [ ] Serial: "123456"
  - [ ] Location: "Engine Room"
- [ ] Upload photo (test with any image)
- [ ] **Expected**: Photo preview appears
- [ ] Add critical part:
  - [ ] Name: "Fuel Injection Pump"
  - [ ] Part Number: "FIP-001"
  - [ ] Quantity: 6
- [ ] Submit
- [ ] **Expected**: Status shows "DRAFT"

### 3.5 Equipment Submission
- [ ] Select equipment
- [ ] Click "Submit for Review"
- [ ] **Expected**: Status changes to "PENDING_REVIEW"
- [ ] **Check**: Cannot edit after submission

---

## Phase 4: Manager Approval

### 4.1 Manager Login
- [ ] Logout and login as manager
- [ ] Navigate to Equipment Review
- [ ] **Expected**: Sees pending equipment
- [ ] **Check**: Shows technician who submitted

### 4.2 Historical Data Upload
- [ ] Click "Historical Data" button
- [ ] **Expected**: Upload interface appears
- [ ] Drag and drop a PDF
- [ ] **Expected**: Progress bar shows processing
- [ ] **Check**: AI Knowledge Level increases
- [ ] **Check**: Preview of extracted data

### 4.3 Equipment Approval
- [ ] Click "Approve" on equipment
- [ ] **Expected**: Confirmation dialog
- [ ] Confirm
- [ ] **Expected**: Status changes to "APPROVED"
- [ ] **Check**: Technician notified

### 4.4 Equipment Rejection
- [ ] Add another equipment as technician
- [ ] As manager, click "Reject"
- [ ] Enter reason: "Missing documentation"
- [ ] **Expected**: Status changes to "REJECTED"
- [ ] **Check**: Technician sees rejection reason

---

## Phase 5: Portal Integration

### 5.1 Trigger Sync
- [ ] As admin, navigate to Integration
- [ ] Click "Sync to Maintenance Portal"
- [ ] **Expected**: Progress indicator
- [ ] Wait for completion
- [ ] **Expected**: Shows items synced

### 5.2 Authentication Bridge
- [ ] Click "Access Maintenance Portal"
- [ ] **Expected**: Auto-login to maintenance portal
- [ ] **Check**: Correct company context
- [ ] **Check**: User role preserved

---

## Phase 6: Maintenance Portal

### 6.1 Initial Access
- [ ] Direct navigate to https://yourdomain.com:3005
- [ ] **Expected**: Redirects to login
- [ ] Login with synced credentials
- [ ] **Expected**: Dashboard loads
- [ ] **Check**: Company name correct

### 6.2 Verify Synced Data
- [ ] Navigate to Vessels
- [ ] **Expected**: "MV Test Vessel" appears
- [ ] Click on vessel
- [ ] **Expected**: Details match onboarding
- [ ] Navigate to Equipment
- [ ] **Expected**: "Main Engine" appears
- [ ] **Check**: QR code generated

### 6.3 Team Communication
- [ ] Click Team Chat icon
- [ ] **Expected**: WebSocket connects
- [ ] Select "Engine Room" channel
- [ ] Type message: "Testing team chat"
- [ ] Send
- [ ] **Expected**: Message appears instantly
- [ ] **Check**: Timestamp correct
- [ ] Open in another browser/incognito
- [ ] **Expected**: Message visible there too

### 6.4 HSE Board
- [ ] Navigate to HSE Board
- [ ] Create safety alert:
  - [ ] Priority: HIGH
  - [ ] Title: "Hot Work Procedures"
  - [ ] Message: "New procedures in effect"
- [ ] Submit
- [ ] **Expected**: Alert appears on board
- [ ] **Check**: Other users see it
- [ ] Click "Acknowledge"
- [ ] **Expected**: Shows who acknowledged

### 6.5 Equipment Management
- [ ] Navigate to Equipment
- [ ] Click on "Main Engine"
- [ ] **Expected**: Full details visible
- [ ] Click "Report Fault"
- [ ] Fill fault details:
  - [ ] Description: "Unusual vibration"
  - [ ] Severity: Medium
  - [ ] Immediate action: "Reduced speed"
- [ ] Submit
- [ ] **Expected**: Fault logged
- [ ] **Check**: Notification sent

### 6.6 Maintenance Scheduling
- [ ] Click "Schedule Maintenance"
- [ ] Select:
  - [ ] Type: Routine
  - [ ] Date: Next week
  - [ ] Duration: 4 hours
- [ ] Assign to technician
- [ ] **Expected**: Appears in calendar
- [ ] **Check**: Technician notified

### 6.7 Parts Ordering
- [ ] Navigate to Parts
- [ ] Search: "Fuel Injection"
- [ ] **Expected**: Shows available parts
- [ ] Add to cart (quantity: 2)
- [ ] View cart
- [ ] **Expected**: Shows total with markup
- [ ] **Check**: 20% markup applied (hidden)
- [ ] Submit order
- [ ] **Expected**: Order confirmation

### 6.8 Analytics Dashboard
- [ ] Navigate to Analytics
- [ ] **Expected**: Charts load
- [ ] **Check**: Equipment health scores
- [ ] **Check**: Maintenance compliance %
- [ ] **Check**: Fault trends graph
- [ ] Export report (PDF)
- [ ] **Expected**: PDF downloads

---

## Phase 7: Advanced Features

### 7.1 Offline Mode
- [ ] In DevTools, go offline (Network tab)
- [ ] Navigate around portal
- [ ] **Expected**: Pages still load
- [ ] Create a fault report
- [ ] **Expected**: Saves locally
- [ ] Go back online
- [ ] **Expected**: Syncs automatically

### 7.2 QR Code Scanning
- [ ] Print/display equipment QR code
- [ ] Access on mobile device
- [ ] Scan QR code
- [ ] **Expected**: Equipment details load
- [ ] **Check**: Can update from mobile

### 7.3 File Management
- [ ] Upload equipment manual (PDF)
- [ ] **Expected**: Processes and stores
- [ ] Upload image > 10MB
- [ ] **Expected**: Size limit error
- [ ] Download uploaded file
- [ ] **Expected**: File intact

### 7.4 Role Permissions
- [ ] Login as technician
- [ ] Try accessing Admin section
- [ ] **Expected**: Access denied
- [ ] Try approving equipment
- [ ] **Expected**: No approve button
- [ ] Check HSE board
- [ ] **Expected**: Can view, not create

---

## Phase 8: Email Automation

### 8.1 Email Triggers
- [ ] Trigger each email type:
  - [ ] New user welcome
  - [ ] Maintenance due reminder
  - [ ] Fault alert (HIGH severity)
  - [ ] Equipment approved
  - [ ] Weekly summary
- [ ] **Check**: Emails arrive in inbox
- [ ] **Check**: Correct formatting
- [ ] **Check**: Links work

### 8.2 Email Queue
- [ ] As admin, view email queue
- [ ] **Expected**: Shows pending/sent
- [ ] Force process queue
- [ ] **Expected**: Emails sent
- [ ] Check failed email handling
- [ ] **Expected**: Retries automatically

---

## Phase 9: Security Testing

### 9.1 Authentication
- [ ] Try accessing without login
- [ ] **Expected**: Redirects to login
- [ ] Enter wrong password 5 times
- [ ] **Expected**: Account locked
- [ ] Check JWT expiry
- [ ] **Expected**: Auto-logout after timeout

### 9.2 Data Isolation
- [ ] Create second company
- [ ] **Expected**: Cannot see first company's data
- [ ] Try accessing other company's URLs
- [ ] **Expected**: Access denied

### 9.3 Input Validation
- [ ] Try SQL injection in forms
- [ ] Try XSS in messages
- [ ] Upload non-image as image
- [ ] **Expected**: All blocked/sanitized

---

## Phase 10: Performance & Polish

### 10.1 Load Testing
- [ ] Add 100 equipment items
- [ ] **Expected**: List still responsive
- [ ] Send 50 chat messages rapidly
- [ ] **Expected**: No lag/drops
- [ ] Upload 20 files simultaneously
- [ ] **Expected**: Queue handles properly

### 10.2 Browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Test on mobile (responsive)

### 10.3 Error Handling
- [ ] Disconnect internet mid-operation
- [ ] **Expected**: Graceful error message
- [ ] Submit form with server stopped
- [ ] **Expected**: User-friendly error
- [ ] Trigger 404 page
- [ ] **Expected**: Branded 404 page

---

## Fix Log

As we go through testing, document issues here:

### Issue #1: [Description]
- **Found in**: [Section]
- **Expected**: [What should happen]
- **Actual**: [What happened]
- **Fix**: [How we fixed it]
- **Status**: [ ] Fixed [ ] Pending

### Issue #2: [Description]
- ...

---

## Sign-off

### System Ready When:
- [ ] All checklist items pass
- [ ] No critical bugs remain
- [ ] Email system operational
- [ ] Data sync working
- [ ] Performance acceptable
- [ ] Security validated

### Deployment Ready:
- [ ] Production environment prepared
- [ ] SSL certificates installed
- [ ] Domains configured
- [ ] Backups automated
- [ ] Monitoring active

**Testing Started**: ___________
**Testing Completed**: ___________
**Signed Off By**: ___________

---

## Notes

- Test with real data where possible
- Document any workarounds needed
- Note features that need documentation
- List any follow-up tasks discovered