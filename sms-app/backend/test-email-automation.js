const axios = require('axios');

const API_URL = 'http://localhost:3005/api';

// Test credentials
const adminCredentials = {
  email: 'admin@smsportal.com',
  password: 'securepassword'
};

async function testEmailAutomation() {
  try {
    console.log('🚀 Testing SMS Email Automation System\n');

    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, adminCredentials);
    const { token } = loginResponse.data;
    console.log('✅ Logged in successfully\n');

    // Set auth header
    const authHeaders = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // 2. Get email queue statistics
    console.log('2. Getting email queue statistics...');
    const statsResponse = await axios.get(`${API_URL}/email/queue/stats`, authHeaders);
    console.log('📊 Email Queue Stats:', statsResponse.data);
    console.log('');

    // 3. Test activation code validation (with a sample code)
    console.log('3. Testing activation code validation...');
    try {
      const validationResponse = await axios.post(`${API_URL}/email/activation/validate`, {
        code: 'ABC-123'
      });
      console.log('✅ Validation result:', validationResponse.data);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('❌ Invalid code (expected):', error.response.data.error);
      }
    }
    console.log('');

    // 4. Send test activation code
    console.log('4. Sending test activation code email...');
    try {
      const testEmailResponse = await axios.post(`${API_URL}/email/activation/test`, {
        companyId: 1, // Oceanic Marine Services
        email: 'test@example.com',
        name: 'Test User'
      }, authHeaders);
      console.log('✅ Test email queued:', testEmailResponse.data);
    } catch (error) {
      console.error('❌ Error sending test email:', error.response?.data || error.message);
    }
    console.log('');

    // 5. Process email queue manually
    console.log('5. Processing email queue manually...');
    try {
      const processResponse = await axios.post(`${API_URL}/email/queue/process`, {}, authHeaders);
      console.log('✅ Queue processed:', processResponse.data);
    } catch (error) {
      console.error('❌ Error processing queue:', error.response?.data || error.message);
    }
    console.log('');

    // 6. Get updated stats
    console.log('6. Getting updated email queue statistics...');
    const updatedStatsResponse = await axios.get(`${API_URL}/email/queue/stats`, authHeaders);
    console.log('📊 Updated Email Queue Stats:', updatedStatsResponse.data);
    console.log('');

    // 7. Test team invitation
    console.log('7. Testing team invitation email...');
    try {
      const invitationResponse = await axios.post(`${API_URL}/email/invitation/send`, {
        inviteeName: 'John Doe',
        inviteeEmail: 'john.doe@example.com',
        role: 'engineer',
        invitationToken: 'test-invitation-token-123'
      }, authHeaders);
      console.log('✅ Invitation sent:', invitationResponse.data);
    } catch (error) {
      console.error('❌ Error sending invitation:', error.response?.data || error.message);
    }

    console.log('\n✨ Email automation test completed!');
    console.log('\n📧 Check the logs/emails.log file to see the email details');
    console.log('📄 For Ethereal emails, check logs/ethereal-emails.log for preview URLs');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testEmailAutomation();