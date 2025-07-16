import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { emailConfig, EmailConfig } from '../config/email.config';
import * as fs from 'fs';
import * as path from 'path';
import { EmailTemplateFactory, EmailTemplateType } from '../templates/email/template-factory';

class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = emailConfig.getConfig();
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    this.transporter = await emailConfig.getTransporter();
    
    if (!this.transporter) {
      console.log('📧 Email service not configured - emails will be logged only');
      
      // Create a development email log file
      const logDir = path.join(__dirname, '../../logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
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

  // Send critical fault alert to managers
  async sendCriticalFaultAlert(data: {
    vesselName: string;
    equipmentName: string;
    faultDescription: string;
    reportedBy: string;
    managerEmails: string[];
  }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
          .alert-box { background-color: #FEE2E2; border: 2px solid #DC2626; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; }
          .details { background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ CRITICAL FAULT ALERT</h1>
          </div>
          <div class="alert-box">
            <strong>IMMEDIATE ATTENTION REQUIRED</strong>
            <br>A critical fault has been reported on ${data.vesselName}
          </div>
          <div class="content">
            <div class="details">
              <h3>Fault Details:</h3>
              <p><strong>Vessel:</strong> ${data.vesselName}</p>
              <p><strong>Equipment:</strong> ${data.equipmentName}</p>
              <p><strong>Description:</strong> ${data.faultDescription}</p>
              <p><strong>Reported by:</strong> ${data.reportedBy}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/manager" class="button">
                View in Dashboard
              </a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to all managers
    for (const managerEmail of data.managerEmails) {
      await this.sendEmail({
        to: managerEmail,
        subject: `🚨 CRITICAL FAULT - ${data.vesselName} - ${data.equipmentName}`,
        html,
        priority: 'high'
      });
    }
  }

  // Send fault resolved notification
  async sendFaultResolvedNotification(data: {
    vesselName: string;
    equipmentName: string;
    faultType: string;
    resolvedBy: string;
    resolution: string;
    downtime: number;
    managerEmails: string[];
  }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
          .details { background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .success-box { background-color: #D1FAE5; border: 2px solid #10B981; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Fault Resolved</h1>
          </div>
          <div class="success-box">
            <strong>${data.faultType.toUpperCase()} FAULT RESOLVED</strong>
            <br>The issue on ${data.vesselName} has been successfully resolved
          </div>
          <div class="content">
            <div class="details">
              <h3>Resolution Details:</h3>
              <p><strong>Vessel:</strong> ${data.vesselName}</p>
              <p><strong>Equipment:</strong> ${data.equipmentName}</p>
              <p><strong>Resolved by:</strong> ${data.resolvedBy}</p>
              <p><strong>Resolution:</strong> ${data.resolution}</p>
              <p><strong>Total Downtime:</strong> ${data.downtime} minutes</p>
              <p><strong>Resolved at:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    for (const managerEmail of data.managerEmails) {
      await this.sendEmail({
        to: managerEmail,
        subject: `✅ Fault Resolved - ${data.vesselName} - ${data.equipmentName}`,
        html
      });
    }
  }

  // Send maintenance reminder
  async sendMaintenanceReminder(data: {
    vesselName: string;
    equipmentName: string;
    maintenanceType: string;
    dueDate: Date;
    recipientEmails: string[];
  }) {
    const daysUntilDue = Math.ceil((data.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #F59E0B; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
          .details { background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .warning-box { background-color: #FEF3C7; border: 2px solid #F59E0B; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 Maintenance Reminder</h1>
          </div>
          <div class="warning-box">
            <strong>MAINTENANCE DUE IN ${daysUntilDue} DAYS</strong>
          </div>
          <div class="content">
            <div class="details">
              <h3>Maintenance Details:</h3>
              <p><strong>Vessel:</strong> ${data.vesselName}</p>
              <p><strong>Equipment:</strong> ${data.equipmentName}</p>
              <p><strong>Maintenance Type:</strong> ${data.maintenanceType}</p>
              <p><strong>Due Date:</strong> ${data.dueDate.toLocaleDateString()}</p>
            </div>
            <p>Please ensure this maintenance is scheduled and completed on time.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    for (const email of data.recipientEmails) {
      await this.sendEmail({
        to: email,
        subject: `🔧 Maintenance Due - ${data.equipmentName} - ${daysUntilDue} days`,
        html
      });
    }
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

  // Send welcome email
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
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">
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
      const logFile = path.join(__dirname, '../../logs/emails.log');
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
        
        const logFile = path.join(__dirname, '../../logs/ethereal-emails.log');
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
}

// Export singleton instance
export const emailService = new EmailService();