#!/usr/bin/env node

/**
 * SMS Demo Integration Test Script
 * Tests the complete flow between portals with demo data
 */

const axios = require('axios');

const ONBOARDING_API = 'http://localhost:5001/api';
const MAINTENANCE_API = 'http://localhost:3001/api';

const DEMO_USER = {
  email: 'admin@demo.com',
  password: 'Demo123!'
};

let onboardingToken = null;
let maintenanceToken = null;

async function testOnboardingLogin() {
  console.log('\n🔐 Testing Onboarding Portal login...');
  try {
    const response = await axios.post(`${ONBOARDING_API}/auth/login`, {
      email: DEMO_USER.email,
      password: DEMO_USER.password
    });
    
    onboardingToken = response.data.accessToken;
    console.log('✅ Onboarding login successful');
    console.log(`   User: ${response.data.user.email}`);
    console.log(`   Role: ${response.data.user.role}`);
    return true;
  } catch (error) {
    console.error('❌ Onboarding login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testOnboardingData() {
  console.log('\n📊 Testing Onboarding Portal data access...');
  try {
    // Get vessels
    const vesselsResponse = await axios.get(`${ONBOARDING_API}/vessels`, {
      headers: { Authorization: `Bearer ${onboardingToken}` }
    });
    
    console.log('✅ Vessels retrieved:', vesselsResponse.data.length);
    if (vesselsResponse.data.length > 0) {
      const vessel = vesselsResponse.data[0];
      console.log(`   - ${vessel.name} (IMO: ${vessel.imoNumber})`);
      
      // Get equipment for first vessel
      const equipmentResponse = await axios.get(`${ONBOARDING_API}/vessels/${vessel.id}/equipment`, {
        headers: { Authorization: `Bearer ${onboardingToken}` }
      });
      
      console.log(`✅ Equipment retrieved: ${equipmentResponse.data.length} items`);
      equipmentResponse.data.slice(0, 3).forEach(eq => {
        console.log(`   - ${eq.name} (${eq.code})`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Data access failed:', error.response?.data || error.message);
    return false;
  }
}

async function testAuthBridge() {
  console.log('\n🌉 Testing Auth Bridge...');
  try {
    const response = await axios.post(`${ONBOARDING_API}/auth/bridge/token`, {}, {
      headers: { Authorization: `Bearer ${onboardingToken}` }
    });
    
    const bridgeToken = response.data.bridgeToken;
    console.log('✅ Bridge token generated');
    
    // Use bridge token to get maintenance portal access
    const maintenanceAuth = await axios.post(`${MAINTENANCE_API}/auth/bridge/validate`, {
      bridgeToken: bridgeToken
    });
    
    maintenanceToken = maintenanceAuth.data.token;
    console.log('✅ Maintenance portal access granted');
    console.log(`   User: ${maintenanceAuth.data.user.email}`);
    console.log(`   Company: ${maintenanceAuth.data.user.company_name}`);
    
    return true;
  } catch (error) {
    console.error('❌ Auth bridge failed:', error.response?.data || error.message);
    return false;
  }
}

async function testMaintenanceData() {
  console.log('\n🔧 Testing Maintenance Portal data access...');
  try {
    // Get vessels
    const vesselsResponse = await axios.get(`${MAINTENANCE_API}/vessels`, {
      headers: { Authorization: `Bearer ${maintenanceToken}` }
    });
    
    console.log('✅ Vessels retrieved:', vesselsResponse.data.length);
    if (vesselsResponse.data.length > 0) {
      const vessel = vesselsResponse.data[0];
      console.log(`   - ${vessel.name} (IMO: ${vessel.imo_number})`);
      
      // Get equipment
      const equipmentResponse = await axios.get(`${MAINTENANCE_API}/equipment?vessel_id=${vessel.id}`, {
        headers: { Authorization: `Bearer ${maintenanceToken}` }
      });
      
      console.log(`✅ Equipment retrieved: ${equipmentResponse.data.length} items`);
      equipmentResponse.data.slice(0, 3).forEach(eq => {
        console.log(`   - ${eq.name} (${eq.manufacturer} ${eq.model})`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Maintenance data access failed:', error.response?.data || error.message);
    return false;
  }
}

async function testDataSync() {
  console.log('\n🔄 Testing Data Sync...');
  try {
    // Export from onboarding portal
    const exportResponse = await axios.post(`${ONBOARDING_API}/integration/export`, {
      vesselId: 1 // Assuming vessel ID 1
    }, {
      headers: { Authorization: `Bearer ${onboardingToken}` }
    });
    
    console.log('✅ Data exported from Onboarding Portal');
    console.log(`   Equipment count: ${exportResponse.data.equipment?.length || 0}`);
    
    // Import to maintenance portal
    const importResponse = await axios.post(`${MAINTENANCE_API}/integration/import`, 
      exportResponse.data,
      {
        headers: { Authorization: `Bearer ${maintenanceToken}` }
      }
    );
    
    console.log('✅ Data imported to Maintenance Portal');
    console.log(`   Status: ${importResponse.data.status}`);
    
    return true;
  } catch (error) {
    console.error('❌ Data sync failed:', error.response?.data || error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 SMS Demo Integration Test');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: 'Onboarding Login', fn: testOnboardingLogin },
    { name: 'Onboarding Data', fn: testOnboardingData },
    { name: 'Auth Bridge', fn: testAuthBridge },
    { name: 'Maintenance Data', fn: testMaintenanceData },
    { name: 'Data Sync', fn: testDataSync }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log(`📈 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All integration tests passed!');
    console.log('\n🎯 Demo environment is fully functional!');
  } else {
    console.log('❌ Some tests failed. Please check the logs above.');
  }
}

// Run tests
main().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});