import { BaseEmailTemplate, EmailTemplateData } from './base-template';

export class FaultAssignmentTemplate extends BaseEmailTemplate {
  getSubject(data: EmailTemplateData): string {
    const severityEmoji = {
      critical: '🚨',
      high: '⚠️',
      medium: '📢',
      low: 'ℹ️'
    };
    const emoji = severityEmoji[data.severity as keyof typeof severityEmoji] || '📋';
    return `${emoji} New Fault Assigned: ${data.faultTitle}`;
  }

  getContent(data: EmailTemplateData): string {
    const severityColor = {
      critical: this.dangerColor,
      high: this.warningColor,
      medium: this.primaryColor,
      low: this.lightGray
    };
    
    const color = severityColor[data.severity as keyof typeof severityColor] || this.primaryColor;

    return `
      <div class="container">
        <div class="header" style="background-color: ${color}">
          <h1>Fault Assignment</h1>
          <p>You have been assigned a new fault</p>
        </div>
        
        <div class="content">
          <h2>${data.faultTitle}</h2>
          
          ${data.severity === 'critical' ? `
            <div class="warning-box" style="background-color: #FEE2E2; border-color: ${this.dangerColor}">
              <p style="color: #991B1B">
                <strong>🚨 CRITICAL SEVERITY FAULT</strong><br>
                This fault requires immediate attention to prevent equipment failure or safety issues.
              </p>
            </div>
          ` : data.severity === 'high' ? `
            <div class="warning-box">
              <p>
                <strong>⚠️ HIGH PRIORITY</strong><br>
                Please address this fault as soon as possible.
              </p>
            </div>
          ` : ''}
          
          <p>You have been assigned the following fault by <strong>${data.assignedBy}</strong>:</p>
          
          <table class="details">
            <tr>
              <td>Fault ID:</td>
              <td><strong>#${data.faultId}</strong></td>
            </tr>
            <tr>
              <td>Equipment:</td>
              <td><strong>${data.equipmentName}</strong></td>
            </tr>
            <tr>
              <td>Location:</td>
              <td>${data.equipmentLocation || 'N/A'}</td>
            </tr>
            <tr>
              <td>Vessel:</td>
              <td>${data.vesselName}</td>
            </tr>
            <tr>
              <td>Severity:</td>
              <td style="color: ${color}"><strong>${data.severity.toUpperCase()}</strong></td>
            </tr>
            <tr>
              <td>Reported Date:</td>
              <td>${new Date(data.reportedDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td>Reported By:</td>
              <td>${data.reportedBy}</td>
            </tr>
            ${data.estimatedHours ? `
            <tr>
              <td>Estimated Hours:</td>
              <td>${data.estimatedHours} hours</td>
            </tr>
            ` : ''}
          </table>

          <h3>Fault Description</h3>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${data.description}</p>
          </div>

          <div class="button-center">
            <a href="${data.portalUrl}/faults/${data.faultId}" class="button" style="background-color: ${color}">
              View Fault Details
            </a>
          </div>

          <h3>Next Steps</h3>
          <ol>
            <li>Review the fault details and equipment history</li>
            <li>Assess the situation and update fault status to "In Progress"</li>
            <li>Identify required parts and tools</li>
            <li>Perform repairs following safety procedures</li>
            <li>Update the fault with resolution details when complete</li>
          </ol>

          ${data.previousFaults && data.previousFaults > 0 ? `
            <div class="info-box">
              <p>
                <strong>📊 Equipment History:</strong><br>
                This equipment has had ${data.previousFaults} fault(s) in the last 90 days.
                Review the equipment history for recurring issues.
              </p>
            </div>
          ` : ''}

          ${data.spareParts && data.spareParts.length > 0 ? `
            <div class="success-box">
              <p>
                <strong>✓ Commonly Used Parts for This Equipment:</strong><br>
                ${data.spareParts.map((part: any) => `• ${part.name} - ${part.stock > 0 ? part.stock + ' in stock' : 'OUT OF STOCK'}`).join('<br>')}
              </p>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>This is an automated fault assignment notification from the SMS Maintenance Portal</p>
          <p>
            <a href="${data.portalUrl}/faults">View All Faults</a> |
            <a href="${data.portalUrl}/help/faults">Fault Management Help</a>
          </p>
        </div>
      </div>
    `;
  }
}