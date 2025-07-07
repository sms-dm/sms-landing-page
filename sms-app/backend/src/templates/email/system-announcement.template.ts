import { BaseEmailTemplate, EmailTemplateData } from './base-template';

export class SystemAnnouncementTemplate extends BaseEmailTemplate {
  getSubject(data: EmailTemplateData): string {
    const priorityPrefix = {
      urgent: '🚨 URGENT: ',
      high: '⚠️ Important: ',
      normal: '',
      low: ''
    };
    const prefix = priorityPrefix[data.priority as keyof typeof priorityPrefix] || '';
    return `${prefix}${data.title}`;
  }

  getContent(data: EmailTemplateData): string {
    const priorityColor = {
      urgent: this.dangerColor,
      high: this.warningColor,
      normal: this.primaryColor,
      low: this.lightGray
    };
    
    const color = priorityColor[data.priority as keyof typeof priorityColor] || this.primaryColor;

    return `
      <div class="container">
        <div class="header" style="background-color: ${color}">
          <h1>System Announcement</h1>
          <p>SMS Maintenance Portal</p>
        </div>
        
        <div class="content">
          <h2>${data.title}</h2>
          
          ${data.priority === 'urgent' ? `
            <div class="warning-box" style="background-color: #FEE2E2; border-color: ${this.dangerColor}">
              <p style="color: #991B1B">
                <strong>🚨 URGENT ANNOUNCEMENT</strong><br>
                This message requires your immediate attention.
              </p>
            </div>
          ` : data.priority === 'high' ? `
            <div class="warning-box">
              <p>
                <strong>⚠️ IMPORTANT NOTICE</strong><br>
                Please read this announcement carefully.
              </p>
            </div>
          ` : ''}
          
          <div style="font-size: 16px; line-height: 1.6; margin: 20px 0;">
            ${data.message.split('\n').map((paragraph: string) => `<p>${paragraph}</p>`).join('')}
          </div>

          ${data.actionRequired ? `
            <div class="info-box">
              <p>
                <strong>Action Required:</strong><br>
                ${data.actionRequired}
              </p>
            </div>
          ` : ''}

          ${data.actionUrl ? `
            <div class="button-center">
              <a href="${data.actionUrl}" class="button" style="background-color: ${color}">
                ${data.actionText || 'Take Action'}
              </a>
            </div>
          ` : ''}

          ${data.affectedItems && data.affectedItems.length > 0 ? `
            <h3>Affected Areas</h3>
            <ul>
              ${data.affectedItems.map((item: string) => `<li>${item}</li>`).join('')}
            </ul>
          ` : ''}

          ${data.timeline ? `
            <h3>Timeline</h3>
            <table class="details">
              ${Object.entries(data.timeline).map(([key, value]) => `
                <tr>
                  <td>${key}:</td>
                  <td>${value}</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}

          ${data.contactInfo ? `
            <h3>Questions or Concerns?</h3>
            <p>${data.contactInfo}</p>
          ` : ''}

          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">

          <p style="font-size: 14px; color: ${this.lightGray};">
            <strong>Announcement Details:</strong><br>
            Sent: ${new Date(data.sentDate).toLocaleString()}<br>
            Target Audience: ${this.formatAudience(data.targetAudience, data.targetName)}<br>
            Priority: ${data.priority.toUpperCase()}<br>
            ${data.expiresAt ? `Expires: ${new Date(data.expiresAt).toLocaleString()}` : ''}
          </p>
        </div>

        <div class="footer">
          <p>This is an official announcement from the SMS Maintenance Portal</p>
          <p>
            <a href="${data.portalUrl}/announcements">View All Announcements</a> |
            <a href="${data.portalUrl}/help">Help Center</a>
          </p>
          <p style="font-size: 12px; margin-top: 10px;">
            You received this because you are part of the ${this.formatAudience(data.targetAudience, data.targetName)} group.
          </p>
        </div>
      </div>
    `;
  }

  private formatAudience(audience: string, name?: string): string {
    switch (audience) {
      case 'all':
        return 'All Users';
      case 'vessel':
        return `Vessel: ${name || 'Unknown'}`;
      case 'company':
        return `Company: ${name || 'All'}`;
      case 'role':
        return `Role: ${name || 'Unknown'}`;
      default:
        return audience;
    }
  }
}