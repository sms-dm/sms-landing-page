import { BaseEmailTemplate, EmailTemplateData } from './base-template';

export class FaultStatusChangeTemplate extends BaseEmailTemplate {
  getSubject(data: EmailTemplateData): string {
    const statusEmoji = {
      resolved: '✅',
      closed: '✓',
      in_progress: '🔧',
      pending_parts: '📦'
    };
    const emoji = statusEmoji[data.newStatus as keyof typeof statusEmoji] || '📋';
    return `${emoji} Fault Update: ${data.faultTitle} - ${this.formatStatus(data.newStatus)}`;
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'in_progress': 'In Progress',
      'pending_parts': 'Pending Parts',
      'resolved': 'Resolved',
      'closed': 'Closed'
    };
    return statusMap[status] || status;
  }

  getContent(data: EmailTemplateData): string {
    const isResolved = data.newStatus === 'resolved' || data.newStatus === 'closed';
    const statusColor = isResolved ? this.successColor : this.primaryColor;

    return `
      <div class="container">
        <div class="header" style="background-color: ${statusColor}">
          <h1>Fault Status Update</h1>
          <p>${data.vesselName}</p>
        </div>
        
        <div class="content">
          <h2>${data.faultTitle}</h2>
          
          ${isResolved ? `
            <div class="success-box">
              <p>
                <strong>✅ Fault ${data.newStatus === 'resolved' ? 'Resolved' : 'Closed'}</strong><br>
                ${data.newStatus === 'resolved' ? 'The fault has been successfully resolved.' : 'The fault has been closed.'}
              </p>
            </div>
          ` : data.newStatus === 'pending_parts' ? `
            <div class="warning-box">
              <p>
                <strong>📦 Waiting for Parts</strong><br>
                Work on this fault is temporarily paused pending parts availability.
              </p>
            </div>
          ` : ''}
          
          <p>The fault status has been updated by <strong>${data.changedBy}</strong>:</p>
          
          <table class="details">
            <tr>
              <td>Fault ID:</td>
              <td><strong>#${data.faultId}</strong></td>
            </tr>
            <tr>
              <td>Equipment:</td>
              <td>${data.equipmentName}</td>
            </tr>
            <tr>
              <td>Previous Status:</td>
              <td>${this.formatStatus(data.oldStatus)}</td>
            </tr>
            <tr>
              <td>New Status:</td>
              <td style="color: ${statusColor}"><strong>${this.formatStatus(data.newStatus)}</strong></td>
            </tr>
            <tr>
              <td>Updated By:</td>
              <td>${data.changedBy}</td>
            </tr>
            <tr>
              <td>Update Time:</td>
              <td>${new Date(data.updateTime).toLocaleString()}</td>
            </tr>
            ${data.timeSpent ? `
            <tr>
              <td>Time Spent:</td>
              <td>${data.timeSpent} hours</td>
            </tr>
            ` : ''}
          </table>

          ${data.resolutionNotes ? `
            <h3>Resolution Notes</h3>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p style="margin: 0; white-space: pre-wrap;">${data.resolutionNotes}</p>
            </div>
          ` : data.statusNotes ? `
            <h3>Status Update Notes</h3>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <p style="margin: 0; white-space: pre-wrap;">${data.statusNotes}</p>
            </div>
          ` : ''}

          <div class="button-center">
            <a href="${data.portalUrl}/faults/${data.faultId}" class="button" style="background-color: ${statusColor}">
              View Fault Details
            </a>
          </div>

          ${data.newStatus === 'pending_parts' && data.requiredParts ? `
            <h3>Required Parts</h3>
            <ul>
              ${data.requiredParts.map((part: any) => `
                <li>${part.name} - Quantity: ${part.quantity} ${part.inStock ? '✓ In Stock' : '✗ Not Available'}</li>
              `).join('')}
            </ul>
          ` : ''}

          ${isResolved ? `
            <h3>Follow-up Actions</h3>
            <ul>
              <li>Verify equipment is functioning properly</li>
              <li>Update maintenance logs if applicable</li>
              <li>Review if preventive measures are needed</li>
              ${data.newStatus === 'resolved' ? '<li>Close the fault if no further action required</li>' : ''}
            </ul>
          ` : data.newStatus === 'in_progress' ? `
            <h3>Work in Progress</h3>
            <p>The assigned technician is actively working on this fault. You will receive another notification when the status changes.</p>
          ` : ''}

          ${data.faultHistory && data.faultHistory.length > 0 ? `
            <div class="info-box">
              <p>
                <strong>📋 Recent Status History:</strong><br>
                ${data.faultHistory.map((h: any) => `• ${h.status} - ${h.date} by ${h.user}`).join('<br>')}
              </p>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>This is an automated fault update notification from the SMS Maintenance Portal</p>
          <p>
            <a href="${data.portalUrl}/faults?status=${data.newStatus}">View ${this.formatStatus(data.newStatus)} Faults</a> |
            <a href="${data.portalUrl}/notifications/preferences">Notification Settings</a>
          </p>
        </div>
      </div>
    `;
  }
}