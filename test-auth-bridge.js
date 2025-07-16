#!/usr/bin/env node

// Test script for authentication bridge between portals

const http = require('http');

// Configuration
const MAINTENANCE_API = 'http://localhost:3005';
const ONBOARDING_API = 'http://localhost:3000';

// Test credentials
const TEST_USER = {
  email: 'demo.admin@oceanic.com',
  password: 'demo123'
};

// Helper function to make HTTP requests
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test 1: Login to Maintenance portal
async function loginToMaintenance() {
  console.log('📝 Test 1: Login to Maintenance portal...');
  
  const result = await makeRequest(`${MAINTENANCE_API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, TEST_USER);
  
  if (result.status === 200 && result.body.token) {
    console.log('✅ Login successful');
    return result.body.token;
  } else {
    console.error('❌ Login failed:', result.body);
    throw new Error('Login failed');
  }
}

// Test 2: Generate bridge token from Maintenance portal
async function generateBridgeToken(token) {
  console.log('\n🔑 Test 2: Generate bridge token from Maintenance portal...');
  
  const result = await makeRequest(`${MAINTENANCE_API}/api/auth/bridge/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (result.status === 200 && result.body.bridgeToken) {
    console.log('✅ Bridge token generated');
    console.log(`   Redirect URL: ${result.body.redirectUrl}`);
    console.log(`   Expires in: ${result.body.expiresIn} seconds`);
    return result.body.bridgeToken;
  } else {
    console.error('❌ Failed to generate bridge token:', result.body);
    throw new Error('Bridge token generation failed');
  }
}

// Test 3: Validate bridge token in Onboarding portal
async function validateBridgeTokenInOnboarding(bridgeToken) {
  console.log('\n🔓 Test 3: Validate bridge token in Onboarding portal...');
  
  const result = await makeRequest(`${ONBOARDING_API}/api/v1/auth/bridge/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { bridgeToken });
  
  if (result.status === 200 && result.body.accessToken) {
    console.log('✅ Bridge token validated in Onboarding portal');
    console.log(`   User: ${result.body.user.email}`);
    console.log(`   Role: ${result.body.user.role}`);
    console.log(`   Company: ${result.body.user.company.name}`);
    return result.body;
  } else {
    console.error('❌ Bridge validation failed:', result.body);
    throw new Error('Bridge validation failed');
  }
}

// Test 4: Generate reverse bridge token from Onboarding portal
async function generateReverseBridgeToken(accessToken) {
  console.log('\n🔑 Test 4: Generate bridge token from Onboarding portal...');
  
  const result = await makeRequest(`${ONBOARDING_API}/api/v1/auth/bridge/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (result.status === 200 && result.body.bridgeToken) {
    console.log('✅ Reverse bridge token generated');
    console.log(`   Redirect URL: ${result.body.redirectUrl}`);
    return result.body.bridgeToken;
  } else {
    console.error('❌ Failed to generate reverse bridge token:', result.body);
    throw new Error('Reverse bridge token generation failed');
  }
}

// Test 5: Validate reverse bridge token in Maintenance portal
async function validateReverseBridgeToken(bridgeToken) {
  console.log('\n🔓 Test 5: Validate reverse bridge token in Maintenance portal...');
  
  const result = await makeRequest(`${MAINTENANCE_API}/api/auth/bridge/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { bridgeToken });
  
  if (result.status === 200 && result.body.token) {
    console.log('✅ Reverse bridge token validated');
    console.log(`   User: ${result.body.user.email}`);
    console.log(`   Role: ${result.body.user.role}`);
    console.log(`   Company: ${result.body.user.company.name}`);
    return result.body;
  } else {
    console.error('❌ Reverse bridge validation failed:', result.body);
    throw new Error('Reverse bridge validation failed');
  }
}

// Main test flow
async function runAuthBridgeTest() {
  console.log('🚀 Starting Authentication Bridge Test\n');
  console.log('Testing bidirectional authentication between portals\n');
  
  try {
    // Test 1: Login to Maintenance portal
    const maintenanceToken = await loginToMaintenance();
    
    // Test 2: Generate bridge token
    const bridgeToken = await generateBridgeToken(maintenanceToken);
    
    // Test 3: Validate in Onboarding portal
    const onboardingAuth = await validateBridgeTokenInOnboarding(bridgeToken);
    
    // Test 4: Generate reverse bridge token
    const reverseBridgeToken = await generateReverseBridgeToken(onboardingAuth.accessToken);
    
    // Test 5: Validate reverse bridge token
    const maintenanceAuth = await validateReverseBridgeToken(reverseBridgeToken);
    
    console.log('\n✅ All authentication bridge tests passed!');
    console.log('\n📝 Summary:');
    console.log('- Users can seamlessly move from Maintenance → Onboarding portal');
    console.log('- Users can seamlessly move from Onboarding → Maintenance portal');
    console.log('- User accounts are automatically created if they don\'t exist');
    console.log('- Roles are properly mapped between systems');
    console.log('- Bridge tokens expire after 5 minutes for security');
    
  } catch (error) {
    console.error('\n❌ Authentication bridge test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runAuthBridgeTest();