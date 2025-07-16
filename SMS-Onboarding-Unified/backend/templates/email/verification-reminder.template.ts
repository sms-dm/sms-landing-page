import { BaseEmailTemplate, EmailTemplateData } from './base-template';

export interface VerificationReminderData extends EmailTemplateData {
  companyName: string;
  contactName: string;
  activationCode: string;
  daysRemaining: number;
  expiryDate: Date;
  portalUrl: string;
}

export class VerificationReminderTemplate extends BaseEmailTemplate {
  getSubject(data: VerificationReminderData): string {
    return `Reminder: Activate Your SMS Portal - ${data.daysRemaining} Days Remaining`;
  }

  getContent(data: VerificationReminderData): string {
    const formattedExpiryDate = new Date(data.expiryDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const urgencyColor = data.daysRemaining <= 3 ? this.dangerColor : this.warningColor;
    const urgencyBox = data.daysRemaining <= 3 ? 'danger-box' : 'warning-box';

    return `
      <div class="container">
        <div class="header" style="background-color: ${urgencyColor};">
          <h1>Action Required</h1>
          <p>Your SMS Portal Activation is Pending</p>
        </div>
        
        <div class="content">
          <h2>Hello ${data.contactName},</h2>
          
          <div class="${urgencyBox}" style="${data.daysRemaining <= 3 ? 'background-color: #FEE2E2; border-color: #DC2626;' : ''}">
            <p style="${data.daysRemaining <= 3 ? 'color: #991B1B;' : ''}">
              <strong>Your activation code expires in ${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''}!</strong><br>
              Don't lose access to your SMS Portal for ${data.companyName}.
            </p>
          </div>
          
          <p>We noticed you haven't activated your SMS Portal yet. Your activation code is still valid, but it will expire soon.</p>
          
          <div class="code-box">
            <p class="label">YOUR ACTIVATION CODE</p>
            <div class="code">${data.activationCode}</div>
            <p class="label" style="color: ${urgencyColor};">Expires on ${formattedExpiryDate}</p>
          </div>
          
          <p>Activate your portal now to start managing your fleet maintenance:</p>
          
          <div class="button-center">
            <a href="${data.portalUrl}" class="button" style="background-color: ${urgencyColor};">Activate Now</a>
          </div>
          
          <h3>Don't Miss Out On:</h3>
          
          <ul>
            <li><strong>Real-time Equipment Monitoring:</strong> Track all your vessel equipment in one place</li>
            <li><strong>Automated Maintenance Scheduling:</strong> Never miss critical maintenance again</li>
            <li><strong>Fault Management:</strong> Quick response to equipment issues</li>
            <li><strong>Team Collaboration:</strong> Coordinate maintenance tasks across your crew</li>
            <li><strong>Cost Savings:</strong> Reduce downtime and maintenance costs</li>
          </ul>
          
          ${data.daysRemaining <= 3 ? `
          <div class="danger-box" style="background-color: #FEE2E2; border: 1px solid #DC2626; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #991B1B;">
              <strong>⚠️ URGENT: Final Notice</strong><br>
              This is one of your final reminders. After ${formattedExpiryDate}, you'll need to contact our sales team to get a new activation code, which may delay your portal setup.
            </p>
          </div>
          ` : ''}
          
          <h3>Need Help Activating?</h3>
          
          <p>Our support team is standing by to assist you:</p>
          
          <table class="details">
            <tr>
              <td>Quick Support</td>
              <td><a href="mailto:support@smartmaintenancesystems.com?subject=Help with activation code ${data.activationCode}">Click here to email support</a></td>
            </tr>
            <tr>
              <td>Phone</td>
              <td>+1 (555) 123-4567</td>
            </tr>
            <tr>
              <td>Live Chat</td>
              <td>Visit our website for instant help</td>
            </tr>
          </table>
          
          <p>Common activation questions:</p>
          <ul>
            <li>Lost your activation email? Use the code above</li>
            <li>Having technical issues? Our support team can walk you through it</li>
            <li>Need to change company details? You can update them after activation</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>Don't let your activation expire - activate today!</p>
          <p>&copy; ${new Date().getFullYear()} Smart Maintenance Systems. All rights reserved.</p>
          <p>
            <a href="https://smartmaintenancesystems.com/privacy">Privacy Policy</a> | 
            <a href="https://smartmaintenancesystems.com/terms">Terms of Service</a>
          </p>
        </div>
      </div>
      
      <style>
        .danger-box {
          background-color: #FEE2E2;
          border: 1px solid #DC2626;
          border-radius: 6px;
          padding: 16px;
          margin: 20px 0;
        }
        .danger-box p {
          margin: 0;
          color: #991B1B;
        }
      </style>
    `;
  }
}