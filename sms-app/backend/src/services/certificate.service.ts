import { dbRun, dbAll, dbGet } from '../config/database.abstraction';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';

interface CertificateData {
  equipmentId: number;
  certificateType: string;
  certificateNumber: string;
  issuingAuthority: string;
  issuedDate: string;
  expiryDate: string;
  renewalPeriodDays?: number;
  warningDaysBeforeExpiry?: number;
  documentId?: number;
  notes?: string;
  vesselId: number;
}

interface CertificateRenewal {
  certificateId: number;
  newCertificateNumber: string;
  newExpiryDate: string;
  renewalCost?: number;
  renewalNotes?: string;
  documentId?: number;
  renewedBy: number;
}

export class CertificateService {
  // Create new certificate tracking record
  static async createCertificate(data: CertificateData, userId: number): Promise<number> {
    const result = await dbRun(`
      INSERT INTO certificate_tracking (
        equipment_id, certificate_type, certificate_number, issuing_authority,
        issued_date, expiry_date, renewal_period_days, warning_days_before_expiry,
        document_id, notes, created_by, vessel_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.equipmentId,
      data.certificateType,
      data.certificateNumber,
      data.issuingAuthority,
      data.issuedDate,
      data.expiryDate,
      data.renewalPeriodDays || 365,
      data.warningDaysBeforeExpiry || 30,
      data.documentId || null,
      data.notes || null,
      userId,
      data.vesselId
    ]);

    // Generate initial warnings if needed
    await this.generateWarningsForCertificate(result.lastID);

    return result.lastID;
  }

  // Renew certificate
  static async renewCertificate(renewal: CertificateRenewal): Promise<void> {
    // Get old certificate data
    const oldCert = await dbGet(`
      SELECT * FROM certificate_tracking WHERE id = ?
    `, [renewal.certificateId]);

    if (!oldCert) {
      throw new Error('Certificate not found');
    }

    // Create new certificate record
    const newCertId = await this.createCertificate({
      equipmentId: oldCert.equipment_id,
      certificateType: oldCert.certificate_type,
      certificateNumber: renewal.newCertificateNumber,
      issuingAuthority: oldCert.issuing_authority,
      issuedDate: new Date().toISOString().split('T')[0],
      expiryDate: renewal.newExpiryDate,
      renewalPeriodDays: oldCert.renewal_period_days,
      warningDaysBeforeExpiry: oldCert.warning_days_before_expiry,
      documentId: renewal.documentId,
      notes: renewal.renewalNotes,
      vesselId: oldCert.vessel_id
    }, renewal.renewedBy);

    // Update old certificate
    await dbRun(`
      UPDATE certificate_tracking 
      SET status = 'renewed', renewed_by_certificate_id = ?
      WHERE id = ?
    `, [newCertId, renewal.certificateId]);

    // Record renewal history
    await dbRun(`
      INSERT INTO certificate_renewals (
        certificate_id, old_certificate_number, new_certificate_number,
        old_expiry_date, new_expiry_date, renewed_by, renewal_cost,
        renewal_notes, document_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      renewal.certificateId,
      oldCert.certificate_number,
      renewal.newCertificateNumber,
      oldCert.expiry_date,
      renewal.newExpiryDate,
      renewal.renewedBy,
      renewal.renewalCost || null,
      renewal.renewalNotes || null,
      renewal.documentId || null
    ]);

    // Clear old warnings
    await dbRun(`
      UPDATE certificate_warnings 
      SET notification_sent = true, acknowledged = true
      WHERE certificate_id = ?
    `, [renewal.certificateId]);
  }

  // Generate warnings for a certificate
  static async generateWarningsForCertificate(certificateId: number): Promise<void> {
    const cert = await dbGet(`
      SELECT * FROM certificate_tracking WHERE id = ?
    `, [certificateId]);

    if (!cert || cert.status !== 'active') return;

    const expiryDate = new Date(cert.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const warningTypes = [
      { days: 90, type: '90_days' },
      { days: 60, type: '60_days' },
      { days: 30, type: '30_days' },
      { days: 14, type: '14_days' },
      { days: 7, type: '7_days' },
      { days: 0, type: 'expired' }
    ];

    for (const warning of warningTypes) {
      if (daysUntilExpiry <= warning.days) {
        await dbRun(`
          INSERT INTO certificate_warnings (
            certificate_id, warning_type, warning_date
          )
          VALUES (?, ?, CURRENT_DATE)
          ON CONFLICT (certificate_id, warning_type) DO NOTHING
        `, [certificateId, warning.type]);
      }
    }
  }

  // Check and send certificate warnings
  static async checkAndSendCertificateWarnings(): Promise<void> {
    // Get all pending warnings
    const warnings = await dbAll(`
      SELECT 
        cw.*,
        ct.certificate_number,
        ct.certificate_type,
        ct.expiry_date,
        ct.vessel_id,
        e.name as equipment_name,
        e.location as equipment_location,
        v.name as vessel_name
      FROM certificate_warnings cw
      JOIN certificate_tracking ct ON cw.certificate_id = ct.id
      JOIN equipment e ON ct.equipment_id = e.id
      JOIN vessels v ON ct.vessel_id = v.id
      WHERE cw.notification_sent = false
        AND ct.status = 'active'
      ORDER BY cw.warning_type DESC
    `);

    for (const warning of warnings) {
      await this.sendCertificateWarning(warning);
      
      // Mark warning as sent
      await dbRun(`
        UPDATE certificate_warnings 
        SET notification_sent = true, sent_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [warning.id]);
    }
  }

  // Send certificate warning notification
  private static async sendCertificateWarning(warning: any): Promise<void> {
    const daysUntilExpiry = Math.floor(
      (new Date(warning.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const urgency = warning.warning_type === 'expired' || warning.warning_type === '7_days' ? 'urgent' :
                   warning.warning_type === '14_days' || warning.warning_type === '30_days' ? 'high' : 'normal';

    // Get relevant users
    const users = await dbAll(`
      SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
      FROM users u
      WHERE u.is_active = true
        AND (
          u.role IN ('hse_manager', 'admin', 'manager', 'chief_engineer')
          OR (u.default_vessel_id = ? AND u.role IN ('second_engineer', 'third_engineer'))
        )
    `, [warning.vessel_id]);

    const title = warning.warning_type === 'expired' 
      ? `EXPIRED: ${warning.certificate_type} Certificate - ${warning.equipment_name}`
      : `Certificate Expiring: ${warning.equipment_name} - ${Math.abs(daysUntilExpiry)} days`;

    const message = warning.warning_type === 'expired'
      ? `The ${warning.certificate_type} certificate for ${warning.equipment_name} (${warning.equipment_location}) on ${warning.vessel_name} has EXPIRED. Immediate action required.`
      : `The ${warning.certificate_type} certificate for ${warning.equipment_name} (${warning.equipment_location}) on ${warning.vessel_name} will expire in ${Math.abs(daysUntilExpiry)} days on ${new Date(warning.expiry_date).toLocaleDateString()}.`;

    // Send notifications to all relevant users
    for (const user of users) {
      await NotificationService.sendNotification({
        userId: user.id,
        type: warning.warning_type === 'expired' ? 'certificate_expired' : 'certificate_warning',
        title,
        message,
        data: {
          certificateId: warning.certificate_id,
          equipmentName: warning.equipment_name,
          vesselName: warning.vessel_name,
          expiryDate: warning.expiry_date,
          warningType: warning.warning_type,
          link: `/equipment/${warning.equipment_id}/certificates`
        },
        priority: urgency,
        channels: urgency === 'urgent' ? ['in_app', 'email', 'push'] : ['in_app', 'email']
      });
    }
  }

  // Get certificate compliance for a vessel
  static async getVesselCertificateCompliance(vesselId: number): Promise<any> {
    const compliance = await dbGet(`
      SELECT * FROM certificate_compliance_status WHERE vessel_id = ?
    `, [vesselId]);

    const upcomingRenewals = await dbAll(`
      SELECT * FROM certificate_calendar 
      WHERE vessel_id = ? 
        AND urgency_status IN ('critical', 'warning', 'upcoming')
      ORDER BY expiry_date
      LIMIT 10
    `, [vesselId]);

    const recentRenewals = await dbAll(`
      SELECT 
        cr.*,
        ct.certificate_type,
        ct.equipment_id,
        e.name as equipment_name,
        u.first_name || ' ' || u.last_name as renewed_by_name
      FROM certificate_renewals cr
      JOIN certificate_tracking ct ON cr.certificate_id = ct.id
      JOIN equipment e ON ct.equipment_id = e.id
      JOIN users u ON cr.renewed_by = u.id
      WHERE ct.vessel_id = ?
      ORDER BY cr.renewal_date DESC
      LIMIT 5
    `, [vesselId]);

    return {
      compliance,
      upcomingRenewals,
      recentRenewals
    };
  }

  // Get certificates for equipment
  static async getEquipmentCertificates(equipmentId: number): Promise<any[]> {
    return await dbAll(`
      SELECT 
        ct.*,
        ed.file_name as document_name,
        ed.file_path as document_path,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM certificate_tracking ct
      LEFT JOIN equipment_documents ed ON ct.document_id = ed.id
      LEFT JOIN users u ON ct.created_by = u.id
      WHERE ct.equipment_id = ?
      ORDER BY ct.status = 'active' DESC, ct.expiry_date DESC
    `, [equipmentId]);
  }

  // Get certificate warnings summary
  static async getCertificateWarningsSummary(vesselId?: number): Promise<any> {
    let query = `
      SELECT 
        warning_type,
        COUNT(*) as count,
        COUNT(CASE WHEN notification_sent = false THEN 1 END) as unsent_count,
        COUNT(CASE WHEN acknowledged = false THEN 1 END) as unacknowledged_count
      FROM certificate_warnings cw
      JOIN certificate_tracking ct ON cw.certificate_id = ct.id
      WHERE ct.status = 'active'
    `;

    const params: any[] = [];
    if (vesselId) {
      query += ` AND ct.vessel_id = ?`;
      params.push(vesselId);
    }

    query += ` GROUP BY warning_type ORDER BY 
      CASE warning_type
        WHEN 'expired' THEN 1
        WHEN '7_days' THEN 2
        WHEN '14_days' THEN 3
        WHEN '30_days' THEN 4
        WHEN '60_days' THEN 5
        WHEN '90_days' THEN 6
      END`;

    return await dbAll(query, params);
  }

  // Acknowledge certificate warning
  static async acknowledgeCertificateWarning(warningId: number, userId: number): Promise<void> {
    await dbRun(`
      UPDATE certificate_warnings
      SET acknowledged = true, 
          acknowledged_by = ?, 
          acknowledged_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [userId, warningId]);
  }

  // Get certificate calendar events for a date range
  static async getCertificateCalendarEvents(startDate: string, endDate: string, vesselId?: number): Promise<any[]> {
    let query = `
      SELECT 
        cc.*,
        'certificate_expiry' as event_type,
        cc.expiry_date as event_date,
        CASE 
          WHEN cc.urgency_status = 'expired' THEN '#dc3545'
          WHEN cc.urgency_status = 'critical' THEN '#fd7e14'
          WHEN cc.urgency_status = 'warning' THEN '#ffc107'
          WHEN cc.urgency_status = 'upcoming' THEN '#0dcaf0'
          ELSE '#198754'
        END as event_color
      FROM certificate_calendar cc
      WHERE cc.expiry_date BETWEEN ? AND ?
    `;

    const params: any[] = [startDate, endDate];

    if (vesselId) {
      query += ` AND cc.vessel_id = ?`;
      params.push(vesselId);
    }

    query += ` ORDER BY cc.expiry_date`;

    return await dbAll(query, params);
  }

  // Bulk update certificate warnings (run daily)
  static async updateAllCertificateWarnings(): Promise<void> {
    // PostgreSQL version
    await dbRun(`SELECT generate_certificate_warnings()`);
    
    // Send notifications for new warnings
    await this.checkAndSendCertificateWarnings();
  }
}