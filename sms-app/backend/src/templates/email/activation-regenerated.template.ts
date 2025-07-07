import { BaseEmailTemplate, EmailTemplateData } from './base-template';

export interface ActivationRegeneratedData extends EmailTemplateData {
  companyName: string;
  newActivationCode: string;
  expiryDate: Date;
  contactName: string;
  portalUrl: string;
  reason: string;
  extendedTrial?: boolean;
}

export class ActivationRegeneratedTemplate extends BaseEmailTemplate {
  getSubject(data: ActivationRegeneratedData): string {
    return `New Activation Code Generated - ${data.companyName}`;
  }

  getContent(data: ActivationRegeneratedData): string {
    const formattedExpiryDate = new Date(data.expiryDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div class="container">
        <div class="header" style="background-color: ${this.successColor};">
          <h1>New Activation Code</h1>
          <p>Your portal is ready for activation</p>
        </div>
        
        <div class="content">
          <h2>Great news, ${data.contactName}!</h2>
          
          <p>We've generated a new activation code for <strong>${data.companyName}</strong>.</p>
          
          ${data.reason && `
          <div class="info-box">
            <p><strong>Reason for new code:</strong> ${data.reason}</p>
          </div>
          `}
          
          <p>Your new activation code is:</p>
          
          <div class="code-box">
            <p class="label">NEW ACTIVATION CODE</p>
            <div class="code" style="color: ${this.successColor};">${data.newActivationCode}</div>
            <p class="label">Valid until ${formattedExpiryDate}</p>
          </div>
          
          <div class="button-center">
            <a href="${data.portalUrl}" class="button" style="background-color: ${this.successColor};">Activate Your Portal Now</a>
          </div>
          
          ${data.extendedTrial ? `
          <div class="success-box">
            <p><strong>🎁 Bonus Applied!</strong> Your trial period has been extended by 30 days as our way of saying thank you for your patience.</p>
          </div>
          ` : ''}
          
          <h3>Quick Activation Steps:</h3>
          <ol>
            <li>Click the activation button above</li>
            <li>Enter your new activation code: <strong>${data.newActivationCode}</strong></li>
            <li>Complete your company profile</li>
            <li>Add your first vessel</li>
            <li>Invite your team members</li>
          </ol>
          
          <div class="info-box">
            <p><strong>Pro Tip:</strong> Have your vessel details ready (name, IMO number, equipment list) to speed up the setup process!</p>
          </div>
          
          <h3>What's included in your subscription:</h3>
          <table class="details">
            <tr>
              <td>Unlimited Users</td>
              <td>Add your entire crew at no extra cost</td>
            </tr>
            <tr>
              <td>Mobile Access</td>
              <td>Manage maintenance from anywhere</td>
            </tr>
            <tr>
              <td>24/7 Support</td>
              <td>We're always here when you need us</td>
            </tr>
            <tr>
              <td>Data Security</td>
              <td>Bank-level encryption for your peace of mind</td>
            </tr>
            <tr>
              <td>Regular Updates</td>
              <td>New features added monthly</td>
            </tr>
          </table>
          
          <p>Remember, we're here to help you succeed. If you need any assistance during setup:</p>
          <ul>
            <li>Email: support@smartmaintenancesystems.com</li>
            <li>Phone: +1 (555) 123-4567</li>
            <li>Live Chat: Available in your portal</li>
          </ul>
          
          <p>Welcome to the future of marine maintenance management!</p>
        </div>
        
        <div class="footer">
          <p>Smart Maintenance Systems - Your Success is Our Priority</p>
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