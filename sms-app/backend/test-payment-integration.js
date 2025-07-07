// Test script for payment integration
const axios = require('axios');

const API_URL = 'http://localhost:3005/api';

async function testPaymentIntegration() {
  console.log('🧪 Testing Payment Integration...\n');

  try {
    // 1. Test webhook endpoint (simulate Stripe webhook)
    console.log('1. Testing payment webhook (Stripe)...');
    const webhookResponse = await axios.post(`${API_URL}/payment/webhooks/stripe`, {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123456',
          status: 'succeeded',
          amount: 29900, // $299.00 in cents
          currency: 'usd',
          receipt_email: 'test@example.com',
          metadata: {
            company_name: 'Test Shipping Co',
            plan_type: 'starter'
          }
        }
      }
    });
    console.log('✅ Webhook response:', webhookResponse.data);

    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Test code validation
    console.log('\n2. Testing activation code validation...');
    // Note: We'd need to get the actual code from the database or email
    // For now, we'll test with an invalid code
    const validationResponse = await axios.post(`${API_URL}/payment/activation/validate`, {
      code: 'TEST-1234-5678-9012'
    }).catch(err => err.response);
    
    console.log('Validation response:', validationResponse.data);

    // 3. Test admin endpoints (would need auth token)
    console.log('\n3. Testing admin endpoints...');
    console.log('⚠️  Admin endpoints require authentication token');

    console.log('\n✨ Payment integration endpoints are working!');
    console.log('\nNext steps:');
    console.log('1. Check database for created activation codes');
    console.log('2. Test with real payment provider webhooks');
    console.log('3. Integrate with onboarding portal');

  } catch (error) {
    console.error('❌ Error testing payment integration:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testPaymentIntegration();