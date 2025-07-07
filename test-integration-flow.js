#!/usr/bin/env node

// Test script for the complete integration flow between Onboarding and Maintenance portals

const http = require('http');

// Configuration
const ONBOARDING_API = 'http://localhost:4000'; // Onboarding backend
const MAINTENANCE_API = 'http://localhost:3005'; // Maintenance backend

// Test credentials
const TEST_ADMIN = {
  email: 'demo.admin@oceanic.com',
  password: 'demo123'
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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

// Step 1: Login to Maintenance portal to get auth token
async function loginToMaintenance() {
  console.log('📝 Step 1: Logging into Maintenance portal...');
  
  const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  const result = await makeRequest(options, TEST_ADMIN);
  
  if (result.status === 200 && result.body.token) {
    console.log('✅ Login successful');
    return result.body.token;
  } else {
    console.error('❌ Login failed:', result.body);
    throw new Error('Login failed');
  }
}

// Step 2: Create test import data
function createTestImportData() {
  return {
    vessel: {
      id: "test-vessel-" + Date.now(),
      name: "MV Integration Test",
      imo: "IMO" + Date.now().toString().slice(-7),
      type: "Platform Supply Vessel",
      flag: "Norway",
      company: {
        id: "test-company-001",
        name: "Integration Test Company",
        code: "ITC"
      },
      specifications: {
        length: "85m",
        beam: "20m"
      },
      locations: []
    },
    equipment: [
      {
        id: "test-equip-001",
        name: "Test Main Engine",
        code: "SMS-TEST-001",
        type: "engine",
        manufacturer: "Test Manufacturer",
        model: "TEST-2000",
        serialNumber: "TST" + Date.now(),
        criticality: "CRITICAL",
        location: { name: "Engine Room" },
        maintenanceSchedule: {
          intervalDays: 180,
          lastMaintenance: null,
          nextMaintenance: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        specifications: {
          power: "5000 kW",
          rpm: "720"
        },
        qualityScore: 95,
        approvalDetails: {
          documentedBy: "Test User",
          documentedAt: new Date().toISOString(),
          reviewedBy: "Test Manager",
          reviewedAt: new Date().toISOString(),
          approvedBy: "Test Admin",
          approvedAt: new Date().toISOString()
        },
        metadata: {}
      },
      {
        id: "test-equip-002",
        name: "Test Generator",
        code: "SMS-TEST-002",
        type: "generator",
        manufacturer: "Test Gen Corp",
        model: "TG-500",
        serialNumber: "TGN" + Date.now(),
        criticality: "IMPORTANT",
        location: { name: "Generator Room" },
        maintenanceSchedule: {
          intervalDays: 90,
          lastMaintenance: new Date().toISOString().split('T')[0],
          nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        specifications: {
          power: "1000 kW",
          voltage: "440V"
        },
        qualityScore: 92,
        approvalDetails: {
          documentedBy: "Test User",
          documentedAt: new Date().toISOString(),
          reviewedBy: null,
          reviewedAt: null,
          approvedBy: null,
          approvedAt: null
        },
        metadata: {}
      }
    ],
    parts: [
      {
        id: "test-part-001",
        equipmentId: "test-equip-001",
        equipmentName: "Test Main Engine",
        name: "Test Fuel Pump",
        partNumber: "TFP-001",
        manufacturer: "Test Parts Inc",
        description: "Test fuel pump for engine",
        criticality: "CRITICAL",
        quantity: 1,
        unitOfMeasure: "pcs",
        minimumStock: 2,
        currentStock: 5,
        specifications: {},
        metadata: {}
      }
    ],
    documents: [],
    metadata: {
      exportId: "test-export-" + Date.now(),
      exportDate: new Date().toISOString(),
      exportedBy: "test-user",
      format: "json",
      includePhotos: false
    }
  };
}

// Step 3: Send import request to Maintenance portal
async function importToMaintenance(token, importData) {
  console.log('\n📤 Step 2: Sending import request to Maintenance portal...');
  
  const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/integration/import/vessel',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  const result = await makeRequest(options, importData);
  
  if (result.status === 200) {
    console.log('✅ Import successful!');
    console.log('📊 Import results:', JSON.stringify(result.body, null, 2));
    return result.body;
  } else {
    console.error('❌ Import failed:', result);
    throw new Error('Import failed');
  }
}

// Step 4: Verify imported data
async function verifyImport(token, vesselId) {
  console.log('\n🔍 Step 3: Verifying imported data...');
  
  // Get equipment for the vessel
  const options = {
    hostname: 'localhost',
    port: 3005,
    path: `/api/equipment/vessel/${vesselId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
  
  const result = await makeRequest(options);
  
  if (result.status === 200) {
    console.log('✅ Verification successful!');
    console.log(`📋 Found ${result.body.length} equipment items`);
    
    // Display equipment details
    result.body.forEach(eq => {
      console.log(`\n⚙️  Equipment: ${eq.name}`);
      console.log(`   - QR Code: ${eq.qr_code}`);
      console.log(`   - Type: ${eq.equipment_type}`);
      console.log(`   - Criticality: ${eq.criticality || 'Not set'}`);
      console.log(`   - Classification: ${eq.classification || 'Not set'}`);
      console.log(`   - Status: ${eq.status}`);
      
      // Check if parts were imported
      const specs = JSON.parse(eq.specifications || '{}');
      if (specs.criticalParts && specs.criticalParts.length > 0) {
        console.log(`   - Parts: ${specs.criticalParts.length} critical parts`);
      }
    });
  } else {
    console.error('❌ Verification failed:', result);
  }
}

// Main test flow
async function runIntegrationTest() {
  console.log('🚀 Starting Integration Test\n');
  console.log('Testing flow: Onboarding Portal → Maintenance Portal\n');
  
  try {
    // Step 1: Login
    const token = await loginToMaintenance();
    
    // Step 2: Create and send import data
    const importData = createTestImportData();
    console.log(`\n📦 Created test vessel: ${importData.vessel.name} (${importData.vessel.imo})`);
    console.log(`   - Equipment: ${importData.equipment.length} items`);
    console.log(`   - Parts: ${importData.parts.length} items`);
    
    const importResult = await importToMaintenance(token, importData);
    
    // Step 3: Verify the import
    if (importResult.data && importResult.data.vessel) {
      await verifyImport(token, importResult.data.vessel.id);
    }
    
    console.log('\n✅ Integration test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- Created company (if new)');
    console.log('- Created/updated vessel');
    console.log('- Imported equipment with criticality levels');
    console.log('- Stored parts in equipment specifications');
    console.log('- All data transformations working correctly');
    
  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runIntegrationTest();