/**
 * Complete Onboarding Workflow Integration Test
 * 
 * This test suite covers the full end-to-end onboarding workflow:
 * 1. Admin creates company and vessels
 * 2. Manager assigns technicians
 * 3. Technician completes onboarding
 * 4. Manager reviews and approves
 * 5. Data exports correctly
 */

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const TEST_TIMEOUT = 60000; // 60 seconds

interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface TestCompany {
  id: string;
  name: string;
  code: string;
}

interface TestVessel {
  id: string;
  name: string;
  imo_number: string;
  company_id: string;
}

interface TestEquipment {
  id: string;
  name: string;
  code: string;
  vessel_id: string;
  status: string;
}

describe('Complete Onboarding Workflow', () => {
  let api: AxiosInstance;
  let adminUser: TestUser;
  let managerUser: TestUser;
  let technicianUser: TestUser;
  let testCompany: TestCompany;
  let testVessel: TestVessel;
  let testEquipment: TestEquipment[] = [];
  let onboardingToken: string;

  beforeAll(() => {
    api = axios.create({
      baseURL: API_BASE_URL,
      validateStatus: () => true, // Don't throw on any status
      timeout: 30000,
    });
  });

  // Utility function to make authenticated requests
  const authenticatedRequest = async (method: string, url: string, data?: any, token?: string) => {
    return api.request({
      method,
      url,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  describe('Step 1: Admin Setup', () => {
    test('Admin logs in', async () => {
      const response = await api.post('/auth/login', {
        email: 'admin@demo.com',
        password: 'Demo123!',
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      
      adminUser = {
        id: response.data.user.id,
        email: response.data.user.email,
        password: 'Demo123!',
        token: response.data.token,
        role: response.data.user.role,
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName,
      };
    });

    test('Admin creates a new company', async () => {
      const companyData = {
        name: `Test Company ${Date.now()}`,
        code: `TC${Date.now()}`,
        address: '123 Test Street, Test City',
        contact_email: 'contact@testcompany.com',
        contact_phone: '+1234567890',
        timezone: 'UTC',
      };

      const response = await authenticatedRequest('POST', '/companies', companyData, adminUser.token);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(companyData.name);
      
      testCompany = response.data;
    });

    test('Admin creates a vessel for the company', async () => {
      const vesselData = {
        company_id: testCompany.id,
        name: `Test Vessel ${Date.now()}`,
        imo_number: `IMO${Date.now()}`,
        vessel_type: 'Cargo Ship',
        flag: 'Panama',
        gross_tonnage: 50000,
        year_built: 2020,
        class_society: 'DNV GL',
      };

      const response = await authenticatedRequest('POST', '/vessels', vesselData, adminUser.token);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(vesselData.name);
      
      testVessel = response.data;
    });

    test('Admin creates vessel locations', async () => {
      const locations = [
        { name: 'Engine Room', code: 'ER', level: 0 },
        { name: 'Bridge', code: 'BR', level: 0 },
        { name: 'Cargo Hold 1', code: 'CH1', level: 0 },
      ];

      for (const location of locations) {
        const response = await authenticatedRequest(
          'POST',
          `/vessels/${testVessel.id}/locations`,
          location,
          adminUser.token
        );

        expect(response.status).toBe(201);
      }
    });

    test('Admin generates onboarding token', async () => {
      const tokenData = {
        vessel_id: testVessel.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        max_uses: 10,
      };

      const response = await authenticatedRequest('POST', '/tokens/onboarding', tokenData, adminUser.token);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('token');
      
      onboardingToken = response.data.token;
    });
  });

  describe('Step 2: Manager Setup', () => {
    test('Create manager user', async () => {
      const managerData = {
        email: `manager.${Date.now()}@testcompany.com`,
        password: 'Manager123!',
        firstName: 'Test',
        lastName: 'Manager',
        role: 'MANAGER',
        company_id: testCompany.id,
      };

      const response = await authenticatedRequest('POST', '/users', managerData, adminUser.token);

      expect(response.status).toBe(201);
      
      managerUser = {
        ...managerData,
        id: response.data.id,
        token: '', // Will be set on login
      };
    });

    test('Manager logs in', async () => {
      const response = await api.post('/auth/login', {
        email: managerUser.email,
        password: managerUser.password,
      });

      expect(response.status).toBe(200);
      managerUser.token = response.data.token;
    });

    test('Manager assigns technician to vessel', async () => {
      // First create technician user
      const technicianData = {
        email: `technician.${Date.now()}@testcompany.com`,
        password: 'Technician123!',
        firstName: 'Test',
        lastName: 'Technician',
        role: 'TECHNICIAN',
        company_id: testCompany.id,
      };

      const createResponse = await authenticatedRequest('POST', '/users', technicianData, adminUser.token);
      expect(createResponse.status).toBe(201);
      
      technicianUser = {
        ...technicianData,
        id: createResponse.data.id,
        token: '', // Will be set on login
      };

      // Manager assigns technician to vessel
      const assignmentData = {
        user_id: technicianUser.id,
        vessel_id: testVessel.id,
        role: 'TECHNICIAN',
      };

      const assignResponse = await authenticatedRequest(
        'POST',
        `/vessels/${testVessel.id}/assignments`,
        assignmentData,
        managerUser.token
      );

      expect(assignResponse.status).toBe(201);
    });
  });

  describe('Step 3: Technician Onboarding', () => {
    test('Technician logs in', async () => {
      const response = await api.post('/auth/login', {
        email: technicianUser.email,
        password: technicianUser.password,
      });

      expect(response.status).toBe(200);
      technicianUser.token = response.data.token;
    });

    test('Technician validates onboarding token', async () => {
      const response = await authenticatedRequest(
        'POST',
        '/tokens/validate',
        { token: onboardingToken },
        technicianUser.token
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('vessel');
      expect(response.data.vessel.id).toBe(testVessel.id);
    });

    test('Technician documents equipment', async () => {
      const equipmentList = [
        {
          name: 'Main Engine',
          code: 'ME-001',
          equipment_type: 'Engine',
          manufacturer: 'MAN B&W',
          model: '6S60MC-C',
          serial_number: 'SN123456',
          criticality: 'CRITICAL',
          location_id: null, // Would be set from actual location
        },
        {
          name: 'Emergency Generator',
          code: 'EG-001',
          equipment_type: 'Generator',
          manufacturer: 'Caterpillar',
          model: 'C32',
          serial_number: 'SN789012',
          criticality: 'CRITICAL',
          location_id: null,
        },
        {
          name: 'Fire Pump',
          code: 'FP-001',
          equipment_type: 'Pump',
          manufacturer: 'Grundfos',
          model: 'NK 150-315',
          serial_number: 'SN345678',
          criticality: 'IMPORTANT',
          location_id: null,
        },
      ];

      for (const equipment of equipmentList) {
        const response = await authenticatedRequest(
          'POST',
          `/vessels/${testVessel.id}/equipment`,
          {
            ...equipment,
            vessel_id: testVessel.id,
            status: 'DOCUMENTED',
            documented_by: technicianUser.id,
            documented_at: new Date().toISOString(),
            quality_score: 85,
          },
          technicianUser.token
        );

        expect(response.status).toBe(201);
        testEquipment.push(response.data);
      }
    });

    test('Technician adds critical parts', async () => {
      const mainEngine = testEquipment.find(e => e.code === 'ME-001');
      expect(mainEngine).toBeDefined();

      const criticalParts = [
        {
          equipment_id: mainEngine!.id,
          name: 'Fuel Injection Pump',
          part_number: 'FIP-12345',
          manufacturer: 'Bosch',
          criticality: 'CRITICAL',
          quantity: 6,
          unit_of_measure: 'pcs',
          minimum_stock: 2,
        },
        {
          equipment_id: mainEngine!.id,
          name: 'Cylinder Liner',
          part_number: 'CL-67890',
          manufacturer: 'MAN B&W',
          criticality: 'CRITICAL',
          quantity: 6,
          unit_of_measure: 'pcs',
          minimum_stock: 1,
        },
      ];

      for (const part of criticalParts) {
        const response = await authenticatedRequest(
          'POST',
          `/equipment/${mainEngine!.id}/parts`,
          part,
          technicianUser.token
        );

        expect(response.status).toBe(201);
      }
    });

    test('Technician uploads documentation photos', async () => {
      // Note: This would normally upload actual files
      // For testing, we'll simulate the upload endpoint
      const mainEngine = testEquipment.find(e => e.code === 'ME-001');
      
      const documentData = {
        equipment_id: mainEngine!.id,
        document_type: 'IMAGE',
        name: 'Main Engine Overview',
        description: 'Front view of main engine',
        file_path: 's3://test-bucket/equipment/ME-001/overview.jpg',
        file_size: 2048000,
        mime_type: 'image/jpeg',
      };

      const response = await authenticatedRequest(
        'POST',
        `/equipment/${mainEngine!.id}/documents`,
        documentData,
        technicianUser.token
      );

      expect(response.status).toBe(201);
    });

    test('Technician submits equipment for review', async () => {
      for (const equipment of testEquipment) {
        const response = await authenticatedRequest(
          'PATCH',
          `/equipment/${equipment.id}/status`,
          { status: 'REVIEWED' },
          technicianUser.token
        );

        expect(response.status).toBe(200);
      }
    });
  });

  describe('Step 4: Manager Review and Approval', () => {
    test('Manager retrieves equipment for review', async () => {
      const response = await authenticatedRequest(
        'GET',
        `/vessels/${testVessel.id}/equipment?status=REVIEWED`,
        null,
        managerUser.token
      );

      expect(response.status).toBe(200);
      expect(response.data.items).toHaveLength(testEquipment.length);
    });

    test('Manager reviews quality scores', async () => {
      for (const equipment of testEquipment) {
        const qualityMetrics = [
          { metric: 'COMPLETENESS', score: 90 },
          { metric: 'ACCURACY', score: 85 },
          { metric: 'PHOTO_QUALITY', score: 80 },
          { metric: 'DOCUMENTATION', score: 95 },
          { metric: 'COMPLIANCE', score: 88 },
        ];

        for (const metric of qualityMetrics) {
          const response = await authenticatedRequest(
            'POST',
            `/equipment/${equipment.id}/quality-scores`,
            {
              ...metric,
              evaluated_by: managerUser.id,
              details: { comment: 'Good documentation' },
            },
            managerUser.token
          );

          expect(response.status).toBe(201);
        }
      }
    });

    test('Manager approves equipment', async () => {
      for (const equipment of testEquipment) {
        const response = await authenticatedRequest(
          'PATCH',
          `/equipment/${equipment.id}/approve`,
          {
            status: 'APPROVED',
            notes: 'Equipment documentation meets all requirements',
          },
          managerUser.token
        );

        expect(response.status).toBe(200);
        expect(response.data.status).toBe('APPROVED');
        expect(response.data.approved_by).toBe(managerUser.id);
      }
    });

    test('Manager generates quality report', async () => {
      const response = await authenticatedRequest(
        'GET',
        `/vessels/${testVessel.id}/reports/quality`,
        null,
        managerUser.token
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('vessel_id');
      expect(response.data).toHaveProperty('total_equipment');
      expect(response.data).toHaveProperty('approved_equipment');
      expect(response.data).toHaveProperty('average_quality_score');
    });
  });

  describe('Step 5: Data Export', () => {
    test('Manager exports vessel data', async () => {
      const exportFormats = ['json', 'csv', 'excel'];

      for (const format of exportFormats) {
        const response = await authenticatedRequest(
          'POST',
          `/vessels/${testVessel.id}/export`,
          {
            format,
            include: ['equipment', 'parts', 'documents', 'quality_scores'],
          },
          managerUser.token
        );

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('export_url');
        expect(response.data).toHaveProperty('expires_at');
      }
    });

    test('Manager exports compliance report', async () => {
      const response = await authenticatedRequest(
        'GET',
        `/vessels/${testVessel.id}/reports/compliance`,
        null,
        managerUser.token
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('vessel');
      expect(response.data).toHaveProperty('compliance_status');
      expect(response.data).toHaveProperty('critical_equipment_documented');
      expect(response.data).toHaveProperty('documentation_completeness');
    });

    test('Manager retrieves audit trail', async () => {
      const response = await authenticatedRequest(
        'GET',
        `/vessels/${testVessel.id}/audit-logs`,
        null,
        managerUser.token
      );

      expect(response.status).toBe(200);
      expect(response.data.items).toBeDefined();
      expect(response.data.items.length).toBeGreaterThan(0);
      
      // Verify audit log contains key actions
      const actions = response.data.items.map((log: any) => log.action);
      expect(actions).toContain('CREATE');
      expect(actions).toContain('UPDATE');
    });
  });

  describe('Workflow Validation', () => {
    test('Verify complete workflow data integrity', async () => {
      // Get vessel summary
      const summaryResponse = await authenticatedRequest(
        'GET',
        `/vessels/${testVessel.id}/summary`,
        null,
        adminUser.token
      );

      expect(summaryResponse.status).toBe(200);
      
      const summary = summaryResponse.data;
      expect(summary.equipment_count).toBe(testEquipment.length);
      expect(summary.approved_equipment_count).toBe(testEquipment.length);
      expect(summary.onboarding_status).toBe('COMPLETED');
      expect(summary.quality_score).toBeGreaterThan(80);
    });

    test('Verify offline sync capability', async () => {
      // Simulate offline data sync
      const syncData = {
        device_id: 'test-device-001',
        operations: [
          {
            entity_type: 'equipment',
            entity_id: testEquipment[0].id,
            operation: 'UPDATE',
            data: { notes: 'Updated offline' },
            client_timestamp: new Date().toISOString(),
          },
        ],
      };

      const response = await authenticatedRequest(
        'POST',
        '/sync/offline',
        syncData,
        technicianUser.token
      );

      expect(response.status).toBe(200);
      expect(response.data.synced).toBe(1);
      expect(response.data.failed).toBe(0);
    });

    test('Verify parts intelligence cross-reference', async () => {
      const response = await authenticatedRequest(
        'GET',
        `/vessels/${testVessel.id}/parts/intelligence`,
        null,
        managerUser.token
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('parts');
      expect(response.data).toHaveProperty('cross_references');
      expect(response.data).toHaveProperty('usage_statistics');
    });
  });

  describe('Cleanup', () => {
    test('Cleanup test data', async () => {
      // Note: In a real environment, you might want to keep test data
      // or have a separate cleanup process
      
      // Delete vessel (cascades to equipment, parts, etc.)
      const deleteResponse = await authenticatedRequest(
        'DELETE',
        `/vessels/${testVessel.id}`,
        null,
        adminUser.token
      );

      expect([200, 204]).toContain(deleteResponse.status);
    });
  });
}, TEST_TIMEOUT);