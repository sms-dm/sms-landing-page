import { dbRun, dbGet, dbAll } from '../config/database';
import { emailService } from './email.service';
import { BaseEmailTemplate } from '../templates/email/base-template';
import { ActivationCodeTemplate } from '../templates/email/activation-code.template';
import { ActivationReminderTemplate } from '../templates/email/activation-reminder.template';
import { ActivationExpiredTemplate } from '../templates/email/activation-expired.template';
import { ActivationRegeneratedTemplate } from '../templates/email/activation-regenerated.template';
import { TeamInvitationTemplate } from '../templates/email/team-invitation.template';

interface EmailQueueItem {
  id: number;
  to_email: string;
  subject: string;
  template_name: string;
  template_data: any;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'processing' | 'sent' | 'failed';
  attempts: number;
  max_attempts: number;
  scheduled_at: string;
  sent_at?: string;
  failed_at?: string;
  error_message?: string;
}

class EmailQueueService {
  private templates: Map<string, BaseEmailTemplate> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor() {
    // Register email templates
    this.registerTemplate('activation-code', new ActivationCodeTemplate());
    this.registerTemplate('activation-reminder', new ActivationReminderTemplate());
    this.registerTemplate('activation-expired', new ActivationExpiredTemplate());
    this.registerTemplate('activation-regenerated', new ActivationRegeneratedTemplate());
    this.registerTemplate('team-invitation', new TeamInvitationTemplate());
  }

  private registerTemplate(name: string, template: BaseEmailTemplate) {
    this.templates.set(name, template);
  }

  // Add email to queue
  async queueEmail(params: {
    to: string;
    templateName: string;
    templateData: any;
    priority?: 'high' | 'normal' | 'low';
    scheduledAt?: Date;
  }): Promise<number> {
    const {
      to,
      templateName,
      templateData,
      priority = 'normal',
      scheduledAt = new Date()
    } = params;

    // Get template to extract subject
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    const { subject } = template.render(templateData);

    const result = await dbRun(`
      INSERT INTO email_queue (
        to_email, subject, template_name, template_data, 
        priority, scheduled_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      to,
      subject,
      templateName,
      JSON.stringify(templateData),
      priority,
      scheduledAt.toISOString()
    ]);

    console.log(`📧 Email queued: ${templateName} to ${to}`);
    return result.lastID;
  }

  // Queue multiple emails
  async queueBulkEmails(emails: Array<{
    to: string;
    templateName: string;
    templateData: any;
    priority?: 'high' | 'normal' | 'low';
    scheduledAt?: Date;
  }>): Promise<number[]> {
    const ids: number[] = [];
    
    for (const email of emails) {
      const id = await this.queueEmail(email);
      ids.push(id);
    }

    return ids;
  }

  // Process email queue
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get pending emails ordered by priority and scheduled time
      const emails = await dbAll(`
        SELECT * FROM email_queue
        WHERE status IN ('pending', 'failed')
          AND scheduled_at <= datetime('now')
          AND attempts < max_attempts
        ORDER BY 
          CASE priority 
            WHEN 'high' THEN 1 
            WHEN 'normal' THEN 2 
            WHEN 'low' THEN 3 
          END,
          scheduled_at
        LIMIT 10
      `) as EmailQueueItem[];

      for (const email of emails) {
        await this.sendQueuedEmail(email);
      }

    } catch (error) {
      console.error('❌ Error processing email queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Send individual queued email
  private async sendQueuedEmail(queueItem: EmailQueueItem): Promise<void> {
    const { id, to_email, template_name, template_data, attempts } = queueItem;

    try {
      // Update status to processing
      await dbRun(`
        UPDATE email_queue 
        SET status = 'processing', 
            attempts = attempts + 1,
            updated_at = datetime('now')
        WHERE id = ?
      `, [id]);

      // Get template
      const template = this.templates.get(template_name);
      if (!template) {
        throw new Error(`Email template '${template_name}' not found`);
      }

      // Parse template data
      const data = typeof template_data === 'string' 
        ? JSON.parse(template_data) 
        : template_data;

      // Render email
      const { subject, html } = template.render(data);

      // Send email
      const result = await emailService.sendEmail({
        to: to_email,
        subject,
        html,
        priority: queueItem.priority
      });

      // Update queue status
      await dbRun(`
        UPDATE email_queue 
        SET status = 'sent',
            sent_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `, [id]);

      // Log sent email
      await dbRun(`
        INSERT INTO email_logs (
          queue_id, to_email, subject, template_name, 
          status, message_id, sent_at
        )
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `, [id, to_email, subject, template_name, 'sent', result.messageId]);

      console.log(`✅ Email sent: ${template_name} to ${to_email}`);

    } catch (error: any) {
      console.error(`❌ Failed to send email ${id}:`, error);

      // Update queue with error
      await dbRun(`
        UPDATE email_queue 
        SET status = CASE 
              WHEN attempts >= max_attempts THEN 'failed'
              ELSE 'pending'
            END,
            failed_at = CASE 
              WHEN attempts >= max_attempts THEN datetime('now')
              ELSE failed_at
            END,
            error_message = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `, [error.message, id]);
    }
  }

  // Start queue processor
  startProcessor(intervalMs: number = 60000): void {
    if (this.processingInterval) {
      return;
    }

    console.log('📧 Starting email queue processor...');
    
    // Process immediately
    this.processQueue();

    // Set up interval
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, intervalMs);
  }

  // Stop queue processor
  stopProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('📧 Email queue processor stopped');
    }
  }

  // Get queue statistics
  async getQueueStats(): Promise<{
    pending: number;
    sent: number;
    failed: number;
    total: number;
  }> {
    const stats = await dbAll(`
      SELECT 
        status,
        COUNT(*) as count
      FROM email_queue
      GROUP BY status
    `) as Array<{ status: string; count: number }>;

    const result = {
      pending: 0,
      sent: 0,
      failed: 0,
      total: 0
    };

    for (const stat of stats) {
      if (stat.status === 'pending' || stat.status === 'processing') {
        result.pending += stat.count;
      } else if (stat.status === 'sent') {
        result.sent = stat.count;
      } else if (stat.status === 'failed') {
        result.failed = stat.count;
      }
      result.total += stat.count;
    }

    return result;
  }

  // Retry failed emails
  async retryFailed(olderThanMinutes: number = 60): Promise<number> {
    const result = await dbRun(`
      UPDATE email_queue
      SET status = 'pending',
          attempts = 0,
          error_message = NULL,
          updated_at = datetime('now')
      WHERE status = 'failed'
        AND failed_at < datetime('now', '-${olderThanMinutes} minutes')
    `);

    return result.changes || 0;
  }

  // Clean old emails
  async cleanOldEmails(olderThanDays: number = 30): Promise<number> {
    const result = await dbRun(`
      DELETE FROM email_queue
      WHERE status IN ('sent', 'failed')
        AND created_at < datetime('now', '-${olderThanDays} days')
    `);

    return result.changes || 0;
  }
}

// Export singleton instance
export const emailQueueService = new EmailQueueService();