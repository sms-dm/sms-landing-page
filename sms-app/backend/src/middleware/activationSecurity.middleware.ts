import { Request, Response, NextFunction } from 'express';
import { dbGet, dbRun, dbAll } from '../config/database';
import crypto from 'crypto';

// Interface for tracking activation attempts
interface ActivationAttempt {
  code: string;
  ip_address: string;
  user_agent?: string;
  success: boolean;
  timestamp: Date;
}

// Store for tracking suspicious patterns (in production, use Redis)
const suspiciousActivityStore = new Map<string, number>();
const codeShareDetection = new Map<string, Set<string>>();
const captchaRequiredStore = new Map<string, boolean>();

// Clean up old entries every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  
  // Clean suspicious activity
  suspiciousActivityStore.forEach((timestamp, key) => {
    if (timestamp < oneHourAgo) {
      suspiciousActivityStore.delete(key);
    }
  });
  
  // Clean captcha requirements
  captchaRequiredStore.forEach((_, key) => {
    const keyParts = key.split(':');
    const timestamp = parseInt(keyParts[keyParts.length - 1] || '0');
    if (timestamp < oneHourAgo) {
      captchaRequiredStore.delete(key);
    }
  });
}, 3600000);

// Get client fingerprint
function getClientFingerprint(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const acceptLanguage = req.headers['accept-language'] || 'unknown';
  const acceptEncoding = req.headers['accept-encoding'] || 'unknown';
  
  // Create a fingerprint hash
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${ip}:${userAgent}:${acceptLanguage}:${acceptEncoding}`)
    .digest('hex');
    
  return fingerprint;
}

// Check if CAPTCHA is required
export function isCaptchaRequired(identifier: string): boolean {
  return captchaRequiredStore.has(identifier);
}

// Brute force protection middleware
export async function bruteForcProtection(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const fingerprint = getClientFingerprint(req);
    
    if (!code) {
      return next();
    }
    
    // Check recent failed attempts for this IP
    const recentAttempts = await dbAll(`
      SELECT COUNT(*) as count 
      FROM activation_attempts 
      WHERE ip_address = ? 
        AND success = 0 
        AND created_at > datetime('now', '-1 hour')
    `, [clientIp]);
    
    const failedCount = recentAttempts[0]?.count || 0;
    
    // If more than 3 failed attempts, require CAPTCHA
    if (failedCount >= 3) {
      captchaRequiredStore.set(`${fingerprint}:${Date.now()}`, true);
      
      // Check if CAPTCHA was provided
      const captchaToken = req.headers['x-captcha-token'] || req.body.captchaToken;
      if (!captchaToken) {
        return res.status(403).json({
          error: 'Too many failed attempts',
          captchaRequired: true,
          message: 'Please complete the CAPTCHA to continue'
        });
      }
      
      // Verify CAPTCHA (implement actual verification with your CAPTCHA service)
      const captchaValid = await verifyCaptcha(captchaToken as string);
      if (!captchaValid) {
        return res.status(403).json({
          error: 'Invalid CAPTCHA',
          captchaRequired: true,
          message: 'Please complete the CAPTCHA correctly'
        });
      }
    }
    
    // Check for suspicious patterns
    const suspiciousKey = `${clientIp}:${code}`;
    const lastAttempt = suspiciousActivityStore.get(suspiciousKey);
    
    if (lastAttempt && Date.now() - lastAttempt < 1000) {
      // Multiple attempts with same code within 1 second
      return res.status(429).json({
        error: 'Suspicious activity detected',
        message: 'Please wait before trying again'
      });
    }
    
    suspiciousActivityStore.set(suspiciousKey, Date.now());
    
    next();
  } catch (error) {
    console.error('Brute force protection error:', error);
    next(); // Don't block on error
  }
}

// Code sharing detection middleware
export async function codeShareDetection(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    
    if (!code) {
      return next();
    }
    
    // Track IPs that have used this code
    if (!codeShareDetection.has(code)) {
      codeShareDetection.set(code, new Set());
    }
    
    const ipsForCode = codeShareDetection.get(code)!;
    ipsForCode.add(clientIp);
    
    // If more than 3 different IPs have tried this code, it might be shared
    if (ipsForCode.size > 3) {
      // Log suspicious activity
      await dbRun(`
        INSERT INTO security_alerts (
          alert_type,
          alert_message,
          metadata,
          created_at
        ) VALUES (?, ?, ?, datetime('now'))
      `, [
        'code_sharing',
        `Activation code ${code} attempted from ${ipsForCode.size} different IPs`,
        JSON.stringify({
          code: code,
          ips: Array.from(ipsForCode),
          timestamp: new Date().toISOString()
        })
      ]);
      
      // Don't block immediately, but flag for review
      req.body.suspiciousActivity = true;
    }
    
    next();
  } catch (error) {
    console.error('Code share detection error:', error);
    next();
  }
}

// Audit logging middleware
export async function auditLog(action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const fingerprint = getClientFingerprint(req);
    
    // Store original end function
    const originalEnd = res.end;
    
    // Override end function to log after response
    res.end = function(...args: any[]) {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      const success = statusCode >= 200 && statusCode < 400;
      
      // Log to database
      dbRun(`
        INSERT INTO activation_audit_logs (
          action,
          ip_address,
          user_agent,
          fingerprint,
          request_body,
          response_status,
          response_time_ms,
          success,
          metadata,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        action,
        clientIp,
        userAgent,
        fingerprint,
        JSON.stringify(req.body),
        statusCode,
        responseTime,
        success ? 1 : 0,
        JSON.stringify({
          headers: req.headers,
          query: req.query,
          params: req.params,
          suspiciousActivity: req.body.suspiciousActivity || false
        })
      ]).catch(error => {
        console.error('Audit log error:', error);
      });
      
      // Call original end function
      originalEnd.apply(res, args);
    };
    
    next();
  };
}

// Verify CAPTCHA token
async function verifyCaptcha(token: string): Promise<boolean> {
  // Implement actual CAPTCHA verification here
  // For Google reCAPTCHA:
  if (process.env.RECAPTCHA_SECRET_KEY) {
    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
      });
      
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('CAPTCHA verification error:', error);
      return false;
    }
  }
  
  // For testing, accept a specific token
  return token === 'test-captcha-token';
}

// Log activation attempt
export async function logActivationAttempt(
  code: string,
  ipAddress: string,
  userAgent: string | undefined,
  success: boolean,
  errorMessage?: string
) {
  try {
    await dbRun(`
      INSERT INTO activation_attempts (
        code,
        ip_address,
        user_agent,
        success,
        error_message,
        created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [code, ipAddress, userAgent, success ? 1 : 0, errorMessage]);
  } catch (error) {
    console.error('Failed to log activation attempt:', error);
  }
}

// Get suspicious activity report
export async function getSuspiciousActivityReport(days: number = 7) {
  try {
    const report = {
      multipleIpCodes: await dbAll(`
        SELECT 
          code,
          COUNT(DISTINCT ip_address) as unique_ips,
          COUNT(*) as total_attempts,
          GROUP_CONCAT(DISTINCT ip_address) as ips
        FROM activation_attempts
        WHERE created_at > datetime('now', '-${days} days')
        GROUP BY code
        HAVING unique_ips > 3
        ORDER BY unique_ips DESC
      `),
      
      highFailureRateIps: await dbAll(`
        SELECT 
          ip_address,
          COUNT(*) as total_attempts,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_attempts,
          ROUND(CAST(SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as failure_rate
        FROM activation_attempts
        WHERE created_at > datetime('now', '-${days} days')
        GROUP BY ip_address
        HAVING failed_attempts > 5
        ORDER BY failure_rate DESC
      `),
      
      rapidFireAttempts: await dbAll(`
        SELECT 
          ip_address,
          code,
          COUNT(*) as attempts_count,
          MIN(created_at) as first_attempt,
          MAX(created_at) as last_attempt,
          (julianday(MAX(created_at)) - julianday(MIN(created_at))) * 24 * 60 as minutes_span
        FROM activation_attempts
        WHERE created_at > datetime('now', '-${days} days')
        GROUP BY ip_address, code
        HAVING attempts_count > 3 AND minutes_span < 5
      `),
      
      securityAlerts: await dbAll(`
        SELECT *
        FROM security_alerts
        WHERE created_at > datetime('now', '-${days} days')
        ORDER BY created_at DESC
        LIMIT 100
      `)
    };
    
    return report;
  } catch (error) {
    console.error('Failed to generate suspicious activity report:', error);
    return null;
  }
}

// Email verification middleware
export async function emailVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    
    if (!email || req.path !== '/regenerate') {
      return next();
    }
    
    // Check if email needs additional verification
    const recentRegenerations = await dbGet(`
      SELECT COUNT(*) as count
      FROM activation_help_logs
      WHERE email = ? 
        AND action = 'regenerate'
        AND created_at > datetime('now', '-24 hours')
    `, [email.toLowerCase()]);
    
    if (recentRegenerations && recentRegenerations.count >= 2) {
      // Require additional verification
      const verificationRequired = !req.body.emailVerified;
      
      if (verificationRequired) {
        return res.status(403).json({
          error: 'Additional verification required',
          emailVerificationRequired: true,
          message: 'Due to multiple regeneration requests, please verify your email'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Email verification error:', error);
    next();
  }
}