import { BaseEmailTemplate, EmailTemplateData } from './base-template';

export class CertificateWarningTemplate extends BaseEmailTemplate {
  getSubject(data: EmailTemplateData): string {
    if (data.warningType === 'expired') {
      return `🚨 EXPIRED: ${data.certificateType} Certificate - ${data.equipmentName}`;
    }
    const days = this.getDaysFromWarningType(data.warningType);
    return `Certificate Expiring: ${data.equipmentName} - ${days} days`;
  }

  private getDaysFromWarningType(warningType: string): number {
    const typeMap: Record<string, number> = {
      '90_days': 90,
      '60_days': 60,
      '30_days': 30,
      '14_days': 14,
      '7_days': 7
    };
    return typeMap[warningType] || 0;
  }

  getContent(data: EmailTemplateData): string {
    const isExpired = data.warningType === 'expired';
    const days = this.getDaysFromWarningType(data.warningType);
    
    const urgencyColor = isExpired ? this.dangerColor :
                        days <= 14 ? this.warningColor : this.primaryColor;

    const urgencyText = isExpired ? 'EXPIRED' :
                       days <= 14 ? 'URGENT' : 'UPCOMING';

    return `
      <div class="container">
        <div class="header" style="background-color: ${urgencyColor}">
          <h1>Certificate ${isExpired ? 'Expired' : 'Expiry Warning'}</h1>
          <p>${data.vesselName}</p>
        </div>
        
        <div class="content">
          <h2>Certificate ${urgencyText}</h2>
          
          ${isExpired ? `
            <div class="warning-box" style="background-color: #FEE2E2; border-color: ${this.dangerColor}">
              <p style="color: #991B1B">
                <strong>🚨 This certificate has EXPIRED!</strong><br>
                Immediate action is required. The equipment may not be compliant for operation.
              </p>
            </div>
          ` : days <= 14 ? `
            <div class="warning-box">
              <p>
                <strong>⚠️ This certificate expires in ${days} days!</strong><br>
                Please arrange for renewal immediately to avoid compliance issues.
              </p>
            </div>
          ` : ''}
          
          <p>The following certificate requires attention:</p>
          
          <table class="details">
            <tr>
              <td>Equipment:</td>
              <td><strong>${data.equipmentName}</strong></td>
            </tr>
            <tr>
              <td>Location:</td>
              <td>${data.equipmentLocation}</td>
            </tr>
            <tr>
              <td>Certificate Type:</td>
              <td><strong>${data.certificateType}</strong></td>
            </tr>
            <tr>
              <td>Certificate Number:</td>
              <td>${data.certificateNumber}</td>
            </tr>
            <tr>
              <td>Issuing Authority:</td>
              <td>${data.issuingAuthority || 'N/A'}</td>
            </tr>
            <tr>
              <td>Expiry Date:</td>
              <td style="color: ${urgencyColor}"><strong>${new Date(data.expiryDate).toLocaleDateString()}</strong></td>
            </tr>
            <tr>
              <td>Status:</td>
              <td style="color: ${urgencyColor}"><strong>${isExpired ? 'EXPIRED' : `Expires in ${days} days`}</strong></td>
            </tr>
          </table>

          <div class="button-center">
            <a href="${data.portalUrl}/equipment/${data.equipmentId}/certificates" class="button" style="background-color: ${urgencyColor}">
              View Certificate Details
            </a>
          </div>

          ${!isExpired ? `
            <h3>Renewal Process</h3>
            <ol>
              <li>Contact the issuing authority for renewal requirements</li>
              <li>Schedule inspection if required</li>
              <li>Prepare necessary documentation</li>
              <li>Submit renewal application before expiry</li>
              <li>Update certificate details in the SMS system once renewed</li>
            </ol>
          ` : `
            <h3>Immediate Actions Required</h3>
            <ol>
              <li><strong>Stop using the equipment if safety-critical</strong></li>
              <li>Contact the issuing authority immediately</li>
              <li>Expedite the renewal process</li>
              <li>Document the reason for expiry</li>
              <li>Update certificate status once renewed</li>
            </ol>
          `}

          <div class="info-box">
            <p>
              <strong>📋 Certificate Types:</strong><br>
              • Safety certificates ensure equipment meets safety standards<br>
              • Inspection certificates verify regular maintenance<br>
              • Calibration certificates ensure measurement accuracy<br>
              • Load test certificates verify weight capacity
            </p>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated certificate warning from the SMS Maintenance Portal</p>
          <p>
            <a href="${data.portalUrl}/certificates/calendar">Certificate Calendar</a> |
            <a href="${data.portalUrl}/help/certificates">Certificate Help</a>
          </p>
        </div>
      </div>
    `;
  }
}