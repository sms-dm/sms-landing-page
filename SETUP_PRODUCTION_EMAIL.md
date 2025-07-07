# Production Email Setup Guide

## Option 1: Gmail (Quick & Free for <500/day)
```bash
# In your .env file:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password  # Not regular password!

# Get app password:
1. Go to Google Account settings
2. Security → 2-Step Verification (must be on)
3. App passwords → Generate
4. Use that 16-character password
```

## Option 2: SendGrid (Professional)
```bash
# Sign up at sendgrid.com (free tier = 100/day)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey  # Literally "apikey"
SMTP_PASS=your-sendgrid-api-key
```

## Option 3: AWS SES (Scalable)
```bash
# Best for high volume
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

## Testing Production Email
```bash
# Update .env with real SMTP
# Restart the service
pm2 restart sms-maintenance

# Send test email
curl -X POST http://localhost:3005/api/admin/email-queue/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-real-email@example.com",
    "template": "welcome",
    "data": {
      "firstName": "Test",
      "companyName": "Test Co"
    }
  }'
```