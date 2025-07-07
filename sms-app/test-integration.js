// Test script for integration API
// This simulates the data format from the Onboarding portal

const testData = {
  vessel: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "MV Test Vessel",
    imo: "IMO1234567",
    type: "Platform Supply Vessel",
    flag: "Norway",
    company: {
      id: "456e7890-e89b-12d3-a456-426614174000",
      name: "Test Marine Company",
      code: "TMC"
    },
    specifications: {
      length: "80m",
      beam: "18m",
      draft: "6.5m"
    },
    locations: []
  },
  equipment: [
    {
      id: "equip-001",
      name: "Main Engine Port",
      code: "SMS-ME-001",
      type: "engine",
      manufacturer: "MAN B&W",
      model: "8L48/60",
      serialNumber: "SN123456",
      criticality: "CRITICAL",
      location: { name: "Engine Room" },
      maintenanceSchedule: {
        intervalDays: 180,
        lastMaintenance: "2024-06-01",
        nextMaintenance: "2024-12-01"
      },
      specifications: {
        power: "8400 kW",
        rpm: "500",
        cylinders: "8"
      },
      qualityScore: 95,
      approvalDetails: {
        documentedBy: "John Technician",
        documentedAt: "2024-01-15T10:00:00Z",
        reviewedBy: "Sarah Manager",
        reviewedAt: "2024-01-16T14:00:00Z",
        approvedBy: "Mike Admin",
        approvedAt: "2024-01-17T09:00:00Z"
      },
      metadata: {}
    },
    {
      id: "equip-002",
      name: "Emergency Generator",
      code: "SMS-EG-001",
      type: "generator",
      manufacturer: "Caterpillar",
      model: "C32",
      serialNumber: "SN789012",
      criticality: "CRITICAL",
      location: { name: "Emergency Generator Room" },
      maintenanceSchedule: {
        intervalDays: 90,
        lastMaintenance: "2024-08-01",
        nextMaintenance: "2024-11-01"
      },
      specifications: {
        power: "1000 kW",
        voltage: "690V",
        frequency: "60Hz"
      },
      qualityScore: 98,
      approvalDetails: {
        documentedBy: "John Technician",
        documentedAt: "2024-01-15T11:00:00Z",
        reviewedBy: "Sarah Manager",
        reviewedAt: "2024-01-16T15:00:00Z",
        approvedBy: "Mike Admin",
        approvedAt: "2024-01-17T10:00:00Z"
      },
      metadata: {}
    },
    {
      id: "equip-003",
      name: "Deck Crane",
      code: "SMS-DC-001",
      type: "crane",
      manufacturer: "Liebherr",
      model: "RL-K4200",
      serialNumber: "SN345678",
      criticality: "IMPORTANT",
      location: { name: "Main Deck" },
      maintenanceSchedule: {
        intervalDays: 365,
        lastMaintenance: "2024-01-01",
        nextMaintenance: "2025-01-01"
      },
      specifications: {
        capacity: "150T",
        reach: "40m",
        type: "Knuckle Boom"
      },
      qualityScore: 92,
      approvalDetails: {
        documentedBy: "John Technician",
        documentedAt: "2024-01-15T12:00:00Z",
        reviewedBy: "Sarah Manager",
        reviewedAt: "2024-01-16T16:00:00Z",
        approvedBy: "Mike Admin",
        approvedAt: "2024-01-17T11:00:00Z"
      },
      metadata: {}
    }
  ],
  parts: [
    {
      id: "part-001",
      equipmentId: "equip-001",
      equipmentName: "Main Engine Port",
      name: "Fuel Injection Pump",
      partNumber: "FIP-8L48-001",
      manufacturer: "MAN B&W",
      description: "High pressure fuel injection pump for 8L48/60 engine",
      criticality: "CRITICAL",
      quantity: 8,
      unitOfMeasure: "pcs",
      minimumStock: 2,
      currentStock: 4,
      specifications: {},
      metadata: {}
    },
    {
      id: "part-002",
      equipmentId: "equip-001",
      equipmentName: "Main Engine Port",
      name: "Cylinder Head Gasket",
      partNumber: "CHG-8L48-001",
      manufacturer: "MAN B&W",
      description: "Cylinder head gasket set for 8L48/60 engine",
      criticality: "IMPORTANT",
      quantity: 8,
      unitOfMeasure: "sets",
      minimumStock: 1,
      currentStock: 2,
      specifications: {},
      metadata: {}
    },
    {
      id: "part-003",
      equipmentId: "equip-002",
      equipmentName: "Emergency Generator",
      name: "Air Filter Element",
      partNumber: "AF-C32-001",
      manufacturer: "Caterpillar",
      description: "Primary air filter element for C32 generator",
      criticality: "STANDARD",
      quantity: 2,
      unitOfMeasure: "pcs",
      minimumStock: 4,
      currentStock: 6,
      specifications: {},
      metadata: {}
    }
  ],
  documents: [], // Not including documents in test
  metadata: {
    exportId: "export-" + Date.now(),
    exportDate: new Date().toISOString(),
    exportedBy: "test-user-id",
    format: "json",
    includePhotos: false
  }
};

// Function to test the import
async function testImport() {
  try {
    console.log('🚀 Testing integration import endpoint...');
    console.log(`📦 Importing vessel: ${testData.vessel.name}`);
    console.log(`⚙️  Equipment items: ${testData.equipment.length}`);
    console.log(`🔧 Parts: ${testData.parts.length}`);
    
    // You would make an actual HTTP request here
    // For now, just log the test data
    console.log('\n📋 Test data structure:');
    console.log(JSON.stringify(testData, null, 2));
    
    console.log('\n✅ Test data generated successfully!');
    console.log('\nTo test the actual endpoint, make a POST request to:');
    console.log('POST http://localhost:3001/api/integration/import/vessel');
    console.log('With Authorization header and the above JSON body');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testImport();