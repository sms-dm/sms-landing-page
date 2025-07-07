# Activation System Testing Procedures

## Overview
Comprehensive testing procedures for the SMS activation system to ensure security, reliability, and performance.

## Test Suite Structure

### 1. Security Tests (`test-activation-security.js`)
Tests all security features and protections.

#### Test Coverage:
- ✅ Rate limiting enforcement
- ✅ Brute force protection
- ✅ Code sharing detection
- ✅ Email verification flow
- ✅ Audit logging
- ✅ Suspicious activity monitoring
- ✅ Security headers
- ✅ Regeneration limits

#### Run Command:
```bash
node test-activation-security.js
```

### 2. Flow Tests (`test-activation-flow.js`)
Tests end-to-end activation workflows.

#### Test Coverage:
- ✅ Complete activation flow
- ✅ Invalid code scenarios
- ✅ Help request flow
- ✅ Concurrent requests
- ✅ Code lifecycle
- ✅ Monitoring & alerts

#### Run Command:
```bash
node test-activation-flow.js
```

### 3. Code Generation Tests (`test-code-generation.js`)
Tests admin code generation features.

#### Test Coverage:
- ✅ Code generation
- ✅ Format & uniqueness
- ✅ Expiry management
- ✅ Batch operations
- ✅ Validation rules
- ✅ Analytics & reporting

#### Run Command:
```bash
node test-code-generation.js
```

### 4. Rate Limiting Tests (`test-rate-limiting.js`)
Detailed rate limiting verification.

#### Test Coverage:
- ✅ Per-endpoint limits
- ✅ Header validation
- ✅ Concurrent handling
- ✅ Reset mechanism
- ✅ IP differentiation
- ✅ Auth bypass

#### Run Command:
```bash
node test-rate-limiting.js
```

## Running All Tests

### Prerequisites
1. Backend server running on port 5000
2. Database with test data
3. Email service configured (or mocked)

### Full Test Suite
```bash
# Run all tests sequentially
npm run test:activation:all

# Or manually:
node test-activation-security.js && \
node test-activation-flow.js && \
node test-code-generation.js && \
node test-rate-limiting.js
```

## Manual Testing Procedures

### 1. CAPTCHA Testing

#### Setup:
1. Configure reCAPTCHA keys in `.env`
2. Enable CAPTCHA in frontend

#### Test Steps:
1. Make 3 failed activation attempts
2. Verify CAPTCHA appears
3. Complete CAPTCHA correctly
4. Verify request proceeds
5. Test with invalid CAPTCHA
6. Verify request blocked

### 2. Email Verification Testing

#### Test Steps:
1. Request code regeneration
2. Check email received
3. Verify code format (6 digits)
4. Test with correct code
5. Test with incorrect code
6. Test expired code (wait 15 mins)

### 3. Load Testing

#### Tools:
- Apache Bench (ab)
- JMeter
- k6

#### Example Load Test:
```bash
# 1000 requests, 10 concurrent
ab -n 1000 -c 10 -p activation.json -T application/json \
  http://localhost:5000/api/payment/activation/validate
```

#### Metrics to Monitor:
- Response times
- Error rates
- Rate limit accuracy
- Database performance
- Memory usage

### 4. Security Penetration Testing

#### SQL Injection:
```bash
# Test various SQL injection attempts
curl -X POST http://localhost:5000/api/payment/activation/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "TEST\" OR \"1\"=\"1"}'
```

#### XSS Testing:
```bash
# Test XSS in code field
curl -X POST http://localhost:5000/api/payment/activation/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "<script>alert(\"XSS\")</script>"}'
```

#### Brute Force:
```bash
# Test rate limiting with rapid requests
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/payment/activation/validate \
    -H "Content-Type: application/json" \
    -d '{"code": "BRUTE-'$i'"}' &
done
```

## Test Data Management

### 1. Test Activation Codes
```sql
-- Active test code
INSERT INTO activation_codes (code, company_id, expires_at)
VALUES ('TEST-ACTIVE-2024', 1, datetime('now', '+30 days'));

-- Expired test code
INSERT INTO activation_codes (code, company_id, expires_at)
VALUES ('TEST-EXPIRED-2024', 1, datetime('now', '-1 day'));

-- Used test code
INSERT INTO activation_codes (code, company_id, activated_at)
VALUES ('TEST-USED-2024', 1, datetime('now'));
```

### 2. Test Companies
```sql
-- Test companies for code generation
INSERT INTO companies (name, slug, contact_email)
VALUES 
  ('Test Company 1', 'test-company-1', 'test1@example.com'),
  ('Test Company 2', 'test-company-2', 'test2@example.com'),
  ('Test Company 3', 'test-company-3', 'test3@example.com');
```

### 3. Reset Test Data
```bash
# Script to reset test data
node scripts/reset-test-data.js
```

## Performance Benchmarks

### Expected Performance:
| Endpoint | Target | Acceptable |
|----------|--------|------------|
| Validate | < 50ms | < 100ms |
| Use Code | < 100ms | < 200ms |
| Generate | < 150ms | < 300ms |
| Help Request | < 100ms | < 200ms |

### Monitoring Performance:
```javascript
// Add to tests
const startTime = Date.now();
const response = await makeRequest(endpoint);
const duration = Date.now() - startTime;
assert(duration < 100, `Response too slow: ${duration}ms`);
```

## Test Environment Setup

### 1. Local Testing
```bash
# Start test database
npm run db:test

# Start backend with test config
NODE_ENV=test npm start

# Run tests
npm run test:activation
```

### 2. CI/CD Testing
```yaml
# .github/workflows/test.yml
- name: Run Activation Tests
  run: |
    npm run db:test:init
    npm run start:test &
    sleep 5
    npm run test:activation:all
```

### 3. Staging Testing
- Deploy to staging environment
- Run full test suite
- Perform manual testing
- Load testing with realistic data
- Security scanning

## Debugging Failed Tests

### 1. Enable Verbose Logging
```bash
DEBUG=* node test-activation-security.js
```

### 2. Check Logs
```bash
# Backend logs
tail -f backend.log

# Database queries
tail -f db-queries.log

# Email logs
tail -f ethereal-emails.log
```

### 3. Common Issues

#### Rate Limit Not Working:
- Check Redis connection
- Verify middleware order
- Check IP detection

#### CAPTCHA Failing:
- Verify reCAPTCHA keys
- Check network connectivity
- Test domain whitelist

#### Email Not Sending:
- Check SMTP configuration
- Verify email templates
- Check spam filters

## Test Reporting

### 1. Automated Reports
```bash
# Generate test report
npm run test:activation:report
```

### 2. Report Contents:
- Test execution summary
- Failed test details
- Performance metrics
- Security findings
- Recommendations

### 3. Report Format:
```
Activation System Test Report
Date: 2024-12-30
Environment: Development

Summary:
- Total Tests: 48
- Passed: 46
- Failed: 2
- Duration: 3m 45s

Failed Tests:
1. Rate limiting - Concurrent requests
   Error: Expected 429, got 200
   
2. Email verification - Expired code
   Error: Code accepted after expiry

Performance:
- Avg response time: 67ms
- Max response time: 234ms
- Requests/second: 150

Security:
- No vulnerabilities found
- All protections active
```

## Continuous Improvement

### 1. Test Coverage Goals
- Unit tests: > 80%
- Integration tests: > 70%
- E2E tests: > 60%
- Security tests: 100%

### 2. Regular Reviews
- Weekly: Failed test analysis
- Monthly: Coverage review
- Quarterly: Performance baseline
- Yearly: Security audit

### 3. Test Maintenance
- Update tests for new features
- Remove obsolete tests
- Optimize slow tests
- Add edge case coverage

## Troubleshooting Guide

### Problem: Tests Timeout
**Solution:**
- Increase timeout limits
- Check database connections
- Verify service availability

### Problem: Inconsistent Results
**Solution:**
- Clear test data between runs
- Check for race conditions
- Use fixed timestamps

### Problem: Environment Differences
**Solution:**
- Use Docker for consistency
- Document dependencies
- Version lock packages

## Resources

### Documentation:
- [API Documentation](./API_DOCUMENTATION.md)
- [Security Guide](./ACTIVATION_SECURITY.md)
- [Database Schema](./DATABASE_SCHEMA.md)

### Tools:
- [Postman Collection](./postman/activation-tests.json)
- [Load Test Scripts](./scripts/load-tests/)
- [Security Scanners](./security/scanners/)