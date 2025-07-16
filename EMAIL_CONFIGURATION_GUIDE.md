# Email Configuration Guide for SMS Portals

This guide explains how email configuration is set up in both SMS portals (Maintenance and Onboarding).

## Overview

Both portals now have a unified email configuration system that:
- Automatically uses Ethereal Email for development/testing
- Supports Gmail, AWS SES, and other SMTP providers for production
- Logs emails locally when no SMTP is configured
- Provides easy migration path to AWS SES

## Configuration Options

### 1. Development Mode (Default)

When no SMTP credentials are provided, the system automatically:
- Creates an Ethereal Email test account
- Sends all emails to Ethereal's servers
- Provides preview URLs for viewing sent emails
- Logs all emails to `logs/ethereal-emails.log`

**No configuration needed!** Just run the application and emails will work.

### 2. Gmail Configuration

For Gmail, add these to your `.env` file:

#### Maintenance Portal (.env)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=SMS Portal <noreply@smartmaintenancesystems.com>
```

#### Onboarding Portal (.env)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=SMS Onboarding <noreply@smartmaintenancesystems.com>
```

**Note:** You need to use an App-specific password, not your regular Gmail password. 
Enable 2FA and generate an app password at: https://myaccount.google.com/apppasswords

### 3. AWS SES Configuration

For AWS SES, add these to your `.env` file:

#### Maintenance Portal (.env)
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
SMTP_FROM=SMS Portal <noreply@your-verified-domain.com>

# Optional AWS configuration for future SES API integration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_SES_REGION=us-east-1
```

#### Onboarding Portal (.env)
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-ses-smtp-username
EMAIL_PASS=your-ses-smtp-password
EMAIL_FROM=SMS Onboarding <noreply@your-verified-domain.com>

# Optional AWS configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Testing Email Configuration

### Test Scripts

Both portals include test scripts to verify email configuration:

```bash
# Test Maintenance Portal emails
cd sms-app/backend
npx ts-node test-email.ts

# Test Onboarding Portal emails
cd SMS-Onboarding-Unified/backend
npx ts-node test-email.ts
```

### What the Test Scripts Do

1. Check email configuration
2. Send test emails for all email types:
   - Welcome emails
   - Password reset emails
   - Fault notifications (Maintenance portal)
   - Maintenance reminders (Maintenance portal)
3. Display Ethereal preview URLs if using test mode
4. Log results to console and files

## Email Types

### Maintenance Portal
- **Welcome Email**: Sent when new users are created
- **Password Reset**: Sent when users request password reset
- **Critical Fault Alert**: Sent to managers when critical faults are reported
- **Fault Resolved**: Sent when faults are resolved
- **Maintenance Reminder**: Sent before maintenance is due

### Onboarding Portal
- **Welcome Email**: Sent after company registration
- **Password Reset**: Sent for password recovery
- **Generic Notifications**: For various system events

## Viewing Test Emails

When using Ethereal Email (development mode):

1. Check console output for credentials:
   ```
   📧 Ethereal Email test account created
   📧 User: abc123@ethereal.email
   🔐 Pass: xyz789
   🌐 Web: https://ethereal.email
   ```

2. Visit https://ethereal.email and login with the provided credentials

3. Or use the preview URLs shown in the console:
   ```
   👁️ Preview URL: https://ethereal.email/message/abc123
   ```

4. Check log files:
   - `logs/emails.log` - All email attempts
   - `logs/ethereal-emails.log` - Ethereal email details with preview URLs

## Troubleshooting

### Common Issues

1. **"Email service not configured"**
   - This is normal in development when no SMTP is set
   - Emails will be logged to console and files
   - Use test scripts to verify functionality

2. **"Failed to initialize email service"**
   - Check SMTP credentials are correct
   - Verify firewall allows outbound SMTP
   - Test with Ethereal first to isolate issues

3. **Gmail "Less secure app" error**
   - Use App-specific password instead
   - Enable 2FA on your Google account
   - Generate password at myaccount.google.com/apppasswords

4. **AWS SES "Email address not verified"**
   - Verify sender email in AWS SES console
   - In sandbox mode, verify recipient emails too
   - Request production access to remove restrictions

## Production Deployment

1. Choose your email provider (Gmail for testing, AWS SES for production)
2. Set environment variables in production
3. Verify sender domain/email with provider
4. Test with a few emails before going live
5. Monitor email logs for delivery issues

## Security Notes

- Never commit `.env` files with real credentials
- Use environment variables in production
- Rotate SMTP passwords regularly
- Monitor for unusual email activity
- Consider rate limiting for password resets

## Future Enhancements

The email system is designed to easily support:
- Email templates with better styling
- Attachment support
- Email queuing with retry logic
- Analytics and tracking
- Multiple language support
- Direct AWS SES API integration (bypassing SMTP)