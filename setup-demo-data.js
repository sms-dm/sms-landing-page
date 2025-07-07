#!/usr/bin/env node

/**
 * SMS Demo Data Setup Script
 * This script creates comprehensive demo data across both portals
 * with proper integration and authentication bridge support
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Demo company and user details
const DEMO_COMPANY = {
  name: 'Demo Marine Services',
  code: 'DMS',
  email: 'demo@demomarineservices.com',
  phone: '+1-555-DEMO-001',
  address: '123 Demo Harbor, Demo Port, DP 54321'
};

const DEMO_USERS = [
  {
    email: 'admin@demo.com',
    password: 'Demo123!',
    firstName: 'Demo',
    lastName: 'Admin',
    role: 'ADMIN',
    phone: '+1-555-100-1001'
  },
  {
    email: 'manager@demo.com',
    password: 'Demo123!',
    firstName: 'Demo',
    lastName: 'Manager',
    role: 'MANAGER',
    phone: '+1-555-100-1002'
  },
  {
    email: 'tech@demo.com',
    password: 'Demo123!',
    firstName: 'Demo',
    lastName: 'Technician',
    role: 'TECHNICIAN',
    phone: '+1-555-100-1003'
  }
];

const DEMO_VESSEL = {
  name: 'MV Demo Explorer',
  imoNumber: '1234567',
  vesselType: 'Container Ship',
  flag: 'United States',
  grossTonnage: 50000,
  yearBuilt: 2022,
  classSociety: 'ABS'
};

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function setupOnboardingPortalData() {
  console.log('\n=== Setting up Onboarding Portal Demo Data ===\n');
  
  // Create a custom seed script for demo data
  const seedScript = `
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating demo data for Onboarding Portal...');
  
  // Delete existing demo company if exists
  await prisma.company.deleteMany({
    where: { code: '${DEMO_COMPANY.code}' }
  });
  
  // Create demo company
  const company = await prisma.company.create({
    data: {
      name: '${DEMO_COMPANY.name}',
      code: '${DEMO_COMPANY.code}',
      address: '${DEMO_COMPANY.address}',
      contactEmail: '${DEMO_COMPANY.email}',
      contactPhone: '${DEMO_COMPANY.phone}',
      timezone: 'America/New_York',
      settings: JSON.stringify({
        allowOfflineSync: true,
        autoApprovalEnabled: false,
        qualityScoreThreshold: 80,
      }),
    },
  });
  
  console.log('Created demo company:', company.name);
  
  // Create demo users
  const users = [];
  ${DEMO_USERS.map(user => `
  const ${user.role.toLowerCase()}Password = await bcrypt.hash('${user.password}', 10);
  const ${user.role.toLowerCase()}User = await prisma.user.create({
    data: {
      companyId: company.id,
      email: '${user.email}',
      passwordHash: ${user.role.toLowerCase()}Password,
      firstName: '${user.firstName}',
      lastName: '${user.lastName}',
      role: '${user.role}',
      phone: '${user.phone}',
      settings: JSON.stringify({
        notifications: true,
        dashboardLayout: 'grid',
      }),
    },
  });
  users.push(${user.role.toLowerCase()}User);
  console.log('Created ${user.role} user:', ${user.role.toLowerCase()}User.email);
  `).join('')}
  
  // Create demo vessel
  const vessel = await prisma.vessel.create({
    data: {
      companyId: company.id,
      name: '${DEMO_VESSEL.name}',
      imoNumber: '${DEMO_VESSEL.imoNumber}',
      vesselType: '${DEMO_VESSEL.vesselType}',
      flag: '${DEMO_VESSEL.flag}',
      grossTonnage: ${DEMO_VESSEL.grossTonnage},
      yearBuilt: ${DEMO_VESSEL.yearBuilt},
      classSociety: '${DEMO_VESSEL.classSociety}',
      metadata: JSON.stringify({
        mainEngine: 'MAN B&W 7S80ME-C',
        auxiliaryEngines: 4,
        crewCapacity: 30,
      }),
    },
  });
  
  console.log('Created demo vessel:', vessel.name);
  
  // Create locations
  const engineRoom = await prisma.location.create({
    data: {
      vesselId: vessel.id,
      name: 'Engine Room',
      code: 'ER',
      level: 0,
      path: '/ER',
      description: 'Main engine room containing propulsion and auxiliary machinery',
    },
  });
  
  const bridge = await prisma.location.create({
    data: {
      vesselId: vessel.id,
      name: 'Bridge',
      code: 'BR',
      level: 0,
      path: '/BR',
      description: 'Navigation bridge and control center',
    },
  });
  
  // Create equipment
  const mainEngine = await prisma.equipment.create({
    data: {
      vesselId: vessel.id,
      locationId: engineRoom.id,
      name: 'Main Engine',
      code: 'ME-001',
      equipmentType: 'Propulsion Engine',
      manufacturer: 'MAN B&W',
      model: '7S80ME-C',
      serialNumber: 'DEMO-ME-001',
      criticality: 'CRITICAL',
      status: 'APPROVED',
      installationDate: new Date('2022-01-15'),
      specifications: JSON.stringify({
        power: '25,480 kW',
        rpm: 78,
        cylinders: 7,
        fuelType: 'HFO/MDO',
      }),
      maintenanceIntervalDays: 180,
      lastMaintenanceDate: new Date('2024-10-01'),
      nextMaintenanceDate: new Date('2025-04-01'),
      qualityScore: 95,
      documentedBy: technicianUser.id,
      reviewedBy: managerUser.id,
      approvedBy: managerUser.id,
      documentedAt: new Date('2024-11-01'),
      reviewedAt: new Date('2024-11-02'),
      approvedAt: new Date('2024-11-03'),
      notes: 'Demo main engine - fully operational',
    },
  });
  
  const auxEngine = await prisma.equipment.create({
    data: {
      vesselId: vessel.id,
      locationId: engineRoom.id,
      name: 'Auxiliary Engine #1',
      code: 'AE-001',
      equipmentType: 'Generator Engine',
      manufacturer: 'Caterpillar',
      model: 'C32',
      serialNumber: 'DEMO-AE-001',
      criticality: 'CRITICAL',
      status: 'APPROVED',
      installationDate: new Date('2022-01-20'),
      specifications: JSON.stringify({
        power: '940 kW',
        rpm: 1800,
        voltage: '440V',
        frequency: '60Hz',
      }),
      maintenanceIntervalDays: 90,
      qualityScore: 92,
      documentedBy: technicianUser.id,
      reviewedBy: managerUser.id,
      approvedBy: managerUser.id,
      documentedAt: new Date('2024-11-01'),
      reviewedAt: new Date('2024-11-02'),
      approvedAt: new Date('2024-11-03'),
    },
  });
  
  const radar = await prisma.equipment.create({
    data: {
      vesselId: vessel.id,
      locationId: bridge.id,
      name: 'Navigation Radar',
      code: 'NAV-001',
      equipmentType: 'Navigation Equipment',
      manufacturer: 'Furuno',
      model: 'FAR-2228',
      serialNumber: 'DEMO-NAV-001',
      criticality: 'CRITICAL',
      status: 'APPROVED',
      installationDate: new Date('2022-02-01'),
      specifications: JSON.stringify({
        frequency: 'X-Band (9GHz)',
        range: '96 NM',
        display: '28.1 inch LCD',
      }),
      qualityScore: 90,
      documentedBy: technicianUser.id,
      reviewedBy: managerUser.id,
      approvedBy: managerUser.id,
      documentedAt: new Date('2024-11-01'),
      reviewedAt: new Date('2024-11-02'),
      approvedAt: new Date('2024-11-03'),
    },
  });
  
  console.log('Created demo equipment');
  
  // Create onboarding token
  const token = await prisma.onboardingToken.create({
    data: {
      vesselId: vessel.id,
      token: 'DEMO-TOKEN-2025',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      maxUses: 100,
      createdBy: adminUser.id,
      metadata: JSON.stringify({
        purpose: 'Demo vessel access',
        allowedRoles: ['TECHNICIAN', 'MANAGER', 'ADMIN'],
      }),
    },
  });
  
  console.log('Created demo onboarding token:', token.token);
  
  console.log('\\nDemo data created successfully!');
  
  return {
    company,
    users: { adminUser, managerUser, technicianUser },
    vessel,
    equipment: { mainEngine, auxEngine, radar },
    token
  };
}

main()
  .catch((e) => {
    console.error('Error creating demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

  // Write the seed script
  const seedPath = path.join(__dirname, 'SMS-Onboarding-Unified', 'prisma', 'seed-demo.ts');
  fs.writeFileSync(seedPath, seedScript);
  
  // Run the seed script
  try {
    process.chdir(path.join(__dirname, 'SMS-Onboarding-Unified'));
    execSync('npx tsx prisma/seed-demo.ts', { stdio: 'inherit' });
    console.log('\n✅ Onboarding Portal demo data created successfully');
  } catch (error) {
    console.error('❌ Error setting up Onboarding Portal data:', error.message);
    throw error;
  } finally {
    // Clean up
    fs.unlinkSync(seedPath);
  }
}

async function setupMaintenancePortalData() {
  console.log('\n=== Setting up Maintenance Portal Demo Data ===\n');
  
  // Create SQL script for SQLite
  const sqlScript = `
-- Delete existing demo company if exists
DELETE FROM companies WHERE name = '${DEMO_COMPANY.name}';

-- Create demo company
INSERT INTO companies (name, subscription_type, max_vessels, max_users, is_active, contact_email, contact_phone, address)
VALUES ('${DEMO_COMPANY.name}', 'premium', 10, 100, 1, '${DEMO_COMPANY.email}', '${DEMO_COMPANY.phone}', '${DEMO_COMPANY.address}');

-- Get the company ID
SELECT last_insert_rowid() as company_id;

-- Create demo users (passwords are hashed for 'Demo123!')
${DEMO_USERS.map((user, index) => {
  const roleMapping = {
    'ADMIN': 'admin',
    'MANAGER': 'manager',
    'TECHNICIAN': 'technician'
  };
  const role = roleMapping[user.role] || user.role.toLowerCase();
  return `
INSERT INTO users (company_id, username, email, password_hash, role, first_name, last_name, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = '${DEMO_COMPANY.name}'),
  '${user.email.split('@')[0]}',
  '${user.email}',
  '$2a$10$eW5rCguGsJwUhfUuJDNtOO4KWGc9fPKDI8EQxPOV8lrJyKb8CQRJG', -- Demo123!
  '${role}',
  '${user.firstName}',
  '${user.lastName}',
  1
);`;
}).join('\n')}

-- Create demo vessel
INSERT INTO vessels (company_id, name, imo_number, flag, vessel_type, build_year, gross_tonnage, is_active)
VALUES (
  (SELECT id FROM companies WHERE name = '${DEMO_COMPANY.name}'),
  '${DEMO_VESSEL.name}',
  '${DEMO_VESSEL.imoNumber}',
  '${DEMO_VESSEL.flag}',
  '${DEMO_VESSEL.vesselType}',
  ${DEMO_VESSEL.yearBuilt},
  ${DEMO_VESSEL.grossTonnage},
  1
);

-- Create demo equipment
INSERT INTO equipment (vessel_id, name, description, manufacturer, model, serial_number, location, classification, status, criticality, installation_date, maintenance_interval_days)
VALUES 
(
  (SELECT id FROM vessels WHERE imo_number = '${DEMO_VESSEL.imoNumber}'),
  'Main Engine',
  'Main propulsion engine',
  'MAN B&W',
  '7S80ME-C',
  'DEMO-ME-001',
  'Engine Room',
  'PERMANENT',
  'operational',
  'critical',
  '2022-01-15',
  180
),
(
  (SELECT id FROM vessels WHERE imo_number = '${DEMO_VESSEL.imoNumber}'),
  'Auxiliary Engine #1',
  'Generator engine',
  'Caterpillar',
  'C32',
  'DEMO-AE-001',
  'Engine Room',
  'PERMANENT',
  'operational',
  'critical',
  '2022-01-20',
  90
),
(
  (SELECT id FROM vessels WHERE imo_number = '${DEMO_VESSEL.imoNumber}'),
  'Navigation Radar',
  'X-Band radar system',
  'Furuno',
  'FAR-2228',
  'DEMO-NAV-001',
  'Bridge',
  'PERMANENT',
  'operational',
  'critical',
  '2022-02-01',
  365
);
`;

  // Write and execute SQL script
  const sqlPath = path.join(__dirname, 'sms-app', 'backend', 'setup-demo-data.sql');
  fs.writeFileSync(sqlPath, sqlScript);
  
  try {
    process.chdir(path.join(__dirname, 'sms-app', 'backend'));
    
    // Use SQLite to execute the script
    const dbPath = path.join(__dirname, 'sms-app', 'backend', 'data', 'sms.db');
    execSync(`sqlite3 ${dbPath} < setup-demo-data.sql`, { stdio: 'inherit' });
    
    console.log('\n✅ Maintenance Portal demo data created successfully');
  } catch (error) {
    console.error('❌ Error setting up Maintenance Portal data:', error.message);
    throw error;
  } finally {
    // Clean up
    fs.unlinkSync(sqlPath);
  }
}

async function createIntegrationBridge() {
  console.log('\n=== Setting up Integration Bridge ===\n');
  
  // Create a bridge configuration file
  const bridgeConfig = {
    demo_accounts: DEMO_USERS.map(user => ({
      email: user.email,
      password: user.password,
      role: user.role,
      access: 'both_portals'
    })),
    vessel_mapping: {
      onboarding_imo: DEMO_VESSEL.imoNumber,
      maintenance_imo: DEMO_VESSEL.imoNumber,
      name: DEMO_VESSEL.name
    },
    sync_enabled: true,
    last_sync: new Date().toISOString()
  };
  
  const configPath = path.join(__dirname, 'demo-bridge-config.json');
  fs.writeFileSync(configPath, JSON.stringify(bridgeConfig, null, 2));
  
  console.log('✅ Integration bridge configuration created');
  console.log(`   Config saved to: ${configPath}`);
}

async function printAccessInformation() {
  console.log('\n' + '='.repeat(60));
  console.log('🎉 DEMO DATA SETUP COMPLETE! 🎉');
  console.log('='.repeat(60));
  
  console.log('\n📋 Demo Company Details:');
  console.log(`   Name: ${DEMO_COMPANY.name}`);
  console.log(`   Code: ${DEMO_COMPANY.code}`);
  console.log(`   Email: ${DEMO_COMPANY.email}`);
  
  console.log('\n👥 Demo User Credentials:');
  DEMO_USERS.forEach(user => {
    console.log(`   ${user.role}:`);
    console.log(`     Email: ${user.email}`);
    console.log(`     Password: ${user.password}`);
  });
  
  console.log('\n🚢 Demo Vessel:');
  console.log(`   Name: ${DEMO_VESSEL.name}`);
  console.log(`   IMO: ${DEMO_VESSEL.imoNumber}`);
  
  console.log('\n🔗 Portal URLs:');
  console.log('   Onboarding Portal: http://localhost:5173');
  console.log('   Maintenance Portal: http://localhost:3002');
  
  console.log('\n📝 Onboarding Token: DEMO-TOKEN-2025');
  
  console.log('\n✨ Features Available:');
  console.log('   - Login with any demo account');
  console.log('   - Switch between portals using auth bridge');
  console.log('   - View/edit vessel and equipment data');
  console.log('   - Test complete workflows');
  
  console.log('\n⚡ Quick Start:');
  console.log('   1. Run: ./start-all.sh');
  console.log('   2. Open: http://localhost:5173');
  console.log('   3. Login with: admin@demo.com / Demo123!');
  console.log('   4. Navigate to vessel dashboard');
  console.log('   5. Click "Switch to Maintenance Portal"');
  
  console.log('\n' + '='.repeat(60));
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting SMS Demo Data Setup...');
    
    // Check if services are running
    console.log('\n📍 Checking service status...');
    try {
      execSync('curl -s http://localhost:5173 > /dev/null 2>&1');
      console.log('   ✅ Onboarding Portal is running');
    } catch (e) {
      console.log('   ⚠️  Onboarding Portal is not running - please start it first');
    }
    
    try {
      execSync('curl -s http://localhost:3002 > /dev/null 2>&1');
      console.log('   ✅ Maintenance Portal is running');
    } catch (e) {
      console.log('   ⚠️  Maintenance Portal is not running - please start it first');
    }
    
    // Setup data in both portals
    await setupOnboardingPortalData();
    await setupMaintenancePortalData();
    await createIntegrationBridge();
    
    // Print access information
    await printAccessInformation();
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
main();