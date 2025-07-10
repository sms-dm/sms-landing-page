import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { emailConfig, EmailConfig } from '../config/email.config';
import * as fs from 'fs';
import * as path from 'path';
import { EmailTemplateFactory, EmailTemplateType } from '../templates/email/template-factory';
import { config } from '../config';

export class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig;
  private baseUrl: string;

  constructor() {
    this.config = emailConfig.getConfig();
    this.baseUrl = config.APP_URL || 'http://localhost:5173';
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    this.transporter = await emailConfig.getTransporter();
    
    if (!this.transporter) {
      console.log('📧 Email service not configured - emails will be logged only');
      
      // Create a development email log file
      const logDir = path.join(__dirname, '../logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  // Send activation code email
  async sendActivationCode(data: {
    companyName: string;
    activationCode: string;
    expiryDate: Date;
    contactName: string;
    email: string;
  }) {
    const portalUrl = `${this.baseUrl}/activate?code=${data.activationCode}`;
    
    await this.sendTemplatedEmail(
      EmailTemplateType.ACTIVATION_CODE,
      data.email,
      {
        ...data,
        portalUrl
      }
    );
  }

  // Send onboarding completion email
  async sendOnboardingComplete(data: {
    companyName: string;
    contactName: string;
    email: string;
    vesselCount: number;
    equipmentCount: number;
    userCount: number;
    adminEmail: string;
    adminPassword?: string;
  }) {
    const maintenancePortalUrl = process.env.MAINTENANCE_PORTAL_URL || 'http://localhost:3001';
    
    await this.sendTemplatedEmail(
      EmailTemplateType.ONBOARDING_COMPLETE,
      data.email,
      {
        ...data,
        maintenancePortalUrl
      }
    );
  }

  // Send verification reminder
  async sendVerificationReminder(data: {
    companyName: string;
    contactName: string;
    email: string;
    activationCode: string;
    daysRemaining: number;
    expiryDate: Date;
  }) {
    const portalUrl = `${this.baseUrl}/activate?code=${data.activationCode}`;
    
    await this.sendTemplatedEmail(
      EmailTemplateType.VERIFICATION_REMINDER,
      data.email,
      {
        ...data,
        portalUrl
      }
    );
  }

  // Send welcome email to new users
  async sendWelcomeEmail(data: {
    email: string;
    firstName: string;
    companyName: string;
    role: string;
    tempPassword?: string;
  }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0066CC; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
          .credentials { background-color: #E0F2FE; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; }
          .button { display: inline-block; padding: 12px 24px; background-color: #0066CC; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to SMS Portal</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.firstName}!</h2>
            <p>Your account has been created for ${data.companyName}.</p>
            <p>You've been assigned the role of <strong>${data.role}</strong>.</p>
            
            ${data.tempPassword ? `
              <div class="credentials">
                <strong>Your Login Credentials:</strong><br>
                Email: ${data.email}<br>
                Temporary Password: ${data.tempPassword}<br>
                <br>
                <em>Please change your password after first login.</em>
              </div>
            ` : ''}
            
            <center>
              <a href="${this.baseUrl}" class="button">
                Login to SMS Portal
              </a>
            </center>
            
            <p>If you have any questions, please contact your administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: data.email,
      subject: `Welcome to SMS Portal - ${data.companyName}`,
      html
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${this.baseUrl}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0066CC; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #0066CC; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SMS Portal - Password Reset</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>You requested a password reset for your SMS Portal account.</p>
            <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            <p>If you didn't request this, please ignore this email.</p>
            <p>For security, this link will expire in 1 hour.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Smart Maintenance Systems. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request - SMS Portal',
      html
    });
  }

  // Send email using template
  async sendTemplatedEmail(
    type: EmailTemplateType,
    to: string | string[],
    data: any
  ) {
    try {
      const recipients = Array.isArray(to) ? to : [to];
      
      for (const recipient of recipients) {
        const { subject, html } = EmailTemplateFactory.renderTemplate(type, data);
        
        await this.sendEmail({
          to: recipient,
          subject,
          html
        });
      }
    } catch (error) {
      console.error(`Failed to send ${type} email:`, error);
      throw error;
    }
  }

  // Core email sending method
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    html: string;
    priority?: 'high' | 'normal' | 'low';
  }) {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const timestamp = new Date().toISOString();

    if (!this.transporter) {
      // Log email to console and file for development
      const logEntry = {
        timestamp,
        to: recipients,
        subject: options.subject,
        priority: options.priority || 'normal',
        preview: options.html.substring(0, 200) + '...'
      };
      
      console.log('📧 Email would be sent:');
      console.log(JSON.stringify(logEntry, null, 2));
      console.log('---');
      
      // Save to log file
      const logFile = path.join(__dirname, '../logs/emails.log');
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(logFile, logLine);
      
      return { messageId: `local-${Date.now()}`, preview: logEntry };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.config.from,
        to: recipients.join(', '),
        subject: options.subject,
        html: options.html,
        priority: options.priority || 'normal'
      });

      console.log('✅ Email sent:', info.messageId);
      
      // If using Ethereal, log the preview URL
      if (emailConfig.isUsingEthereal()) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('👁️  Preview URL:', previewUrl);
        console.log('📧 Ethereal Email Web:', this.config.ethereal?.web);
        
        // Log to file for easy access
        const logEntry = {
          timestamp,
          messageId: info.messageId,
          to: recipients,
          subject: options.subject,
          previewUrl,
          etherealWeb: this.config.ethereal?.web
        };
        
        const logFile = path.join(__dirname, '../logs/ethereal-emails.log');
        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(logFile, logLine);
        
        return { ...info, previewUrl };
      }
      
      return info;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
    }
  }
  // Send notification email
  async sendNotificationEmail(
    userEmail: string,
    subject: string,
    content: string
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0066CC; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SMS Portal Notification</h1>
          </div>
          <div class="content">
            ${content}
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();