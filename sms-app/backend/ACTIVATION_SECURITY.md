# Activation System Security Documentation

## Overview
The SMS activation system implements multiple layers of security to protect against abuse while maintaining a good user experience.

## Security Features

### 1. Rate Limiting
Protects against brute force attacks and API abuse.

#### Limits by Endpoint:
- **Activation Validation**: 5 attempts per hour per IP
- **Activation Usage**: 3 attempts per hour per IP
- **Help Requests**: 5 attempts per hour per IP
- **Code Regeneration**: 3 attempts per day per email
- **General API**: 100 requests per minute per IP

#### Implementation:
```javascript
// Rate limiter middleware
import { activationValidationRateLimit } from './middleware/rateLimiter.middleware';

router.post('/activation/validate', 
  activationValidationRateLimit,
  controller.validateActivationCode
);
```

### 2. Brute Force Protection
Prevents automated attempts to guess activation codes.

#### Features:
- Tracks failed attempts per IP
- Requires CAPTCHA after 3 failed attempts
- Blocks IPs with excessive failures
- Monitors rapid-fire attempts

#### CAPTCHA Integration:
```javascript
// After 3 failed attempts
{
  "error": "Too many failed attempts",
  "captchaRequired": true,
  "message": "Please complete the CAPTCHA to continue"
}
```

### 3. Code Sharing Detection
Identifies when activation codes are being shared or sold.

#### Detection Criteria:
- Code used from > 3 different IPs
- Geographic anomalies
- Unusual usage patterns

#### Alerts:
- Automatic admin notification
- Code suspension option
- IP blacklisting capability

### 4. Audit Logging
Comprehensive logging of all activation-related activities.

#### Logged Events:
- Code generation
- Validation attempts
- Usage/activation
- Help requests
- Regeneration requests
- Admin actions

#### Log Contents:
```javascript
{
  action: 'activation_validate',
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0...',
  fingerprint: 'sha256_hash',
  request_body: { /* redacted sensitive data */ },
  response_status: 200,
  response_time_ms: 45,
  success: true,
  metadata: { /* additional context */ }
}
```

### 5. Email Verification
Ensures code regeneration requests are legitimate.

#### Process:
1. Verify email exists in system
2. Send 6-digit verification code
3. Validate code (15-minute expiry)
4. Allow regeneration upon success

#### Security Features:
- Rate limited verification emails
- Code expires after 15 minutes
- Maximum 5 verification attempts
- IP tracking for all requests

### 6. IP and Fingerprint Tracking
Advanced client identification for better security.

#### Tracking Methods:
- IP address (with proxy detection)
- User agent string
- Browser fingerprinting
- Accept headers
- Geographic location

#### Uses:
- Pattern detection
- Anomaly identification
- Blacklist enforcement
- Audit trail

## Security Best Practices

### 1. Code Generation
- Cryptographically secure random generation
- Minimum 10 characters
- Alphanumeric + hyphens only
- Unique constraint enforced
- Configurable expiry (default 30 days)

### 2. Code Storage
- Hashed in database
- Salted for additional security
- No plain text storage
- Encrypted backups

### 3. Code Distribution
- Secure email only
- No SMS/phone distribution
- Audit trail for all sends
- Reminder emails tracked

### 4. Code Usage
- One-time use only
- Immediate invalidation
- Company activation tracked
- User creation logged

## Monitoring and Alerts

### 1. Real-time Monitoring
- Failed activation attempts
- Suspicious IP patterns
- Code sharing detection
- Geographic anomalies
- Rate limit violations

### 2. Alert Triggers
| Event | Threshold | Action |
|-------|-----------|--------|
| Failed attempts | > 10/hour from single IP | Block IP + Alert |
| Code sharing | > 3 different IPs | Flag code + Alert |
| Rapid attempts | > 5/second | Temporary block |
| Geographic anomaly | Different continent | Manual review |
| Regeneration abuse | > 3/day | Block email |

### 3. Admin Dashboard
- Real-time statistics
- Security alerts
- Suspicious activity log
- Manual override options
- Blacklist management

## Testing Security

### 1. Automated Tests
Run security tests regularly:
```bash
npm run test:security
```

Tests include:
- Rate limiting verification
- Brute force protection
- Code sharing detection
- Email verification flow
- Audit logging accuracy

### 2. Manual Testing
Periodically test:
- CAPTCHA functionality
- Email delivery
- Alert notifications
- Admin overrides
- Blacklist effectiveness

### 3. Security Audits
Monthly reviews of:
- Failed attempt patterns
- Successful activations
- Geographic distribution
- Code usage patterns
- System vulnerabilities

## Incident Response

### 1. Suspicious Activity
1. Automatic detection via monitoring
2. Admin alert generated
3. Review activity logs
4. Determine threat level
5. Apply appropriate response

### 2. Response Actions
- **Low Risk**: Monitor and log
- **Medium Risk**: Require CAPTCHA
- **High Risk**: Block IP/email
- **Critical**: Suspend all codes

### 3. Recovery Process
1. Identify affected codes/companies
2. Notify legitimate users
3. Issue new codes if needed
4. Update security rules
5. Document incident

## Configuration

### Environment Variables
```env
# Rate limiting
RATE_LIMIT_WINDOW_MS=3600000  # 1 hour
RATE_LIMIT_MAX_REQUESTS=5

# Security
ENABLE_CAPTCHA=true
RECAPTCHA_SECRET_KEY=your_key
CAPTCHA_THRESHOLD=3

# Monitoring
ALERT_EMAIL=security@smartmarine.com
ALERT_THRESHOLD_FAILED=10
ALERT_THRESHOLD_SHARED=3

# IP Blocking
ENABLE_IP_BLOCKING=true
IP_BLOCK_DURATION_HOURS=24
```

### Database Tables
- `activation_attempts` - Track all attempts
- `security_alerts` - Store security events
- `audit_logs` - General audit trail
- `activation_audit_logs` - Activation-specific logs
- `ip_blacklist` - Blocked IPs
- `email_blacklist` - Blocked emails

## Maintenance

### Daily Tasks
- Review security alerts
- Check failed attempt patterns
- Verify email delivery
- Monitor rate limit effectiveness

### Weekly Tasks
- Analyze usage patterns
- Review audit logs
- Update blacklists
- Test CAPTCHA functionality

### Monthly Tasks
- Security audit
- Performance review
- Update documentation
- Test incident response

## Future Enhancements

### Planned Improvements
1. **Machine Learning**: Anomaly detection using ML
2. **2FA Integration**: Two-factor for high-value codes
3. **Geofencing**: Restrict codes by region
4. **Device Fingerprinting**: Advanced client identification
5. **Behavioral Analysis**: Pattern-based threat detection

### Research Areas
- Blockchain verification
- Biometric authentication
- Zero-trust architecture
- Advanced rate limiting algorithms
- Distributed security monitoring

## Support

For security concerns or questions:
- Email: security@smartmarine.com
- Emergency: +1-XXX-XXX-XXXX
- Documentation: /docs/security
- Admin Portal: /admin/security