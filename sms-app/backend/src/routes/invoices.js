const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const invoiceService = require('../services/invoiceService');

// Get all invoices (SMS Admin)
router.get('/admin/invoices', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { status, vesselId, startDate, endDate } = req.query;

    let query = `
      SELECT 
        i.*,
        po.order_number,
        v.name as vessel_name,
        c.name as company_name
      FROM invoices i
      JOIN purchase_orders po ON i.purchase_order_id = po.id
      JOIN vessels v ON i.vessel_id = v.id
      JOIN companies c ON v.company_id = c.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (status) {
      params.push(status);
      query += ` AND i.status = $${++paramCount}`;
    }

    if (vesselId) {
      params.push(vesselId);
      query += ` AND i.vessel_id = $${++paramCount}`;
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND i.issue_date >= $${++paramCount}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND i.issue_date <= $${++paramCount}`;
    }

    query += ' ORDER BY i.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get vessel invoices (for vessel users)
router.get('/vessels/:vesselId/invoices', authenticateToken, async (req, res) => {
  try {
    const { vesselId } = req.params;
    const { status } = req.query;

    // Verify user has access to this vessel
    if (req.user.role !== 'admin' && req.user.default_vessel_id !== parseInt(vesselId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = `
      SELECT 
        i.id,
        i.invoice_number,
        i.issue_date,
        i.due_date,
        i.total_amount,
        i.status,
        i.payment_terms,
        po.order_number
      FROM invoices i
      JOIN purchase_orders po ON i.purchase_order_id = po.id
      WHERE i.vessel_id = $1
    `;

    const params = [vesselId];

    if (status) {
      params.push(status);
      query += ` AND i.status = $2`;
    }

    query += ' ORDER BY i.issue_date DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vessel invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get single invoice details
router.get('/invoices/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const includeMarkup = req.user.role === 'admin';
    
    const invoice = await invoiceService.getInvoiceSummary(invoiceId, includeMarkup);
    
    // Verify access
    if (req.user.role !== 'admin' && req.user.default_vessel_id !== invoice.vessel_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get invoice items
    const itemsResult = await db.query(`
      SELECT 
        poi.quantity,
        poi.unit_price,
        poi.total_price,
        pi.part_name,
        pi.part_number,
        pi.description
      FROM purchase_order_items poi
      JOIN parts_inventory pi ON poi.part_inventory_id = pi.id
      WHERE poi.purchase_order_id = $1
    `, [invoice.purchase_order_id]);

    invoice.items = itemsResult.rows;

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Generate and send invoice PDF
router.post('/invoices/:invoiceId/send', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { recipientEmail } = req.body;

    const result = await invoiceService.sendInvoice(invoiceId, recipientEmail);
    res.json(result);
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

// Download invoice PDF
router.get('/invoices/:invoiceId/download', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Verify access
    const invoice = await invoiceService.getInvoiceSummary(invoiceId, false);
    if (req.user.role !== 'admin' && req.user.default_vessel_id !== invoice.vessel_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filepath = await invoiceService.generateInvoice(invoiceId);
    res.download(filepath);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ error: 'Failed to download invoice' });
  }
});

// Update invoice status
router.put('/invoices/:invoiceId/status', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateFields = {
      status: status,
      updated_at: 'CURRENT_TIMESTAMP'
    };

    if (status === 'paid') {
      updateFields.paid_at = 'CURRENT_TIMESTAMP';
    }

    if (notes) {
      updateFields.internal_notes = notes;
    }

    const setClause = Object.keys(updateFields)
      .map((key, index) => {
        if (updateFields[key] === 'CURRENT_TIMESTAMP') {
          return `${key} = CURRENT_TIMESTAMP`;
        }
        return `${key} = $${index + 2}`;
      })
      .join(', ');

    const values = [invoiceId];
    Object.entries(updateFields).forEach(([key, value]) => {
      if (value !== 'CURRENT_TIMESTAMP') {
        values.push(value);
      }
    });

    const result = await db.query(`
      UPDATE invoices 
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
});

// Get revenue report (SMS Admin only)
router.get('/admin/revenue-report', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { startDate, endDate, vesselId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const report = await invoiceService.getRevenueReport(startDate, endDate, vesselId);
    res.json(report);
  } catch (error) {
    console.error('Error generating revenue report:', error);
    res.status(500).json({ error: 'Failed to generate revenue report' });
  }
});

// Get outstanding invoices summary
router.get('/admin/outstanding-summary', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_outstanding,
        SUM(total_amount) as total_amount_due,
        SUM(CASE WHEN due_date < CURRENT_DATE THEN total_amount ELSE 0 END) as overdue_amount,
        COUNT(CASE WHEN due_date < CURRENT_DATE THEN 1 END) as overdue_count,
        AVG(CURRENT_DATE - due_date) as avg_days_overdue
      FROM invoices
      WHERE status IN ('sent', 'viewed', 'overdue')
    `);

    const vesselBreakdown = await db.query(`
      SELECT 
        v.name as vessel_name,
        COUNT(i.id) as invoice_count,
        SUM(i.total_amount) as total_due,
        MIN(i.due_date) as oldest_due_date
      FROM invoices i
      JOIN vessels v ON i.vessel_id = v.id
      WHERE i.status IN ('sent', 'viewed', 'overdue')
      GROUP BY v.id, v.name
      ORDER BY total_due DESC
    `);

    res.json({
      summary: result.rows[0],
      byVessel: vesselBreakdown.rows
    });
  } catch (error) {
    console.error('Error fetching outstanding summary:', error);
    res.status(500).json({ error: 'Failed to fetch outstanding summary' });
  }
});

module.exports = router;