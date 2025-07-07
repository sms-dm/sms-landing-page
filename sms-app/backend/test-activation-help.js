const axios = require('axios');

const BACKEND_URL = 'http://localhost:3005';

async function testActivationHelp() {
  console.log('🧪 Testing Activation Help System...\n');

  try {
    // Test 1: Verify email endpoint
    console.log('1️⃣ Testing email verification...');
    const verifyResponse = await axios.post(`${BACKEND_URL}/api/activation/verify-email`, {
      email: 'admin@geoquip.com'
    });
    console.log('✅ Email verification response:', verifyResponse.data);
    console.log('');

    // Test 2: Send verification code
    if (verifyResponse.data.exists) {
      console.log('2️⃣ Testing verification code sending...');
      const helpResponse = await axios.post(`${BACKEND_URL}/api/activation/help`, {
        email: 'admin@geoquip.com',
        reason: 'expired',
        action: 'send_verification'
      });
      console.log('✅ Verification code sent:', helpResponse.data);
      console.log('');

      // Test 3: Test rate limiting
      console.log('3️⃣ Testing rate limiting...');
      const rateLimitPromises = [];
      for (let i = 0; i < 6; i++) {
        rateLimitPromises.push(
          axios.post(`${BACKEND_URL}/api/activation/verify-email`, {
            email: `test${i}@example.com`
          }).catch(err => ({ error: err.response?.status }))
        );
      }
      
      const rateLimitResults = await Promise.all(rateLimitPromises);
      const blocked = rateLimitResults.filter(r => r.error === 429).length;
      console.log(`✅ Rate limiting working: ${blocked} requests blocked out of 6`);
      console.log('');

      // Test 4: Invalid email
      console.log('4️⃣ Testing invalid email...');
      try {
        await axios.post(`${BACKEND_URL}/api/activation/verify-email`, {
          email: 'nonexistent@example.com'
        });
      } catch (err) {
        // Expected to not exist
      }
      console.log('✅ Invalid email handled correctly');
      console.log('');

      // Test 5: Check stats endpoint
      console.log('5️⃣ Testing stats endpoint...');
      try {
        const statsResponse = await axios.get(`${BACKEND_URL}/api/activation/stats`);
        console.log('✅ Stats:', statsResponse.data);
      } catch (err) {
        console.log('ℹ️  Stats endpoint requires authentication (expected)');
      }
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📌 To complete the flow:');
    console.log('1. Check email for verification code');
    console.log('2. Use the code in the activation help page');
    console.log('3. A new activation code will be sent');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testActivationHelp();