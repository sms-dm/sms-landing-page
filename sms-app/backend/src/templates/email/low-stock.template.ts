import { BaseEmailTemplate, EmailTemplateData } from './base-template';

export class LowStockTemplate extends BaseEmailTemplate {
  getSubject(data: EmailTemplateData): string {
    if (data.currentStock === 0) {
      return `🚨 OUT OF STOCK: ${data.partName} - ${data.vesselName}`;
    }
    const percentage = Math.round((data.currentStock / data.minimumStock) * 100);
    return `Low Stock Alert: ${data.partName} at ${percentage}% - ${data.vesselName}`;
  }

  getContent(data: EmailTemplateData): string {
    const isOutOfStock = data.currentStock === 0;
    const percentage = Math.round((data.currentStock / data.minimumStock) * 100);
    const urgencyColor = isOutOfStock ? this.dangerColor :
                        percentage < 50 ? this.warningColor : this.primaryColor;

    return `
      <div class="container">
        <div class="header" style="background-color: ${urgencyColor}">
          <h1>Inventory Alert</h1>
          <p>${data.vesselName}</p>
        </div>
        
        <div class="content">
          <h2>${isOutOfStock ? 'OUT OF STOCK' : 'Low Stock Warning'}</h2>
          
          ${isOutOfStock ? `
            <div class="warning-box" style="background-color: #FEE2E2; border-color: ${this.dangerColor}">
              <p style="color: #991B1B">
                <strong>🚨 This part is completely OUT OF STOCK!</strong><br>
                Immediate procurement action required to avoid operational delays.
              </p>
            </div>
          ` : percentage < 50 ? `
            <div class="warning-box">
              <p>
                <strong>⚠️ Stock level is critically low!</strong><br>
                Only ${percentage}% of minimum stock remaining. Consider ordering soon.
              </p>
            </div>
          ` : ''}
          
          <p>The following part requires replenishment:</p>
          
          <table class="details">
            <tr>
              <td>Part Name:</td>
              <td><strong>${data.partName}</strong></td>
            </tr>
            <tr>
              <td>Part Number:</td>
              <td>${data.partNumber || 'N/A'}</td>
            </tr>
            <tr>
              <td>Category:</td>
              <td>${data.category || 'General'}</td>
            </tr>
            <tr>
              <td>Current Stock:</td>
              <td style="color: ${urgencyColor}"><strong>${data.currentStock} ${data.unit || 'units'}</strong></td>
            </tr>
            <tr>
              <td>Minimum Stock:</td>
              <td>${data.minimumStock} ${data.unit || 'units'}</td>
            </tr>
            <tr>
              <td>Reorder Quantity:</td>
              <td>${data.reorderQuantity || data.minimumStock * 2} ${data.unit || 'units'}</td>
            </tr>
            ${data.lastOrderDate ? `
            <tr>
              <td>Last Order Date:</td>
              <td>${new Date(data.lastOrderDate).toLocaleDateString()}</td>
            </tr>
            ` : ''}
            ${data.averageConsumption ? `
            <tr>
              <td>Avg. Monthly Usage:</td>
              <td>${data.averageConsumption} ${data.unit || 'units'}</td>
            </tr>
            ` : ''}
          </table>

          <div class="button-center">
            <a href="${data.portalUrl}/inventory/parts/${data.partId}" class="button" style="background-color: ${urgencyColor}">
              View Part Details
            </a>
            <a href="${data.portalUrl}/inventory/orders/new?partId=${data.partId}" class="button" style="background-color: ${this.successColor}; margin-left: 10px;">
              Create Purchase Order
            </a>
          </div>

          <h3>Recommended Actions</h3>
          <ol>
            <li>Review current consumption patterns</li>
            <li>Check for any pending orders for this part</li>
            <li>Verify stock accuracy with physical count</li>
            <li>${isOutOfStock ? '<strong>Create urgent purchase order</strong>' : 'Plan purchase order before stock depletion'}</li>
            <li>Consider adjusting minimum stock levels if needed</li>
          </ol>

          ${data.criticalEquipment && data.criticalEquipment.length > 0 ? `
            <div class="info-box">
              <p>
                <strong>⚙️ Critical Equipment Using This Part:</strong><br>
                ${data.criticalEquipment.map((eq: any) => `• ${eq.name} (${eq.location})`).join('<br>')}
              </p>
            </div>
          ` : ''}

          ${data.alternativeParts && data.alternativeParts.length > 0 ? `
            <div class="success-box">
              <p>
                <strong>✓ Alternative Parts Available:</strong><br>
                ${data.alternativeParts.map((part: any) => `• ${part.name} - ${part.stock} in stock`).join('<br>')}
              </p>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>This is an automated inventory alert from the SMS Maintenance Portal</p>
          <p>
            <a href="${data.portalUrl}/inventory/settings">Inventory Settings</a> |
            <a href="${data.portalUrl}/help/inventory">Inventory Help</a>
          </p>
          <p style="font-size: 12px; margin-top: 10px;">
            To adjust stock alert thresholds, visit your inventory settings.
          </p>
        </div>
      </div>
    `;
  }
}