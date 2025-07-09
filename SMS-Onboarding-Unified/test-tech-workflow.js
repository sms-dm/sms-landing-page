#!/usr/bin/env node

// Simple test script for technician workflow
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_TOKEN = 'test-technician-token'; // Replace with actual token

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testTechnicianWorkflow() {
  console.log('Testing Technician Workflow...\n');

  try {
    // 1. Test getting assignments
    console.log('1. Getting technician assignments...');
    const assignmentsRes = await api.get('/technician/assignments');
    console.log('✅ Assignments:', assignmentsRes.data);

    // 2. Test getting vessel locations
    console.log('\n2. Getting vessel locations...');
    const vesselId = 'vessel-1'; // Use actual vessel ID
    const locationsRes = await api.get(`/technician/vessels/${vesselId}/locations`);
    console.log('✅ Locations:', locationsRes.data);

    // 3. Test creating equipment
    if (locationsRes.data.length > 0) {
      console.log('\n3. Creating equipment...');
      const locationId = locationsRes.data[0].id;
      const equipmentData = {
        name: 'Test Equipment',
        manufacturer: 'Test Manufacturer',
        model: 'TEST-001',
        serialNumber: 'SN-' + Date.now(),
        categoryId: 'cat-1',
        criticalityLevel: 'medium',
        vesselId: vesselId
      };
      
      const equipmentRes = await api.post(`/technician/locations/${locationId}/equipment`, equipmentData);
      console.log('✅ Equipment created:', equipmentRes.data);

      // 4. Test adding parts
      console.log('\n4. Adding spare parts...');
      const equipmentId = equipmentRes.data.id;
      const partData = {
        partNumber: 'PART-' + Date.now(),
        name: 'Test Part',
        manufacturer: 'Part Manufacturer',
        quantity: 10,
        minimumStock: 5,
        criticalityLevel: 'high'
      };
      
      const partRes = await api.post(`/technician/equipment/${equipmentId}/parts`, partData);
      console.log('✅ Part created:', partRes.data);

      // 5. Test marking part as critical
      console.log('\n5. Marking part as critical...');
      const partId = partRes.data.id;
      const criticalRes = await api.post(`/technician/parts/${partId}/mark-critical`, {
        reason: 'Essential for main engine operation'
      });
      console.log('✅ Part marked as critical:', criticalRes.data);

      // 6. Test quality score
      console.log('\n6. Getting quality score...');
      const qualityRes = await api.get(`/technician/vessels/${vesselId}/quality-score`);
      console.log('✅ Quality score:', qualityRes.data);
    }

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests
testTechnicianWorkflow();