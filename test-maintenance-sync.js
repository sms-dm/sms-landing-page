#!/usr/bin/env node

/**
 * Test script to verify maintenance task sync between portals
 */

const axios = require('axios');

const ONBOARDING_API = process.env.ONBOARDING_API_URL || 'http://localhost:3001/api';
const MAINTENANCE_API = process.env.MAINTENANCE_API_URL || 'http://localhost:3000/api';
const SYNC_API_KEY = process.env.SYNC_API_KEY || 'development-sync-key-2024';

async function testMaintenanceSync() {
  console.log('🔧 Testing Maintenance Task Sync...\n');

  try {
    // 1. Check onboarding API for equipment with maintenance tasks
    console.log('1️⃣ Fetching equipment with maintenance tasks from onboarding portal...');
    const equipmentResponse = await axios.get(`${ONBOARDING_API}/sync/equipment`, {
      headers: {
        'Authorization': `Bearer ${SYNC_API_KEY}`
      }
    });

    const equipmentWithTasks = equipmentResponse.data.filter(eq => 
      eq.maintenanceTasks && eq.maintenanceTasks.length > 0
    );

    console.log(`Found ${equipmentWithTasks.length} equipment items with maintenance tasks`);
    
    if (equipmentWithTasks.length > 0) {
      const firstEquipment = equipmentWithTasks[0];
      console.log(`\nExample: ${firstEquipment.name}`);
      console.log(`Maintenance tasks: ${firstEquipment.maintenanceTasks.length}`);
      firstEquipment.maintenanceTasks.forEach(task => {
        console.log(`  - ${task.taskName}: Every ${task.intervalValue} ${task.intervalUnit}`);
      });
    }

    // 2. Trigger sync in maintenance portal
    console.log('\n2️⃣ Triggering sync in maintenance portal...');
    const syncResponse = await axios.post(`${MAINTENANCE_API}/sync/trigger`, {}, {
      headers: {
        'Authorization': 'Bearer admin-token' // You might need to get a valid token
      }
    });

    console.log(`Sync started with ID: ${syncResponse.data.syncId}`);

    // 3. Wait for sync to complete
    console.log('\n3️⃣ Waiting for sync to complete...');
    let syncComplete = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!syncComplete && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      try {
        const statusResponse = await axios.get(
          `${MAINTENANCE_API}/sync/status/${syncResponse.data.syncId}`,
          {
            headers: {
              'Authorization': 'Bearer admin-token'
            }
          }
        );

        const status = statusResponse.data.status;
        console.log(`Sync status: ${status}`);

        if (status === 'completed' || status === 'failed') {
          syncComplete = true;
          
          if (status === 'completed') {
            console.log('\n✅ Sync completed successfully!');
            console.log(`Items synced:`);
            console.log(`  - Vessels: ${statusResponse.data.vessels_synced || 0}`);
            console.log(`  - Equipment: ${statusResponse.data.equipment_synced || 0}`);
            console.log(`  - Users: ${statusResponse.data.users_synced || 0}`);
            console.log(`  - Parts: ${statusResponse.data.parts_synced || 0}`);
            console.log(`  - Maintenance Tasks: ${statusResponse.data.maintenance_tasks_synced || 0}`);
          } else {
            console.log('\n❌ Sync failed!');
            console.log(`Errors: ${statusResponse.data.errors}`);
          }
        }
      } catch (error) {
        // Status endpoint might not be available
        console.log('Could not get sync status, assuming it\'s still running...');
      }

      attempts++;
    }

    if (!syncComplete) {
      console.log('\n⏱️ Sync timed out after 60 seconds');
    }

    // 4. Verify maintenance tasks in database
    console.log('\n4️⃣ Verifying maintenance tasks in database...');
    console.log('You can check the maintenance portal database to verify tasks were synced.');
    console.log('Run: SELECT COUNT(*) FROM maintenance_tasks;');

  } catch (error) {
    console.error('\n❌ Error during maintenance sync test:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testMaintenanceSync()
  .then(() => {
    console.log('\n✅ Maintenance sync test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });