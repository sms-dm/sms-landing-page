#!/usr/bin/env node

/**
 * Test script for SMS Onboarding Email System
 * 
 * This script tests:
 * 1. Email configuration and Ethereal setup
 * 2. Sending activation code emails
 * 3. Sending onboarding completion emails
 * 4. Sending verification reminders
 * 5. Email queue functionality
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  onboardingApiUrl: process.env.ONBOARDING_API_URL || 'http://localhost:3000',
  maintenanceApiUrl: process.env.MAINTENANCE_API_URL || 'http://localhost:3001',
  testEmail: process.env.TEST_EMAIL || 'test@example.com',
  testCompany: 'Test Maritime Services',
  testContactName: 'John Smith'
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Check Email Service Status
async function testEmailServiceStatus() {
  logSection('Test 1: Checking Email Service Status');
  
  try {
    // Check onboarding backend logs
    const logsPath = path.join(__dirname, 'SMS-Onboarding-Unified/backend/logs');
    
    if (fs.existsSync(logsPath)) {
      log('✓ Logs directory exists', 'green');
      
      const etherealLogPath = path.join(logsPath, 'ethereal-emails.log');
      if (fs.existsSync(etherealLogPath)) {
        log('✓ Ethereal email log exists', 'green');
        
        // Read last few lines of the log
        const logContent = fs.readFileSync(etherealLogPath, 'utf8');
        const lines = logContent.trim().split('\n').slice(-5);
        
        if (lines.length > 0) {
          log('\nRecent Ethereal email entries:', 'blue');
          lines.forEach(line => {
            try {
              const entry = JSON.parse(line);
              console.log(`  - ${entry.timestamp}: ${entry.subject} to ${entry.to}`);
              if (entry.previewUrl) {
                console.log(`    Preview: ${entry.previewUrl}`);
              }
            } catch (e) {
              console.log(`  - ${line}`);
            }
          });
        }
      } else {
        log('✗ No Ethereal email log found yet', 'yellow');
      }
    } else {
      log('✗ Logs directory not found', 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`✗ Error checking email service: ${error.message}`, 'red');
    return false;
  }
}

// Test 2: Send Test Activation Code Email
async function testActivationCodeEmail() {
  logSection('Test 2: Testing Activation Code Email');
  
  try {
    // Import the email service directly
    const { emailQueueService } = require('./SMS-Onboarding-Unified/backend/services/email-queue.service');
    
    log('Sending activation code email...', 'blue');
    
    await emailQueueService.sendActivationCodeEmail({
      companyName: TEST_CONFIG.testCompany,
      activationCode: 'TEST-1234',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      contactName: TEST_CONFIG.testContactName,
      contactEmail: TEST_CONFIG.testEmail
    });
    
    log('✓ Activation code email queued successfully', 'green');
    
    // Wait a moment for processing
    await delay(2000);
    
    // Check logs
    await testEmailServiceStatus();
    
    return true;
  } catch (error) {
    log(`✗ Error sending activation code email: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

// Test 3: Send Test Onboarding Completion Email
async function testOnboardingCompleteEmail() {
  logSection('Test 3: Testing Onboarding Completion Email');
  
  try {
    const { emailQueueService } = require('./SMS-Onboarding-Unified/backend/services/email-queue.service');
    
    log('Sending onboarding completion email...', 'blue');
    
    await emailQueueService.sendOnboardingCompleteEmail({
      companyId: 'test-company-id',
      companyName: TEST_CONFIG.testCompany,
      contactName: TEST_CONFIG.testContactName,
      contactEmail: TEST_CONFIG.testEmail,
      vesselCount: 3,
      equipmentCount: 45,
      userCount: 12,
      adminEmail: 'admin@testcompany.com',
      adminPassword: 'TempPassword123!'
    });
    
    log('✓ Onboarding completion email queued successfully', 'green');
    
    // Wait a moment for processing
    await delay(2000);
    
    return true;
  } catch (error) {
    log(`✗ Error sending onboarding completion email: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

// Test 4: Send Test Verification Reminder
async function testVerificationReminder() {
  logSection('Test 4: Testing Verification Reminder Email');
  
  try {
    const { emailQueueService } = require('./SMS-Onboarding-Unified/backend/services/email-queue.service');
    
    log('Sending verification reminder email...', 'blue');
    
    await emailQueueService.queueEmail({
      to: TEST_CONFIG.testEmail,
      templateName: 'verification-reminder',
      templateData: {
        companyName: TEST_CONFIG.testCompany,
        contactName: TEST_CONFIG.testContactName,
        activationCode: 'TEST-1234',
        daysRemaining: 3,
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      priority: 'high'
    });
    
    log('✓ Verification reminder email queued successfully', 'green');
    
    // Wait a moment for processing
    await delay(2000);
    
    return true;
  } catch (error) {
    log(`✗ Error sending verification reminder: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

// Test 5: Direct Email Service Test
async function testDirectEmailService() {
  logSection('Test 5: Testing Direct Email Service');
  
  try {
    const { emailService } = require('./SMS-Onboarding-Unified/backend/services/email.service');
    
    log('Sending direct test email...', 'blue');
    
    const result = await emailService.sendEmail({
      to: TEST_CONFIG.testEmail,
      subject: 'SMS Portal - Email System Test',
      html: `
        <h2>Email System Test</h2>
        <p>This is a test email from the SMS Onboarding Portal email system.</p>
        <p>If you're seeing this, the email service is working correctly!</p>
        <hr>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>Timestamp: ${new Date().toISOString()}</li>
          <li>Company: ${TEST_CONFIG.testCompany}</li>
          <li>Contact: ${TEST_CONFIG.testContactName}</li>
        </ul>
      `
    });
    
    log('✓ Direct email sent successfully', 'green');
    
    if (result.previewUrl) {
      log(`\nEthereal Preview URL: ${result.previewUrl}`, 'cyan');
    }
    
    return true;
  } catch (error) {
    log(`✗ Error sending direct email: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n');
  log('SMS Onboarding Email System Test Suite', 'cyan');
  log('=====================================', 'cyan');
  log(`Testing with email: ${TEST_CONFIG.testEmail}`, 'blue');
  
  const tests = [
    { name: 'Email Service Status', fn: testEmailServiceStatus },
    { name: 'Direct Email Service', fn: testDirectEmailService },
    { name: 'Activation Code Email', fn: testActivationCodeEmail },
    { name: 'Onboarding Complete Email', fn: testOnboardingCompleteEmail },
    { name: 'Verification Reminder', fn: testVerificationReminder }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      log(`\n✗ Test "${test.name}" failed with error: ${error.message}`, 'red');
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  logSection('Test Summary');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    log(`${result.passed ? '✓' : '✗'} ${result.name}`, result.passed ? 'green' : 'red');
  });
  
  console.log('\n');
  log(`Total: ${results.length} tests`, 'blue');
  log(`Passed: ${passed}`, 'green');
  if (failed > 0) {
    log(`Failed: ${failed}`, 'red');
  }
  
  // Check for Ethereal emails log
  console.log('\n');
  log('Checking for Ethereal email previews...', 'blue');
  
  try {
    const etherealLogPath = path.join(__dirname, 'SMS-Onboarding-Unified/backend/logs/ethereal-emails.log');
    if (fs.existsSync(etherealLogPath)) {
      const logContent = fs.readFileSync(etherealLogPath, 'utf8');
      const lines = logContent.trim().split('\n');
      const recentEmails = lines.slice(-10).map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      }).filter(Boolean);
      
      if (recentEmails.length > 0) {
        log('\nRecent Ethereal Preview URLs:', 'cyan');
        recentEmails.forEach(email => {
          if (email.previewUrl) {
            console.log(`\n  Subject: ${email.subject}`);
            console.log(`  To: ${email.to}`);
            console.log(`  Preview: ${email.previewUrl}`);
            console.log(`  Ethereal Web: ${email.etherealWeb || 'https://ethereal.email'}`);
          }
        });
      }
    }
  } catch (error) {
    // Ignore errors reading log
  }
  
  console.log('\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    log(`\nFatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  testEmailServiceStatus,
  testActivationCodeEmail,
  testOnboardingCompleteEmail,
  testVerificationReminder,
  testDirectEmailService
};