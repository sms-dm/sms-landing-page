import { BaseEmailTemplate, EmailTemplateData } from './base-template';

export interface TeamInvitationData extends EmailTemplateData {
  inviteeName: string;
  inviterName: string;
  companyName: string;
  role: string;
  invitationUrl: string;
  expiryDate: Date;
  vesselCount?: number;
  features?: string[];
}

export class TeamInvitationTemplate extends BaseEmailTemplate {
  getSubject(data: TeamInvitationData): string {
    return `You're invited to join ${data.companyName} on SMS Portal`;
  }

  getContent(data: TeamInvitationData): string {
    const formattedExpiryDate = new Date(data.expiryDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const roleDescriptions: { [key: string]: string } = {
      'admin': 'Full access to all portal features and settings',
      'manager': 'Manage vessels, crew, and maintenance schedules',
      'engineer': 'View and update maintenance tasks and equipment status',
      'crew': 'View schedules and report maintenance issues',
      'viewer': 'Read-only access to reports and dashboards'
    };

    const roleDescription = roleDescriptions[data.role.toLowerCase()] || 'Access to portal features based on your role';

    return `
      <div class="container">
        <div class="header">
          <h1>Welcome to Smart Maintenance Systems</h1>
          <p>You've been invited to join ${data.companyName}</p>
        </div>
        
        <div class="content">
          <h2>Hi ${data.inviteeName || 'there'},</h2>
          
          <p><strong>${data.inviterName}</strong> has invited you to join the <strong>${data.companyName}</strong> team on SMS Portal as a <strong>${data.role}</strong>.</p>
          
          <div class="info-box">
            <p><strong>Your Role: ${data.role}</strong><br>
            ${roleDescription}</p>
          </div>
          
          <div class="button-center">
            <a href="${data.invitationUrl}" class="button">Accept Invitation</a>
          </div>
          
          <p style="text-align: center; color: ${this.lightGray};">This invitation expires on ${formattedExpiryDate}</p>
          
          <h3>What is SMS Portal?</h3>
          <p>Smart Maintenance Systems is a comprehensive platform for managing vessel maintenance, designed specifically for the maritime industry.</p>
          
          ${data.vesselCount ? `
          <p>Your company currently manages <strong>${data.vesselCount} vessel${data.vesselCount > 1 ? 's' : ''}</strong> on the platform.</p>
          ` : ''}
          
          <h3>What you'll be able to do:</h3>
          <ul>
            ${data.features && data.features.length > 0 ? 
              data.features.map(feature => `<li>${feature}</li>`).join('') :
              `
              <li>Access real-time vessel maintenance data</li>
              <li>View and manage maintenance schedules</li>
              <li>Track equipment status and history</li>
              <li>Collaborate with your team</li>
              <li>Generate compliance reports</li>
              `
            }
          </ul>
          
          <h3>Getting Started:</h3>
          <ol>
            <li>Click the "Accept Invitation" button above</li>
            <li>Create your account with a secure password</li>
            <li>Complete your profile</li>
            <li>Start exploring the portal</li>
          </ol>
          
          <div class="warning-box">
            <p><strong>Note:</strong> This invitation will expire on ${formattedExpiryDate}. Please accept it before this date.</p>
          </div>
          
          <p>If you have any questions about this invitation, please contact ${data.inviterName} or our support team.</p>
          
          <table class="details">
            <tr>
              <td>Company</td>
              <td>${data.companyName}</td>
            </tr>
            <tr>
              <td>Invited by</td>
              <td>${data.inviterName}</td>
            </tr>
            <tr>
              <td>Your role</td>
              <td>${data.role}</td>
            </tr>
            <tr>
              <td>Invitation expires</td>
              <td>${formattedExpiryDate}</td>
            </tr>
          </table>
        </div>
        
        <div class="footer">
          <p>Smart Maintenance Systems - Join Your Crew Online</p>
          <p>&copy; ${new Date().getFullYear()} Smart Maintenance Systems. All rights reserved.</p>
          <p>
            <a href="https://smartmaintenancesystems.com/privacy">Privacy Policy</a> | 
            <a href="https://smartmaintenancesystems.com/terms">Terms of Service</a>
          </p>
          <p style="margin-top: 20px; font-size: 12px;">
            If you received this email by mistake or don't want to join this team, you can safely ignore it.
          </p>
        </div>
      </div>
    `;
  }
}