import { Router, Request, Response } from 'express';
import { dbGet, dbRun, dbAll } from '../config/database';
import { activationCodeService } from '../services/activation-code.service';
import { emailService } from '../services/email.service';
import * as crypto from 'crypto';
import { 
  helpRequestRateLimit,
  codeRegenerationRateLimit 
} from '../middleware/rateLimiter.middleware';
import { 
  emailVerification,
  auditLog
} from '../middleware/activationSecurity.middleware';
import {
  auditActivationHelp,
  auditActivationRegenerate
} from '../middleware/auditLog.middleware';

const router = Router();

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { attempts: number; resetTime: Date }>();
const verificationCodes = new Map<string, { code: string; email: string; expiresAt: Date; attempts: number }>();

// Clean up expired entries every hour
setInterval(() => {
  const now = new Date();
  
  // Clean rate limits
  rateLimitStore.forEach((value, key) => {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  });
  
  // Clean verification codes
  verificationCodes.forEach((value, key) => {
    if (value.expiresAt < now) {
      verificationCodes.delete(key);
    }
  });
}, 60 * 60 * 1000); // Every hour

// Check rate limiting
function checkRateLimit(identifier: string, maxAttempts: number = 5): boolean {
  const now = new Date();
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || entry.resetTime < now) {
    // Create new entry
    const resetTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    rateLimitStore.set(identifier, { attempts: 1, resetTime });
    return true;
  }
  
  if (entry.attempts >= maxAttempts) {
    return false;
  }
  
  entry.attempts++;
  return true;
}

// Generate verification code
function generateVerificationCode(): string {
  const code = crypto.randomInt(100000, 999999).toString();
  return code;
}

// Verify email exists in system
router.post('/verify-email', 
  helpRequestRateLimit,
  auditLog('verify_email'),
  async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check rate limit
    if (!checkRateLimit(`verify-email:${clientIp}`, 10)) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    
    // Check if email exists in companies table
    const company = await dbGet(`
      SELECT id, name, contact_email 
      FROM companies 
      WHERE contact_email = ?
    `, [email.toLowerCase()]);
    
    // For now, just check company table
    // TODO: Add payments table check when payment integration is complete
    const exists = !!company;
    
    // Log the attempt
    await dbRun(`
      INSERT INTO activation_help_logs (
        email, action, ip_address, success
      ) VALUES (?, 'verify_email', ?, ?)
    `, [email.toLowerCase(), clientIp, exists ? 1 : 0]);
    
    res.json({ exists });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process help request
router.post('/help', 
  helpRequestRateLimit,
  auditActivationHelp,
  auditLog('activation_help'),
  async (req: Request, res: Response) => {
  try {
    const { email, reason, action, verificationCode } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (!email || !reason) {
      return res.status(400).json({ error: 'Email and reason are required' });
    }
    
    // Check rate limit
    if (!checkRateLimit(`help:${clientIp}:${email}`, 5)) {
      return res.status(429).json({ error: 'Too many requests. Please try again in an hour.' });
    }
    
    if (action === 'send_verification') {
      // Generate and send verification code
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      // Store verification code
      const verificationKey = `${email}:${reason}`;
      verificationCodes.set(verificationKey, {
        code,
        email: email.toLowerCase(),
        expiresAt,
        attempts: 0
      });
      
      // Send verification email directly using email service
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0096FF;">Verification Code</h2>
          <p>You requested help with your SMS activation code.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #333; letter-spacing: 3px; margin: 0;">${code}</h1>
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `;
      
      await emailService.sendEmail({
        to: email,
        subject: 'SMS Activation Help - Verification Code',
        html: emailHtml,
        priority: 'high'
      });
      
      // Log the action
      await dbRun(`
        INSERT INTO activation_help_logs (
          email, action, reason, ip_address, success
        ) VALUES (?, 'send_verification', ?, ?, 1)
      `, [email.toLowerCase(), reason, clientIp]);
      
      res.json({ success: true });
      
    } else if (action === 'verify_code') {
      // Verify the code
      const verificationKey = `${email}:${reason}`;
      const storedData = verificationCodes.get(verificationKey);
      
      if (!storedData) {
        return res.json({ verified: false, error: 'No verification code found' });
      }
      
      if (storedData.expiresAt < new Date()) {
        verificationCodes.delete(verificationKey);
        return res.json({ verified: false, error: 'Verification code expired' });
      }
      
      if (storedData.attempts >= 5) {
        verificationCodes.delete(verificationKey);
        return res.json({ verified: false, error: 'Too many failed attempts' });
      }
      
      storedData.attempts++;
      
      if (storedData.code !== verificationCode) {
        return res.json({ verified: false, error: 'Invalid verification code' });
      }
      
      // Code is valid
      res.json({ verified: true });
      
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error processing help request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Regenerate activation code
router.post('/regenerate', 
  codeRegenerationRateLimit,
  emailVerification,
  auditActivationRegenerate,
  auditLog('activation_regenerate'),
  async (req: Request, res: Response) => {
  try {
    const { email, reason, verificationCode } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (!email || !reason || !verificationCode) {
      return res.status(400).json({ error: 'Email, reason, and verification code are required' });
    }
    
    // Verify the code first
    const verificationKey = `${email}:${reason}`;
    const storedData = verificationCodes.get(verificationKey);
    
    if (!storedData || storedData.code !== verificationCode) {
      return res.status(403).json({ error: 'Invalid or expired verification code' });
    }
    
    // Find the company
    const company = await dbGet(`
      SELECT id, name, contact_email 
      FROM companies 
      WHERE contact_email = ?
    `, [email.toLowerCase()]);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Check regeneration limit
    const regenerationCount = await dbGet(`
      SELECT COUNT(*) as count 
      FROM activation_codes 
      WHERE company_id = ? AND regenerated = 1
    `, [company.id]);
    
    if (regenerationCount && regenerationCount.count >= 3) {
      await dbRun(`
        INSERT INTO activation_help_logs (
          email, action, reason, ip_address, success, error_message
        ) VALUES (?, 'regenerate', ?, ?, 0, 'Max regenerations exceeded')
      `, [email.toLowerCase(), reason, clientIp]);
      
      return res.status(403).json({ 
        error: 'Maximum regenerations exceeded',
        message: 'Maximum regeneration limit reached. Please contact support.'
      });
    }
    
    // Regenerate the code
    const newCode = await activationCodeService.regenerateActivationCode(
      company.id,
      reason,
      reason === 'expired' // Extend trial if original expired
    );
    
    // Mark old codes as regenerated
    await dbRun(`
      UPDATE activation_codes 
      SET regenerated = 1, updated_at = datetime('now')
      WHERE company_id = ? AND activated_at IS NULL AND regenerated = 0
    `, [company.id]);
    
    // Clear verification code
    verificationCodes.delete(verificationKey);
    
    // Log success
    await dbRun(`
      INSERT INTO activation_help_logs (
        email, action, reason, ip_address, success, new_code
      ) VALUES (?, 'regenerate', ?, ?, 1, ?)
    `, [email.toLowerCase(), reason, clientIp, newCode]);
    
    res.json({ 
      success: true,
      message: `New activation code sent to ${email}`
    });
    
  } catch (error) {
    console.error('Error regenerating activation code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get help statistics (admin only)
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // In production, add authentication check here
    
    const stats = await dbGet(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(DISTINCT email) as unique_emails,
        COUNT(DISTINCT ip_address) as unique_ips,
        SUM(CASE WHEN action = 'verify_email' THEN 1 ELSE 0 END) as verify_attempts,
        SUM(CASE WHEN action = 'regenerate' AND success = 1 THEN 1 ELSE 0 END) as successful_regenerations,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_attempts
      FROM activation_help_logs
      WHERE created_at > datetime('now', '-7 days')
    `);
    
    const topReasons = await dbAll(`
      SELECT reason, COUNT(*) as count
      FROM activation_help_logs
      WHERE reason IS NOT NULL
      GROUP BY reason
      ORDER BY count DESC
    `);
    
    res.json({
      weeklyStats: stats,
      topReasons
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;