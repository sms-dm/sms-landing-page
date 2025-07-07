# SMS Email Setup Guide

## Quick Setup for Gmail

### Step 1: Prepare Your Gmail Account
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Generate an **App Password**:
   - Click on "2-Step Verification"
   - Scroll down to "App passwords"
   - Select "Mail" and your device
   - Copy the 16-character password (no spaces)

### Step 2: Configure Email Settings

Run this command to set up your email:
```bash
cd /home/sms/repos/SMS/sms-app/backend

# Add email configuration to .env
cat >> .env << EOF

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM="SMS System <your.email@gmail.com>"
EMAIL_QUEUE_BATCH_SIZE=10
EMAIL_QUEUE_RETRY_ATTEMPTS=3
EOF
```

**Important**: Replace `your.email@gmail.com` and `your-16-char-app-password` with your actual values.

### Step 3: Test Email Sending

```bash
# Run the email preview to see all templates
node /home/sms/repos/SMS/preview-email-templates.js

# Test actual email sending
node /home/sms/repos/SMS/test-email-system.js
```

## What is SSL?

SSL (Secure Sockets Layer) is a security protocol that:
- **Encrypts** data between your server and email server
- **Authenticates** your identity to prevent spoofing
- **Required** by Gmail for secure email sending

For Gmail:
- Port 587 uses **STARTTLS** (starts unencrypted, then upgrades to SSL)
- Port 465 uses **SSL/TLS** (encrypted from the start)
- We use 587 with STARTTLS for better compatibility

## Email Templates You'll See

1. **Welcome Email** - When new users join
2. **Activation Code** - For company onboarding
3. **Maintenance Reminders** - When equipment needs service
4. **HSE Alerts** - Safety notifications
5. **Fault Alerts** - Equipment issues
6. **Equipment Approved** - After manager approval
7. **Weekly Summary** - Performance reports
8. **Payment Confirmation** - After payments

## Testing Checklist

- [ ] Gmail 2-Step Verification enabled
- [ ] App Password generated (16 characters)
- [ ] Email configuration added to .env
- [ ] Test email sent successfully
- [ ] Templates preview correctly
- [ ] Emails arrive in inbox

## Troubleshooting

If emails don't send:
1. Check app password has no spaces
2. Verify 2-Step Verification is on
3. Try regenerating app password
4. Check spam folder
5. Ensure ports aren't blocked by firewall

## Next Steps

Once email is working:
1. All system notifications will send real emails
2. Test each workflow to see different templates
3. Monitor email queue in admin dashboard
4. Adjust sending frequency if needed