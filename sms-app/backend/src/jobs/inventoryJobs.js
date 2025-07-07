const cron = require('node-cron');
const inventoryService = require('../services/inventoryService');

class InventoryJobs {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Start all inventory-related scheduled jobs
   */
  start() {
    // Check low stock every hour during business hours (8 AM - 6 PM)
    this.jobs.set('checkLowStock', cron.schedule('0 8-18 * * *', async () => {
      console.log('Running low stock check...');
      try {
        const count = await inventoryService.checkLowStock();
        console.log(`Low stock check completed. Found ${count} new low stock items.`);
      } catch (error) {
        console.error('Error in low stock check job:', error);
      }
    }));

    // Check for overdue invoices daily at 9 AM
    this.jobs.set('checkOverdueInvoices', cron.schedule('0 9 * * *', async () => {
      console.log('Checking for overdue invoices...');
      try {
        await this.checkOverdueInvoices();
      } catch (error) {
        console.error('Error checking overdue invoices:', error);
      }
    }));

    // Generate monthly revenue report on the 1st of each month
    this.jobs.set('monthlyRevenueReport', cron.schedule('0 0 1 * *', async () => {
      console.log('Generating monthly revenue report...');
      try {
        await this.generateMonthlyRevenueReport();
      } catch (error) {
        console.error('Error generating monthly revenue report:', error);
      }
    }));

    console.log('Inventory jobs started');
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Check for overdue invoices and update their status
   */
  async checkOverdueInvoices() {
    const db = require('../db');
    
    try {
      // Update status of overdue invoices
      const result = await db.query(`
        UPDATE invoices 
        SET status = 'overdue'
        WHERE status IN ('sent', 'viewed')
        AND due_date < CURRENT_DATE
        RETURNING id, invoice_number, vessel_id, total_amount
      `);

      if (result.rows.length > 0) {
        console.log(`Marked ${result.rows.length} invoices as overdue`);

        // Notify SMS admins about overdue invoices
        for (const invoice of result.rows) {
          await db.query(`
            INSERT INTO sms_notifications (
              notification_type, reference_type, reference_id, vessel_id,
              recipient_type, title, message, priority, action_required, action_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            'payment_due', 'invoice', invoice.id, invoice.vessel_id,
            'sms_admin', `Overdue Invoice: ${invoice.invoice_number}`,
            `Invoice ${invoice.invoice_number} is now overdue. Amount: $${invoice.total_amount.toFixed(2)}`,
            'high', true, `/admin/invoices/${invoice.id}`
          ]);
        }
      }
    } catch (error) {
      console.error('Error checking overdue invoices:', error);
      throw error;
    }
  }

  /**
   * Generate monthly revenue report for SMS admins
   */
  async generateMonthlyRevenueReport() {
    const db = require('../db');
    const invoiceService = require('../services/invoiceService');
    
    try {
      // Get last month's date range
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const report = await invoiceService.getRevenueReport(
        lastMonth.toISOString().split('T')[0],
        lastMonthEnd.toISOString().split('T')[0]
      );

      // Create notification for SMS admins
      await db.query(`
        INSERT INTO sms_notifications (
          notification_type, reference_type, reference_id, recipient_type,
          title, message, priority, action_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        'order_status', 'report', 0, 'sms_admin',
        `Monthly Revenue Report - ${lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        `Monthly revenue report is ready. Total markup revenue: $${report.totals.totalMarkupRevenue.toFixed(2)}. Total invoiced: $${report.totals.totalInvoiced.toFixed(2)}`,
        'normal', '/admin/reports/revenue'
      ]);

      console.log('Monthly revenue report generated successfully');
    } catch (error) {
      console.error('Error generating monthly revenue report:', error);
      throw error;
    }
  }

  /**
   * Manually trigger low stock check (for testing)
   */
  async runLowStockCheck() {
    console.log('Manually triggering low stock check...');
    try {
      const count = await inventoryService.checkLowStock();
      return { success: true, count };
    } catch (error) {
      console.error('Error in manual low stock check:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new InventoryJobs();