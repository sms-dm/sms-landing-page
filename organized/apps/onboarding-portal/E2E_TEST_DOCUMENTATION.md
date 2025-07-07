# End-to-End Workflow Test Documentation

## Overview

The `test-e2e-workflow.js` script provides comprehensive testing of the complete SMS Onboarding workflow, validating all major components and their interactions.

## Test Coverage

The script tests the following workflow steps:

### 1. Admin Setup
- Admin login with demo credentials
- Company creation
- Vessel creation
- Vessel location setup
- Onboarding token generation

### 2. Manager Setup
- Manager user creation
- Manager login
- Technician user creation
- Technician assignment to vessel

### 3. Technician Onboarding
- Technician login
- Onboarding token validation
- Equipment documentation (3 items)
- Critical parts addition
- Equipment submission for review

### 4. Manager Review & Approval
- Equipment retrieval for review
- Quality score assignment (5 metrics per equipment)
- Equipment approval
- Quality report generation

### 5. Data Export & Reports
- Data export in JSON, CSV, and Excel formats
- Compliance report generation
- Audit trail verification
- Complete workflow validation

## Prerequisites

1. **Backend API Running**
   ```bash
   cd backend
   npm run dev
   ```

2. **Database Setup**
   - PostgreSQL running with the SMS database
   - Database migrations applied
   - Demo admin user seeded (admin@demo.com / Demo123!)

3. **Node.js Dependencies**
   ```bash
   npm install axios
   ```

## Running the Test

### Basic Usage
```bash
node test-e2e-workflow.js
```

### With Custom API URL
```bash
API_URL=http://localhost:3000/api/v1 node test-e2e-workflow.js
```

### Make Executable
```bash
chmod +x test-e2e-workflow.js
./test-e2e-workflow.js
```

## Understanding the Output

### Real-time Logs
The script provides detailed logging:
- ✅ **PASSED**: Test succeeded
- ❌ **FAILED**: Test failed with error details
- 🚀 Progress indicators for each workflow step
- Timestamps for all operations

### Test Report
A JSON report is generated with:
- **Summary**: Total tests, pass/fail counts, success rate, duration
- **Issues**: Detailed list of any failures
- **Test Data**: IDs of created entities, export URLs
- **Full Logs**: Complete execution history

### Example Output
```
🚀 Starting End-to-End Workflow Tests
API URL: http://localhost:3000/api/v1
========================================

[2025-01-04T10:30:00.000Z] [INFO] Checking API health...
[2025-01-04T10:30:00.100Z] [SUCCESS] API is healthy

=== Step 1: Admin Setup ===
[2025-01-04T10:30:00.200Z] [INFO] Testing admin login...
[2025-01-04T10:30:00.300Z] [SUCCESS] ✅ PASSED: Admin login
[2025-01-04T10:30:00.301Z] [SUCCESS] Admin logged in successfully: admin@demo.com

... (more test output) ...

========================================
📊 TEST EXECUTION SUMMARY
========================================
Total Tests: 25
✅ Passed: 24
❌ Failed: 1
Success Rate: 96.00%
Duration: 45.23 seconds
========================================

🚨 ISSUES FOUND:
----------------------------------------
1. Export data in excel format
   Error: Expected status 200, got 500
   Time: 2025-01-04T10:30:45.123Z

📄 Full report saved to: test-report-1704363045123.json
```

## Common Issues and Solutions

### 1. API Connection Failed
**Issue**: Cannot connect to API
**Solution**: 
- Ensure backend is running on the correct port
- Check API_URL environment variable
- Verify no firewall blocking the connection

### 2. Authentication Failed
**Issue**: Admin login fails
**Solution**:
- Ensure demo user is seeded in database
- Check credentials match: admin@demo.com / Demo123!
- Verify JWT secret is configured

### 3. Database Errors
**Issue**: Entity creation fails
**Solution**:
- Check database connection
- Ensure all migrations are applied
- Verify foreign key constraints

### 4. Export Format Not Supported
**Issue**: Excel export fails
**Solution**:
- Check if excel export dependencies are installed
- Verify export service configuration
- Check disk space for temporary files

### 5. Quality Metrics Missing
**Issue**: Quality score endpoints return 404
**Solution**:
- Ensure quality service is implemented
- Check route definitions
- Verify middleware is not blocking requests

## Test Data Cleanup

The script automatically cleans up test data by:
- Deleting the test vessel (cascades to all related data)
- Using timestamp-based naming to avoid conflicts
- Handling cleanup errors gracefully

## Interpreting Results

### Success Criteria
- **All tests pass**: System is working correctly
- **High success rate (>95%)**: Minor issues that may not affect core functionality
- **Low success rate (<80%)**: Critical issues need attention

### Key Metrics to Monitor
1. **Equipment Documentation**: All 3 equipment items should be created
2. **Quality Scores**: Average should be >80
3. **Approval Rate**: All equipment should be approved
4. **Export Functionality**: All 3 formats should work
5. **Audit Trail**: Should contain CREATE and UPDATE actions

## Extending the Tests

To add new test cases:

1. Create a new test function:
```javascript
async function testNewFeature() {
  log('\nTesting new feature...', 'info');
  
  const response = await makeRequest(
    'POST',
    '/new-endpoint',
    { data: 'test' },
    testData.admin.token
  );
  
  assert(
    response.status === 200,
    'New feature test',
    `Expected status 200, got ${response.status}`
  );
  
  return response.status === 200;
}
```

2. Add to the test flow in `runTests()`:
```javascript
await testNewFeature();
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
    
    - name: Install dependencies
      run: npm install
    
    - name: Run migrations
      run: npm run db:migrate
    
    - name: Seed database
      run: npm run db:seed
    
    - name: Start API
      run: npm run dev &
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/sms_test
    
    - name: Wait for API
      run: npx wait-on http://localhost:3000/api/v1/health
    
    - name: Run E2E tests
      run: node test-e2e-workflow.js
    
    - name: Upload test report
      if: always()
      uses: actions/upload-artifact@v2
      with:
        name: test-report
        path: test-report-*.json
```

## Troubleshooting

### Enable Debug Mode
Add verbose logging:
```javascript
// At the top of the script
const DEBUG = process.env.DEBUG === 'true';

// In makeRequest function
if (DEBUG) {
  console.log('Request:', method, url, data);
  console.log('Response:', response.status, response.data);
}
```

### Check Individual Components
Test specific parts:
```bash
# Test only admin functions
node -e "require('./test-e2e-workflow.js').testAdminLogin()"

# Test with custom timeout
TIMEOUT=120000 node test-e2e-workflow.js
```

### Analyze Failed Requests
The test report includes:
- Full request/response details
- Timestamps for timing analysis
- Error messages and stack traces
- Test data IDs for manual inspection

## Best Practices

1. **Run Regularly**: Include in daily CI/CD pipeline
2. **Monitor Trends**: Track success rates over time
3. **Fix Immediately**: Address failures before they compound
4. **Keep Updated**: Add tests for new features
5. **Clean Environment**: Run on fresh database for consistency

## Support

For issues or questions:
1. Check the test report JSON file
2. Review API logs for detailed errors
3. Verify database state
4. Check network connectivity
5. Ensure all services are running