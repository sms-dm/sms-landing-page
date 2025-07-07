import { BaseEmailTemplate, EmailTemplateData } from './base-template';

export interface ActivationCodeData extends EmailTemplateData {
  companyName: string;
  activationCode: string;
  expiryDate: Date;
  contactName: string;
  portalUrl: string;
}

export class ActivationCodeTemplate extends BaseEmailTemplate {
  getSubject(data: ActivationCodeData): string {
    return `Your SMS Portal Activation Code - ${data.companyName}`;
  }

  getContent(data: ActivationCodeData): string {
    const formattedExpiryDate = new Date(data.expiryDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div class="container">
        <div class="header">
          <h1>Smart Maintenance Systems</h1>
          <p>Your Portal is Ready for Activation</p>
        </div>
        
        <div class="content">
          <h2>Welcome aboard, ${data.contactName}!</h2>
          
          <p>Thank you for choosing Smart Maintenance Systems. Your SMS Portal subscription for <strong>${data.companyName}</strong> has been successfully processed.</p>
          
          <p>Your activation code is ready:</p>
          
          <div class="code-box">
            <p class="label">ACTIVATION CODE</p>
            <div class="code">${data.activationCode}</div>
            <p class="label">Valid until ${formattedExpiryDate}</p>
          </div>
          
          <p>To activate your portal and start managing your fleet maintenance:</p>
          
          <div class="button-center">
            <a href="${data.portalUrl}" class="button">Activate Your Portal</a>
          </div>
          
          <div class="info-box">
            <p><strong>What happens next?</strong><br>
            1. Click the button above or visit your portal<br>
            2. Enter your activation code when prompted<br>
            3. Complete your company setup<br>
            4. Start adding vessels and managing maintenance</p>
          </div>
          
          <h3 style="margin-top: 30px;">Your Portal Includes:</h3>
          <table class="details">
            <tr>
              <td>Multi-vessel Management</td>
              <td>Manage your entire fleet from one dashboard</td>
            </tr>
            <tr>
              <td>Predictive Maintenance</td>
              <td>AI-powered maintenance scheduling</td>
            </tr>
            <tr>
              <td>Real-time Monitoring</td>
              <td>Track equipment status and faults</td>
            </tr>
            <tr>
              <td>Parts & Inventory</td>
              <td>Integrated parts ordering and tracking</td>
            </tr>
            <tr>
              <td>Team Collaboration</td>
              <td>Assign tasks and track progress</td>
            </tr>
          </table>
          
          <div class="warning-box">
            <p><strong>Important:</strong> This activation code will expire on ${formattedExpiryDate}. Please activate your portal before this date to avoid any delays.</p>
          </div>
          
          <p>If you have any questions or need assistance, our support team is here to help:</p>
          <ul>
            <li>Email: support@smartmaintenancesystems.com</li>
            <li>Phone: +1 (555) 123-4567</li>
            <li>Live Chat: Available in your portal</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>Smart Maintenance Systems - Keeping Your Fleet Running Smoothly</p>
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