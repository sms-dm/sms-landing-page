import { emailService } from './email.service';
import { EmailTemplateType } from '../templates/email/template-factory';

class EmailQueueService {

  // Add email to queue
  async queueEmail(params: {
    to: string;
    templateName: EmailTemplateType;
    templateData: any;
    priority?: 'high' | 'normal' | 'low';
    scheduledAt?: Date;
  }): Promise<string> {
    const {
      to,
      templateName,
      templateData
    } = params;

    console.log(`📧 Queuing email: ${templateName} to ${to}`);
    
    // For now, send immediately since we don't have email queue table in Prisma schema
    // In production, you would store this in a database queue
    try {
      await this.sendEmailNow({
        to,
        templateName,
        templateData,
        priority
      });
      
      return `immediate-${Date.now()}`;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  // Send email immediately
  private async sendEmailNow(params: {
    to: string;
    templateName: EmailTemplateType;
    templateData: any;
    priority?: 'high' | 'normal' | 'low';
  }) {
    const { to, templateName, templateData } = params;

    switch (templateName) {
      case EmailTemplateType.ACTIVATION_CODE:
        await emailService.sendActivationCode({
          ...templateData,
          email: to
        });
        break;

      case EmailTemplateType.ONBOARDING_COMPLETE:
        await emailService.sendOnboardingComplete({
          ...templateData,
          email: to
        });
        break;

      case EmailTemplateType.VERIFICATION_REMINDER:
        await emailService.sendVerificationReminder({
          ...templateData,
          email: to
        });
        break;

      case EmailTemplateType.WELCOME:
        await emailService.sendWelcomeEmail({
          ...templateData,
          email: to
        });
        break;

      case EmailTemplateType.PASSWORD_RESET:
        await emailService.sendPasswordResetEmail(to, templateData.resetToken);
        break;

      default:
        throw new Error(`Unknown email template: ${templateName}`);
    }
  }

  // Queue multiple emails
  async queueBulkEmails(emails: Array<{
    to: string;
    templateName: EmailTemplateType;
    templateData: any;
    priority?: 'high' | 'normal' | 'low';
    scheduledAt?: Date;
  }>): Promise<string[]> {
    const ids: string[] = [];
    
    for (const email of emails) {
      const id = await this.queueEmail(email);
      ids.push(id);
    }

    return ids;
  }

  // Schedule reminder emails for activation codes
  async scheduleActivationReminders(params: {
    companyId: string;
    activationCode: string;
    expiryDate: Date;
    contactEmail: string;
    contactName: string;
    companyName: string;
  }) {
    const { expiryDate, contactEmail } = params;
    const now = new Date();
    const msUntilExpiry = expiryDate.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));

    // Schedule reminders at 7 days, 3 days, and 1 day before expiry
    const reminderDays = [7, 3, 1];
    
    for (const days of reminderDays) {
      if (daysUntilExpiry > days) {
        const scheduledAt = new Date(expiryDate.getTime() - (days * 24 * 60 * 60 * 1000));
        
        await this.queueEmail({
          to: contactEmail,
          templateName: EmailTemplateType.VERIFICATION_REMINDER,
          templateData: {
            ...params,
            daysRemaining: days
          },
          priority: days <= 3 ? 'high' : 'normal',
          scheduledAt
        });

        console.log(`📅 Scheduled reminder for ${days} days before expiry`);
      }
    }
  }

  // Send immediate activation code email
  async sendActivationCodeEmail(params: {
    companyName: string;
    activationCode: string;
    expiryDate: Date;
    contactName: string;
    contactEmail: string;
  }) {
    await this.queueEmail({
      to: params.contactEmail,
      templateName: EmailTemplateType.ACTIVATION_CODE,
      templateData: {
        companyName: params.companyName,
        activationCode: params.activationCode,
        expiryDate: params.expiryDate,
        contactName: params.contactName
      },
      priority: 'high'
    });

    // Also schedule reminders
    await this.scheduleActivationReminders({
      ...params,
      companyId: '' // Will be set when company is created
    });
  }

  // Send onboarding completion email
  async sendOnboardingCompleteEmail(params: {
    companyId: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    vesselCount: number;
    equipmentCount: number;
    userCount: number;
    adminEmail: string;
    adminPassword?: string;
  }) {
    await this.queueEmail({
      to: params.contactEmail,
      templateName: EmailTemplateType.ONBOARDING_COMPLETE,
      templateData: {
        companyName: params.companyName,
        contactName: params.contactName,
        vesselCount: params.vesselCount,
        equipmentCount: params.equipmentCount,
        userCount: params.userCount,
        adminEmail: params.adminEmail,
        adminPassword: params.adminPassword
      },
      priority: 'high'
    });

    // Also send to admin if different from contact
    if (params.adminEmail !== params.contactEmail) {
      await this.queueEmail({
        to: params.adminEmail,
        templateName: EmailTemplateType.ONBOARDING_COMPLETE,
        templateData: {
          companyName: params.companyName,
          contactName: 'Administrator',
          vesselCount: params.vesselCount,
          equipmentCount: params.equipmentCount,
          userCount: params.userCount,
          adminEmail: params.adminEmail,
          adminPassword: params.adminPassword
        },
        priority: 'high'
      });
    }
  }

  // Send welcome email to new team members
  async sendTeamMemberWelcome(params: {
    email: string;
    firstName: string;
    companyName: string;
    role: string;
    tempPassword?: string;
  }) {
    await this.queueEmail({
      to: params.email,
      templateName: EmailTemplateType.WELCOME,
      templateData: {
        firstName: params.firstName,
        companyName: params.companyName,
        role: params.role,
        tempPassword: params.tempPassword
      },
      priority: 'normal'
    });
  }
}

// Export singleton instance
export const emailQueueService = new EmailQueueService();