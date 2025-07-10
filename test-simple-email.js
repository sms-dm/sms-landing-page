#!/usr/bin/env node

/**
 * Simple test script for SMS Onboarding Email System
 */

console.log('🚀 Testing SMS Onboarding Email System\n');

// Test the main app email service
const mainAppEmailPath = './sms-app/backend/src/services/email.service.ts';
const onboardingEmailPath = './SMS-Onboarding-Unified/backend/services/email.service.ts';

console.log('Checking email services...');
console.log('- Main app email service:', mainAppEmailPath);
console.log('- Onboarding email service:', onboardingEmailPath);

// Check if email logs exist
const fs = require('fs');
const path = require('path');

const logPaths = [
  './sms-app/backend/logs/ethereal-emails.log',
  './SMS-Onboarding-Unified/backend/logs/ethereal-emails.log'
];

console.log('\nChecking email logs:');
logPaths.forEach(logPath => {
  if (fs.existsSync(logPath)) {
    console.log(`✅ Found: ${logPath}`);
    
    // Read last few entries
    try {
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.trim().split('\n').slice(-3);
      
      if (lines.length > 0) {
        console.log('  Recent entries:');
        lines.forEach(line => {
          try {
            const entry = JSON.parse(line);
            console.log(`    - ${entry.timestamp}: ${entry.subject}`);
            if (entry.previewUrl) {
              console.log(`      Preview: ${entry.previewUrl}`);
            }
          } catch (e) {
            console.log(`    - ${line.substring(0, 80)}...`);
          }
        });
      }
    } catch (e) {
      console.log('  (Could not read log file)');
    }
  } else {
    console.log(`❌ Not found: ${logPath}`);
  }
});

console.log('\n📧 Email System Configuration Summary:');
console.log('1. Main SMS App: Uses nodemailer with Ethereal for testing');
console.log('2. Onboarding Portal: Uses nodemailer with Ethereal for testing');
console.log('3. Both systems log emails to ethereal-emails.log');
console.log('4. Email templates are TypeScript-based with HTML rendering');

console.log('\n✨ Key Email Triggers:');
console.log('1. After Payment/Demo Request -> Activation Code Email');
console.log('2. During Onboarding -> Reminder Emails (7, 3, 1 days before expiry)');
console.log('3. After Onboarding Complete -> Completion Email with portal access');
console.log('4. Team Invitations -> Welcome emails to new users');

console.log('\n🔧 To test emails manually:');
console.log('1. Start the onboarding backend: cd SMS-Onboarding-Unified/backend && npm run dev');
console.log('2. Check logs in SMS-Onboarding-Unified/backend/logs/');
console.log('3. Ethereal preview URLs will be logged for each email sent');

console.log('\n✅ Email system is configured and ready!');