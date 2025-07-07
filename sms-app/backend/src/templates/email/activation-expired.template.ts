import { BaseEmailTemplate, EmailTemplateData } from './base-template';

export interface ActivationExpiredData extends EmailTemplateData {
  companyName: string;
  contactName: string;
  originalCode: string;
  expiredDate: Date;
  supportEmail: string;
  supportPhone: string;
}

export class ActivationExpiredTemplate extends BaseEmailTemplate {
  getSubject(data: ActivationExpiredData): string {
    return `Activation Code Expired - Action Required`;
  }

  getContent(data: ActivationExpiredData): string {
    const formattedExpiredDate = new Date(data.expiredDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div class="container">
        <div class="header" style="background-color: ${this.dangerColor};">
          <h1>Activation Code Expired</h1>
          <p>Your portal activation code has expired</p>
        </div>
        
        <div class="content">
          <h2>Hi ${data.contactName},</h2>
          
          <p>We noticed that your SMS Portal activation code for <strong>${data.companyName}</strong> expired on ${formattedExpiredDate}.</p>
          
          <div class="warning-box" style="border-color: ${this.dangerColor}; background-color: #FEE2E2;">
            <p style="color: #991B1B;">
              <strong>Your activation code has expired</strong><br>
              The code ${data.originalCode} is no longer valid
            </p>
          </div>
          
          <h3>Don't worry - we're here to help!</h3>
          
          <p>To get your portal up and running, please contact our support team who will:</p>
          <ul>
            <li>Generate a new activation code for you</li>
            <li>Extend your trial period if needed</li>
            <li>Help you complete the setup process</li>
            <li>Answer any questions you may have</li>
          </ul>
          
          <div class="info-box">
            <p><strong>Contact Support:</strong><br>
            Email: ${data.supportEmail}<br>
            Phone: ${data.supportPhone}<br>
            Reference: ${data.originalCode} (expired)</p>
          </div>
          
          <div class="button-center">
            <a href="mailto:${data.supportEmail}?subject=Expired Activation Code - ${data.companyName}&body=Hi,%0A%0AMy activation code (${data.originalCode}) has expired.%0A%0ACompany: ${data.companyName}%0AContact: ${data.contactName}%0A%0APlease help me reactivate my portal.%0A%0AThank you!" class="button">Email Support</a>
          </div>
          
          <h3>Why choose SMS Portal?</h3>
          <p>While we work on getting you activated, here's a reminder of what you'll get:</p>
          <ul>
            <li><strong>Reduce Downtime:</strong> Predictive maintenance prevents unexpected failures</li>
            <li><strong>Save Money:</strong> Optimize maintenance schedules and parts inventory</li>
            <li><strong>Improve Compliance:</strong> Stay ahead of regulatory requirements</li>
            <li><strong>Empower Your Team:</strong> Give your crew the tools they need to excel</li>
          </ul>
          
          <p>We understand that getting started can sometimes be delayed. Our team is committed to making your activation as smooth as possible.</p>
          
          <div class="success-box">
            <p><strong>Special Offer:</strong> As an apology for any inconvenience, we'll extend your trial period by an additional 30 days when you activate!</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Smart Maintenance Systems - We're here to help you succeed</p>
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