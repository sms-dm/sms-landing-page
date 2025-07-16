#!/usr/bin/env node

const axios = require('axios');

// Configuration
const MAINTENANCE_API = 'http://localhost:3005/api';
const ONBOARDING_API = 'http://localhost:3001/api';

// Test credentials (adjust as needed)
const MAINTENANCE_CREDS = {
  email: 'admin@smartmarine.com',
  password: 'admin123'
};

const ONBOARDING_CREDS = {
  email: 'admin@smartmarine.com',
  password: 'admin123'
};

let maintenanceToken = null;
let onboardingToken = null;

// Helper function to login
async function login(apiUrl, credentials) {
  try {
    const response = await axios.post(`${apiUrl}/auth/login`, credentials);
    return response.data.token;
  } catch (error) {
    console.error(`Failed to login to ${apiUrl}:`, error.response?.data || error.message);
    throw error;
  }
}

// Test sync connection
async function testSyncConnection() {
  console.log('\n1. Testing sync connection...');
  try {
    const response = await axios.get(`${MAINTENANCE_API}/sync/test-connection`, {
      headers: { Authorization: `Bearer ${maintenanceToken}` }
    });
    console.log('✅ Connection test:', response.data);
  } catch (error) {
    console.error('❌ Connection test failed:', error.response?.data || error.message);
  }
}

// Get current sync status
async function getSyncStatus() {
  console.log('\n2. Getting current sync status...');
  try {
    const response = await axios.get(`${MAINTENANCE_API}/sync/status`, {
      headers: { Authorization: `Bearer ${maintenanceToken}` }
    });
    console.log('✅ Sync status:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get sync status:', error.response?.data || error.message);
  }
}

// Trigger manual sync
async function triggerSync() {
  console.log('\n3. Triggering manual sync...');
  try {
    const response = await axios.post(`${MAINTENANCE_API}/sync/trigger`, {}, {
      headers: { Authorization: `Bearer ${maintenanceToken}` }
    });
    console.log('✅ Sync triggered:', response.data);
    return response.data.syncId;
  } catch (error) {
    console.error('❌ Failed to trigger sync:', error.response?.data || error.message);
  }
}

// Monitor sync progress
async function monitorSyncProgress(syncId) {
  console.log('\n4. Monitoring sync progress...');
  
  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${MAINTENANCE_API}/sync/status/${syncId}`, {
          headers: { Authorization: `Bearer ${maintenanceToken}` }
        });
        
        const syncLog = response.data;
        console.log(`Status: ${syncLog.status} | Vessels: ${syncLog.vessels_synced} | Equipment: ${syncLog.equipment_synced} | Users: ${syncLog.users_synced}`);
        
        if (syncLog.status === 'completed' || syncLog.status === 'failed') {
          clearInterval(checkInterval);
          console.log('\n✅ Sync completed with status:', syncLog.status);
          if (syncLog.errors && syncLog.errors.length > 0) {
            console.log('Errors:', syncLog.errors);
          }
          resolve(syncLog);
        }
      } catch (error) {
        console.error('Error checking sync status:', error.message);
      }
    }, 2000); // Check every 2 seconds
  });
}

// Get sync history
async function getSyncHistory() {
  console.log('\n5. Getting sync history...');
  try {
    const response = await axios.get(`${MAINTENANCE_API}/sync/history?limit=5`, {
      headers: { Authorization: `Bearer ${maintenanceToken}` }
    });
    console.log('✅ Recent sync history:');
    response.data.data.forEach(log => {
      console.log(`- ${log.type} sync on ${new Date(log.started_at).toLocaleString()} - Status: ${log.status}`);
    });
  } catch (error) {
    console.error('❌ Failed to get sync history:', error.response?.data || error.message);
  }
}

// Test webhook
async function testWebhook() {
  console.log('\n6. Testing webhook endpoint...');
  try {
    const testPayload = {
      eventId: `test-${Date.now()}`,
      event: 'test.event',
      data: {
        message: 'This is a test webhook'
      }
    };
    
    const response = await axios.post(`${MAINTENANCE_API}/sync/webhook`, testPayload);
    console.log('✅ Webhook test response:', response.data);
  } catch (error) {
    console.error('❌ Webhook test failed:', error.response?.data || error.message);
  }
}

// Verify data sync
async function verifyDataSync() {
  console.log('\n7. Verifying data synchronization...');
  
  try {
    // Get vessels from maintenance portal
    const vesselsResponse = await axios.get(`${MAINTENANCE_API}/vessels`, {
      headers: { Authorization: `Bearer ${maintenanceToken}` }
    });
    console.log(`✅ Vessels in maintenance portal: ${vesselsResponse.data.length}`);
    
    // Get equipment count
    const equipmentResponse = await axios.get(`${MAINTENANCE_API}/equipment`, {
      headers: { Authorization: `Bearer ${maintenanceToken}` }
    });
    console.log(`✅ Equipment in maintenance portal: ${equipmentResponse.data.length}`);
    
    // Get users count
    const usersResponse = await axios.get(`${MAINTENANCE_API}/companies`, {
      headers: { Authorization: `Bearer ${maintenanceToken}` }
    });
    // Note: Users endpoint might need adjustment based on your API
    console.log(`✅ Companies in maintenance portal: ${usersResponse.data.length}`);
    
  } catch (error) {
    console.error('❌ Failed to verify data sync:', error.response?.data || error.message);
  }
}

// Main test flow
async function runSyncTest() {
  console.log('🚀 Starting SMS Portal Sync Test\n');
  
  try {
    // Login to both portals
    console.log('Logging in to maintenance portal...');
    maintenanceToken = await login(MAINTENANCE_API, MAINTENANCE_CREDS);
    console.log('✅ Logged in to maintenance portal');
    
    // Run test sequence
    await testSyncConnection();
    
    const currentStatus = await getSyncStatus();
    
    if (!currentStatus?.isSyncing) {
      const syncId = await triggerSync();
      
      if (syncId) {
        await monitorSyncProgress(syncId);
      }
    } else {
      console.log('⚠️  Sync already in progress, skipping trigger');
    }
    
    await getSyncHistory();
    await testWebhook();
    await verifyDataSync();
    
    console.log('\n✅ Sync test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Sync test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runSyncTest();

// Instructions for use:
console.log(`
To use this test script:
1. Ensure both portals are running:
   - Maintenance Portal: http://localhost:3005
   - Onboarding Portal: http://localhost:3001

2. Update the credentials if needed

3. Run: node test-sync-flow.js
`);