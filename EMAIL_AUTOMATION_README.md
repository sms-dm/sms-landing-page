# SMS Email Automation System

## Overview

The SMS Email Automation System provides comprehensive email functionality for activation codes, team invitations, and other automated communications. The system includes:

- Professional HTML email templates with SMS branding
- Email queue with retry mechanism
- Automated triggers for activation reminders and expiry notifications
- Scheduled jobs for email processing
- Support for multiple email providers (SMTP, AWS SES, Ethereal for testing)

## Features

### 1. Email Templates

Located in `sms-app/backend/src/templates/email/`:

- **activation-code.template.ts** - Initial activation code email
- **activation-reminder.template.ts** - Reminder 2 days before expiry
- **activation-expired.template.ts** - Notification when code expires
- **activation-regenerated.template.ts** - New code generation
- **team-invitation.template.ts** - Team member invitations

All templates extend `BaseEmailTemplate` and include:
- Professional SMS branding with blue color scheme (#0066CC)
- Mobile-responsive design
- Clear CTAs
- Detailed information tables

### 2. Email Queue System

Database tables:
- `email_queue` - Stores pending/sent emails
- `email_logs` - Tracks email delivery status
- `activation_codes` - Manages activation codes

Features:
- Priority-based processing (high, normal, low)
- Automatic retry for failed emails (max 3 attempts)
- Status tracking (pending, processing, sent, failed)
- Scheduled cleanup of old emails

### 3. Automated Triggers

The system automatically:
- Sends activation code after payment processing
- Sends reminder 2 days before code expiry
- Notifies when activation code expires
- Queues team invitations when users are added

### 4. Scheduled Jobs

Managed by `ScheduledJobsService`:
- **Email Queue Processing** - Every minute
- **Activation Reminders** - Every hour
- **Expiry Notifications** - Every hour
- **Retry Failed Emails** - Every hour
- **Clean Old Emails** - Daily

## API Endpoints

### Public Endpoints

```bash
# Validate activation code
POST /api/email/activation/validate
{
  "code": "ABC-123"
}

# Activate code
POST /api/email/activation/activate
{
  "code": "ABC-123"
}
```

### Authenticated Endpoints (Requires JWT)

```bash
# Get email queue statistics (admin only)
GET /api/email/queue/stats

# Send test activation code (admin only)
POST /api/email/activation/test
{
  "companyId": 1,
  "email": "user@example.com",
  "name": "John Doe"
}

# Regenerate activation code (admin only)
POST /api/email/activation/regenerate
{
  "companyId": 1,
  "reason": "Previous code expired",
  "extendTrial": true
}

# Send team invitation
POST /api/email/invitation/send
{
  "inviteeName": "Jane Doe",
  "inviteeEmail": "jane@example.com",
  "role": "engineer",
  "invitationToken": "invitation-token-123"
}

# Process email queue manually (admin only)
POST /api/email/queue/process

# Retry failed emails (admin only)
POST /api/email/queue/retry
{
  "olderThanMinutes": 60
}
```

## Configuration

### Environment Variables

```env
# Email Service Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=SMS Portal <noreply@smartmaintenancesystems.com>

# AWS SES (Optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_SES_REGION=us-east-1

# Frontend URL for email links
FRONTEND_URL=http://localhost:3000
```

### Development Mode

In development without SMTP configuration, the system uses Ethereal Email:
- Test emails are captured but not sent
- Preview URLs are logged to `logs/ethereal-emails.log`
- Visit the Ethereal web interface to view emails

## Testing

### Run the Test Script

```bash
cd sms-app/backend
node test-email-automation.js
```

This script will:
1. Login as admin
2. Get email queue statistics
3. Test activation code validation
4. Send a test activation email
5. Process the email queue
6. Send a team invitation

### Check Email Logs

```bash
# View email logs (development)
tail -f logs/emails.log

# View Ethereal preview URLs
tail -f logs/ethereal-emails.log
```

## Email Template Examples

### Activation Code Email
- Subject: "Your SMS Portal Activation Code - [Company Name]"
- Contains: 6-character activation code (XXX-XXX format)
- Expiry date clearly displayed
- Direct activation button
- Portal features overview

### Activation Reminder
- Subject: "⏰ Activation Reminder - X days remaining"
- Urgency color coding (yellow for 2 days, red for 1 day)
- Clear countdown display
- Benefits of activating now

### Team Invitation
- Subject: "You're invited to join [Company] on SMS Portal"
- Role-specific feature list
- Company vessel count
- 7-day expiry for invitation

## Integration with Payment System

When payment is processed:

```javascript
// In payment controller after successful payment
await activationCodeService.sendActivationCode(
  companyId,
  customerEmail,
  customerName,
  portalUrl
);
```

## Monitoring

Check system health:

```javascript
// Get queue statistics
const stats = await emailQueueService.getQueueStats();
// Returns: { pending: 5, sent: 120, failed: 2, total: 127 }

// Check scheduled jobs status
const jobStatus = scheduledJobsService.getStatus();
// Returns array of job statuses
```

## Troubleshooting

### Emails not sending
1. Check SMTP configuration in .env
2. Verify email service is initialized (check logs)
3. Manually process queue: `POST /api/email/queue/process`

### Failed emails
1. Check error in email_queue table
2. Review logs for specific error messages
3. Retry failed emails: `POST /api/email/queue/retry`

### Activation codes not working
1. Verify code hasn't expired
2. Check if already activated
3. Regenerate if needed

## Security

- Activation codes are 6-character alphanumeric
- Codes expire after 30 days (configurable)
- Failed email attempts are limited to 3
- All email templates sanitize user input
- Team invitations expire after 7 days