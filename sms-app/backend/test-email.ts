import { emailService } from './src/services/email.service';
import { emailConfig } from './src/config/email.config';

async function testEmailService() {
  console.log('🧪 Testing Email Service Configuration...\n');

  try {
    // Wait for email service to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📧 Email Configuration:');
    const config = emailConfig.getConfig();
    console.log('- Host:', config.host);
    console.log('- Port:', config.port);
    console.log('- From:', config.from);
    console.log('- Using Ethereal:', emailConfig.isUsingEthereal());
    
    if (emailConfig.isUsingEthereal()) {
      console.log('\n🌐 Ethereal Test Account:');
      console.log('- User:', config.ethereal?.user);
      console.log('- Web Interface:', config.ethereal?.web);
    }

    console.log('\n📤 Testing email functions...\n');

    // Test 1: Welcome Email
    console.log('1. Testing Welcome Email...');
    await emailService.sendWelcomeEmail({
      email: 'test@example.com',
      firstName: 'John',
      companyName: 'Test Shipping Co.',
      role: 'Manager',
      tempPassword: 'TempPass123!'
    });
    console.log('✅ Welcome email sent\n');

    // Test 2: Password Reset Email
    console.log('2. Testing Password Reset Email...');
    await emailService.sendPasswordResetEmail(
      'test@example.com',
      'test-reset-token-123'
    );
    console.log('✅ Password reset email sent\n');

    // Test 3: Critical Fault Alert
    console.log('3. Testing Critical Fault Alert...');
    await emailService.sendCriticalFaultAlert({
      vesselName: 'MV Test Vessel',
      equipmentName: 'Main Engine',
      faultDescription: 'High temperature alarm - immediate attention required',
      reportedBy: 'Chief Engineer',
      managerEmails: ['manager@example.com', 'superintendent@example.com']
    });
    console.log('✅ Critical fault alert sent\n');

    // Test 4: Fault Resolved Notification
    console.log('4. Testing Fault Resolved Notification...');
    await emailService.sendFaultResolvedNotification({
      vesselName: 'MV Test Vessel',
      equipmentName: 'Main Engine',
      faultType: 'Critical',
      resolvedBy: 'Chief Engineer',
      resolution: 'Replaced faulty temperature sensor',
      downtime: 45,
      managerEmails: ['manager@example.com']
    });
    console.log('✅ Fault resolved notification sent\n');

    // Test 5: Maintenance Reminder
    console.log('5. Testing Maintenance Reminder...');
    await emailService.sendMaintenanceReminder({
      vesselName: 'MV Test Vessel',
      equipmentName: 'Auxiliary Engine #1',
      maintenanceType: '1000 Hour Service',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      recipientEmails: ['engineer@example.com', 'manager@example.com']
    });
    console.log('✅ Maintenance reminder sent\n');

    console.log('🎉 All email tests completed successfully!\n');

    if (emailConfig.isUsingEthereal()) {
      console.log('📧 View sent emails at:', config.ethereal?.web);
      console.log('🔑 Login with:');
      console.log('   User:', config.ethereal?.user);
      console.log('   Pass:', config.ethereal?.pass);
      
      // Check for log files
      const fs = require('fs');
      const path = require('path');
      const logFile = path.join(__dirname, 'logs/ethereal-emails.log');
      
      if (fs.existsSync(logFile)) {
        console.log('\n📄 Email log file created at:', logFile);
        const logs = fs.readFileSync(logFile, 'utf-8').split('\n').filter(Boolean);
        console.log(`   Contains ${logs.length} email entries`);
        
        // Show preview URLs
        console.log('\n🔗 Preview URLs:');
        logs.forEach((log: string) => {
          try {
            const entry = JSON.parse(log);
            if (entry.previewUrl) {
              console.log(`   - ${entry.subject}: ${entry.previewUrl}`);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Email test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEmailService().then(() => {
  console.log('\n✅ Email service test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Email service test failed:', error);
  process.exit(1);
});