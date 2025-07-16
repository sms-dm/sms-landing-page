import { dbGet, dbAll, dbRun } from '../config/database';
import { emailService } from './email.service';
import { EventEmitter } from 'events';

interface SecurityAlert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: Date;
}

interface MonitoringConfig {
  failedAttemptsThreshold: number;
  codeShareThreshold: number;
  rapidFireThreshold: number;
  alertEmail: string;
  checkInterval: number; // milliseconds
}

class SecurityMonitoringService extends EventEmitter {
  private config: MonitoringConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertCache = new Map<string, Date>();
  
  constructor() {
    super();
    
    this.config = {
      failedAttemptsThreshold: parseInt(process.env.ALERT_THRESHOLD_FAILED || '10'),
      codeShareThreshold: parseInt(process.env.ALERT_THRESHOLD_SHARED || '3'),
      rapidFireThreshold: parseInt(process.env.ALERT_THRESHOLD_RAPID || '5'),
      alertEmail: process.env.ALERT_EMAIL || 'security@smartmarine.com',
      checkInterval: parseInt(process.env.MONITORING_INTERVAL || '60000') // 1 minute
    };
  }
  
  /**
   * Start monitoring for suspicious activities
   */
  startMonitoring() {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }
    
    console.log('🔍 Starting security monitoring...');
    
    // Run initial check
    this.performSecurityCheck();
    
    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.performSecurityCheck();
    }, this.config.checkInterval);
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Security monitoring stopped');
    }
  }
  
  /**
   * Perform comprehensive security check
   */
  private async performSecurityCheck() {
    try {
      await Promise.all([
        this.checkFailedAttempts(),
        this.checkCodeSharing(),
        this.checkRapidFireAttempts(),
        this.checkGeographicAnomalies(),
        this.checkSuspiciousPatterns()
      ]);
    } catch (error) {
      console.error('Security check error:', error);
    }
  }
  
  /**
   * Check for excessive failed attempts
   */
  private async checkFailedAttempts() {
    try {
      const results = await dbAll(`
        SELECT 
          ip_address,
          COUNT(*) as failed_count,
          MIN(created_at) as first_attempt,
          MAX(created_at) as last_attempt
        FROM activation_attempts
        WHERE success = 0
          AND created_at > datetime('now', '-1 hour')
        GROUP BY ip_address
        HAVING failed_count >= ?
      `, [this.config.failedAttemptsThreshold]);
      
      for (const result of results) {
        await this.createAlert({
          type: 'excessive_failed_attempts',
          severity: 'high',
          message: `IP ${result.ip_address} has ${result.failed_count} failed attempts in the last hour`,
          details: {
            ip_address: result.ip_address,
            failed_count: result.failed_count,
            first_attempt: result.first_attempt,
            last_attempt: result.last_attempt
          },
          timestamp: new Date()
        });
        
        // Auto-block IP if configured
        if (process.env.ENABLE_AUTO_BLOCKING === 'true') {
          await this.blockIP(result.ip_address, 'Excessive failed attempts');
        }
      }
    } catch (error) {
      console.error('Failed attempts check error:', error);
    }
  }
  
  /**
   * Check for code sharing
   */
  private async checkCodeSharing() {
    try {
      const results = await dbAll(`
        SELECT 
          code,
          COUNT(DISTINCT ip_address) as unique_ips,
          GROUP_CONCAT(DISTINCT ip_address) as ip_list,
          COUNT(*) as total_attempts
        FROM activation_attempts
        WHERE created_at > datetime('now', '-24 hours')
        GROUP BY code
        HAVING unique_ips >= ?
      `, [this.config.codeShareThreshold]);
      
      for (const result of results) {
        await this.createAlert({
          type: 'code_sharing_detected',
          severity: 'critical',
          message: `Activation code ${result.code} used from ${result.unique_ips} different IPs`,
          details: {
            code: result.code,
            unique_ips: result.unique_ips,
            ip_list: result.ip_list.split(','),
            total_attempts: result.total_attempts
          },
          timestamp: new Date()
        });
        
        // Mark code as suspicious
        await dbRun(`
          UPDATE activation_codes
          SET suspicious_activity = 1
          WHERE code = ?
        `, [result.code]);
      }
    } catch (error) {
      console.error('Code sharing check error:', error);
    }
  }
  
  /**
   * Check for rapid-fire attempts
   */
  private async checkRapidFireAttempts() {
    try {
      const results = await dbAll(`
        SELECT 
          ip_address,
          COUNT(*) as attempt_count,
          MIN(created_at) as first_attempt,
          MAX(created_at) as last_attempt,
          (julianday(MAX(created_at)) - julianday(MIN(created_at))) * 86400 as duration_seconds
        FROM activation_attempts
        WHERE created_at > datetime('now', '-5 minutes')
        GROUP BY ip_address
        HAVING attempt_count >= ? AND duration_seconds < 60
      `, [this.config.rapidFireThreshold]);
      
      for (const result of results) {
        await this.createAlert({
          type: 'rapid_fire_attempts',
          severity: 'high',
          message: `IP ${result.ip_address} made ${result.attempt_count} attempts in ${Math.round(result.duration_seconds)} seconds`,
          details: {
            ip_address: result.ip_address,
            attempt_count: result.attempt_count,
            duration_seconds: result.duration_seconds,
            rate_per_second: result.attempt_count / result.duration_seconds
          },
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Rapid fire check error:', error);
    }
  }
  
  /**
   * Check for geographic anomalies
   */
  private async checkGeographicAnomalies() {
    try {
      // This would integrate with a GeoIP service in production
      // For now, we'll check for suspicious user agent patterns
      const results = await dbAll(`
        SELECT 
          code,
          COUNT(DISTINCT user_agent) as unique_agents,
          GROUP_CONCAT(DISTINCT substr(user_agent, 1, 50)) as agents
        FROM activation_attempts
        WHERE created_at > datetime('now', '-1 hour')
        GROUP BY code
        HAVING unique_agents > 5
      `);
      
      for (const result of results) {
        await this.createAlert({
          type: 'suspicious_user_agents',
          severity: 'medium',
          message: `Code ${result.code} accessed from ${result.unique_agents} different user agents`,
          details: {
            code: result.code,
            unique_agents: result.unique_agents,
            sample_agents: result.agents
          },
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Geographic anomaly check error:', error);
    }
  }
  
  /**
   * Check for suspicious patterns
   */
  private async checkSuspiciousPatterns() {
    try {
      // Sequential code attempts
      const sequentialResults = await dbAll(`
        SELECT 
          ip_address,
          GROUP_CONCAT(code) as attempted_codes,
          COUNT(*) as code_count
        FROM activation_attempts
        WHERE created_at > datetime('now', '-30 minutes')
          AND code LIKE '%-%'
        GROUP BY ip_address
        HAVING code_count > 3
      `);
      
      for (const result of sequentialResults) {
        const codes = result.attempted_codes.split(',');
        if (this.areCodesSequential(codes)) {
          await this.createAlert({
            type: 'sequential_code_attempts',
            severity: 'high',
            message: `IP ${result.ip_address} attempting sequential codes`,
            details: {
              ip_address: result.ip_address,
              attempted_codes: codes,
              pattern: 'sequential'
            },
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Pattern check error:', error);
    }
  }
  
  /**
   * Create and send security alert
   */
  private async createAlert(alert: SecurityAlert) {
    try {
      // Check if we've already sent this alert recently
      const alertKey = `${alert.type}:${JSON.stringify(alert.details)}`;
      const lastAlert = this.alertCache.get(alertKey);
      
      if (lastAlert && (Date.now() - lastAlert.getTime()) < 3600000) {
        return; // Don't send duplicate alerts within 1 hour
      }
      
      // Save alert to database
      await dbRun(`
        INSERT INTO security_alerts (
          alert_type,
          severity,
          alert_message,
          metadata,
          created_at
        ) VALUES (?, ?, ?, ?, datetime('now'))
      `, [
        alert.type,
        alert.severity,
        alert.message,
        JSON.stringify(alert.details)
      ]);
      
      // Send email notification for high/critical alerts
      if (alert.severity === 'high' || alert.severity === 'critical') {
        await this.sendAlertEmail(alert);
      }
      
      // Emit event for real-time monitoring
      this.emit('securityAlert', alert);
      
      // Cache the alert
      this.alertCache.set(alertKey, new Date());
      
      console.log(`🚨 Security Alert: ${alert.type} - ${alert.message}`);
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  }
  
  /**
   * Send alert email
   */
  private async sendAlertEmail(alert: SecurityAlert) {
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${alert.severity === 'critical' ? '#FF0000' : '#FFA500'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🚨 Security Alert - ${alert.severity.toUpperCase()}</h2>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px;">
            <h3>${alert.type.replace(/_/g, ' ').toUpperCase()}</h3>
            <p style="font-size: 16px; color: #333;">${alert.message}</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <h4>Details:</h4>
              <pre style="font-size: 14px; color: #666;">
${JSON.stringify(alert.details, null, 2)}
              </pre>
            </div>
            
            <div style="margin-top: 20px;">
              <p><strong>Time:</strong> ${alert.timestamp.toISOString()}</p>
              <p><strong>Action Required:</strong> Please review the security dashboard</p>
            </div>
            
            <a href="${process.env.FRONTEND_URL}/admin/security" 
               style="display: inline-block; background: #0096FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px;">
              View Security Dashboard
            </a>
          </div>
        </div>
      `;
      
      await emailService.sendEmail({
        to: this.config.alertEmail,
        subject: `[${alert.severity.toUpperCase()}] Security Alert - ${alert.type}`,
        html: emailHtml,
        priority: 'high'
      });
    } catch (error) {
      console.error('Failed to send alert email:', error);
    }
  }
  
  /**
   * Block an IP address
   */
  private async blockIP(ipAddress: string, reason: string) {
    try {
      await dbRun(`
        INSERT INTO ip_blacklist (
          ip_address,
          reason,
          blocked_at,
          expires_at
        ) VALUES (?, ?, datetime('now'), datetime('now', '+24 hours'))
      `, [ipAddress, reason]);
      
      console.log(`🚫 Blocked IP: ${ipAddress} - ${reason}`);
    } catch (error) {
      console.error('Failed to block IP:', error);
    }
  }
  
  /**
   * Check if codes follow a sequential pattern
   */
  private areCodesSequential(codes: string[]): boolean {
    if (codes.length < 3) return false;
    
    // Extract numeric parts
    const numbers = codes.map(code => {
      const match = code.match(/\d+/);
      return match ? parseInt(match[0]) : null;
    }).filter(n => n !== null);
    
    if (numbers.length < 3) return false;
    
    // Check if numbers are sequential
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] - numbers[i - 1] !== 1) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get current security status
   */
  async getSecurityStatus() {
    try {
      const [activeAlerts, recentAttempts, blockedIPs] = await Promise.all([
        dbGet(`
          SELECT COUNT(*) as count 
          FROM security_alerts 
          WHERE resolved = 0 
            AND created_at > datetime('now', '-24 hours')
        `),
        dbGet(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
          FROM activation_attempts
          WHERE created_at > datetime('now', '-1 hour')
        `),
        dbGet(`
          SELECT COUNT(*) as count
          FROM ip_blacklist
          WHERE expires_at > datetime('now')
        `)
      ]);
      
      return {
        monitoring: this.monitoringInterval !== null,
        activeAlerts: activeAlerts?.count || 0,
        recentAttempts: {
          total: recentAttempts?.total || 0,
          failed: recentAttempts?.failed || 0
        },
        blockedIPs: blockedIPs?.count || 0,
        lastCheck: new Date()
      };
    } catch (error) {
      console.error('Failed to get security status:', error);
      return null;
    }
  }
}

// Create singleton instance
export const securityMonitoring = new SecurityMonitoringService();

// Start monitoring on service initialization
if (process.env.ENABLE_SECURITY_MONITORING !== 'false') {
  securityMonitoring.startMonitoring();
}