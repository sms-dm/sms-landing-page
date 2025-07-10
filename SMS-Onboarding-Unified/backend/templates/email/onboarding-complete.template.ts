import { BaseEmailTemplate, EmailTemplateData } from './base-template';

export interface OnboardingCompleteData extends EmailTemplateData {
  companyName: string;
  contactName: string;
  maintenancePortalUrl: string;
  vesselCount: number;
  equipmentCount: number;
  userCount: number;
  adminEmail: string;
  adminPassword?: string;
}

export class OnboardingCompleteTemplate extends BaseEmailTemplate {
  getSubject(data: OnboardingCompleteData): string {
    return `Welcome to SMS Portal - ${data.companyName} Onboarding Complete!`;
  }

  getContent(data: OnboardingCompleteData): string {
    return `
      <div class="container">
        <div class="header">
          <h1>Onboarding Complete!</h1>
          <p>Your SMS Portal is Ready</p>
        </div>
        
        <div class="content">
          <h2>Congratulations, ${data.contactName}!</h2>
          
          <div class="success-box">
            <p><strong>Your SMS Portal for ${data.companyName} is now fully activated and ready to use!</strong></p>
          </div>
          
          <p>We've successfully set up your portal with the following:</p>
          
          <table class="details">
            <tr>
              <td>Vessels Added</td>
              <td>${data.vesselCount} vessel${data.vesselCount !== 1 ? 's' : ''}</td>
            </tr>
            <tr>
              <td>Equipment Configured</td>
              <td>${data.equipmentCount} equipment items</td>
            </tr>
            <tr>
              <td>Team Members</td>
              <td>${data.userCount} user${data.userCount !== 1 ? 's' : ''}</td>
            </tr>
            <tr>
              <td>Portal Status</td>
              <td>Active & Ready</td>
            </tr>
          </table>
          
          <h3>Access Your Maintenance Portal</h3>
          
          <p>Your team can now access the full SMS Portal to manage maintenance, track equipment, and collaborate:</p>
          
          <div class="button-center">
            <a href="${data.maintenancePortalUrl}" class="button">Go to Maintenance Portal</a>
          </div>
          
          ${data.adminPassword ? `
          <div class="info-box">
            <p><strong>Admin Login Credentials:</strong><br>
            Email: ${data.adminEmail}<br>
            Temporary Password: ${data.adminPassword}<br>
            <br>
            <em>Please change this password after your first login.</em></p>
          </div>
          ` : `
          <div class="info-box">
            <p><strong>Login with:</strong><br>
            Email: ${data.adminEmail}<br>
            Password: The password you created during onboarding</p>
          </div>
          `}
          
          <h3>What's Next?</h3>
          
          <p>Now that your portal is active, here are some recommended next steps:</p>
          
          <ul>
            <li><strong>Schedule Maintenance:</strong> Set up recurring maintenance schedules for your equipment</li>
            <li><strong>Configure Alerts:</strong> Set up email notifications for critical faults and maintenance reminders</li>
            <li><strong>Add More Team Members:</strong> Invite additional crew members and assign roles</li>
            <li><strong>Explore Analytics:</strong> View insights and reports on your fleet's performance</li>
            <li><strong>Set Up Inventory:</strong> Configure spare parts inventory tracking</li>
          </ul>
          
          <h3>Need Help?</h3>
          
          <p>Our support team is available to help you get the most out of your SMS Portal:</p>
          
          <table class="details">
            <tr>
              <td>Documentation</td>
              <td><a href="https://docs.smartmaintenancesystems.com">docs.smartmaintenancesystems.com</a></td>
            </tr>
            <tr>
              <td>Email Support</td>
              <td><a href="mailto:support@smartmaintenancesystems.com">support@smartmaintenancesystems.com</a></td>
            </tr>
            <tr>
              <td>Phone Support</td>
              <td>+1 (555) 123-4567</td>
            </tr>
            <tr>
              <td>Live Chat</td>
              <td>Available in your portal</td>
            </tr>
          </table>
          
          <div class="success-box" style="margin-top: 30px;">
            <p><strong>Thank you for choosing Smart Maintenance Systems!</strong><br>
            We're excited to help you keep your fleet running smoothly.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Smart Maintenance Systems - Your Partner in Fleet Maintenance</p>
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