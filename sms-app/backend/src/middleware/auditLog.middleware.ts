import { Request, Response, NextFunction } from 'express';
import { dbRun } from '../config/database';
import crypto from 'crypto';

// Interface for audit log entry
interface AuditLogEntry {
  action: string;
  resource_type: string;
  resource_id?: string;
  user_id?: number;
  ip_address: string;
  user_agent?: string;
  request_method: string;
  request_path: string;
  request_body?: any;
  response_status?: number;
  response_time_ms?: number;
  error_message?: string;
  metadata?: any;
}

// Action types that should be audited
const AUDITABLE_ACTIONS = [
  'activation_code_generate',
  'activation_code_validate',
  'activation_code_use',
  'activation_code_regenerate',
  'activation_code_extend',
  'activation_code_revoke',
  'activation_help_request',
  'company_create',
  'company_update',
  'user_create',
  'user_login',
  'user_logout',
  'payment_webhook',
  'security_alert'
];

// Sensitive fields to redact
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'password_hash',
  'credit_card',
  'cvv',
  'ssn',
  'social_security',
  'api_key',
  'secret_key',
  'access_token',
  'refresh_token'
];

// Redact sensitive information
function redactSensitiveData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const redacted = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key in redacted) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }
  
  return redacted;
}

// Generate request ID
function generateRequestId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Audit log middleware factory
export function createAuditLog(action: string, resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    // Attach request ID to request object
    (req as any).requestId = requestId;
    
    // Get client information
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];
    const userId = (req as any).user?.id;
    
    // Store original methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;
    
    // Wrap response methods to capture response data
    const captureResponse = (body: any) => {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      // Determine resource ID from request
      let resourceId = req.params.id || req.params.code;
      if (!resourceId && req.body) {
        resourceId = req.body.id || req.body.code || req.body.company_id;
      }
      
      // Create audit log entry
      const logEntry: AuditLogEntry = {
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        user_id: userId,
        ip_address: clientIp,
        user_agent: userAgent,
        request_method: req.method,
        request_path: req.originalUrl,
        request_body: redactSensitiveData(req.body),
        response_status: statusCode,
        response_time_ms: responseTime,
        metadata: {
          request_id: requestId,
          headers: redactSensitiveData(req.headers),
          query: req.query,
          params: req.params
        }
      };
      
      // Add error message if status indicates error
      if (statusCode >= 400 && body) {
        try {
          const errorData = typeof body === 'string' ? JSON.parse(body) : body;
          logEntry.error_message = errorData.error || errorData.message;
        } catch {
          logEntry.error_message = 'Unknown error';
        }
      }
      
      // Write to audit log
      writeAuditLog(logEntry).catch(error => {
        console.error('Failed to write audit log:', error);
      });
    };
    
    // Override response methods
    res.send = function(body: any) {
      captureResponse(body);
      return originalSend.call(this, body);
    };
    
    res.json = function(body: any) {
      captureResponse(body);
      return originalJson.call(this, body);
    };
    
    res.end = function(...args: any[]) {
      captureResponse(args[0]);
      return originalEnd.apply(this, args);
    };
    
    next();
  };
}

// Write audit log to database
async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await dbRun(`
      INSERT INTO audit_logs (
        action,
        resource_type,
        resource_id,
        user_id,
        ip_address,
        user_agent,
        request_method,
        request_path,
        request_body,
        response_status,
        response_time_ms,
        error_message,
        metadata,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      entry.action,
      entry.resource_type,
      entry.resource_id,
      entry.user_id,
      entry.ip_address,
      entry.user_agent,
      entry.request_method,
      entry.request_path,
      JSON.stringify(entry.request_body),
      entry.response_status,
      entry.response_time_ms,
      entry.error_message,
      JSON.stringify(entry.metadata)
    ]);
  } catch (error) {
    console.error('Audit log write error:', error);
    throw error;
  }
}

// Query audit logs
export async function queryAuditLogs(filters: {
  action?: string;
  resourceType?: string;
  resourceId?: string;
  userId?: number;
  ipAddress?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];
    
    if (filters.action) {
      query += ' AND action = ?';
      params.push(filters.action);
    }
    
    if (filters.resourceType) {
      query += ' AND resource_type = ?';
      params.push(filters.resourceType);
    }
    
    if (filters.resourceId) {
      query += ' AND resource_id = ?';
      params.push(filters.resourceId);
    }
    
    if (filters.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }
    
    if (filters.ipAddress) {
      query += ' AND ip_address = ?';
      params.push(filters.ipAddress);
    }
    
    if (filters.startDate) {
      query += ' AND created_at >= ?';
      params.push(filters.startDate.toISOString());
    }
    
    if (filters.endDate) {
      query += ' AND created_at <= ?';
      params.push(filters.endDate.toISOString());
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }
    
    const { dbAll } = await import('../config/database');
    return await dbAll(query, params);
  } catch (error) {
    console.error('Query audit logs error:', error);
    throw error;
  }
}

// Get audit log statistics
export async function getAuditLogStats(days: number = 30) {
  try {
    const { dbGet, dbAll } = await import('../config/database');
    
    const stats = await dbGet(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT action) as unique_actions,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(response_time_ms) as avg_response_time,
        MAX(response_time_ms) as max_response_time,
        SUM(CASE WHEN response_status >= 400 THEN 1 ELSE 0 END) as error_count,
        SUM(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 ELSE 0 END) as success_count
      FROM audit_logs
      WHERE created_at > datetime('now', '-${days} days')
    `);
    
    const topActions = await dbAll(`
      SELECT 
        action,
        COUNT(*) as count,
        AVG(response_time_ms) as avg_response_time,
        SUM(CASE WHEN response_status >= 400 THEN 1 ELSE 0 END) as error_count
      FROM audit_logs
      WHERE created_at > datetime('now', '-${days} days')
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `);
    
    const topIps = await dbAll(`
      SELECT 
        ip_address,
        COUNT(*) as request_count,
        COUNT(DISTINCT action) as unique_actions,
        SUM(CASE WHEN response_status >= 400 THEN 1 ELSE 0 END) as error_count
      FROM audit_logs
      WHERE created_at > datetime('now', '-${days} days')
      GROUP BY ip_address
      ORDER BY request_count DESC
      LIMIT 10
    `);
    
    return {
      summary: stats,
      topActions,
      topIps
    };
  } catch (error) {
    console.error('Get audit log stats error:', error);
    throw error;
  }
}

// Cleanup old audit logs
export async function cleanupOldAuditLogs(retentionDays: number = 90) {
  try {
    const { dbRun } = await import('../config/database');
    
    const result = await dbRun(`
      DELETE FROM audit_logs
      WHERE created_at < datetime('now', '-${retentionDays} days')
    `);
    
    console.log(`Cleaned up ${result.changes} old audit log entries`);
    return result.changes;
  } catch (error) {
    console.error('Cleanup audit logs error:', error);
    throw error;
  }
}

// Export specific audit log middleware
export const auditActivationGenerate = createAuditLog('activation_code_generate', 'activation_code');
export const auditActivationValidate = createAuditLog('activation_code_validate', 'activation_code');
export const auditActivationUse = createAuditLog('activation_code_use', 'activation_code');
export const auditActivationRegenerate = createAuditLog('activation_code_regenerate', 'activation_code');
export const auditActivationExtend = createAuditLog('activation_code_extend', 'activation_code');
export const auditActivationRevoke = createAuditLog('activation_code_revoke', 'activation_code');
export const auditActivationHelp = createAuditLog('activation_help_request', 'activation_help');
export const auditUserLogin = createAuditLog('user_login', 'user');
export const auditPaymentWebhook = createAuditLog('payment_webhook', 'payment');