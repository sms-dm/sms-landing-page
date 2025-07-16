import { emailService } from './services/email.service';
import { emailQueueService } from './services/email-queue.service';
import { EmailTemplateType } from './templates/email/template-factory';

async function testEmailSystem() {
  console.log('🚀 Testing SMS Onboarding Email System\n');

  try {
    // Test 1: Direct email send
    console.log('Test 1: Sending direct test email...');
    const directResult = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'SMS Portal - Email System Test',
      html: `
        <h2>Email System Test</h2>
        <p>This is a test email from the SMS Onboarding Portal.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    });
    console.log('✅ Direct email sent:', directResult);

    // Test 2: Activation code email
    console.log('\nTest 2: Sending activation code email...');
    await emailService.sendActivationCode({
      companyName: 'Test Maritime Company',
      activationCode: 'TEST-1234',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      contactName: 'John Smith',
      email: 'test@example.com'
    });
    console.log('✅ Activation code email sent');

    // Test 3: Onboarding complete email
    console.log('\nTest 3: Sending onboarding complete email...');
    await emailService.sendOnboardingComplete({
      companyName: 'Test Maritime Company',
      contactName: 'John Smith',
      email: 'test@example.com',
      vesselCount: 3,
      equipmentCount: 45,
      userCount: 12,
      adminEmail: 'admin@test.com',
      adminPassword: 'TempPass123!'
    });
    console.log('✅ Onboarding complete email sent');

    // Test 4: Verification reminder
    console.log('\nTest 4: Sending verification reminder...');
    await emailService.sendVerificationReminder({
      companyName: 'Test Maritime Company',
      contactName: 'John Smith',
      email: 'test@example.com',
      activationCode: 'TEST-1234',
      daysRemaining: 3,
      expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    });
    console.log('✅ Verification reminder sent');

    // Test 5: Using email queue
    console.log('\nTest 5: Testing email queue...');
    await emailQueueService.queueEmail({
      to: 'test@example.com',
      templateName: EmailTemplateType.WELCOME,
      templateData: {
        firstName: 'John',
        companyName: 'Test Maritime Company',
        role: 'Admin',
        tempPassword: 'Welcome123!'
      }
    });
    console.log('✅ Email queued successfully');

    console.log('\n🎉 All email tests completed successfully!');
    console.log('\n📧 Check the logs for Ethereal preview URLs:');
    console.log('   - SMS-Onboarding-Unified/backend/logs/ethereal-emails.log');
    console.log('   - SMS-Onboarding-Unified/backend/logs/emails.log');

  } catch (error) {
    console.error('\n❌ Email test failed:', error);
  }
}

// Run the test
testEmailSystem().then(() => {
  console.log('\n✨ Email system test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});