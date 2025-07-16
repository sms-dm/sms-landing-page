const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const db = require('../db');

class InvoiceService {
  /**
   * Generate PDF invoice for a purchase order
   */
  async generateInvoice(invoiceId) {
    try {
      // Get invoice details
      const invoiceResult = await db.query(`
        SELECT 
          i.*,
          po.order_number,
          po.supplier,
          po.shipping_address,
          v.name as vessel_name,
          c.name as company_name,
          c.address as company_address,
          c.contact_email,
          c.contact_phone
        FROM invoices i
        JOIN purchase_orders po ON i.purchase_order_id = po.id
        JOIN vessels v ON i.vessel_id = v.id
        JOIN companies c ON v.company_id = c.id
        WHERE i.id = $1
      `, [invoiceId]);

      if (invoiceResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }

      const invoice = invoiceResult.rows[0];

      // Get invoice items
      const itemsResult = await db.query(`
        SELECT 
          poi.*,
          pi.part_name,
          pi.part_number,
          pi.description
        FROM purchase_order_items poi
        JOIN parts_inventory pi ON poi.part_inventory_id = pi.id
        WHERE poi.purchase_order_id = $1
      `, [invoice.purchase_order_id]);

      const items = itemsResult.rows;

      // Create invoice PDF
      const doc = new PDFDocument({ margin: 50 });
      const filename = `invoice_${invoice.invoice_number}.pdf`;
      const filepath = path.join(__dirname, '../../uploads/invoices', filename);

      // Ensure directory exists
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Pipe to file
      doc.pipe(fs.createWriteStream(filepath));

      // Add company header
      doc.fontSize(20)
         .text('SMART MARINE SYSTEMS', 50, 50)
         .fontSize(10)
         .text('Marine Equipment & Parts Supply', 50, 75)
         .text('Email: billing@smartmarinesystems.com', 50, 90)
         .text('Phone: +1-555-0123', 50, 105);

      // Add invoice details
      doc.fontSize(16)
         .text('INVOICE', 400, 50, { align: 'right' })
         .fontSize(10)
         .text(`Invoice #: ${invoice.invoice_number}`, 400, 75, { align: 'right' })
         .text(`Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 400, 90, { align: 'right' })
         .text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 400, 105, { align: 'right' });

      // Add billing information
      doc.fontSize(12)
         .text('Bill To:', 50, 150)
         .fontSize(10)
         .text(invoice.company_name, 50, 170)
         .text(`Vessel: ${invoice.vessel_name}`, 50, 185)
         .text(invoice.company_address || 'Address on file', 50, 200)
         .text(invoice.contact_email || '', 50, 215);

      // Add shipping information
      doc.fontSize(12)
         .text('Ship To:', 300, 150)
         .fontSize(10)
         .text(invoice.shipping_address || `Vessel: ${invoice.vessel_name}`, 300, 170);

      // Add items table
      const tableTop = 280;
      doc.fontSize(10);

      // Table headers
      doc.text('Item', 50, tableTop)
         .text('Part Number', 150, tableTop)
         .text('Qty', 300, tableTop)
         .text('Unit Price', 350, tableTop)
         .text('Total', 450, tableTop);

      // Draw line under headers
      doc.moveTo(50, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke();

      // Add items
      let position = tableTop + 30;
      items.forEach(item => {
        doc.text(item.part_name, 50, position)
           .text(item.part_number, 150, position)
           .text(item.quantity.toString(), 300, position)
           .text(`$${item.unit_price.toFixed(2)}`, 350, position)
           .text(`$${item.total_price.toFixed(2)}`, 450, position);
        position += 20;
      });

      // Add totals
      const totalsTop = position + 20;
      doc.moveTo(350, totalsTop)
         .lineTo(550, totalsTop)
         .stroke();

      doc.text('Subtotal:', 350, totalsTop + 10)
         .text(`$${invoice.subtotal.toFixed(2)}`, 450, totalsTop + 10);

      if (invoice.shipping_cost > 0) {
        doc.text('Shipping:', 350, totalsTop + 30)
           .text(`$${invoice.shipping_cost.toFixed(2)}`, 450, totalsTop + 30);
      }

      if (invoice.tax_amount > 0) {
        doc.text('Tax:', 350, totalsTop + 50)
           .text(`$${invoice.tax_amount.toFixed(2)}`, 450, totalsTop + 50);
      }

      doc.fontSize(12)
         .text('Total Due:', 350, totalsTop + 70)
         .text(`$${invoice.total_amount.toFixed(2)}`, 450, totalsTop + 70);

      // Add payment terms
      doc.fontSize(10)
         .text(`Payment Terms: ${invoice.payment_terms}`, 50, totalsTop + 100)
         .text('Please remit payment to the above address.', 50, totalsTop + 115);

      // Add footer
      doc.fontSize(8)
         .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

      // Finalize PDF
      doc.end();

      return filepath;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }

  /**
   * Send invoice via email
   */
  async sendInvoice(invoiceId, recipientEmail) {
    try {
      const filepath = await this.generateInvoice(invoiceId);
      
      // Update invoice status
      await db.query(`
        UPDATE invoices 
        SET status = 'sent', sent_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [invoiceId]);

      // In a real implementation, you would send the email here
      // For now, we'll just return the file path
      return {
        success: true,
        filepath: filepath,
        message: 'Invoice generated successfully'
      };
    } catch (error) {
      console.error('Error sending invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoice summary with hidden markup details
   */
  async getInvoiceSummary(invoiceId, includeMarkup = false) {
    try {
      const result = await db.query(`
        SELECT 
          i.*,
          po.order_number,
          po.sms_markup_percentage,
          po.sms_markup_amount,
          po.subtotal as original_subtotal,
          v.name as vessel_name,
          c.name as company_name
        FROM invoices i
        JOIN purchase_orders po ON i.purchase_order_id = po.id
        JOIN vessels v ON i.vessel_id = v.id
        JOIN companies c ON v.company_id = c.id
        WHERE i.id = $1
      `, [invoiceId]);

      if (result.rows.length === 0) {
        throw new Error('Invoice not found');
      }

      const invoice = result.rows[0];

      // Remove markup details if not authorized
      if (!includeMarkup) {
        delete invoice.sms_markup_percentage;
        delete invoice.sms_markup_amount;
        delete invoice.original_subtotal;
      }

      return invoice;
    } catch (error) {
      console.error('Error getting invoice summary:', error);
      throw error;
    }
  }

  /**
   * Calculate revenue report for SMS
   */
  async getRevenueReport(startDate, endDate, vesselId = null) {
    try {
      let query = `
        SELECT 
          DATE_TRUNC('month', i.issue_date) as month,
          COUNT(DISTINCT i.id) as invoice_count,
          COUNT(DISTINCT po.vessel_id) as vessel_count,
          SUM(po.subtotal) as total_base_cost,
          SUM(po.sms_markup_amount) as total_markup_revenue,
          SUM(i.total_amount) as total_invoiced,
          AVG(po.sms_markup_percentage) as avg_markup_percentage
        FROM invoices i
        JOIN purchase_orders po ON i.purchase_order_id = po.id
        WHERE i.issue_date BETWEEN $1 AND $2
        AND i.status NOT IN ('cancelled', 'draft')
      `;

      const params = [startDate, endDate];

      if (vesselId) {
        query += ` AND po.vessel_id = $3`;
        params.push(vesselId);
      }

      query += ` GROUP BY DATE_TRUNC('month', i.issue_date)
                 ORDER BY month DESC`;

      const result = await db.query(query, params);

      // Calculate totals
      const totals = result.rows.reduce((acc, row) => ({
        totalInvoices: acc.totalInvoices + parseInt(row.invoice_count),
        totalBaseCost: acc.totalBaseCost + parseFloat(row.total_base_cost || 0),
        totalMarkupRevenue: acc.totalMarkupRevenue + parseFloat(row.total_markup_revenue || 0),
        totalInvoiced: acc.totalInvoiced + parseFloat(row.total_invoiced || 0)
      }), {
        totalInvoices: 0,
        totalBaseCost: 0,
        totalMarkupRevenue: 0,
        totalInvoiced: 0
      });

      return {
        monthly: result.rows,
        totals: totals,
        averageMarkupPercentage: 20, // SMS standard
        projectedAnnualRevenue: totals.totalMarkupRevenue * (12 / result.rows.length)
      };
    } catch (error) {
      console.error('Error generating revenue report:', error);
      throw error;
    }
  }
}

module.exports = new InvoiceService();