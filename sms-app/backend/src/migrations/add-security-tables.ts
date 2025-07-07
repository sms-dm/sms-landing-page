import { dbRun } from '../config/database';

export async function up() {
  console.log('Creating security tables...');
  
  // Create activation attempts table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS activation_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      success INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_activation_attempts_ip (ip_address),
      INDEX idx_activation_attempts_code (code),
      INDEX idx_activation_attempts_created (created_at)
    )
  `);
  
  // Create security alerts table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS security_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_type TEXT NOT NULL,
      alert_message TEXT NOT NULL,
      severity TEXT DEFAULT 'medium',
      metadata TEXT,
      resolved INTEGER DEFAULT 0,
      resolved_by INTEGER,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_security_alerts_type (alert_type),
      INDEX idx_security_alerts_created (created_at),
      INDEX idx_security_alerts_resolved (resolved)
    )
  `);
  
  // Create audit logs table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      user_id INTEGER,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      request_method TEXT,
      request_path TEXT,
      request_body TEXT,
      response_status INTEGER,
      response_time_ms INTEGER,
      error_message TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_logs_action (action),
      INDEX idx_audit_logs_resource (resource_type, resource_id),
      INDEX idx_audit_logs_user (user_id),
      INDEX idx_audit_logs_ip (ip_address),
      INDEX idx_audit_logs_created (created_at)
    )
  `);
  
  // Create activation audit logs table (specific to activation events)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS activation_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      fingerprint TEXT,
      request_body TEXT,
      response_status INTEGER,
      response_time_ms INTEGER,
      success INTEGER DEFAULT 0,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_activation_audit_action (action),
      INDEX idx_activation_audit_ip (ip_address),
      INDEX idx_activation_audit_fingerprint (fingerprint),
      INDEX idx_activation_audit_created (created_at)
    )
  `);
  
  // Add security columns to activation_codes table if they don't exist
  await dbRun(`
    ALTER TABLE activation_codes ADD COLUMN last_attempt_at DATETIME
  `).catch(() => console.log('Column last_attempt_at already exists'));
  
  await dbRun(`
    ALTER TABLE activation_codes ADD COLUMN attempt_count INTEGER DEFAULT 0
  `).catch(() => console.log('Column attempt_count already exists'));
  
  await dbRun(`
    ALTER TABLE activation_codes ADD COLUMN locked_until DATETIME
  `).catch(() => console.log('Column locked_until already exists'));
  
  await dbRun(`
    ALTER TABLE activation_codes ADD COLUMN suspicious_activity INTEGER DEFAULT 0
  `).catch(() => console.log('Column suspicious_activity already exists'));
  
  // Add IP tracking to activation_help_logs if not exists
  await dbRun(`
    ALTER TABLE activation_help_logs ADD COLUMN fingerprint TEXT
  `).catch(() => console.log('Column fingerprint already exists'));
  
  console.log('Security tables created successfully');
}

export async function down() {
  console.log('Dropping security tables...');
  
  await dbRun('DROP TABLE IF EXISTS activation_attempts');
  await dbRun('DROP TABLE IF EXISTS security_alerts');
  await dbRun('DROP TABLE IF EXISTS audit_logs');
  await dbRun('DROP TABLE IF EXISTS activation_audit_logs');
  
  console.log('Security tables dropped successfully');
}