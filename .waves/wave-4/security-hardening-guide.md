# SMS Security Hardening Guide

## Overview

This guide provides comprehensive security hardening procedures for the SMS platform, covering both infrastructure and application security. All recommendations align with maritime industry compliance requirements and AWS security best practices.

## 1. Network Security Hardening

### 1.1 VPC Security Configuration

```yaml
Network Isolation:
  - Private subnets for all compute resources
  - Public subnets only for ALB and NAT Gateways
  - No direct internet access for databases or application servers
  
Security Group Rules:
  - Principle of least privilege
  - No 0.0.0.0/0 ingress rules except ALB ports 80/443
  - Explicit deny for unused ports
  - Time-based access for maintenance
```

### 1.2 Network Access Control Lists (NACLs)

```bash
# Restrictive NACL for database subnets
aws ec2 create-network-acl-entry \
  --network-acl-id acl-xxxxx \
  --rule-number 100 \
  --protocol tcp \
  --rule-action allow \
  --ingress \
  --port-range From=5432,To=5432 \
  --source-cidr 10.0.10.0/24  # App subnet only

# Deny all other traffic
aws ec2 create-network-acl-entry \
  --network-acl-id acl-xxxxx \
  --rule-number 200 \
  --protocol -1 \
  --rule-action deny \
  --ingress \
  --source-cidr 0.0.0.0/0
```

### 1.3 VPC Flow Logs Analysis

```python
# analyze_flow_logs.py
import boto3
import pandas as pd
from datetime import datetime, timedelta

def analyze_suspicious_traffic():
    """Analyze VPC flow logs for suspicious patterns"""
    
    client = boto3.client('logs')
    
    # Query for rejected connections
    query = """
    fields @timestamp, srcaddr, dstaddr, dstport, protocol, action
    | filter action = "REJECT"
    | stats count(*) as attempts by srcaddr, dstport
    | sort attempts desc
    | limit 20
    """
    
    response = client.start_query(
        logGroupName='/aws/vpc/sms-prod',
        startTime=int((datetime.now() - timedelta(hours=24)).timestamp()),
        endTime=int(datetime.now().timestamp()),
        queryString=query
    )
    
    # Check for port scanning
    port_scan_query = """
    fields srcaddr, dstport
    | filter action = "REJECT"
    | stats count_distinct(dstport) as unique_ports by srcaddr
    | filter unique_ports > 10
    """
    
    # Alert on suspicious IPs
    suspicious_ips = execute_query(port_scan_query)
    if suspicious_ips:
        block_suspicious_ips(suspicious_ips)
```

## 2. Data Encryption

### 2.1 Encryption at Rest

```yaml
RDS Encryption:
  - Enable encryption on creation (cannot be added later)
  - Use customer-managed KMS keys
  - Encrypt snapshots and read replicas
  - Enable TDE for additional protection

S3 Encryption:
  - Default bucket encryption with SSE-KMS
  - Bucket policies to deny unencrypted uploads
  - Separate KMS keys per data classification

EBS Encryption:
  - Encrypt all EBS volumes by default
  - Use separate KMS keys for different workloads
```

### 2.2 Encryption in Transit

```nginx
# ALB SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# HSTS Header
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### 2.3 Application-Level Encryption

```javascript
// Encrypt sensitive data before storage
const crypto = require('crypto');

class DataEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyDerivation = 'pbkdf2';
  }
  
  encryptSensitiveData(data, category) {
    const key = this.getDEK(category); // Data Encryption Key
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      keyVersion: this.getCurrentKeyVersion(category)
    };
  }
  
  // Rotate encryption keys periodically
  async rotateKeys() {
    const categories = ['PII', 'financial', 'vessel-data'];
    
    for (const category of categories) {
      await this.generateNewDEK(category);
      await this.reEncryptData(category);
    }
  }
}
```

## 3. Identity and Access Management

### 3.1 IAM Best Practices

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnforceMFAAccess",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "Bool": {
          "aws:MultiFactorAuthPresent": "false"
        },
        "StringNotEquals": {
          "aws:RequestedRegion": ["us-east-1", "eu-west-1"]
        }
      }
    },
    {
      "Sid": "RequireSecureTransport",
      "Effect": "Deny",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::sms-*/*",
        "arn:aws:s3:::sms-*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

### 3.2 Service Account Security

```yaml
ECS Task Roles:
  - Minimal permissions per service
  - No wildcard permissions
  - Separate roles for different services
  - Regular permission audits

Example Task Role:
  API Service:
    - s3:GetObject on specific buckets
    - secretsmanager:GetSecretValue for app secrets
    - rds:DescribeDBInstances for health checks
    - No admin permissions
```

### 3.3 Secrets Management

```javascript
// Secure secrets retrieval with caching
class SecretsManager {
  constructor() {
    this.cache = new Map();
    this.ttl = 3600000; // 1 hour
  }
  
  async getSecret(secretName) {
    // Check cache first
    const cached = this.cache.get(secretName);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }
    
    // Retrieve from AWS Secrets Manager
    const client = new AWS.SecretsManager();
    const response = await client.getSecretValue({
      SecretId: secretName
    }).promise();
    
    const secret = JSON.parse(response.SecretString);
    
    // Cache with expiry
    this.cache.set(secretName, {
      value: secret,
      expiry: Date.now() + this.ttl
    });
    
    return secret;
  }
  
  // Rotate secrets automatically
  async rotateSecret(secretName) {
    const client = new AWS.SecretsManager();
    
    await client.rotateSecret({
      SecretId: secretName,
      RotationRules: {
        AutomaticallyAfterDays: 90
      }
    }).promise();
  }
}
```

## 4. Application Security

### 4.1 Input Validation and Sanitization

```javascript
// Comprehensive input validation
const validator = require('validator');
const xss = require('xss');

class InputValidator {
  validateAndSanitize(input, rules) {
    const errors = [];
    const sanitized = {};
    
    for (const [field, value] of Object.entries(input)) {
      if (!rules[field]) {
        continue; // Skip unknown fields
      }
      
      const rule = rules[field];
      
      // Type validation
      if (rule.type === 'email' && !validator.isEmail(value)) {
        errors.push(`${field} must be a valid email`);
        continue;
      }
      
      if (rule.type === 'uuid' && !validator.isUUID(value)) {
        errors.push(`${field} must be a valid UUID`);
        continue;
      }
      
      // Length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${field} exceeds maximum length`);
        continue;
      }
      
      // SQL injection prevention
      if (rule.type === 'string') {
        sanitized[field] = value
          .replace(/'/g, "''")
          .replace(/;/g, '')
          .replace(/--/g, '');
      }
      
      // XSS prevention
      if (rule.sanitize) {
        sanitized[field] = xss(value, {
          whiteList: {},
          stripIgnoreTag: true
        });
      }
    }
    
    return { errors, sanitized };
  }
}

// Usage
const rules = {
  vesselName: { type: 'string', maxLength: 100, sanitize: true },
  email: { type: 'email', required: true },
  vesselId: { type: 'uuid', required: true }
};
```

### 4.2 Authentication Security

```javascript
// Secure authentication implementation
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');

class AuthenticationService {
  async createUser(email, password) {
    // Password strength requirements
    const passwordRules = [
      { regex: /.{12,}/, message: 'Password must be at least 12 characters' },
      { regex: /[A-Z]/, message: 'Password must contain uppercase letters' },
      { regex: /[a-z]/, message: 'Password must contain lowercase letters' },
      { regex: /[0-9]/, message: 'Password must contain numbers' },
      { regex: /[^A-Za-z0-9]/, message: 'Password must contain special characters' }
    ];
    
    for (const rule of passwordRules) {
      if (!rule.regex.test(password)) {
        throw new Error(rule.message);
      }
    }
    
    // Hash password with high cost factor
    const hashedPassword = await bcrypt.hash(password, 14);
    
    // Generate MFA secret
    const mfaSecret = speakeasy.generateSecret({
      name: `SMS Platform (${email})`,
      length: 32
    });
    
    return {
      email,
      password: hashedPassword,
      mfaSecret: mfaSecret.base32,
      mfaQrCode: mfaSecret.qr_code_url
    };
  }
  
  async authenticate(email, password, mfaToken) {
    const user = await this.getUserByEmail(email);
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      await this.recordFailedAttempt(email);
      throw new Error('Invalid credentials');
    }
    
    // Verify MFA
    const validToken = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: mfaToken,
      window: 1
    });
    
    if (!validToken) {
      await this.recordFailedAttempt(email);
      throw new Error('Invalid MFA token');
    }
    
    // Generate session
    return this.createSecureSession(user);
  }
  
  async recordFailedAttempt(email) {
    const key = `failed_auth:${email}`;
    const attempts = await redis.incr(key);
    await redis.expire(key, 300); // 5 minutes
    
    if (attempts > 5) {
      await this.lockAccount(email);
      throw new Error('Account locked due to too many failed attempts');
    }
  }
}
```

### 4.3 API Security

```javascript
// API rate limiting and security middleware
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userId: req.user?.id
      });
      res.status(429).json({ error: message });
    }
  });
};

// Apply different limits for different endpoints
app.use('/api/auth/login', createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  5, // 5 requests
  'Too many login attempts'
));

app.use('/api/', createRateLimiter(
  1 * 60 * 1000, // 1 minute
  100, // 100 requests
  'Too many requests'
));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## 5. Container Security

### 5.1 Docker Image Hardening

```dockerfile
# Secure Dockerfile example
FROM node:18-alpine AS builder

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install only production dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application files
COPY --chown=nodejs:nodejs . .

# Final stage - distroless image
FROM gcr.io/distroless/nodejs18-debian11

# Copy from builder
COPY --from=builder --chown=1001:1001 /app /app

# Set non-root user
USER 1001

# Readonly filesystem
WORKDIR /app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD ["/nodejs/bin/node", "/app/healthcheck.js"]

# Run application
EXPOSE 3000
CMD ["/app/server.js"]
```

### 5.2 Container Runtime Security

```yaml
# ECS Task Definition Security Settings
{
  "family": "sms-api-secure",
  "taskRoleArn": "arn:aws:iam::xxx:role/sms-api-task-role",
  "executionRoleArn": "arn:aws:iam::xxx:role/sms-api-execution-role",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "xxx.dkr.ecr.us-east-1.amazonaws.com/sms-api:latest",
      "memory": 2048,
      "cpu": 1024,
      "essential": true,
      "readonlyRootFilesystem": true,
      "user": "1001:1001",
      "privileged": false,
      "linuxParameters": {
        "capabilities": {
          "drop": ["ALL"],
          "add": ["NET_BIND_SERVICE"]
        },
        "tmpfs": [
          {
            "containerPath": "/tmp",
            "size": 100,
            "mountOptions": ["noexec", "nosuid", "nodev"]
          }
        ]
      },
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:xxx:secret:sms/prod/db-url"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/sms-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 5.3 Image Scanning and Compliance

```bash
#!/bin/bash
# scan-images.sh - Automated container scanning

# Scan image with Trivy
trivy image --severity HIGH,CRITICAL \
  --exit-code 1 \
  --no-progress \
  --format json \
  --output scan-results.json \
  $ECR_REPO:$IMAGE_TAG

# Check for outdated base images
skopeo inspect docker://$ECR_REPO:$IMAGE_TAG | \
  jq -r '.Env[] | select(startswith("NODE_VERSION"))' | \
  awk -F= '{print $2}'

# Verify image signature
cosign verify --key cosign.pub $ECR_REPO:$IMAGE_TAG

# Policy compliance check
opa eval -d policies/ -i scan-results.json \
  "data.docker.deny[_]" --format pretty
```

## 6. Monitoring and Incident Response

### 6.1 Security Monitoring

```javascript
// Real-time security monitoring
class SecurityMonitor {
  constructor() {
    this.alerts = new Map();
    this.thresholds = {
      failedLogins: 5,
      suspiciousQueries: 10,
      largeDataExport: 1000
    };
  }
  
  async monitorFailedLogins(userId) {
    const key = `failed_login:${userId}`;
    const count = await redis.incr(key);
    await redis.expire(key, 300); // 5 minute window
    
    if (count >= this.thresholds.failedLogins) {
      await this.triggerAlert('FAILED_LOGIN_THRESHOLD', {
        userId,
        count,
        action: 'Account temporarily locked'
      });
    }
  }
  
  async monitorDatabaseQueries(query, userId) {
    // Detect potential SQL injection patterns
    const suspiciousPatterns = [
      /union\s+select/i,
      /or\s+1\s*=\s*1/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(query)) {
        await this.triggerAlert('SUSPICIOUS_QUERY', {
          userId,
          query: query.substring(0, 200),
          pattern: pattern.toString()
        });
        return false; // Block query
      }
    }
    
    return true;
  }
  
  async monitorDataAccess(userId, recordCount, dataType) {
    if (recordCount > this.thresholds.largeDataExport) {
      await this.triggerAlert('LARGE_DATA_EXPORT', {
        userId,
        recordCount,
        dataType,
        timestamp: new Date().toISOString()
      });
    }
    
    // Track access patterns
    await this.logAccessPattern(userId, dataType, recordCount);
  }
  
  async triggerAlert(alertType, details) {
    const alert = {
      id: uuid.v4(),
      type: alertType,
      severity: this.getSeverity(alertType),
      details,
      timestamp: new Date().toISOString()
    };
    
    // Send to CloudWatch
    await cloudwatch.putMetricData({
      Namespace: 'SMS/Security',
      MetricData: [{
        MetricName: alertType,
        Value: 1,
        Unit: 'Count',
        Dimensions: [
          { Name: 'Environment', Value: process.env.NODE_ENV },
          { Name: 'Severity', Value: alert.severity }
        ]
      }]
    }).promise();
    
    // Send to SNS for immediate notification
    if (alert.severity === 'CRITICAL') {
      await sns.publish({
        TopicArn: process.env.SECURITY_ALERT_TOPIC,
        Subject: `Security Alert: ${alertType}`,
        Message: JSON.stringify(alert, null, 2)
      }).promise();
    }
    
    // Log to security audit trail
    logger.security(alert);
  }
}
```

### 6.2 Incident Response Procedures

```yaml
Incident Response Playbook:
  
  1. Detection Phase:
    - Automated alerts from CloudWatch, GuardDuty, Security Hub
    - Manual reports from users or security team
    - Regular security audit findings
    
  2. Triage Phase:
    Priority Levels:
      P1 - Critical:
        - Active data breach
        - Ransomware detection
        - Complete system compromise
        - Response Time: < 15 minutes
        
      P2 - High:
        - Suspicious user activity
        - Multiple failed authentication attempts
        - Unusual data access patterns
        - Response Time: < 1 hour
        
      P3 - Medium:
        - Policy violations
        - Configuration drift
        - Response Time: < 4 hours
        
  3. Containment:
    - Isolate affected systems
    - Revoke compromised credentials
    - Block suspicious IP addresses
    - Enable break-glass procedures
    
  4. Eradication:
    - Remove malicious code
    - Patch vulnerabilities
    - Update security rules
    - Reset compromised accounts
    
  5. Recovery:
    - Restore from clean backups
    - Verify system integrity
    - Re-enable services gradually
    - Monitor for reoccurrence
    
  6. Post-Incident:
    - Document timeline and actions
    - Update security procedures
    - Conduct lessons learned session
    - Implement additional controls
```

### 6.3 Security Automation

```python
# security_automation.py
import boto3
import json
from datetime import datetime

class SecurityAutomation:
    def __init__(self):
        self.waf = boto3.client('wafv2')
        self.ec2 = boto3.client('ec2')
        self.guardduty = boto3.client('guardduty')
        
    async def auto_block_malicious_ip(self, ip_address, reason):
        """Automatically block malicious IPs"""
        
        # Add to WAF IP set
        ip_set_id = os.environ['WAF_BLOCK_IP_SET_ID']
        
        response = self.waf.update_ip_set(
            Scope='REGIONAL',
            Id=ip_set_id,
            Updates=[{
                'Action': 'INSERT',
                'IPAddress': f"{ip_address}/32"
            }],
            LockToken=self.get_lock_token(ip_set_id)
        )
        
        # Add to NACL deny list
        nacl_id = os.environ['DATABASE_NACL_ID']
        
        self.ec2.create_network_acl_entry(
            NetworkAclId=nacl_id,
            RuleNumber=self.get_next_rule_number(nacl_id),
            Protocol='-1',
            RuleAction='deny',
            CidrBlock=f"{ip_address}/32"
        )
        
        # Log the action
        self.log_security_action({
            'action': 'IP_BLOCKED',
            'ip_address': ip_address,
            'reason': reason,
            'timestamp': datetime.utcnow().isoformat(),
            'automated': True
        })
        
    async def respond_to_guardduty_finding(self, finding):
        """Automated response to GuardDuty findings"""
        
        severity = finding['Severity']
        finding_type = finding['Type']
        
        if severity >= 7:  # High severity
            if 'EC2' in finding_type:
                # Isolate compromised instance
                instance_id = finding['Resource']['InstanceDetails']['InstanceId']
                await self.isolate_instance(instance_id)
                
            elif 'IAM' in finding_type:
                # Disable compromised credentials
                user_name = finding['Resource']['AccessKeyDetails']['UserName']
                await self.disable_user_access(user_name)
                
        # Always create ticket for investigation
        await self.create_security_ticket(finding)
        
    async def isolate_instance(self, instance_id):
        """Isolate potentially compromised EC2 instance"""
        
        # Create isolation security group
        isolation_sg = self.ec2.create_security_group(
            GroupName=f'isolation-{instance_id}-{int(time.time())}',
            Description='Security isolation group - no traffic allowed'
        )
        
        # Update instance security groups
        self.ec2.modify_instance_attribute(
            InstanceId=instance_id,
            Groups=[isolation_sg['GroupId']]
        )
        
        # Create snapshot for forensics
        self.create_forensic_snapshot(instance_id)
```

## 7. Compliance and Auditing

### 7.1 Audit Trail Implementation

```javascript
// Comprehensive audit logging
class AuditLogger {
  constructor() {
    this.sensitiveFields = ['password', 'ssn', 'creditCard'];
  }
  
  async logEvent(event) {
    const auditEntry = {
      id: uuid.v4(),
      timestamp: new Date().toISOString(),
      eventType: event.type,
      userId: event.userId,
      sessionId: event.sessionId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      resource: event.resource,
      action: event.action,
      result: event.result,
      metadata: this.sanitizeMetadata(event.metadata)
    };
    
    // Write to immutable audit log
    await this.writeToCloudTrail(auditEntry);
    
    // Index for searching
    await this.indexInElasticsearch(auditEntry);
    
    // Real-time analysis
    await this.analyzeForAnomalies(auditEntry);
  }
  
  sanitizeMetadata(metadata) {
    const sanitized = { ...metadata };
    
    // Remove sensitive fields
    for (const field of this.sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  async analyzeForAnomalies(entry) {
    // Check for unusual access patterns
    const recentActivity = await this.getRecentActivity(entry.userId);
    
    // Unusual time
    const hour = new Date(entry.timestamp).getHours();
    if (hour < 6 || hour > 22) {
      await this.flagAnomaly('UNUSUAL_TIME', entry);
    }
    
    // Unusual location
    const location = await this.getGeoLocation(entry.ipAddress);
    if (location.country !== recentActivity.usualCountry) {
      await this.flagAnomaly('UNUSUAL_LOCATION', entry);
    }
    
    // Rapid resource access
    const accessRate = await this.calculateAccessRate(entry.userId);
    if (accessRate > 100) { // 100 requests per minute
      await this.flagAnomaly('HIGH_ACCESS_RATE', entry);
    }
  }
}
```

### 7.2 Compliance Reporting

```python
# compliance_reporter.py
class ComplianceReporter:
    def __init__(self):
        self.config = boto3.client('config')
        self.securityhub = boto3.client('securityhub')
        
    def generate_compliance_report(self, standard='CIS'):
        """Generate compliance report for specified standard"""
        
        report = {
            'standard': standard,
            'timestamp': datetime.utcnow().isoformat(),
            'summary': {
                'total_controls': 0,
                'passed': 0,
                'failed': 0,
                'not_applicable': 0
            },
            'findings': []
        }
        
        # Get compliance findings
        findings = self.securityhub.get_findings(
            Filters={
                'ComplianceStatus': [
                    {'Value': 'FAILED', 'Comparison': 'EQUALS'},
                    {'Value': 'WARNING', 'Comparison': 'EQUALS'}
                ],
                'RecordState': [
                    {'Value': 'ACTIVE', 'Comparison': 'EQUALS'}
                ]
            }
        )
        
        for finding in findings['Findings']:
            report['findings'].append({
                'control': finding['Title'],
                'status': finding['Compliance']['Status'],
                'severity': finding['Severity']['Label'],
                'remediation': finding['Remediation']['Recommendation']['Text']
            })
            
        return report
        
    def continuous_compliance_monitoring(self):
        """Set up continuous compliance monitoring"""
        
        # Create Config rules for critical controls
        rules = [
            {
                'name': 'encrypted-volumes',
                'source': 'AWS::EC2::Volume',
                'rule': 'ENCRYPTED_VOLUMES'
            },
            {
                'name': 'rds-encryption-enabled',
                'source': 'AWS::RDS::DBInstance',
                'rule': 'RDS_STORAGE_ENCRYPTED'
            },
            {
                'name': 's3-bucket-encryption',
                'source': 'AWS::S3::Bucket',
                'rule': 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
            }
        ]
        
        for rule in rules:
            self.config.put_config_rule(
                ConfigRule={
                    'ConfigRuleName': f"sms-{rule['name']}",
                    'Source': {
                        'Owner': 'AWS',
                        'SourceIdentifier': rule['rule']
                    },
                    'Scope': {
                        'ComplianceResourceTypes': [rule['source']]
                    }
                }
            )
```

## 8. Security Testing

### 8.1 Penetration Testing Framework

```bash
#!/bin/bash
# security-test.sh - Automated security testing

# OWASP ZAP API Security Testing
docker run -t owasp/zap2docker-stable zap-api-scan.py \
  -t https://api.sms-offshore.com/openapi.json \
  -f openapi \
  -r zap-report.html \
  -w zap-report.md

# Nuclei vulnerability scanning
nuclei -u https://app.sms-offshore.com \
  -t ~/nuclei-templates/ \
  -severity critical,high \
  -o nuclei-report.txt

# SSL/TLS configuration testing
testssl.sh --fast --parallel https://app.sms-offshore.com

# Container security scanning
grype dir:. --fail-on high
```

### 8.2 Security Test Automation

```javascript
// security-tests.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Security Tests', () => {
  test('SQL Injection Prevention', async ({ request }) => {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'--",
      "1' UNION SELECT * FROM users--"
    ];
    
    for (const input of maliciousInputs) {
      const response = await request.post('/api/search', {
        data: { query: input }
      });
      
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid input');
    }
  });
  
  test('XSS Prevention', async ({ page }) => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>'
    ];
    
    for (const payload of xssPayloads) {
      await page.goto('/dashboard');
      await page.fill('[name="comment"]', payload);
      await page.click('[type="submit"]');
      
      // Verify script is not executed
      const alertFired = await page.evaluate(() => {
        let alertCalled = false;
        window.alert = () => { alertCalled = true; };
        return alertCalled;
      });
      
      expect(alertFired).toBe(false);
    }
  });
  
  test('Authentication Security', async ({ request }) => {
    // Test rate limiting
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(request.post('/api/auth/login', {
        data: { email: 'test@example.com', password: 'wrong' }
      }));
    }
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.some(r => r.status() === 429);
    expect(rateLimited).toBe(true);
  });
});
```

## 9. Disaster Recovery Security

### 9.1 Secure Backup Procedures

```yaml
Backup Security:
  Encryption:
    - All backups encrypted with separate KMS keys
    - Key rotation every 90 days
    - Cross-region key replication
    
  Access Control:
    - Separate backup account with MFA
    - Cross-account backup replication
    - Immutable backup retention
    
  Testing:
    - Monthly restore drills
    - Integrity verification
    - Security scanning of restored data
```

### 9.2 Incident Recovery

```bash
#!/bin/bash
# disaster-recovery.sh - Secure recovery procedures

# Verify backup integrity
aws s3api head-object \
  --bucket sms-backups-prod \
  --key database/latest.sql.enc \
  --checksum-mode ENABLED

# Decrypt backup with specific key version
aws kms decrypt \
  --ciphertext-blob fileb://database-backup.enc \
  --key-id arn:aws:kms:us-east-1:xxx:key/xxx \
  --encryption-context Purpose=backup,Environment=prod \
  --output text \
  --query Plaintext | base64 -d > database-backup.sql

# Verify decrypted content
sha256sum -c database-backup.sql.sha256

# Restore with minimal privileges
psql -h localhost -U restore_user -d sms_recovery < database-backup.sql
```

## 10. Security Checklist

### Pre-Deployment Security Checklist

- [ ] All data encrypted at rest and in transit
- [ ] MFA enabled for all user accounts
- [ ] Network segmentation implemented
- [ ] Security groups follow least privilege
- [ ] WAF rules configured and tested
- [ ] Container images scanned and signed
- [ ] Secrets stored in AWS Secrets Manager
- [ ] Audit logging enabled for all services
- [ ] Backup encryption and access controls verified
- [ ] Incident response plan documented and tested
- [ ] Security monitoring dashboards configured
- [ ] Penetration testing completed
- [ ] Compliance scanning passed
- [ ] Disaster recovery procedures tested
- [ ] Security training completed for all team members

### Ongoing Security Tasks

- [ ] Weekly vulnerability scans
- [ ] Monthly penetration tests
- [ ] Quarterly security reviews
- [ ] Annual disaster recovery drills
- [ ] Continuous compliance monitoring
- [ ] Regular security training updates
- [ ] Incident response plan updates
- [ ] Third-party security assessments

## Conclusion

This security hardening guide provides comprehensive protection for the SMS platform across all layers of the infrastructure. Regular reviews and updates of these security measures ensure continued protection against evolving threats while maintaining compliance with maritime industry regulations.