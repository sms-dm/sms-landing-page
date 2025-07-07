import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  ethereal?: {
    user: string;
    pass: string;
    web: string;
  };
}

export class EmailConfiguration {
  private static instance: EmailConfiguration;
  private config: EmailConfig;
  private transporter: Transporter | null = null;
  private isEthereal: boolean = false;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): EmailConfiguration {
    if (!EmailConfiguration.instance) {
      EmailConfiguration.instance = new EmailConfiguration();
    }
    return EmailConfiguration.instance;
  }

  private loadConfig(): EmailConfig {
    // Check if we're in development mode without SMTP configuration
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const hasSmtpConfig = process.env.SMTP_USER && process.env.SMTP_PASS;

    if (isDevelopment && !hasSmtpConfig) {
      // Use Ethereal Email for testing
      console.log('📧 No SMTP configuration found, using Ethereal Email for testing');
      this.isEthereal = true;
      
      // These are temporary credentials that will be generated
      return {
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        user: '', // Will be set after creating test account
        pass: '', // Will be set after creating test account
        from: process.env.SMTP_FROM || 'SMS Portal <noreply@smartmaintenancesystems.com>',
        ethereal: {
          user: '',
          pass: '',
          web: ''
        }
      };
    }

    // Production or configured SMTP
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || 'SMS Portal <noreply@smartmaintenancesystems.com>'
    };
  }

  async getTransporter(): Promise<Transporter | null> {
    if (this.transporter) {
      return this.transporter;
    }

    try {
      if (this.isEthereal) {
        // Create Ethereal test account
        const testAccount = await nodemailer.createTestAccount();
        
        this.config.user = testAccount.user;
        this.config.pass = testAccount.pass;
        this.config.ethereal = {
          user: testAccount.user,
          pass: testAccount.pass,
          web: testAccount.web || 'https://ethereal.email'
        };

        console.log('✅ Ethereal Email test account created');
        console.log('📧 User:', testAccount.user);
        console.log('🔐 Pass:', testAccount.pass);
        console.log('🌐 Web:', testAccount.web);
      }

      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.pass
        },
        // Additional settings for better compatibility
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates in development
        }
      });

      // Verify connection
      if (this.transporter) {
        await this.transporter.verify();
        console.log('✅ Email service ready');
        
        if (this.isEthereal) {
          console.log('📧 Ethereal Email URL:', this.config.ethereal?.web);
          console.log('   View sent emails at:', this.config.ethereal?.web);
        }
      }

      return this.transporter;
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      return null;
    }
  }

  getConfig(): EmailConfig {
    return this.config;
  }

  isUsingEthereal(): boolean {
    return this.isEthereal;
  }

  // AWS SES configuration helper
  static getAWSSESConfig() {
    return {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sesRegion: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-1'
    };
  }

  // Check if AWS SES is configured
  static isAWSSESConfigured(): boolean {
    return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  }
}

export const emailConfig = EmailConfiguration.getInstance();