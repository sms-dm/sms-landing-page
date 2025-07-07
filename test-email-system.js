#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'sms-app/backend/.env') });

// Simple email test without dependencies
const nodemailer = require('nodemailer');

async function testEmailSystem() {
  console.log('📧 SMS Email System Test');
  console.log('========================\n');

  // Check configuration
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  if (!config.auth.user || !config.auth.pass) {
    console.error('❌ Email not configured!');
    console.log('\nPlease set in sms-app/backend/.env:');
    console.log('SMTP_USER=your.email@gmail.com');
    console.log('SMTP_PASS=your-16-char-app-password\n');
    console.log('See EMAIL_SETUP_GUIDE.md for instructions');
    process.exit(1);
  }

  console.log('📌 Email Configuration:');
  console.log(`   From: ${process.env.EMAIL_FROM || config.auth.user}`);
  console.log(`   SMTP: ${config.host}:${config.port}`);
  console.log(`   User: ${config.auth.user}\n`);

  // Create transporter
  const transporter = nodemailer.createTransport(config);

  // Test templates
  const templates = [
    {
      name: 'Welcome Email',
      subject: '🎉 Welcome to Smart Maintenance Systems',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to SMS!</h2>
          <p>Dear Test User,</p>
          <p>Your company <strong>Test Shipping Co</strong> has been successfully onboarded.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Portal Access:</strong></p>
            <p>🔗 <a href="http://localhost:3005">http://localhost:3005</a></p>
            <p><strong>Your Credentials:</strong><br>
            Username: test@example.com<br>
            Password: [Provided separately]</p>
          </div>
          <p>Get started by logging in and exploring your dashboard!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">Smart Maintenance Systems</p>
        </div>
      `
    },
    {
      name: 'Maintenance Reminder',
      subject: '⚠️ Maintenance Due: Main Engine',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #92400e;">MAINTENANCE REMINDER</h3>
          </div>
          <p><strong>Vessel:</strong> MV Test Vessel</p>
          <p><strong>Equipment:</strong> Main Engine</p>
          <p><strong>Type:</strong> Routine Service</p>
          <p><strong>Due Date:</strong> ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p>⏰ This equipment requires attention within 7 days</p>
          </div>
          <a href="http://localhost:3005" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a>
        </div>
      `
    },
    {
      name: 'HSE Alert',
      subject: '🚨 HSE Alert - HIGH: Safety Update',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #991b1b;">HEALTH, SAFETY & ENVIRONMENT ALERT</h3>
          </div>
          <p><strong>Priority:</strong> <span style="color: #dc2626;">HIGH</span></p>
          <p><strong>Subject:</strong> Hot Work Procedures Update</p>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>New hot work procedures are now in effect.</strong></p>
            <p>All crew members must review and acknowledge the updated procedures before conducting any hot work operations.</p>
          </div>
          <p><strong>IMMEDIATE ACTION REQUIRED:</strong></p>
          <ol>
            <li>Read the full safety update</li>
            <li>Brief your team members</li>
            <li>Acknowledge receipt in the portal</li>
          </ol>
          <a href="http://localhost:3005" style="display: inline-block; background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acknowledge Now</a>
        </div>
      `
    }
  ];

  // Send test emails
  console.log('📤 Sending test emails...\n');
  
  for (const template of templates) {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"SMS System" <${config.auth.user}>`,
        to: config.auth.user, // Send to yourself
        subject: template.subject,
        html: template.html
      });

      console.log(`✅ ${template.name} sent!`);
      console.log(`   Message ID: ${info.messageId}`);
    } catch (error) {
      console.error(`❌ ${template.name} failed:`, error.message);
    }
  }

  console.log('\n📬 Check your inbox!');
  console.log('   - You should receive 3 test emails');
  console.log('   - Check spam folder if not in inbox');
  console.log('   - Each shows different template styles\n');

  console.log('🎯 Next steps:');
  console.log('   1. Verify emails look correct');
  console.log('   2. Start the full system with ./start-all.sh');
  console.log('   3. Test real workflows to trigger emails');
}

// Run test
testEmailSystem().catch(console.error);