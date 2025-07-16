import { dbRun, dbAll, dbGet } from '../config/database.abstraction';
// CSV generation would use csv-writer package when installed
// import { createObjectCsvStringifier } from 'csv-writer';

export class HseService {
  // Valid enum values
  private static readonly UPDATE_TYPES = [
    'safety_alert', 'procedure_update', 'incident_report', 
    'best_practice', 'regulatory_update', 'training'
  ];
  
  private static readonly SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'];
  
  private static readonly SCOPES = ['fleet', 'vessel', 'department'];

  // Validation methods
  static isValidUpdateType(type: string): boolean {
    return this.UPDATE_TYPES.includes(type);
  }

  static isValidSeverity(severity: string): boolean {
    return this.SEVERITIES.includes(severity);
  }

  static isValidScope(scope: string): boolean {
    return this.SCOPES.includes(scope);
  }

  // Permission checks
  static canViewAcknowledgments(userRole: string): boolean {
    return ['hse', 'hse_manager', 'admin', 'manager'].includes(userRole);
  }

  static canCreateHseUpdate(userRole: string): boolean {
    return ['hse', 'hse_manager', 'admin', 'manager'].includes(userRole);
  }

  // Get acknowledgment statistics
  static async getAcknowledgmentStats(updateId: number, update: any): Promise<any> {
    // Get target audience count based on scope
    let targetQuery = `SELECT COUNT(DISTINCT u.id) as count FROM users u WHERE u.is_active = true`;
    const targetParams: any[] = [];
    
    if (update.scope === 'vessel' && update.vessel_id) {
      targetQuery += ` AND u.default_vessel_id = ?`;
      targetParams.push(update.vessel_id);
    } else if (update.scope === 'department' && update.department) {
      targetQuery += ` AND u.department = ?`;
      targetParams.push(update.department);
    }
    
    const targetAudience = await dbGet(targetQuery, targetParams);
    
    // Get acknowledgment count
    const ackCount = await dbGet(`
      SELECT COUNT(*) as count FROM hse_acknowledgments 
      WHERE hse_update_id = ?
    `, [updateId]);
    
    // Get acknowledgments by department
    const byDepartment = await dbAll(`
      SELECT u.department, COUNT(*) as count
      FROM hse_acknowledgments ha
      JOIN users u ON ha.user_id = u.id
      WHERE ha.hse_update_id = ?
      GROUP BY u.department
      ORDER BY count DESC
    `, [updateId]);
    
    // Get acknowledgments by vessel
    const byVessel = await dbAll(`
      SELECT v.name as vessel_name, COUNT(*) as count
      FROM hse_acknowledgments ha
      JOIN users u ON ha.user_id = u.id
      LEFT JOIN vessels v ON u.default_vessel_id = v.id
      WHERE ha.hse_update_id = ?
      GROUP BY v.id
      ORDER BY count DESC
    `, [updateId]);
    
    // Get acknowledgment timeline
    const timeline = await dbAll(`
      SELECT 
        DATE(acknowledged_at) as date,
        COUNT(*) as count
      FROM hse_acknowledgments
      WHERE hse_update_id = ?
      GROUP BY DATE(acknowledged_at)
      ORDER BY date
    `, [updateId]);
    
    // Calculate compliance rate
    const complianceRate = targetAudience.count > 0 
      ? Math.round((ackCount.count / targetAudience.count) * 100) 
      : 0;
    
    // Check if past deadline
    let isPastDeadline = false;
    let deadlineComplianceRate = null;
    
    if (update.acknowledgment_deadline) {
      isPastDeadline = new Date(update.acknowledgment_deadline) < new Date();
      
      if (isPastDeadline) {
        // Get acknowledgments before deadline
        const beforeDeadline = await dbGet(`
          SELECT COUNT(*) as count 
          FROM hse_acknowledgments 
          WHERE hse_update_id = ? AND acknowledged_at <= ?
        `, [updateId, update.acknowledgment_deadline]);
        
        deadlineComplianceRate = targetAudience.count > 0 
          ? Math.round((beforeDeadline.count / targetAudience.count) * 100) 
          : 0;
      }
    }
    
    return {
      updateId,
      targetAudience: targetAudience.count,
      acknowledged: ackCount.count,
      pending: targetAudience.count - ackCount.count,
      complianceRate,
      isPastDeadline,
      deadlineComplianceRate,
      byDepartment,
      byVessel,
      timeline
    };
  }

  // Get non-acknowledged users
  static async getNonAcknowledgedUsers(updateId: number, update: any): Promise<any[]> {
    let query = `
      SELECT u.id, u.name, u.email, u.department, u.role, v.name as vessel_name
      FROM users u
      LEFT JOIN vessels v ON u.default_vessel_id = v.id
      WHERE u.is_active = true
        AND u.id NOT IN (
          SELECT user_id FROM hse_acknowledgments WHERE hse_update_id = ?
        )
    `;
    
    const params: any[] = [updateId];
    
    // Apply scope filters
    if (update.scope === 'vessel' && update.vessel_id) {
      query += ` AND u.default_vessel_id = ?`;
      params.push(update.vessel_id);
    } else if (update.scope === 'department' && update.department) {
      query += ` AND u.department = ?`;
      params.push(update.department);
    }
    
    query += ` ORDER BY u.department, u.name`;
    
    return await dbAll(query, params);
  }

  // Get non-acknowledged user IDs
  static async getNonAcknowledgedUserIds(updateId: number, update: any): Promise<number[]> {
    const users = await this.getNonAcknowledgedUsers(updateId, update);
    return users.map(u => u.id);
  }

  // Create HSE channel message
  static async createHseChannelMessage(hseUpdate: any, creator: any): Promise<void> {
    const channelId = parseInt(process.env.HSE_CHANNEL_ID || '0');
    if (!channelId) return;
    
    const severityEmoji = {
      'critical': '🚨',
      'high': '⚠️',
      'medium': '📢',
      'low': 'ℹ️',
      'info': '💡'
    };
    
    const typeLabel = {
      'safety_alert': 'Safety Alert',
      'procedure_update': 'Procedure Update',
      'incident_report': 'Incident Report',
      'best_practice': 'Best Practice',
      'regulatory_update': 'Regulatory Update',
      'training': 'Training'
    };
    
    const emoji = severityEmoji[hseUpdate.severity] || '📌';
    const type = typeLabel[hseUpdate.update_type] || hseUpdate.update_type;
    
    let content = `${emoji} **New HSE Update: ${type}**\n\n`;
    content += `**${hseUpdate.title}**\n\n`;
    content += `${hseUpdate.content}\n\n`;
    content += `Severity: ${hseUpdate.severity.toUpperCase()}\n`;
    
    if (hseUpdate.requires_acknowledgment) {
      content += `⚠️ **This update requires acknowledgment**`;
      if (hseUpdate.acknowledgment_deadline) {
        content += ` by ${new Date(hseUpdate.acknowledgment_deadline).toLocaleDateString()}`;
      }
      content += '\n';
    }
    
    content += `\nView full details: /hse/${hseUpdate.id}`;
    
    await dbRun(`
      INSERT INTO messages (
        channel_id, sender_id, content, message_type, is_system
      )
      VALUES (?, ?, ?, 'hse_update', false)
    `, [channelId, creator.id, content]);
  }

  // Get HSE statistics
  static async getStatistics(options: {
    period: number;
    vessel_id?: string;
    department?: string;
    user: any;
  }): Promise<any> {
    const dateFilter = `datetime('now', '-${options.period} days')`;
    const params: any[] = [];
    
    let vesselFilter = '';
    let departmentFilter = '';
    
    if (options.vessel_id) {
      vesselFilter = ' AND h.vessel_id = ?';
      params.push(options.vessel_id);
    }
    
    if (options.department) {
      departmentFilter = ' AND h.department = ?';
      params.push(options.department);
    }
    
    // Total updates by type
    const updatesByType = await dbAll(`
      SELECT 
        update_type,
        COUNT(*) as count
      FROM hse_updates h
      WHERE h.created_at > ${dateFilter}
        ${vesselFilter}
        ${departmentFilter}
      GROUP BY update_type
    `, params);
    
    // Updates by severity
    const updatesBySeverity = await dbAll(`
      SELECT 
        severity,
        COUNT(*) as count
      FROM hse_updates h
      WHERE h.created_at > ${dateFilter}
        ${vesselFilter}
        ${departmentFilter}
      GROUP BY severity
      ORDER BY 
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          WHEN 'info' THEN 5
        END
    `, params);
    
    // Acknowledgment compliance
    const complianceStats = await dbGet(`
      SELECT 
        COUNT(DISTINCT h.id) as total_requiring_ack,
        COUNT(DISTINCT CASE WHEN ack_rate.rate = 100 THEN h.id END) as fully_acknowledged,
        AVG(COALESCE(ack_rate.rate, 0)) as avg_compliance_rate
      FROM hse_updates h
      LEFT JOIN (
        SELECT 
          ha.hse_update_id,
          (COUNT(DISTINCT ha.user_id) * 100.0 / NULLIF(target.count, 0)) as rate
        FROM hse_acknowledgments ha
        JOIN hse_updates hu ON ha.hse_update_id = hu.id
        JOIN (
          SELECT h2.id, COUNT(DISTINCT u.id) as count
          FROM hse_updates h2
          CROSS JOIN users u
          WHERE u.is_active = true
            AND (
              (h2.scope = 'fleet') OR
              (h2.scope = 'vessel' AND u.default_vessel_id = h2.vessel_id) OR
              (h2.scope = 'department' AND u.department = h2.department)
            )
          GROUP BY h2.id
        ) target ON hu.id = target.id
        GROUP BY ha.hse_update_id
      ) ack_rate ON h.id = ack_rate.hse_update_id
      WHERE h.requires_acknowledgment = true
        AND h.created_at > ${dateFilter}
        ${vesselFilter}
        ${departmentFilter}
    `, params);
    
    // Active updates
    const activeUpdates = await dbGet(`
      SELECT COUNT(*) as count
      FROM hse_updates h
      WHERE h.is_active = true
        AND (h.expires_at IS NULL OR h.expires_at > CURRENT_TIMESTAMP)
        ${vesselFilter}
        ${departmentFilter}
    `, params);
    
    // Top contributors
    const topContributors = await dbAll(`
      SELECT 
        u.name,
        u.department,
        COUNT(h.id) as update_count
      FROM hse_updates h
      JOIN users u ON h.created_by = u.id
      WHERE h.created_at > ${dateFilter}
        ${vesselFilter}
        ${departmentFilter}
      GROUP BY u.id
      ORDER BY update_count DESC
      LIMIT 5
    `, params);
    
    // Updates over time
    const updatesOverTime = await dbAll(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM hse_updates h
      WHERE h.created_at > ${dateFilter}
        ${vesselFilter}
        ${departmentFilter}
      GROUP BY DATE(created_at)
      ORDER BY date
    `, params);
    
    return {
      period: options.period,
      filters: {
        vessel_id: options.vessel_id,
        department: options.department
      },
      updatesByType,
      updatesBySeverity,
      complianceStats,
      activeUpdates: activeUpdates.count,
      topContributors,
      updatesOverTime
    };
  }

  // Generate HSE report
  static async generateReport(options: {
    format: string;
    filters: any;
    user: any;
  }): Promise<any> {
    let query = `
      SELECT 
        h.*,
        u.name as creator_name,
        v.name as vessel_name,
        (
          SELECT COUNT(*) FROM hse_acknowledgments 
          WHERE hse_update_id = h.id
        ) as acknowledgment_count
      FROM hse_updates h
      JOIN users u ON h.created_by = u.id
      LEFT JOIN vessels v ON h.vessel_id = v.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // Apply filters
    if (options.filters.start_date) {
      query += ` AND h.created_at >= ?`;
      params.push(options.filters.start_date);
    }
    
    if (options.filters.end_date) {
      query += ` AND h.created_at <= ?`;
      params.push(options.filters.end_date);
    }
    
    if (options.filters.severity) {
      query += ` AND h.severity = ?`;
      params.push(options.filters.severity);
    }
    
    if (options.filters.update_type) {
      query += ` AND h.update_type = ?`;
      params.push(options.filters.update_type);
    }
    
    query += ` ORDER BY h.created_at DESC`;
    
    const updates = await dbAll(query, params);
    
    if (options.format === 'csv') {
      // Simple CSV generation without external library
      const headers = ['ID', 'Title', 'Type', 'Severity', 'Scope', 'Vessel', 'Department', 'Created By', 'Created Date', 'Requires Ack', 'Ack Count'];
      const rows = updates.map(u => [
        u.id,
        `"${u.title.replace(/"/g, '""')}"`,
        u.update_type,
        u.severity,
        u.scope,
        u.vessel_name || '',
        u.department || '',
        u.creator_name,
        u.created_at,
        u.requires_acknowledgment ? 'Yes' : 'No',
        u.acknowledgment_count
      ]);
      
      const csvData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      return {
        contentType: 'text/csv',
        filename: `hse_report_${new Date().toISOString().split('T')[0]}.csv`,
        data: csvData
      };
    } else {
      // JSON format
      return {
        contentType: 'application/json',
        filename: `hse_report_${new Date().toISOString().split('T')[0]}.json`,
        data: JSON.stringify({
          generated_at: new Date().toISOString(),
          generated_by: options.user.name,
          filters: options.filters,
          update_count: updates.length,
          updates
        }, null, 2)
      };
    }
  }

  // Check for pending acknowledgments
  static async checkPendingAcknowledgments(userId: number): Promise<any[]> {
    return await dbAll(`
      SELECT h.*, v.name as vessel_name
      FROM hse_updates h
      LEFT JOIN vessels v ON h.vessel_id = v.id
      WHERE h.requires_acknowledgment = true
        AND h.is_active = true
        AND (h.expires_at IS NULL OR h.expires_at > CURRENT_TIMESTAMP)
        AND h.id NOT IN (
          SELECT hse_update_id FROM hse_acknowledgments WHERE user_id = ?
        )
        AND (
          (h.scope = 'fleet') OR
          (h.scope = 'vessel' AND h.vessel_id = (
            SELECT default_vessel_id FROM users WHERE id = ?
          )) OR
          (h.scope = 'department' AND h.department = (
            SELECT department FROM users WHERE id = ?
          ))
        )
      ORDER BY h.severity DESC, h.created_at DESC
    `, [userId, userId, userId]);
  }
}