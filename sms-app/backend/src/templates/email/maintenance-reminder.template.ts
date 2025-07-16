import { BaseEmailTemplate, EmailTemplateData } from './base-template';

export class MaintenanceReminderTemplate extends BaseEmailTemplate {
  getSubject(data: EmailTemplateData): string {
    if (data.daysUntilDue <= 0) {
      return `⚠️ OVERDUE: Maintenance Required - ${data.equipmentName}`;
    }
    return `Maintenance Due: ${data.equipmentName} - ${data.daysUntilDue} days`;
  }

  getContent(data: EmailTemplateData): string {
    const urgencyColor = data.daysUntilDue <= 0 ? this.dangerColor :
                        data.daysUntilDue <= 7 ? this.warningColor : this.primaryColor;

    const urgencyText = data.daysUntilDue <= 0 ? 'OVERDUE' :
                       data.daysUntilDue <= 7 ? 'URGENT' : 'UPCOMING';

    return `
      <div class="container">
        <div class="header" style="background-color: ${urgencyColor}">
          <h1>Maintenance Reminder</h1>
          <p>${data.vesselName}</p>
        </div>
        
        <div class="content">
          <h2>Maintenance ${urgencyText}</h2>
          
          ${data.daysUntilDue <= 0 ? `
            <div class="warning-box" style="background-color: #FEE2E2; border-color: ${this.dangerColor}">
              <p style="color: #991B1B">
                <strong>⚠️ This equipment is OVERDUE for maintenance!</strong><br>
                Immediate action is required to ensure safety and compliance.
              </p>
            </div>
          ` : ''}
          
          <p>The following equipment requires maintenance:</p>
          
          <table class="details">
            <tr>
              <td>Equipment:</td>
              <td><strong>${data.equipmentName}</strong></td>
            </tr>
            <tr>
              <td>Location:</td>
              <td>${data.location}</td>
            </tr>
            <tr>
              <td>Vessel:</td>
              <td>${data.vesselName}</td>
            </tr>
            <tr>
              <td>Due Date:</td>
              <td style="color: ${urgencyColor}"><strong>${new Date(data.dueDate).toLocaleDateString()}</strong></td>
            </tr>
            <tr>
              <td>Days Until Due:</td>
              <td style="color: ${urgencyColor}"><strong>${data.daysUntilDue <= 0 ? 'OVERDUE' : `${data.daysUntilDue} days`}</strong></td>
            </tr>
            <tr>
              <td>Criticality:</td>
              <td>${data.criticality.toUpperCase()}</td>
            </tr>
            ${data.lastMaintenanceDate ? `
            <tr>
              <td>Last Maintenance:</td>
              <td>${new Date(data.lastMaintenanceDate).toLocaleDateString()}</td>
            </tr>
            ` : ''}
          </table>

          <div class="button-center">
            <a href="${data.portalUrl}/equipment/${data.equipmentId}/maintenance" class="button" style="background-color: ${urgencyColor}">
              View Equipment Details
            </a>
          </div>

          <p>Please ensure maintenance is scheduled and completed before the due date to maintain equipment reliability and safety compliance.</p>

          ${data.daysUntilDue > 0 && data.daysUntilDue <= 7 ? `
            <div class="info-box">
              <p>
                <strong>📋 Quick Actions:</strong><br>
                • Check spare parts availability<br>
                • Review maintenance procedures<br>
                • Schedule maintenance window<br>
                • Assign technicians
              </p>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>This is an automated reminder from the SMS Maintenance Portal</p>
          <p>
            <a href="${data.portalUrl}/notifications/preferences">Manage Notification Preferences</a> |
            <a href="${data.portalUrl}/help">Help</a>
          </p>
        </div>
      </div>
    `;
  }
}