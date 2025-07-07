import { BaseEmailTemplate, EmailTemplateData } from './base-template';

export interface ActivationReminderData extends EmailTemplateData {
  companyName: string;
  activationCode: string;
  expiryDate: Date;
  contactName: string;
  portalUrl: string;
  daysRemaining: number;
}

export class ActivationReminderTemplate extends BaseEmailTemplate {
  getSubject(data: ActivationReminderData): string {
    return `⏰ Activation Reminder - ${data.daysRemaining} days remaining`;
  }

  getContent(data: ActivationReminderData): string {
    const formattedExpiryDate = new Date(data.expiryDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const urgencyColor = data.daysRemaining <= 1 ? this.dangerColor : this.warningColor;

    return `
      <div class="container">
        <div class="header" style="background-color: ${urgencyColor};">
          <h1>Activation Reminder</h1>
          <p>${data.daysRemaining} ${data.daysRemaining === 1 ? 'day' : 'days'} remaining to activate your portal</p>
        </div>
        
        <div class="content">
          <h2>Hi ${data.contactName},</h2>
          
          <p>This is a friendly reminder that your SMS Portal activation code for <strong>${data.companyName}</strong> will expire soon.</p>
          
          <div class="warning-box" style="border-color: ${urgencyColor}; background-color: ${data.daysRemaining <= 1 ? '#FEE2E2' : '#FEF3C7'};">
            <p style="color: ${data.daysRemaining <= 1 ? '#991B1B' : '#92400E'};">
              <strong>⏰ Time is running out!</strong><br>
              Your activation code expires on ${formattedExpiryDate}
            </p>
          </div>
          
          <p>Don't lose access to your portal! Here's your activation code:</p>
          
          <div class="code-box">
            <p class="label">YOUR ACTIVATION CODE</p>
            <div class="code">${data.activationCode}</div>
            <p class="label" style="color: ${urgencyColor};">Expires in ${data.daysRemaining} ${data.daysRemaining === 1 ? 'day' : 'days'}</p>
          </div>
          
          <div class="button-center">
            <a href="${data.portalUrl}" class="button" style="background-color: ${urgencyColor};">Activate Now</a>
          </div>
          
          <h3>Why activate now?</h3>
          <ul>
            <li><strong>Immediate Access:</strong> Start managing your fleet maintenance right away</li>
            <li><strong>Team Setup:</strong> Add your crew members and assign roles</li>
            <li><strong>Vessel Configuration:</strong> Set up your vessels and equipment</li>
            <li><strong>Training Resources:</strong> Access our comprehensive guides and tutorials</li>
          </ul>
          
          ${data.daysRemaining <= 1 ? `
          <div class="warning-box" style="border-color: ${this.dangerColor}; background-color: #FEE2E2;">
            <p style="color: #991B1B;">
              <strong>Final Notice:</strong> If you don't activate by ${formattedExpiryDate}, you'll need to contact our support team to generate a new activation code, which may delay your access.
            </p>
          </div>
          ` : ''}
          
          <p>Need help? Our support team is standing by:</p>
          <ul>
            <li>Email: support@smartmaintenancesystems.com</li>
            <li>Phone: +1 (555) 123-4567</li>
            <li>Live Chat: Available 24/7</li>
          </ul>
          
          <p>We're excited to have you join the SMS family and look forward to helping you streamline your maintenance operations!</p>
        </div>
        
        <div class="footer">
          <p>Smart Maintenance Systems - Don't let this opportunity expire!</p>
          <p>&copy; ${new Date().getFullYear()} Smart Maintenance Systems. All rights reserved.</p>
          <p>
            <a href="https://smartmaintenancesystems.com/privacy">Privacy Policy</a> | 
            <a href="https://smartmaintenancesystems.com/terms">Terms of Service</a>
          </p>
        </div>
      </div>
    `;
  }
}