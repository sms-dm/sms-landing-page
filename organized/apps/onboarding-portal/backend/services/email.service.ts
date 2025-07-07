import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

interface EmailTemplateData {
  subject: string;
  userName?: string;
  userEmail: string;
  userRole?: string;
  companyName?: string;
  verificationLink?: string;
  resetLink?: string;
  [key: string]: any;
}

export class EmailService {
  private baseUrl: string;
  private templatesDir: string;

  constructor() {
    this.baseUrl = config.APP_URL || 'http://localhost:3000';
    this.templatesDir = path.join(__dirname, '../templates/email');
  }

  async renderTemplate(templateName: string, data: EmailTemplateData): Promise<string> {
    try {
      // Read base template
      const baseTemplate = await fs.readFile(
        path.join(this.templatesDir, 'base.html'),
        'utf-8'
      );

      // Read specific template content
      const contentTemplate = await fs.readFile(
        path.join(this.templatesDir, `${templateName}.html`),
        'utf-8'
      );

      // Replace content placeholder in base template
      let html = baseTemplate.replace('{{content}}', contentTemplate);

      // Replace all variables
      const variables = {
        ...data,
        baseUrl: this.baseUrl,
      };

      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, String(value || ''));
      });

      return html;
    } catch (error) {
      console.error(`Failed to render email template ${templateName}:`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(data: EmailTemplateData): Promise<void> {
    const html = await this.renderTemplate('welcome', {
      ...data,
      subject: 'Welcome to SMS - Smart Maintenance System',
    });

    // In production, integrate with email service provider (SendGrid, AWS SES, etc.)
    console.log('Sending welcome email to:', data.userEmail);
    console.log('Email preview:', html.substring(0, 200) + '...');
    
    // TODO: Implement actual email sending
  }

  async sendPasswordResetEmail(data: EmailTemplateData): Promise<void> {
    const html = await this.renderTemplate('password-reset', {
      ...data,
      subject: 'Password Reset Request - SMS',
    });

    // In production, integrate with email service provider
    console.log('Sending password reset email to:', data.userEmail);
    console.log('Email preview:', html.substring(0, 200) + '...');
    
    // TODO: Implement actual email sending
  }

  async sendNotificationEmail(
    userEmail: string,
    subject: string,
    content: string
  ): Promise<void> {
    // For generic notifications, wrap content in base template
    const html = await this.renderTemplate('base', {
      subject,
      userEmail,
      content,
    });

    console.log('Sending notification email to:', userEmail);
    console.log('Subject:', subject);
    
    // TODO: Implement actual email sending
  }
}

export const emailService = new EmailService();