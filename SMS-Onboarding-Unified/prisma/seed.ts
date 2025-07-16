// SMS Onboarding Portal - Database Seed Script
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create test company
  const company = await prisma.company.create({
    data: {
      name: 'Maritime Solutions Inc.',
      code: 'MSI',
      address: '123 Harbor Street, Port City, PC 12345',
      contactEmail: 'info@maritimesolutions.com',
      contactPhone: '+1-555-123-4567',
      timezone: 'America/New_York',
      settings: {
        allowOfflineSync: true,
        autoApprovalEnabled: false,
        qualityScoreThreshold: 80,
      },
    },
  });

  console.log('Created company:', company.name);

  // Create users with different roles
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const managerPassword = await bcrypt.hash('Manager123!', 10);
  const techPassword = await bcrypt.hash('Tech123!', 10);

  const adminUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'admin@maritimesolutions.com',
      passwordHash: adminPassword,
      firstName: 'John',
      lastName: 'Admin',
      role: 'ADMIN',
      phone: '+1-555-100-0001',
      settings: {
        notifications: true,
        dashboardLayout: 'grid',
      },
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'manager@maritimesolutions.com',
      passwordHash: managerPassword,
      firstName: 'Sarah',
      lastName: 'Manager',
      role: 'MANAGER',
      phone: '+1-555-100-0002',
      settings: {
        notifications: true,
        autoReviewEnabled: true,
      },
    },
  });

  const techUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'tech@maritimesolutions.com',
      passwordHash: techPassword,
      firstName: 'Mike',
      lastName: 'Technician',
      role: 'TECHNICIAN',
      phone: '+1-555-100-0003',
      settings: {
        offlineMode: true,
        cameraQuality: 'high',
      },
    },
  });

  console.log('Created users:', { adminUser: adminUser.email, managerUser: managerUser.email, techUser: techUser.email });

  // Create test vessels
  const vessel1 = await prisma.vessel.create({
    data: {
      companyId: company.id,
      name: 'MV Ocean Explorer',
      imoNumber: '9876543',
      vesselType: 'Container Ship',
      flag: 'United States',
      grossTonnage: 45000,
      yearBuilt: 2018,
      classSociety: 'ABS',
      metadata: {
        mainEngine: 'MAN B&W 7S80ME-C',
        auxiliaryEngines: 3,
        crewCapacity: 25,
      },
    },
  });

  const vessel2 = await prisma.vessel.create({
    data: {
      companyId: company.id,
      name: 'MV Cargo Master',
      imoNumber: '9876544',
      vesselType: 'Bulk Carrier',
      flag: 'Panama',
      grossTonnage: 38000,
      yearBuilt: 2020,
      classSociety: 'DNV',
      metadata: {
        mainEngine: 'Wartsila RT-flex96C',
        auxiliaryEngines: 4,
        crewCapacity: 22,
      },
    },
  });

  console.log('Created vessels:', vessel1.name, vessel2.name);

  // Create locations for vessel1
  const engineRoom = await prisma.location.create({
    data: {
      vesselId: vessel1.id,
      name: 'Engine Room',
      code: 'ER',
      level: 0,
      path: '/ER',
      description: 'Main engine room containing propulsion and auxiliary machinery',
      metadata: {
        deck: 'Lower',
        accessPoints: 2,
      },
    },
  });

  const mainEngineArea = await prisma.location.create({
    data: {
      vesselId: vessel1.id,
      parentId: engineRoom.id,
      name: 'Main Engine Area',
      code: 'ER-ME',
      level: 1,
      path: '/ER/ME',
      description: 'Area containing the main propulsion engine',
      sortOrder: 1,
    },
  });

  const auxEngineArea = await prisma.location.create({
    data: {
      vesselId: vessel1.id,
      parentId: engineRoom.id,
      name: 'Auxiliary Engine Area',
      code: 'ER-AE',
      level: 1,
      path: '/ER/AE',
      description: 'Area containing auxiliary engines and generators',
      sortOrder: 2,
    },
  });

  const bridge = await prisma.location.create({
    data: {
      vesselId: vessel1.id,
      name: 'Bridge',
      code: 'BR',
      level: 0,
      path: '/BR',
      description: 'Navigation bridge and control center',
      metadata: {
        deck: 'Navigation',
        equipment: ['Radar', 'ECDIS', 'Autopilot'],
      },
    },
  });

  console.log('Created locations for', vessel1.name);

  // Create equipment
  const mainEngine = await prisma.equipment.create({
    data: {
      vesselId: vessel1.id,
      locationId: mainEngineArea.id,
      name: 'Main Engine',
      code: 'ME-001',
      equipmentType: 'Propulsion Engine',
      manufacturer: 'MAN B&W',
      model: '7S80ME-C',
      serialNumber: 'MB7S80-2018-001',
      criticality: 'CRITICAL',
      status: 'DOCUMENTED',
      installationDate: new Date('2018-06-15'),
      warrantyExpiry: new Date('2023-06-15'),
      specifications: {
        power: '25,480 kW',
        rpm: 78,
        cylinders: 7,
        fuelType: 'HFO/MDO',
      },
      maintenanceIntervalDays: 180,
      lastMaintenanceDate: new Date('2024-10-01'),
      nextMaintenanceDate: new Date('2025-04-01'),
      qualityScore: 85,
      documentedBy: techUser.id,
      documentedAt: new Date('2024-11-15'),
      notes: 'Main propulsion engine in excellent condition',
    },
  });

  const auxEngine1 = await prisma.equipment.create({
    data: {
      vesselId: vessel1.id,
      locationId: auxEngineArea.id,
      name: 'Auxiliary Engine #1',
      code: 'AE-001',
      equipmentType: 'Generator Engine',
      manufacturer: 'Caterpillar',
      model: 'C32',
      serialNumber: 'CAT32-2018-AE1',
      criticality: 'CRITICAL',
      status: 'APPROVED',
      installationDate: new Date('2018-06-20'),
      specifications: {
        power: '940 kW',
        rpm: 1800,
        voltage: '440V',
        frequency: '60Hz',
      },
      maintenanceIntervalDays: 90,
      qualityScore: 92,
      documentedBy: techUser.id,
      reviewedBy: managerUser.id,
      approvedBy: managerUser.id,
      documentedAt: new Date('2024-11-16'),
      reviewedAt: new Date('2024-11-17'),
      approvedAt: new Date('2024-11-18'),
    },
  });

  const radar = await prisma.equipment.create({
    data: {
      vesselId: vessel1.id,
      locationId: bridge.id,
      name: 'X-Band Radar',
      code: 'NAV-RAD-001',
      equipmentType: 'Navigation Equipment',
      manufacturer: 'Furuno',
      model: 'FAR-2228',
      serialNumber: 'FUR2228-2018-001',
      criticality: 'CRITICAL',
      status: 'REVIEWED',
      installationDate: new Date('2018-07-01'),
      specifications: {
        frequency: 'X-Band (9GHz)',
        range: '96 NM',
        display: '28.1 inch LCD',
      },
      qualityScore: 88,
      documentedBy: techUser.id,
      reviewedBy: managerUser.id,
      documentedAt: new Date('2024-11-16'),
      reviewedAt: new Date('2024-11-17'),
    },
  });

  console.log('Created equipment');

  // Create critical parts
  const turbocharger = await prisma.criticalPart.create({
    data: {
      equipmentId: mainEngine.id,
      name: 'Turbocharger',
      partNumber: 'TCA88-100',
      manufacturer: 'ABB Turbo Systems',
      description: 'Main engine turbocharger unit',
      criticality: 'CRITICAL',
      quantity: 1,
      unitOfMeasure: 'Unit',
      minimumStock: 0,
      currentStock: 0,
      specifications: {
        model: 'TCA88-25',
        weight: '3,200 kg',
        maxRPM: 12000,
      },
    },
  });

  const fuelInjector = await prisma.criticalPart.create({
    data: {
      equipmentId: mainEngine.id,
      name: 'Fuel Injector',
      partNumber: 'FI-7S80-STD',
      manufacturer: 'MAN B&W',
      description: 'Standard fuel injector for 7S80ME-C engine',
      criticality: 'CRITICAL',
      quantity: 7,
      unitOfMeasure: 'Piece',
      minimumStock: 2,
      currentStock: 3,
      specifications: {
        pressure: '1,800 bar',
        nozzleType: 'Multi-hole',
      },
    },
  });

  const oilFilter = await prisma.criticalPart.create({
    data: {
      equipmentId: auxEngine1.id,
      name: 'Oil Filter',
      partNumber: 'OF-CAT32-001',
      manufacturer: 'Caterpillar',
      description: 'Engine oil filter for C32 generator',
      criticality: 'IMPORTANT',
      quantity: 1,
      unitOfMeasure: 'Piece',
      minimumStock: 4,
      currentStock: 6,
      specifications: {
        filtration: '10 micron',
        capacity: '45 liters',
      },
    },
  });

  console.log('Created critical parts');

  // Create parts cross-reference
  await prisma.partsCrossReference.create({
    data: {
      vesselId: vessel1.id,
      originalPartId: oilFilter.id,
      compatiblePartId: oilFilter.id, // In reality, this would be a different part
      compatibilityType: 'COMPATIBLE',
      notes: 'Can use Baldwin B7299 as substitute',
      verifiedBy: managerUser.id,
      verifiedAt: new Date(),
    },
  });

  // Create quality scores
  await prisma.qualityScore.createMany({
    data: [
      {
        equipmentId: mainEngine.id,
        metric: 'COMPLETENESS',
        score: 90,
        details: { fieldsCompleted: 18, totalFields: 20 },
        evaluatedBy: managerUser.id,
      },
      {
        equipmentId: mainEngine.id,
        metric: 'PHOTO_QUALITY',
        score: 85,
        details: { photosUploaded: 12, photosRequired: 10, averageResolution: 'HIGH' },
        evaluatedBy: managerUser.id,
      },
      {
        equipmentId: mainEngine.id,
        metric: 'DOCUMENTATION',
        score: 80,
        details: { manualsUploaded: true, certificatesUploaded: true },
        evaluatedBy: managerUser.id,
      },
    ],
  });

  console.log('Created quality scores');

  // Create onboarding token
  const token = await prisma.onboardingToken.create({
    data: {
      vesselId: vessel1.id,
      token: 'ONB-2024-' + Math.random().toString(36).substring(2, 15),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      maxUses: 5,
      createdBy: adminUser.id,
      metadata: {
        purpose: 'Initial vessel onboarding',
        allowedRoles: ['TECHNICIAN', 'MANAGER'],
      },
    },
  });

  console.log('Created onboarding token:', token.token);

  // Create sample documents
  await prisma.document.createMany({
    data: [
      {
        vesselId: vessel1.id,
        equipmentId: mainEngine.id,
        documentType: 'IMAGE',
        name: 'Main Engine Overview',
        description: 'General view of the main engine from starboard side',
        filePath: 's3://sms-onboarding/vessels/9876543/equipment/ME-001/images/overview.jpg',
        fileSize: BigInt(2458000),
        mimeType: 'image/jpeg',
        thumbnailPath: 's3://sms-onboarding/vessels/9876543/equipment/ME-001/thumbnails/overview_thumb.jpg',
        uploadedBy: techUser.id,
      },
      {
        vesselId: vessel1.id,
        equipmentId: mainEngine.id,
        documentType: 'MANUAL',
        name: 'Operation Manual',
        description: 'MAN B&W 7S80ME-C Operation Manual',
        filePath: 's3://sms-onboarding/vessels/9876543/equipment/ME-001/manuals/operation_manual.pdf',
        fileSize: BigInt(15600000),
        mimeType: 'application/pdf',
        uploadedBy: techUser.id,
      },
      {
        vesselId: vessel1.id,
        equipmentId: radar.id,
        documentType: 'CERTIFICATE',
        name: 'Type Approval Certificate',
        description: 'Furuno FAR-2228 Type Approval Certificate',
        filePath: 's3://sms-onboarding/vessels/9876543/equipment/NAV-RAD-001/certificates/type_approval.pdf',
        fileSize: BigInt(850000),
        mimeType: 'application/pdf',
        uploadedBy: techUser.id,
      },
    ],
  });

  console.log('Created sample documents');

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: managerUser.id,
        type: 'EQUIPMENT_DOCUMENTED',
        title: 'Equipment Ready for Review',
        message: 'Main Engine has been documented and is ready for review',
        data: { equipmentId: mainEngine.id, vesselId: vessel1.id },
      },
      {
        userId: adminUser.id,
        type: 'QUALITY_ALERT',
        title: 'Low Quality Score Alert',
        message: 'Equipment documentation quality below threshold',
        data: { threshold: 80, currentScore: 75 },
      },
    ],
  });

  console.log('Created notifications');

  console.log('Database seed completed successfully!');
  console.log('\nTest credentials:');
  console.log('Admin: admin@maritimesolutions.com / Admin123!');
  console.log('Manager: manager@maritimesolutions.com / Manager123!');
  console.log('Technician: tech@maritimesolutions.com / Tech123!');
  console.log('\nOnboarding Token:', token.token);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });