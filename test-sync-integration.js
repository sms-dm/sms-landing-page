#!/usr/bin/env node
const axios = require('axios');

// Configuration
const MAINTENANCE_API = 'http://localhost:3005/api';
const ONBOARDING_API = 'http://localhost:3001/api';
const SYNC_API_KEY = 'development-sync-key-2024';

// Test user credentials for maintenance portal
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

async function testSyncIntegration() {
  console.log('🔄 Testing Portal Sync Integration\n');

  try {
    // Step 1: Test sync endpoints availability
    console.log('1️⃣ Testing sync endpoints availability...');
    
    const endpoints = [
      { name: 'Vessels', url: `${ONBOARDING_API}/sync/vessels` },
      { name: 'Equipment', url: `${ONBOARDING_API}/sync/equipment` },
      { name: 'Users', url: `${ONBOARDING_API}/sync/users` }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint.url, {
          headers: {
            'Authorization': `Bearer ${SYNC_API_KEY}`
          }
        });
        console.log(`   ✅ ${endpoint.name}: ${response.data.length || 0} items available`);
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: ${error.response?.status} ${error.response?.data?.error || error.message}`);
      }
    }

    // Step 2: Login to maintenance portal
    console.log('\n2️⃣ Logging into maintenance portal...');
    
    let authToken;
    try {
      const loginResponse = await axios.post(`${MAINTENANCE_API}/auth/login`, TEST_USER);
      authToken = loginResponse.data.token;
      console.log('   ✅ Login successful');
    } catch (error) {
      console.log('   ❌ Login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Step 3: Test sync connection
    console.log('\n3️⃣ Testing sync connection from maintenance portal...');
    
    try {
      const testResponse = await axios.get(`${MAINTENANCE_API}/sync/test-connection`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('   ✅ Connection test:', testResponse.data.message || 'Success');
    } catch (error) {
      console.log('   ❌ Connection test failed:', error.response?.data?.message || error.message);
    }

    // Step 4: Get current sync status
    console.log('\n4️⃣ Checking sync status...');
    
    try {
      const statusResponse = await axios.get(`${MAINTENANCE_API}/sync/status`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const status = statusResponse.data;
      console.log('   📊 Sync Status:');
      console.log(`      - Is Syncing: ${status.isSyncing ? 'Yes' : 'No'}`);
      console.log(`      - Last Sync: ${status.lastSync || 'Never'}`);
      console.log(`      - Scheduled: ${status.scheduledSyncEnabled ? 'Yes' : 'No'}`);
    } catch (error) {
      console.log('   ❌ Status check failed:', error.response?.data?.message || error.message);
    }

    // Step 5: Trigger manual sync
    console.log('\n5️⃣ Triggering manual sync...');
    
    try {
      const syncResponse = await axios.post(`${MAINTENANCE_API}/sync/trigger`, {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const result = syncResponse.data;
      console.log('   ✅ Sync triggered successfully!');
      console.log(`      - Sync ID: ${result.id}`);
      console.log(`      - Status: ${result.status}`);
      
      // Wait for sync to complete
      console.log('\n   ⏳ Waiting for sync to complete...');
      
      let syncComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
      
      while (!syncComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          const statusCheck = await axios.get(`${MAINTENANCE_API}/sync/status/${result.id}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          const currentStatus = statusCheck.data;
          
          if (currentStatus.status === 'completed') {
            syncComplete = true;
            console.log('\n   ✅ Sync completed successfully!');
            console.log(`      - Vessels synced: ${currentStatus.itemsSynced?.vessels || 0}`);
            console.log(`      - Equipment synced: ${currentStatus.itemsSynced?.equipment || 0}`);
            console.log(`      - Users synced: ${currentStatus.itemsSynced?.users || 0}`);
            console.log(`      - Duration: ${currentStatus.duration || 'N/A'}`);
            
            if (currentStatus.errors && currentStatus.errors.length > 0) {
              console.log(`      - ⚠️  Errors: ${currentStatus.errors.length}`);
              currentStatus.errors.forEach(err => console.log(`         • ${err}`));
            }
          } else if (currentStatus.status === 'failed') {
            syncComplete = true;
            console.log('\n   ❌ Sync failed!');
            console.log(`      - Error: ${currentStatus.errors?.join(', ') || 'Unknown error'}`);
          } else {
            process.stdout.write('.');
          }
        } catch (error) {
          // Status endpoint might not exist, continue waiting
        }
        
        attempts++;
      }
      
      if (!syncComplete) {
        console.log('\n   ⚠️  Sync timeout - check maintenance portal logs');
      }
      
    } catch (error) {
      console.log('   ❌ Sync trigger failed:', error.response?.data?.message || error.message);
    }

    // Step 6: Check sync history
    console.log('\n6️⃣ Checking sync history...');
    
    try {
      const historyResponse = await axios.get(`${MAINTENANCE_API}/sync/history?limit=5`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const history = historyResponse.data;
      if (history && history.length > 0) {
        console.log(`   📋 Recent sync operations (${history.length}):`);
        history.forEach((sync, index) => {
          console.log(`      ${index + 1}. ${sync.type} - ${sync.status} - ${new Date(sync.startedAt).toLocaleString()}`);
        });
      } else {
        console.log('   📋 No sync history found');
      }
    } catch (error) {
      console.log('   ❌ History check failed:', error.response?.data?.message || error.message);
    }

    console.log('\n✅ Sync integration test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

// Run the test
console.log('SMS Portal Sync Integration Test');
console.log('================================\n');
console.log('Prerequisites:');
console.log('- Maintenance portal running on port 3005');
console.log('- Onboarding portal running on port 3001');
console.log('- Environment variables configured\n');

testSyncIntegration();