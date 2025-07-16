#!/bin/bash

echo "🔧 SMS Gmail Setup"
echo "=================="
echo
echo "Before continuing, make sure you have:"
echo "1. Gmail 2-Step Verification enabled"
echo "2. An App Password (16 characters)"
echo
read -p "Do you have these ready? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please get these first:"
    echo "👉 https://myaccount.google.com/security"
    exit 1
fi

# Get email details
echo
read -p "Enter your Gmail address: " gmail_address
read -sp "Enter your App Password (16 chars): " app_password
echo
echo

# Update the .env file
cd sms-app/backend

# Backup existing .env
cp .env .env.backup.$(date +%s) 2>/dev/null || true

# Add email configuration
cat >> .env << EOF

# Email Configuration (Added $(date))
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=$gmail_address
SMTP_PASS=$app_password
EMAIL_FROM="SMS System <$gmail_address>"
EMAIL_QUEUE_BATCH_SIZE=10
EMAIL_QUEUE_RETRY_ATTEMPTS=3
EOF

echo "✅ Email configuration added to .env"
echo
echo "Testing email setup..."
echo

# Create a test script
cat > test-real-email.js << 'EOF'
const { EmailService } = require('./src/services/email.service');

async function testEmail() {
  const emailService = new EmailService();
  
  try {
    const testEmail = await emailService.sendEmail({
      to: process.argv[2] || process.env.SMTP_USER,
      subject: 'SMS System - Email Test',
      template: 'test',
      data: {
        message: 'If you can read this, your email system is working! 🎉',
        timestamp: new Date().toLocaleString()
      }
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Check your inbox for the test message');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your app password is correct (16 chars, no spaces)');
    console.log('2. Make sure 2-Step Verification is enabled');
    console.log('3. Try generating a new app password');
  }
}

testEmail();
EOF

# Run the test
echo "Sending test email to $gmail_address..."
node test-real-email.js $gmail_address

echo
echo "🎯 Next steps:"
echo "1. Check your inbox for the test email"
echo "2. If it worked, restart the service: pm2 restart sms-maintenance"
echo "3. Run the full email test: node ../../test-email-system.js"
echo
echo "📧 Your email templates will now send to real addresses!"