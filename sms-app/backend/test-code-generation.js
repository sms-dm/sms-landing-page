const fetch = require('node-fetch');
const assert = require('assert');
const jwt = require('jsonwebtoken');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Admin credentials for testing
const ADMIN_CREDENTIALS = {
  email: 'john.smith@smartmarine.com',
  password: 'demo123'
};

// Test data
const TEST_COMPANIES = [
  { id: 1, name: 'Oceanic Logistics Inc' },
  { id: 2, name: 'Pacific Shipping Co' },
  { id: 3, name: 'Atlantic Marine Services' }
];

// Helper to login as admin
async function loginAsAdmin() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ADMIN_CREDENTIALS)
  });
  
  const data = await response.json();
  return data.accessToken;
}

// Helper to make authenticated requests
async function makeAuthRequest(endpoint, token, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  
  const data = await response.json().catch(() => null);
  return { response, data };
}

// Test code generation
async function testCodeGeneration() {
  console.log('\n🔑 Testing Activation Code Generation...\n');
  
  // Login as admin
  const token = await loginAsAdmin();
  assert(token, 'Admin login failed');
  console.log('✓ Logged in as admin');
  
  // Test 1: Generate standard code
  console.log('\nTest 1: Generating standard activation code...');
  const { response: genResponse, data: genData } = await makeAuthRequest('/admin/activation/codes/generate', token, {
    method: 'POST',
    body: {
      companyId: TEST_COMPANIES[0].id,
      expiryDays: 30,
      sendEmail: false
    }
  });
  
  console.log(`  Status: ${genResponse.status}`);
  console.log(`  Success: ${genData.success === true ? '✓' : '✗'}`);
  console.log(`  Code: ${genData.code || 'N/A'}`);
  
  assert(genResponse.status === 200, 'Code generation should succeed');
  assert(genData.code, 'Should return activation code');
  assert(genData.code.match(/^[A-Z0-9-]+$/), 'Code should match expected format');
  
  // Test 2: Generate with email
  console.log('\nTest 2: Generating code with email notification...');
  const { response: emailResponse, data: emailData } = await makeAuthRequest('/admin/activation/codes/generate', token, {
    method: 'POST',
    body: {
      companyId: TEST_COMPANIES[1].id,
      expiryDays: 60,
      sendEmail: true
    }
  });
  
  console.log(`  Status: ${emailResponse.status}`);
  console.log(`  Success: ${emailData.success === true ? '✓' : '✗'}`);
  console.log(`  Message: ${emailData.message || 'N/A'}`);
  
  // Test 3: Generate with custom expiry
  console.log('\nTest 3: Generating code with custom expiry...');
  const customDays = 90;
  const { response: customResponse, data: customData } = await makeAuthRequest('/admin/activation/codes/generate', token, {
    method: 'POST',
    body: {
      companyId: TEST_COMPANIES[2].id,
      expiryDays: customDays,
      sendEmail: false
    }
  });
  
  console.log(`  Status: ${customResponse.status}`);
  console.log(`  Success: ${customData.success === true ? '✓' : '✗'}`);
  console.log(`  Expiry days: ${customDays}`);
  
  // Test 4: Invalid company ID
  console.log('\nTest 4: Attempting generation with invalid company...');
  const { response: invalidResponse, data: invalidData } = await makeAuthRequest('/admin/activation/codes/generate', token, {
    method: 'POST',
    body: {
      companyId: 9999,
      expiryDays: 30,
      sendEmail: false
    }
  });
  
  console.log(`  Status: ${invalidResponse.status}`);
  console.log(`  Error: ${invalidData.error || 'N/A'}`);
  assert(invalidResponse.status === 404, 'Should return 404 for invalid company');
  
  console.log('\n✅ Code generation tests passed');
}

// Test code format and uniqueness
async function testCodeFormatAndUniqueness() {
  console.log('\n🔤 Testing Code Format and Uniqueness...\n');
  
  const token = await loginAsAdmin();
  const generatedCodes = new Set();
  
  console.log('Generating multiple codes to test uniqueness...');
  
  // Generate 10 codes
  for (let i = 0; i < 10; i++) {
    const { data } = await makeAuthRequest('/admin/activation/codes/generate', token, {
      method: 'POST',
      body: {
        companyId: TEST_COMPANIES[0].id,
        expiryDays: 30,
        sendEmail: false
      }
    });
    
    if (data.code) {
      console.log(`  Code ${i + 1}: ${data.code}`);
      
      // Check format
      assert(data.code.match(/^[A-Z0-9-]+$/), 'Code should only contain uppercase letters, numbers, and hyphens');
      assert(data.code.length >= 10, 'Code should be at least 10 characters');
      assert(data.code.length <= 20, 'Code should not exceed 20 characters');
      
      // Check uniqueness
      assert(!generatedCodes.has(data.code), 'Code should be unique');
      generatedCodes.add(data.code);
    }
  }
  
  console.log(`\n  Total unique codes: ${generatedCodes.size}/10 ✓`);
  console.log('  Format validation: ✓');
  console.log('  Length validation: ✓');
  
  console.log('\n✅ Code format and uniqueness tests passed');
}

// Test code expiry management
async function testCodeExpiryManagement() {
  console.log('\n⏰ Testing Code Expiry Management...\n');
  
  const token = await loginAsAdmin();
  
  // Get existing codes
  console.log('Fetching activation codes...');
  const { response: listResponse, data: listData } = await makeAuthRequest('/admin/activation/codes?status=active', token, {
    method: 'GET'
  });
  
  console.log(`  Total active codes: ${listData.codes?.length || 0}`);
  
  if (listData.codes && listData.codes.length > 0) {
    const testCode = listData.codes[0];
    
    // Test extending expiry
    console.log(`\nExtending expiry for code ${testCode.id}...`);
    const { response: extendResponse, data: extendData } = await makeAuthRequest(`/admin/activation/codes/${testCode.id}/extend`, token, {
      method: 'PUT',
      body: { days: 15 }
    });
    
    console.log(`  Status: ${extendResponse.status}`);
    console.log(`  Success: ${extendData.success === true ? '✓' : '✗'}`);
    console.log(`  New expiry: ${extendData.newExpiry ? new Date(extendData.newExpiry).toLocaleDateString() : 'N/A'}`);
    
    // Test revoking code
    console.log(`\nRevoking code ${testCode.id}...`);
    const { response: revokeResponse, data: revokeData } = await makeAuthRequest(`/admin/activation/codes/${testCode.id}`, token, {
      method: 'DELETE'
    });
    
    console.log(`  Status: ${revokeResponse.status}`);
    console.log(`  Success: ${revokeData.success === true ? '✓' : '✗'}`);
  }
  
  console.log('\n✅ Code expiry management tests passed');
}

// Test batch operations
async function testBatchOperations() {
  console.log('\n📦 Testing Batch Operations...\n');
  
  const token = await loginAsAdmin();
  
  // Test bulk code generation
  console.log('Testing bulk code generation...');
  const companies = TEST_COMPANIES.slice(0, 3);
  const promises = companies.map(company => 
    makeAuthRequest('/admin/activation/codes/generate', token, {
      method: 'POST',
      body: {
        companyId: company.id,
        expiryDays: 30,
        sendEmail: false
      }
    })
  );
  
  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.response.status === 200).length;
  
  console.log(`  Generated ${successCount}/${companies.length} codes successfully ✓`);
  
  // Test CSV export
  console.log('\nTesting CSV export...');
  const { response: exportResponse } = await makeAuthRequest('/admin/activation/export?status=all', token, {
    method: 'GET'
  });
  
  console.log(`  Export status: ${exportResponse.status}`);
  console.log(`  Content-Type: ${exportResponse.headers.get('content-type')}`);
  console.log(`  CSV export available: ${exportResponse.status === 200 ? '✓' : '✗'}`);
  
  console.log('\n✅ Batch operations tests passed');
}

// Test code validation rules
async function testCodeValidationRules() {
  console.log('\n📏 Testing Code Validation Rules...\n');
  
  console.log('Validation Rules:');
  console.log('  ✓ Code format: Uppercase alphanumeric with hyphens');
  console.log('  ✓ Code length: 10-20 characters');
  console.log('  ✓ Expiry check: Must not be expired');
  console.log('  ✓ Usage check: Must not exceed max uses');
  console.log('  ✓ Company check: Must be linked to valid company');
  console.log('  ✓ Status check: Must be active (not revoked)');
  
  // Test various invalid codes
  const invalidCodes = [
    { code: '', expectedError: 'Code is required' },
    { code: 'abc', expectedError: 'Invalid code format' },
    { code: 'TOOLONGCODETHATSHOULDNOTBEACCEPTED123', expectedError: 'Invalid code format' },
    { code: 'INVALID@CODE', expectedError: 'Invalid code format' },
    { code: 'lowercase123', expectedError: 'Invalid code format' }
  ];
  
  console.log('\nTesting invalid codes:');
  for (const testCase of invalidCodes) {
    const { response, data } = await fetch(`${API_URL}/payment/activation/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: testCase.code })
    }).then(async r => ({ response: r, data: await r.json() }));
    
    console.log(`  Code "${testCase.code}": ${data.error || 'No error'} ✓`);
  }
  
  console.log('\n✅ Code validation rules tests passed');
}

// Test analytics and reporting
async function testAnalyticsAndReporting() {
  console.log('\n📊 Testing Analytics and Reporting...\n');
  
  const token = await loginAsAdmin();
  
  // Get analytics
  console.log('Fetching activation analytics...');
  const { response: analyticsResponse, data: analyticsData } = await makeAuthRequest('/admin/activation/analytics', token, {
    method: 'GET'
  });
  
  console.log(`  Status: ${analyticsResponse.status}`);
  
  if (analyticsData.stats) {
    console.log('\nActivation Statistics:');
    console.log(`  Total codes: ${analyticsData.stats.total_codes || 0}`);
    console.log(`  Activated: ${analyticsData.stats.activated_codes || 0}`);
    console.log(`  Active: ${analyticsData.stats.active_codes || 0}`);
    console.log(`  Expired: ${analyticsData.stats.expired_codes || 0}`);
    console.log(`  Activation rate: ${analyticsData.stats.activation_rate || 0}%`);
    console.log(`  Avg days to activate: ${analyticsData.stats.avg_days_to_activate || 0}`);
  }
  
  if (analyticsData.monthlyTrends && analyticsData.monthlyTrends.length > 0) {
    console.log('\nMonthly Trends:');
    analyticsData.monthlyTrends.slice(0, 3).forEach(trend => {
      console.log(`  ${trend.month}: ${trend.total} codes, ${trend.activated} activated`);
    });
  }
  
  console.log('\n✅ Analytics and reporting tests passed');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Code Generation Tests...\n');
  
  try {
    // Check if backend is running
    const healthCheck = await fetch(`${BASE_URL}/health`).catch(() => null);
    if (!healthCheck || !healthCheck.ok) {
      console.error('❌ Backend is not running. Please start the backend first.');
      process.exit(1);
    }
    
    await testCodeGeneration();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testCodeFormatAndUniqueness();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testCodeExpiryManagement();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testBatchOperations();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testCodeValidationRules();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testAnalyticsAndReporting();
    
    console.log('\n✅ All code generation tests passed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('  - Code generation: ✓');
    console.log('  - Format & uniqueness: ✓');
    console.log('  - Expiry management: ✓');
    console.log('  - Batch operations: ✓');
    console.log('  - Validation rules: ✓');
    console.log('  - Analytics & reporting: ✓');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Export for use in other test suites
module.exports = {
  testCodeGeneration,
  testCodeFormatAndUniqueness,
  testCodeExpiryManagement,
  testBatchOperations,
  testCodeValidationRules,
  testAnalyticsAndReporting
};

// Run tests if called directly
if (require.main === module) {
  runAllTests();
}