import { BaseEmailTemplate, EmailTemplateData } from './base-template';
import { ActivationCodeTemplate } from './activation-code.template';
import { ActivationExpiredTemplate } from './activation-expired.template';
import { ActivationHelpVerificationTemplate } from './activation-help-verification.template';
import { ActivationRegeneratedTemplate } from './activation-regenerated.template';
import { ActivationReminderTemplate } from './activation-reminder.template';
import { TeamInvitationTemplate } from './team-invitation.template';
import { MaintenanceReminderTemplate } from './maintenance-reminder.template';
import { CertificateWarningTemplate } from './certificate-warning.template';
import { LowStockTemplate } from './low-stock.template';
import { FaultAssignmentTemplate } from './fault-assignment.template';
import { FaultStatusChangeTemplate } from './fault-status-change.template';
import { SystemAnnouncementTemplate } from './system-announcement.template';

export type EmailTemplateType = 
  | 'activation-code'
  | 'activation-expired'
  | 'activation-help-verification'
  | 'activation-regenerated'
  | 'activation-reminder'
  | 'team-invitation'
  | 'maintenance-reminder'
  | 'certificate-warning'
  | 'low-stock'
  | 'fault-assignment'
  | 'fault-status-change'
  | 'system-announcement';

export class EmailTemplateFactory {
  private static templates: Map<EmailTemplateType, new () => BaseEmailTemplate> = new Map([
    ['activation-code', ActivationCodeTemplate],
    ['activation-expired', ActivationExpiredTemplate],
    ['activation-help-verification', ActivationHelpVerificationTemplate],
    ['activation-regenerated', ActivationRegeneratedTemplate],
    ['activation-reminder', ActivationReminderTemplate],
    ['team-invitation', TeamInvitationTemplate],
    ['maintenance-reminder', MaintenanceReminderTemplate],
    ['certificate-warning', CertificateWarningTemplate],
    ['low-stock', LowStockTemplate],
    ['fault-assignment', FaultAssignmentTemplate],
    ['fault-status-change', FaultStatusChangeTemplate],
    ['system-announcement', SystemAnnouncementTemplate]
  ]);

  static getTemplate(type: EmailTemplateType): BaseEmailTemplate {
    const TemplateClass = this.templates.get(type);
    
    if (!TemplateClass) {
      throw new Error(`Email template type '${type}' not found`);
    }
    
    return new TemplateClass();
  }

  static renderTemplate(type: EmailTemplateType, data: EmailTemplateData): { subject: string; html: string } {
    const template = this.getTemplate(type);
    
    // Add default data
    const defaultData = {
      portalUrl: process.env.PORTAL_URL || 'https://sms-portal.com',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@sms-portal.com',
      companyName: 'Smart Marine Systems',
      year: new Date().getFullYear(),
      ...data
    };
    
    return template.render(defaultData);
  }

  static async sendEmail(
    type: EmailTemplateType,
    to: string,
    data: EmailTemplateData,
    emailService: any
  ): Promise<void> {
    const { subject, html } = this.renderTemplate(type, data);
    
    await emailService.sendEmail({
      to,
      subject,
      html
    });
  }

  static getAvailableTemplates(): EmailTemplateType[] {
    return Array.from(this.templates.keys());
  }

  static validateTemplateData(type: EmailTemplateType, data: EmailTemplateData): string[] {
    const errors: string[] = [];
    
    // Basic validation for common required fields per template type
    const requiredFields: Record<EmailTemplateType, string[]> = {
      'activation-code': ['activationCode', 'companyName', 'userName'],
      'activation-expired': ['companyName'],
      'activation-help-verification': ['verificationCode', 'companyName', 'requestDetails'],
      'activation-regenerated': ['activationCode', 'companyName', 'regeneratedBy'],
      'activation-reminder': ['activationCode', 'companyName', 'daysUntilExpiry'],
      'team-invitation': ['inviterName', 'teamName', 'invitationLink'],
      'maintenance-reminder': ['equipmentName', 'vesselName', 'daysUntilDue', 'dueDate', 'equipmentId'],
      'certificate-warning': ['certificateType', 'equipmentName', 'vesselName', 'warningType', 'expiryDate'],
      'low-stock': ['partName', 'vesselName', 'currentStock', 'minimumStock', 'partId'],
      'fault-assignment': ['faultTitle', 'faultId', 'severity', 'assignedBy', 'equipmentName'],
      'fault-status-change': ['faultTitle', 'faultId', 'oldStatus', 'newStatus', 'changedBy'],
      'system-announcement': ['title', 'message', 'priority', 'targetAudience']
    };
    
    const required = requiredFields[type] || [];
    
    for (const field of required) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    return errors;
  }
}