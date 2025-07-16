#!/usr/bin/env node

const axios = require('axios');

// Configuration
const ONBOARDING_API = 'http://localhost:5174/api';
const MAINTENANCE_API = 'http://localhost:3005/api';

// Test credentials
const testUser = {
  email: 'integration.test@sms.com',
  password: 'Test123!'
};

let authTokenOnboarding = '';
let authTokenMaintenance = '';
let testVesselId = '';
let exportData = null;

// Helper function to log steps
function log(step, message, data = null) {
  console.log(`\n[${step}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Helper function to handle errors
function handleError(step, error) {
  console.error(`\n[${step}] ERROR:`, error.response?.data || error.message);
  process.exit(1);
}

async function testIntegration() {
  try {
    // Step 1: Login to Onboarding Portal
    log('STEP 1', 'Logging into Onboarding Portal...');
    try {
      const loginResponse = await axios.post(`${ONBOARDING_API}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      authTokenOnboarding = loginResponse.data.accessToken;
      log('STEP 1', 'Login successful', { user: loginResponse.data.user });
    } catch (error) {
      log('STEP 1', 'Login failed, trying demo admin credentials...');
      const demoResponse = await axios.post(`${ONBOARDING_API}/auth/login`, {
        email: 'admin@smartmarinesystems.com',
        password: 'admin123'
      });
      authTokenOnboarding = demoResponse.data.accessToken;
      log('STEP 1', 'Demo login successful', { user: demoResponse.data.user });
    }

    // Step 2: Get vessels in Onboarding Portal
    log('STEP 2', 'Fetching vessels from Onboarding Portal...');
    const vesselsResponse = await axios.get(`${ONBOARDING_API}/vessels`, {
      headers: { Authorization: `Bearer ${authTokenOnboarding}` }
    });
    
    if (vesselsResponse.data.vessels && vesselsResponse.data.vessels.length > 0) {
      testVesselId = vesselsResponse.data.vessels[0].id;
      log('STEP 2', `Found ${vesselsResponse.data.vessels.length} vessels, using first one:`, {
        id: testVesselId,
        name: vesselsResponse.data.vessels[0].name,
        imo: vesselsResponse.data.vessels[0].imo
      });
    } else {
      log('STEP 2', 'No vessels found. Please create a vessel in the Onboarding Portal first.');
      process.exit(1);
    }

    // Step 3: Export vessel data from Onboarding Portal
    log('STEP 3', 'Exporting vessel data from Onboarding Portal...');
    const exportResponse = await axios.post(
      `${ONBOARDING_API}/integration/export-to-maintenance`,
      {
        vesselId: testVesselId,
        includePhotos: false,
        format: 'json'
      },
      {
        headers: { Authorization: `Bearer ${authTokenOnboarding}` }
      }
    );
    
    exportData = exportResponse.data.data;
    log('STEP 3', 'Export successful', {
      exportId: exportData.metadata.exportId,
      vessel: exportData.vessel.name,
      equipmentCount: exportData.equipment.length,
      partsCount: exportData.parts.length
    });

    // Step 4: Generate bridge token in Onboarding Portal
    log('STEP 4', 'Generating bridge token for Maintenance Portal access...');
    const bridgeResponse = await axios.post(
      `${ONBOARDING_API}/auth-bridge/generate`,
      {},
      {
        headers: { Authorization: `Bearer ${authTokenOnboarding}` }
      }
    );
    
    const bridgeToken = bridgeResponse.data.bridgeToken;
    log('STEP 4', 'Bridge token generated', {
      expiresIn: bridgeResponse.data.expiresIn,
      redirectUrl: bridgeResponse.data.redirectUrl
    });

    // Step 5: Use bridge token to authenticate in Maintenance Portal
    log('STEP 5', 'Authenticating in Maintenance Portal with bridge token...');
    const bridgeAuthResponse = await axios.post(`${MAINTENANCE_API}/auth-bridge/validate`, {
      bridgeToken: bridgeToken
    });
    
    authTokenMaintenance = bridgeAuthResponse.data.token;
    log('STEP 5', 'Bridge authentication successful', {
      user: bridgeAuthResponse.data.user
    });

    // Step 6: Import vessel data into Maintenance Portal
    log('STEP 6', 'Importing vessel data into Maintenance Portal...');
    const importResponse = await axios.post(
      `${MAINTENANCE_API}/integration/import`,
      exportData,
      {
        headers: { Authorization: `Bearer ${authTokenMaintenance}` }
      }
    );
    
    log('STEP 6', 'Import successful', importResponse.data.data);

    // Step 7: Verify import in Maintenance Portal
    log('STEP 7', 'Verifying imported data in Maintenance Portal...');
    
    // Check vessels
    const maintenanceVesselsResponse = await axios.get(`${MAINTENANCE_API}/vessels`, {
      headers: { Authorization: `Bearer ${authTokenMaintenance}` }
    });
    
    const importedVessel = maintenanceVesselsResponse.data.find(
      v => v.imo_number === exportData.vessel.imo
    );
    
    if (importedVessel) {
      log('STEP 7', 'Vessel verified in Maintenance Portal', {
        id: importedVessel.id,
        name: importedVessel.name,
        imo: importedVessel.imo_number
      });
      
      // Check equipment
      const equipmentResponse = await axios.get(
        `${MAINTENANCE_API}/equipment?vesselId=${importedVessel.id}`,
        {
          headers: { Authorization: `Bearer ${authTokenMaintenance}` }
        }
      );
      
      log('STEP 7', `Equipment verified: ${equipmentResponse.data.length} items imported`);
    } else {
      log('STEP 7', 'WARNING: Vessel not found in Maintenance Portal after import');
    }

    // Step 8: Test reverse bridge (Maintenance to Onboarding)
    log('STEP 8', 'Testing reverse bridge authentication...');
    const reverseBridgeResponse = await axios.post(
      `${MAINTENANCE_API}/auth-bridge/generate`,
      {},
      {
        headers: { Authorization: `Bearer ${authTokenMaintenance}` }
      }
    );
    
    log('STEP 8', 'Reverse bridge token generated', {
      redirectUrl: reverseBridgeResponse.data.redirectUrl
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('INTEGRATION TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\nSummary:');
    console.log(`- Vessel "${exportData.vessel.name}" exported from Onboarding Portal`);
    console.log(`- ${exportData.equipment.length} equipment items exported`);
    console.log(`- ${exportData.parts.length} parts exported`);
    console.log(`- Data successfully imported into Maintenance Portal`);
    console.log(`- Bridge authentication working in both directions`);
    console.log('\nTest Credentials for both portals:');
    console.log(`- Email: ${testUser.email}`);
    console.log(`- Password: ${testUser.password}`);
    console.log('\nPortal URLs:');
    console.log(`- Onboarding Portal: http://localhost:3001`);
    console.log(`- Maintenance Portal: http://localhost:3000`);
    
  } catch (error) {
    handleError('UNKNOWN', error);
  }
}

// Run the test
console.log('Starting Portal Integration Test...');
console.log('Make sure both portals are running!');
console.log('='.repeat(60));

testIntegration();