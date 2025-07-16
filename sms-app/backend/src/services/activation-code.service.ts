import { dbRun, dbGet, dbAll } from '../config/database';
import { emailQueueService } from './email-queue.service';
import * as crypto from 'crypto';

interface ActivationCode {
  id: number;
  company_id: number;
  code: string;
  expires_at: string;
  activated_at?: string;
  reminder_sent_at?: string;
  expired_notification_sent: boolean;
}

interface Company {
  id: number;
  name: string;
  contact_email?: string;
  contact_name?: string;
}

class ActivationCodeService {
  // Generate a unique activation code
  private generateCode(): string {
    // Generate 6-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Format as XXX-XXX
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  }

  // Create activation code for a company
  async createActivationCode(companyId: number, expiryDays: number = 30): Promise<string> {
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    // Try to generate a unique code
    while (attempts < maxAttempts) {
      code = this.generateCode();
      
      // Check if code exists
      const existing = await dbGet(
        'SELECT id FROM activation_codes WHERE code = ?',
        [code]
      );

      if (!existing) {
        break;
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique activation code');
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Insert activation code
    await dbRun(`
      INSERT INTO activation_codes (company_id, code, expires_at)
      VALUES (?, ?, ?)
    `, [companyId, code!, expiresAt.toISOString()]);

    console.log(`✅ Activation code created: ${code} for company ${companyId}`);
    return code!;
  }

  // Send activation code email
  async sendActivationCode(
    companyId: number, 
    recipientEmail: string,
    recipientName: string,
    portalUrl: string = process.env.FRONTEND_URL || 'http://localhost:3000'
  ): Promise<void> {
    // Get or create activation code
    let activationCode = await dbGet(`
      SELECT * FROM activation_codes
      WHERE company_id = ? 
        AND activated_at IS NULL
        AND expires_at > datetime('now')
      ORDER BY created_at DESC
      LIMIT 1
    `, [companyId]) as ActivationCode | undefined;

    if (!activationCode) {
      // Create new activation code
      const code = await this.createActivationCode(companyId);
      activationCode = await dbGet(
        'SELECT * FROM activation_codes WHERE code = ?',
        [code]
      ) as ActivationCode;
    }

    // Get company details
    const company = await dbGet(
      'SELECT * FROM companies WHERE id = ?',
      [companyId]
    ) as Company;

    // Queue activation email
    await emailQueueService.queueEmail({
      to: recipientEmail,
      templateName: 'activation-code',
      templateData: {
        companyName: company.name,
        activationCode: activationCode.code,
        expiryDate: new Date(activationCode.expires_at),
        contactName: recipientName,
        portalUrl: `${portalUrl}/activate?code=${activationCode.code}`
      },
      priority: 'high'
    });
  }

  // Check and send activation reminders
  async sendActivationReminders(): Promise<number> {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    // Find codes expiring in 2 days that haven't been reminded
    const expiringCodes = await dbAll(`
      SELECT 
        ac.*,
        c.name as company_name,
        c.contact_email,
        c.contact_name
      FROM activation_codes ac
      JOIN companies c ON ac.company_id = c.id
      WHERE ac.activated_at IS NULL
        AND ac.reminder_sent_at IS NULL
        AND ac.expires_at > datetime('now')
        AND ac.expires_at <= ?
    `, [twoDaysFromNow.toISOString()]) as Array<ActivationCode & {
      company_name: string;
      contact_email?: string;
      contact_name?: string;
    }>;

    let sentCount = 0;

    for (const code of expiringCodes) {
      if (!code.contact_email) continue;

      const expiryDate = new Date(code.expires_at);
      const daysRemaining = Math.ceil(
        (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      // Queue reminder email
      await emailQueueService.queueEmail({
        to: code.contact_email,
        templateName: 'activation-reminder',
        templateData: {
          companyName: code.company_name,
          activationCode: code.code,
          expiryDate: expiryDate,
          contactName: code.contact_name || 'there',
          portalUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
          daysRemaining
        },
        priority: 'high'
      });

      // Update reminder sent timestamp
      await dbRun(`
        UPDATE activation_codes
        SET reminder_sent_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `, [code.id]);

      sentCount++;
    }

    return sentCount;
  }

  // Check and send expiry notifications
  async sendExpiryNotifications(): Promise<number> {
    // Find expired codes that haven't been notified
    const expiredCodes = await dbAll(`
      SELECT 
        ac.*,
        c.name as company_name,
        c.contact_email,
        c.contact_name
      FROM activation_codes ac
      JOIN companies c ON ac.company_id = c.id
      WHERE ac.activated_at IS NULL
        AND ac.expired_notification_sent = 0
        AND ac.expires_at < datetime('now')
    `) as Array<ActivationCode & {
      company_name: string;
      contact_email?: string;
      contact_name?: string;
    }>;

    let sentCount = 0;

    for (const code of expiredCodes) {
      if (!code.contact_email) continue;

      // Queue expiry notification
      await emailQueueService.queueEmail({
        to: code.contact_email,
        templateName: 'activation-expired',
        templateData: {
          companyName: code.company_name,
          contactName: code.contact_name || 'there',
          originalCode: code.code,
          expiredDate: new Date(code.expires_at),
          supportEmail: 'support@smartmaintenancesystems.com',
          supportPhone: '+1 (555) 123-4567'
        },
        priority: 'normal'
      });

      // Mark as notified
      await dbRun(`
        UPDATE activation_codes
        SET expired_notification_sent = 1,
            updated_at = datetime('now')
        WHERE id = ?
      `, [code.id]);

      sentCount++;
    }

    return sentCount;
  }

  // Regenerate activation code
  async regenerateActivationCode(
    companyId: number,
    reason: string,
    extendTrial: boolean = false
  ): Promise<string> {
    // Create new activation code
    const newCode = await this.createActivationCode(
      companyId,
      extendTrial ? 60 : 30 // 60 days if extended, 30 otherwise
    );

    // Get company details
    const company = await dbGet(`
      SELECT c.*, c.contact_email, c.contact_name
      FROM companies c
      WHERE c.id = ?
    `, [companyId]) as Company;

    if (company.contact_email) {
      // Queue regeneration email
      await emailQueueService.queueEmail({
        to: company.contact_email,
        templateName: 'activation-regenerated',
        templateData: {
          companyName: company.name,
          newActivationCode: newCode,
          expiryDate: new Date(Date.now() + (extendTrial ? 60 : 30) * 24 * 60 * 60 * 1000),
          contactName: company.contact_name || 'there',
          portalUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
          reason,
          extendedTrial: extendTrial
        },
        priority: 'high'
      });
    }

    return newCode;
  }

  // Validate activation code
  async validateActivationCode(code: string): Promise<{
    valid: boolean;
    companyId?: number;
    error?: string;
  }> {
    const activationCode = await dbGet(`
      SELECT * FROM activation_codes
      WHERE code = ?
    `, [code]) as ActivationCode | undefined;

    if (!activationCode) {
      return { valid: false, error: 'Invalid activation code' };
    }

    if (activationCode.activated_at) {
      return { valid: false, error: 'Activation code already used' };
    }

    if (new Date(activationCode.expires_at) < new Date()) {
      return { valid: false, error: 'Activation code expired' };
    }

    return { valid: true, companyId: activationCode.company_id };
  }

  // Activate code
  async activateCode(code: string): Promise<void> {
    await dbRun(`
      UPDATE activation_codes
      SET activated_at = datetime('now'),
          updated_at = datetime('now')
      WHERE code = ?
    `, [code]);
  }

  // Send team invitation
  async sendTeamInvitation(params: {
    inviteeName: string;
    inviteeEmail: string;
    inviterName: string;
    companyName: string;
    role: string;
    invitationToken: string;
    vesselCount?: number;
  }): Promise<void> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days to accept

    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    await emailQueueService.queueEmail({
      to: params.inviteeEmail,
      templateName: 'team-invitation',
      templateData: {
        inviteeName: params.inviteeName,
        inviterName: params.inviterName,
        companyName: params.companyName,
        role: params.role,
        invitationUrl: `${portalUrl}/accept-invitation?token=${params.invitationToken}`,
        expiryDate,
        vesselCount: params.vesselCount,
        features: this.getRoleFeatures(params.role)
      },
      priority: 'normal'
    });
  }

  // Get role-specific features for email
  private getRoleFeatures(role: string): string[] {
    const features: { [key: string]: string[] } = {
      admin: [
        'Full system administration access',
        'Manage all users and permissions',
        'Configure company settings',
        'Access all vessels and equipment',
        'Generate executive reports'
      ],
      manager: [
        'Manage vessel maintenance schedules',
        'Assign and track work orders',
        'View team performance metrics',
        'Approve parts requisitions',
        'Generate compliance reports'
      ],
      engineer: [
        'Update equipment status',
        'Log maintenance activities',
        'Report and resolve faults',
        'Access technical documentation',
        'View maintenance history'
      ],
      crew: [
        'View assigned tasks',
        'Report equipment issues',
        'Access safety procedures',
        'Log work hours',
        'View vessel schedules'
      ],
      viewer: [
        'View vessel status',
        'Access maintenance reports',
        'View equipment information',
        'Download compliance documents',
        'Monitor KPI dashboards'
      ]
    };

    return features[role.toLowerCase()] || features.crew;
  }
}

// Export singleton instance
export const activationCodeService = new ActivationCodeService();