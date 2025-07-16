#!/usr/bin/env node

/**
 * End-to-End Test Script for SMS Onboarding Workflow
 * 
 * This script tests the complete workflow:
 * 1. Admin creates company and vessel
 * 2. Manager assigns technician
 * 3. Technician completes onboarding
 * 4. Manager reviews and approves
 * 5. Data export works
 * 
 * Usage: node test-e2e-workflow.js
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const TEST_TIMEOUT = 60000; // 60 seconds

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  issues: [],
  startTime: new Date(),
  endTime: null,
  logs: []
};

// Utility function to log with timestamp
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(logEntry);
  testResults.logs.push(logEntry);
}

// Test data storage
const testData = {
  admin: null,
  manager: null,
  technician: null,
  company: null,
  vessel: null,
  equipment: [],
  onboardingToken: null,
  exportUrls: []
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  validateStatus: () => true // Don't throw on any status
});

// Authenticated request helper
async function makeRequest(method, url, data = null, token = null) {
  const config = {
    method,
    url,
    data,
    headers: {}
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await api.request(config);
    return response;
  } catch (error) {
    log(`Request failed: ${method} ${url} - ${error.message}`, 'error');
    throw error;
  }
}

// Test assertion helper
function assert(condition, testName, errorMessage) {
  if (condition) {
    testResults.passed++;
    log(`✅ PASSED: ${testName}`, 'success');
  } else {
    testResults.failed++;
    testResults.issues.push({
      test: testName,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
    log(`❌ FAILED: ${testName} - ${errorMessage}`, 'error');
  }
}

// Test Steps

async function testAdminLogin() {
  log('\n=== Step 1: Admin Setup ===', 'info');
  log('Testing admin login...', 'info');

  const response = await makeRequest('POST', '/auth/login', {
    email: 'admin@demo.com',
    password: 'Demo123!'
  });

  assert(
    response.status === 200,
    'Admin login',
    `Expected status 200, got ${response.status}. Response: ${JSON.stringify(response.data)}`
  );

  if (response.status === 200) {
    testData.admin = {
      id: response.data.user.id,
      email: response.data.user.email,
      token: response.data.token,
      role: response.data.user.role
    };
    log(`Admin logged in successfully: ${testData.admin.email}`, 'success');
  }

  return response.status === 200;
}

async function testCreateCompany() {
  log('\nTesting company creation...', 'info');

  const companyData = {
    name: `Test Company ${Date.now()}`,
    code: `TC${Date.now()}`,
    address: '123 Test Street, Test City',
    contact_email: 'contact@testcompany.com',
    contact_phone: '+1234567890',
    timezone: 'UTC'
  };

  const response = await makeRequest('POST', '/companies', companyData, testData.admin.token);

  assert(
    response.status === 201,
    'Create company',
    `Expected status 201, got ${response.status}. Response: ${JSON.stringify(response.data)}`
  );

  if (response.status === 201) {
    testData.company = response.data;
    log(`Company created: ${testData.company.name} (ID: ${testData.company.id})`, 'success');
  }

  return response.status === 201;
}

async function testCreateVessel() {
  log('\nTesting vessel creation...', 'info');

  const vesselData = {
    company_id: testData.company.id,
    name: `Test Vessel ${Date.now()}`,
    imo_number: `IMO${Date.now()}`,
    vessel_type: 'Cargo Ship',
    flag: 'Panama',
    gross_tonnage: 50000,
    year_built: 2020,
    class_society: 'DNV GL'
  };

  const response = await makeRequest('POST', '/vessels', vesselData, testData.admin.token);

  assert(
    response.status === 201,
    'Create vessel',
    `Expected status 201, got ${response.status}. Response: ${JSON.stringify(response.data)}`
  );

  if (response.status === 201) {
    testData.vessel = response.data;
    log(`Vessel created: ${testData.vessel.name} (ID: ${testData.vessel.id})`, 'success');
  }

  return response.status === 201;
}

async function testCreateVesselLocations() {
  log('\nTesting vessel location creation...', 'info');

  const locations = [
    { name: 'Engine Room', code: 'ER', level: 0 },
    { name: 'Bridge', code: 'BR', level: 0 },
    { name: 'Cargo Hold 1', code: 'CH1', level: 0 }
  ];

  let allSuccess = true;

  for (const location of locations) {
    const response = await makeRequest(
      'POST',
      `/vessels/${testData.vessel.id}/locations`,
      location,
      testData.admin.token
    );

    const success = response.status === 201;
    allSuccess = allSuccess && success;

    assert(
      success,
      `Create location: ${location.name}`,
      `Expected status 201, got ${response.status}`
    );
  }

  return allSuccess;
}

async function testGenerateOnboardingToken() {
  log('\nTesting onboarding token generation...', 'info');

  const tokenData = {
    vessel_id: testData.vessel.id,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    max_uses: 10
  };

  const response = await makeRequest('POST', '/tokens/onboarding', tokenData, testData.admin.token);

  assert(
    response.status === 201,
    'Generate onboarding token',
    `Expected status 201, got ${response.status}. Response: ${JSON.stringify(response.data)}`
  );

  if (response.status === 201) {
    testData.onboardingToken = response.data.token;
    log(`Onboarding token generated: ${testData.onboardingToken}`, 'success');
  }

  return response.status === 201;
}

async function testCreateManager() {
  log('\n=== Step 2: Manager Setup ===', 'info');
  log('Creating manager user...', 'info');

  const managerData = {
    email: `manager.${Date.now()}@testcompany.com`,
    password: 'Manager123!',
    firstName: 'Test',
    lastName: 'Manager',
    role: 'MANAGER',
    company_id: testData.company.id
  };

  const response = await makeRequest('POST', '/users', managerData, testData.admin.token);

  assert(
    response.status === 201,
    'Create manager user',
    `Expected status 201, got ${response.status}. Response: ${JSON.stringify(response.data)}`
  );

  if (response.status === 201) {
    testData.manager = {
      id: response.data.id,
      email: managerData.email,
      password: managerData.password,
      token: null
    };
    log(`Manager created: ${testData.manager.email}`, 'success');
  }

  return response.status === 201;
}

async function testManagerLogin() {
  log('\nTesting manager login...', 'info');

  const response = await makeRequest('POST', '/auth/login', {
    email: testData.manager.email,
    password: testData.manager.password
  });

  assert(
    response.status === 200,
    'Manager login',
    `Expected status 200, got ${response.status}`
  );

  if (response.status === 200) {
    testData.manager.token = response.data.token;
    log('Manager logged in successfully', 'success');
  }

  return response.status === 200;
}

async function testCreateTechnician() {
  log('\nCreating technician user...', 'info');

  const technicianData = {
    email: `technician.${Date.now()}@testcompany.com`,
    password: 'Technician123!',
    firstName: 'Test',
    lastName: 'Technician',
    role: 'TECHNICIAN',
    company_id: testData.company.id
  };

  const response = await makeRequest('POST', '/users', technicianData, testData.admin.token);

  assert(
    response.status === 201,
    'Create technician user',
    `Expected status 201, got ${response.status}`
  );

  if (response.status === 201) {
    testData.technician = {
      id: response.data.id,
      email: technicianData.email,
      password: technicianData.password,
      token: null
    };
    log(`Technician created: ${testData.technician.email}`, 'success');
  }

  return response.status === 201;
}

async function testAssignTechnician() {
  log('\nTesting technician assignment to vessel...', 'info');

  const assignmentData = {
    user_id: testData.technician.id,
    vessel_id: testData.vessel.id,
    role: 'TECHNICIAN'
  };

  const response = await makeRequest(
    'POST',
    `/vessels/${testData.vessel.id}/assignments`,
    assignmentData,
    testData.manager.token
  );

  assert(
    response.status === 201,
    'Assign technician to vessel',
    `Expected status 201, got ${response.status}`
  );

  return response.status === 201;
}

async function testTechnicianLogin() {
  log('\n=== Step 3: Technician Onboarding ===', 'info');
  log('Testing technician login...', 'info');

  const response = await makeRequest('POST', '/auth/login', {
    email: testData.technician.email,
    password: testData.technician.password
  });

  assert(
    response.status === 200,
    'Technician login',
    `Expected status 200, got ${response.status}`
  );

  if (response.status === 200) {
    testData.technician.token = response.data.token;
    log('Technician logged in successfully', 'success');
  }

  return response.status === 200;
}

async function testValidateOnboardingToken() {
  log('\nTesting onboarding token validation...', 'info');

  const response = await makeRequest(
    'POST',
    '/tokens/validate',
    { token: testData.onboardingToken },
    testData.technician.token
  );

  assert(
    response.status === 200,
    'Validate onboarding token',
    `Expected status 200, got ${response.status}`
  );

  return response.status === 200;
}

async function testDocumentEquipment() {
  log('\nTesting equipment documentation...', 'info');

  const equipmentList = [
    {
      name: 'Main Engine',
      code: 'ME-001',
      equipment_type: 'Engine',
      manufacturer: 'MAN B&W',
      model: '6S60MC-C',
      serial_number: 'SN123456',
      criticality: 'CRITICAL'
    },
    {
      name: 'Emergency Generator',
      code: 'EG-001',
      equipment_type: 'Generator',
      manufacturer: 'Caterpillar',
      model: 'C32',
      serial_number: 'SN789012',
      criticality: 'CRITICAL'
    },
    {
      name: 'Fire Pump',
      code: 'FP-001',
      equipment_type: 'Pump',
      manufacturer: 'Grundfos',
      model: 'NK 150-315',
      serial_number: 'SN345678',
      criticality: 'IMPORTANT'
    }
  ];

  let allSuccess = true;

  for (const equipment of equipmentList) {
    const response = await makeRequest(
      'POST',
      `/vessels/${testData.vessel.id}/equipment`,
      {
        ...equipment,
        vessel_id: testData.vessel.id,
        status: 'DOCUMENTED',
        documented_by: testData.technician.id,
        documented_at: new Date().toISOString(),
        quality_score: 85
      },
      testData.technician.token
    );

    const success = response.status === 201;
    allSuccess = allSuccess && success;

    assert(
      success,
      `Document equipment: ${equipment.name}`,
      `Expected status 201, got ${response.status}`
    );

    if (success) {
      testData.equipment.push(response.data);
    }
  }

  log(`Documented ${testData.equipment.length} equipment items`, 'info');
  return allSuccess;
}

async function testAddCriticalParts() {
  log('\nTesting critical parts addition...', 'info');

  const mainEngine = testData.equipment.find(e => e.code === 'ME-001');
  if (!mainEngine) {
    log('Main engine not found, skipping parts test', 'warning');
    return false;
  }

  const criticalParts = [
    {
      equipment_id: mainEngine.id,
      name: 'Fuel Injection Pump',
      part_number: 'FIP-12345',
      manufacturer: 'Bosch',
      criticality: 'CRITICAL',
      quantity: 6,
      unit_of_measure: 'pcs',
      minimum_stock: 2
    },
    {
      equipment_id: mainEngine.id,
      name: 'Cylinder Liner',
      part_number: 'CL-67890',
      manufacturer: 'MAN B&W',
      criticality: 'CRITICAL',
      quantity: 6,
      unit_of_measure: 'pcs',
      minimum_stock: 1
    }
  ];

  let allSuccess = true;

  for (const part of criticalParts) {
    const response = await makeRequest(
      'POST',
      `/equipment/${mainEngine.id}/parts`,
      part,
      testData.technician.token
    );

    const success = response.status === 201;
    allSuccess = allSuccess && success;

    assert(
      success,
      `Add critical part: ${part.name}`,
      `Expected status 201, got ${response.status}`
    );
  }

  return allSuccess;
}

async function testSubmitForReview() {
  log('\nTesting equipment submission for review...', 'info');

  let allSuccess = true;

  for (const equipment of testData.equipment) {
    const response = await makeRequest(
      'PATCH',
      `/equipment/${equipment.id}/status`,
      { status: 'REVIEWED' },
      testData.technician.token
    );

    const success = response.status === 200;
    allSuccess = allSuccess && success;

    assert(
      success,
      `Submit equipment for review: ${equipment.name}`,
      `Expected status 200, got ${response.status}`
    );
  }

  return allSuccess;
}

async function testManagerReview() {
  log('\n=== Step 4: Manager Review and Approval ===', 'info');
  log('Testing manager equipment retrieval...', 'info');

  const response = await makeRequest(
    'GET',
    `/vessels/${testData.vessel.id}/equipment?status=REVIEWED`,
    null,
    testData.manager.token
  );

  assert(
    response.status === 200,
    'Retrieve equipment for review',
    `Expected status 200, got ${response.status}`
  );

  if (response.status === 200 && response.data.items) {
    log(`Found ${response.data.items.length} equipment items for review`, 'info');
  }

  return response.status === 200;
}

async function testQualityScoring() {
  log('\nTesting quality score assignment...', 'info');

  let allSuccess = true;

  for (const equipment of testData.equipment) {
    const qualityMetrics = [
      { metric: 'COMPLETENESS', score: 90 },
      { metric: 'ACCURACY', score: 85 },
      { metric: 'PHOTO_QUALITY', score: 80 },
      { metric: 'DOCUMENTATION', score: 95 },
      { metric: 'COMPLIANCE', score: 88 }
    ];

    for (const metric of qualityMetrics) {
      const response = await makeRequest(
        'POST',
        `/equipment/${equipment.id}/quality-scores`,
        {
          ...metric,
          evaluated_by: testData.manager.id,
          details: { comment: 'Good documentation' }
        },
        testData.manager.token
      );

      const success = response.status === 201;
      allSuccess = allSuccess && success;

      if (!success) {
        log(`Failed to add quality score for ${equipment.name}: ${metric.metric}`, 'error');
      }
    }
  }

  assert(
    allSuccess,
    'Add quality scores',
    'Failed to add all quality scores'
  );

  return allSuccess;
}

async function testEquipmentApproval() {
  log('\nTesting equipment approval...', 'info');

  let allSuccess = true;

  for (const equipment of testData.equipment) {
    const response = await makeRequest(
      'PATCH',
      `/equipment/${equipment.id}/approve`,
      {
        status: 'APPROVED',
        notes: 'Equipment documentation meets all requirements'
      },
      testData.manager.token
    );

    const success = response.status === 200;
    allSuccess = allSuccess && success;

    assert(
      success,
      `Approve equipment: ${equipment.name}`,
      `Expected status 200, got ${response.status}`
    );
  }

  return allSuccess;
}

async function testGenerateQualityReport() {
  log('\nTesting quality report generation...', 'info');

  const response = await makeRequest(
    'GET',
    `/vessels/${testData.vessel.id}/reports/quality`,
    null,
    testData.manager.token
  );

  assert(
    response.status === 200,
    'Generate quality report',
    `Expected status 200, got ${response.status}`
  );

  if (response.status === 200) {
    log(`Quality report: Total equipment: ${response.data.total_equipment}, Approved: ${response.data.approved_equipment}, Average score: ${response.data.average_quality_score}`, 'info');
  }

  return response.status === 200;
}

async function testDataExport() {
  log('\n=== Step 5: Data Export ===', 'info');
  log('Testing data export functionality...', 'info');

  const exportFormats = ['json', 'csv', 'excel'];
  let allSuccess = true;

  for (const format of exportFormats) {
    const response = await makeRequest(
      'POST',
      `/vessels/${testData.vessel.id}/export`,
      {
        format,
        include: ['equipment', 'parts', 'documents', 'quality_scores']
      },
      testData.manager.token
    );

    const success = response.status === 200;
    allSuccess = allSuccess && success;

    assert(
      success,
      `Export data in ${format} format`,
      `Expected status 200, got ${response.status}`
    );

    if (success && response.data.export_url) {
      testData.exportUrls.push({
        format,
        url: response.data.export_url,
        expires_at: response.data.expires_at
      });
    }
  }

  return allSuccess;
}

async function testComplianceReport() {
  log('\nTesting compliance report generation...', 'info');

  const response = await makeRequest(
    'GET',
    `/vessels/${testData.vessel.id}/reports/compliance`,
    null,
    testData.manager.token
  );

  assert(
    response.status === 200,
    'Generate compliance report',
    `Expected status 200, got ${response.status}`
  );

  if (response.status === 200) {
    log(`Compliance status: ${response.data.compliance_status}`, 'info');
    log(`Critical equipment documented: ${response.data.critical_equipment_documented}%`, 'info');
    log(`Documentation completeness: ${response.data.documentation_completeness}%`, 'info');
  }

  return response.status === 200;
}

async function testAuditTrail() {
  log('\nTesting audit trail retrieval...', 'info');

  const response = await makeRequest(
    'GET',
    `/vessels/${testData.vessel.id}/audit-logs`,
    null,
    testData.manager.token
  );

  assert(
    response.status === 200,
    'Retrieve audit trail',
    `Expected status 200, got ${response.status}`
  );

  if (response.status === 200 && response.data.items) {
    log(`Found ${response.data.items.length} audit log entries`, 'info');
    
    const actions = response.data.items.map(log => log.action);
    assert(
      actions.includes('CREATE'),
      'Audit trail contains CREATE actions',
      'No CREATE actions found in audit trail'
    );
    assert(
      actions.includes('UPDATE'),
      'Audit trail contains UPDATE actions',
      'No UPDATE actions found in audit trail'
    );
  }

  return response.status === 200;
}

async function testWorkflowValidation() {
  log('\n=== Workflow Validation ===', 'info');
  log('Verifying complete workflow data integrity...', 'info');

  const response = await makeRequest(
    'GET',
    `/vessels/${testData.vessel.id}/summary`,
    null,
    testData.admin.token
  );

  assert(
    response.status === 200,
    'Get vessel summary',
    `Expected status 200, got ${response.status}`
  );

  if (response.status === 200) {
    const summary = response.data;
    
    assert(
      summary.equipment_count === testData.equipment.length,
      'Equipment count matches',
      `Expected ${testData.equipment.length} equipment, got ${summary.equipment_count}`
    );
    
    assert(
      summary.approved_equipment_count === testData.equipment.length,
      'All equipment approved',
      `Expected ${testData.equipment.length} approved, got ${summary.approved_equipment_count}`
    );
    
    assert(
      summary.onboarding_status === 'COMPLETED',
      'Onboarding status is COMPLETED',
      `Expected COMPLETED status, got ${summary.onboarding_status}`
    );
    
    assert(
      summary.quality_score > 80,
      'Quality score is acceptable',
      `Expected quality score > 80, got ${summary.quality_score}`
    );
  }

  return response.status === 200;
}

async function cleanup() {
  log('\n=== Cleanup ===', 'info');
  log('Cleaning up test data...', 'info');

  if (testData.vessel && testData.admin && testData.admin.token) {
    try {
      const response = await makeRequest(
        'DELETE',
        `/vessels/${testData.vessel.id}`,
        null,
        testData.admin.token
      );

      if ([200, 204].includes(response.status)) {
        log('Test data cleaned up successfully', 'success');
      } else {
        log('Failed to cleanup test data', 'warning');
      }
    } catch (error) {
      log(`Cleanup error: ${error.message}`, 'warning');
    }
  }
}

async function generateReport() {
  testResults.endTime = new Date();
  const duration = (testResults.endTime - testResults.startTime) / 1000;

  const report = {
    summary: {
      total_tests: testResults.passed + testResults.failed,
      passed: testResults.passed,
      failed: testResults.failed,
      success_rate: ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2) + '%',
      duration_seconds: duration.toFixed(2),
      start_time: testResults.startTime.toISOString(),
      end_time: testResults.endTime.toISOString()
    },
    issues: testResults.issues,
    test_data: {
      company_id: testData.company?.id,
      vessel_id: testData.vessel?.id,
      equipment_count: testData.equipment.length,
      export_urls: testData.exportUrls
    },
    logs: testResults.logs
  };

  // Save report to file
  const reportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n\n========================================');
  console.log('📊 TEST EXECUTION SUMMARY');
  console.log('========================================');
  console.log(`Total Tests: ${report.summary.total_tests}`);
  console.log(`✅ Passed: ${report.summary.passed}`);
  console.log(`❌ Failed: ${report.summary.failed}`);
  console.log(`Success Rate: ${report.summary.success_rate}`);
  console.log(`Duration: ${report.summary.duration_seconds} seconds`);
  console.log('========================================');

  if (testResults.issues.length > 0) {
    console.log('\n🚨 ISSUES FOUND:');
    console.log('----------------------------------------');
    testResults.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.test}`);
      console.log(`   Error: ${issue.error}`);
      console.log(`   Time: ${issue.timestamp}`);
      console.log('');
    });
  }

  console.log(`\n📄 Full report saved to: ${reportPath}`);

  return report;
}

// Main test runner
async function runTests() {
  log('🚀 Starting End-to-End Workflow Tests', 'info');
  log(`API URL: ${API_BASE_URL}`, 'info');
  log('========================================\n', 'info');

  try {
    // Check API health
    log('Checking API health...', 'info');
    const healthResponse = await makeRequest('GET', '/health');
    if (healthResponse.status !== 200) {
      throw new Error(`API health check failed. Status: ${healthResponse.status}`);
    }
    log('API is healthy', 'success');

    // Run test workflow
    await testAdminLogin();
    
    if (testData.admin && testData.admin.token) {
      await testCreateCompany();
      await testCreateVessel();
      await testCreateVesselLocations();
      await testGenerateOnboardingToken();
      await testCreateManager();
      await testManagerLogin();
      await testCreateTechnician();
      await testAssignTechnician();
      await testTechnicianLogin();
      await testValidateOnboardingToken();
      await testDocumentEquipment();
      await testAddCriticalParts();
      await testSubmitForReview();
      await testManagerReview();
      await testQualityScoring();
      await testEquipmentApproval();
      await testGenerateQualityReport();
      await testDataExport();
      await testComplianceReport();
      await testAuditTrail();
      await testWorkflowValidation();
    } else {
      log('Admin login failed, skipping remaining tests', 'error');
    }

  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    testResults.issues.push({
      test: 'Test Execution',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    // Always run cleanup
    await cleanup();

    // Generate and save report
    const report = await generateReport();

    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };