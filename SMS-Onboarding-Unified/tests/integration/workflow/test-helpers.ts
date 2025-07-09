/**
 * Test Helper Functions for Onboarding Workflow
 */

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface TestContext {
  api: AxiosInstance;
  users: {
    admin?: TestUser;
    manager?: TestUser;
    technician?: TestUser;
  };
  company?: TestCompany;
  vessel?: TestVessel;
  equipment: TestEquipment[];
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
  role: string;
  firstName: string;
  lastName: string;
}

export interface TestCompany {
  id: string;
  name: string;
  code: string;
}

export interface TestVessel {
  id: string;
  name: string;
  imo_number: string;
  company_id: string;
}

export interface TestEquipment {
  id: string;
  name: string;
  code: string;
  vessel_id: string;
  status: string;
}

/**
 * Create an authenticated API client
 */
export function createApiClient(baseURL: string = 'http://localhost:3000/api/v1'): AxiosInstance {
  return axios.create({
    baseURL,
    validateStatus: () => true,
    timeout: 30000,
  });
}

/**
 * Make authenticated request
 */
export async function authenticatedRequest(
  api: AxiosInstance,
  method: string,
  url: string,
  data?: any,
  token?: string
) {
  return api.request({
    method,
    url,
    data,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
}

/**
 * Login user and get token
 */
export async function loginUser(
  api: AxiosInstance,
  email: string,
  password: string
): Promise<TestUser> {
  const response = await api.post('/auth/login', { email, password });
  
  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.data.message}`);
  }
  
  return {
    id: response.data.user.id,
    email: response.data.user.email,
    password,
    token: response.data.token,
    role: response.data.user.role,
    firstName: response.data.user.firstName,
    lastName: response.data.user.lastName,
  };
}

/**
 * Create a test company
 */
export async function createTestCompany(
  api: AxiosInstance,
  token: string,
  companyData?: Partial<TestCompany>
): Promise<TestCompany> {
  const data = {
    name: companyData?.name || `Test Company ${Date.now()}`,
    code: companyData?.code || `TC${Date.now()}`,
    address: '123 Test Street, Test City',
    contact_email: 'contact@testcompany.com',
    contact_phone: '+1234567890',
    timezone: 'UTC',
  };

  const response = await authenticatedRequest(api, 'POST', '/companies', data, token);
  
  if (response.status !== 201) {
    throw new Error(`Failed to create company: ${response.data.message}`);
  }
  
  return response.data;
}

/**
 * Create a test vessel
 */
export async function createTestVessel(
  api: AxiosInstance,
  token: string,
  companyId: string,
  vesselData?: Partial<TestVessel>
): Promise<TestVessel> {
  const data = {
    company_id: companyId,
    name: vesselData?.name || `Test Vessel ${Date.now()}`,
    imo_number: vesselData?.imo_number || `IMO${Date.now()}`,
    vessel_type: 'Cargo Ship',
    flag: 'Panama',
    gross_tonnage: 50000,
    year_built: 2020,
    class_society: 'DNV GL',
  };

  const response = await authenticatedRequest(api, 'POST', '/vessels', data, token);
  
  if (response.status !== 201) {
    throw new Error(`Failed to create vessel: ${response.data.message}`);
  }
  
  return response.data;
}

/**
 * Create test equipment
 */
export async function createTestEquipment(
  api: AxiosInstance,
  token: string,
  vesselId: string,
  equipmentData: Partial<TestEquipment>
): Promise<TestEquipment> {
  const data = {
    vessel_id: vesselId,
    name: equipmentData.name || `Test Equipment ${Date.now()}`,
    code: equipmentData.code || `EQ${Date.now()}`,
    equipment_type: 'Generic',
    manufacturer: 'Test Manufacturer',
    model: 'Test Model',
    serial_number: `SN${Date.now()}`,
    criticality: 'STANDARD',
    status: equipmentData.status || 'DRAFT',
    ...equipmentData,
  };

  const response = await authenticatedRequest(api, 'POST', `/vessels/${vesselId}/equipment`, data, token);
  
  if (response.status !== 201) {
    throw new Error(`Failed to create equipment: ${response.data.message}`);
  }
  
  return response.data;
}

/**
 * Create a test user
 */
export async function createTestUser(
  api: AxiosInstance,
  adminToken: string,
  userData: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role: string;
    company_id: string;
  }
): Promise<TestUser> {
  const data = {
    email: userData.email || `user.${Date.now()}@testcompany.com`,
    password: userData.password || 'TestUser123!',
    firstName: userData.firstName || 'Test',
    lastName: userData.lastName || 'User',
    role: userData.role,
    company_id: userData.company_id,
  };

  const response = await authenticatedRequest(api, 'POST', '/users', data, adminToken);
  
  if (response.status !== 201) {
    throw new Error(`Failed to create user: ${response.data.message}`);
  }
  
  return {
    ...data,
    id: response.data.id,
    token: '', // Will be set on login
  };
}

/**
 * Wait for condition with timeout
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeout: number = 30000,
  interval: number = 1000
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Timeout waiting for condition');
}

/**
 * Generate test data
 */
export function generateTestData() {
  const timestamp = Date.now();
  
  return {
    company: {
      name: `Test Company ${timestamp}`,
      code: `TC${timestamp}`,
    },
    vessel: {
      name: `Test Vessel ${timestamp}`,
      imo_number: `IMO${timestamp}`,
    },
    equipment: [
      {
        name: 'Main Engine',
        code: 'ME-001',
        equipment_type: 'Engine',
        manufacturer: 'MAN B&W',
        model: '6S60MC-C',
        criticality: 'CRITICAL',
      },
      {
        name: 'Emergency Generator',
        code: 'EG-001',
        equipment_type: 'Generator',
        manufacturer: 'Caterpillar',
        model: 'C32',
        criticality: 'CRITICAL',
      },
      {
        name: 'Fire Pump',
        code: 'FP-001',
        equipment_type: 'Pump',
        manufacturer: 'Grundfos',
        model: 'NK 150-315',
        criticality: 'IMPORTANT',
      },
    ],
    parts: [
      {
        name: 'Fuel Injection Pump',
        part_number: 'FIP-12345',
        manufacturer: 'Bosch',
        criticality: 'CRITICAL',
      },
      {
        name: 'Cylinder Liner',
        part_number: 'CL-67890',
        manufacturer: 'MAN B&W',
        criticality: 'CRITICAL',
      },
    ],
  };
}

/**
 * Clean up test data
 */
export async function cleanupTestData(context: TestContext): Promise<void> {
  const { api, users, vessel } = context;
  
  if (vessel && users.admin?.token) {
    try {
      await authenticatedRequest(api, 'DELETE', `/vessels/${vessel.id}`, null, users.admin.token);
    } catch (error) {
      console.warn('Failed to cleanup vessel:', error);
    }
  }
}

/**
 * Verify workflow completion
 */
export async function verifyWorkflowCompletion(
  api: AxiosInstance,
  token: string,
  vesselId: string
): Promise<boolean> {
  const response = await authenticatedRequest(api, 'GET', `/vessels/${vesselId}/summary`, null, token);
  
  if (response.status !== 200) {
    return false;
  }
  
  const summary = response.data;
  return (
    summary.onboarding_status === 'COMPLETED' &&
    summary.approved_equipment_count > 0 &&
    summary.quality_score > 0
  );
}

/**
 * Export test results
 */
export async function exportTestResults(
  api: AxiosInstance,
  token: string,
  vesselId: string,
  format: 'json' | 'csv' | 'excel' = 'json'
): Promise<any> {
  const response = await authenticatedRequest(
    api,
    'POST',
    `/vessels/${vesselId}/export`,
    {
      format,
      include: ['equipment', 'parts', 'documents', 'quality_scores'],
    },
    token
  );
  
  if (response.status !== 200) {
    throw new Error(`Failed to export data: ${response.data.message}`);
  }
  
  return response.data;
}