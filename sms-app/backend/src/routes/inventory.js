const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const inventoryService = require('../services/inventoryService');

// Get all parts inventory for a vessel
router.get('/vessels/:vesselId/parts', authenticateToken, async (req, res) => {
  try {
    const { vesselId } = req.params;
    const { category, stockStatus } = req.query;

    let query = `
      SELECT 
        pi.*,
        CASE 
          WHEN pi.current_stock = 0 THEN 'out_of_stock'
          WHEN pi.current_stock < pi.minimum_stock THEN 'low_stock'
          WHEN pi.current_stock >= pi.minimum_stock AND pi.current_stock < (pi.minimum_stock * 1.5) THEN 'adequate'
          ELSE 'well_stocked'
        END as stock_status,
        (pi.current_stock - pi.minimum_stock) as stock_variance
      FROM parts_inventory pi
      WHERE pi.vessel_id = $1
    `;

    const params = [vesselId];
    let paramCount = 1;

    if (category) {
      params.push(category);
      query += ` AND pi.category = $${++paramCount}`;
    }

    if (stockStatus) {
      if (stockStatus === 'low_stock') {
        query += ` AND pi.current_stock < pi.minimum_stock`;
      } else if (stockStatus === 'out_of_stock') {
        query += ` AND pi.current_stock = 0`;
      }
    }

    query += ' ORDER BY pi.part_name';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching parts inventory:', error);
    res.status(500).json({ error: 'Failed to fetch parts inventory' });
  }
});

// Get single part details
router.get('/parts/:partId', authenticateToken, async (req, res) => {
  try {
    const { partId } = req.params;

    const result = await db.query(`
      SELECT 
        pi.*,
        v.name as vessel_name,
        CASE 
          WHEN pi.current_stock = 0 THEN 'out_of_stock'
          WHEN pi.current_stock < pi.minimum_stock THEN 'low_stock'
          WHEN pi.current_stock >= pi.minimum_stock AND pi.current_stock < (pi.minimum_stock * 1.5) THEN 'adequate'
          ELSE 'well_stocked'
        END as stock_status
      FROM parts_inventory pi
      JOIN vessels v ON pi.vessel_id = v.id
      WHERE pi.id = $1
    `, [partId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Part not found' });
    }

    // Get recent transactions
    const transactions = await db.query(`
      SELECT 
        it.*,
        u.first_name || ' ' || u.last_name as performed_by_name
      FROM inventory_transactions it
      JOIN users u ON it.performed_by = u.id
      WHERE it.part_inventory_id = $1
      ORDER BY it.transaction_date DESC
      LIMIT 10
    `, [partId]);

    const part = result.rows[0];
    part.recent_transactions = transactions.rows;

    res.json(part);
  } catch (error) {
    console.error('Error fetching part details:', error);
    res.status(500).json({ error: 'Failed to fetch part details' });
  }
});

// Update part inventory (for vessels)
router.put('/parts/:partId', authenticateToken, async (req, res) => {
  try {
    const { partId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.current_stock; // Stock updates should use transactions
    delete updates.created_at;
    delete updates.updated_at;

    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = [partId, ...Object.values(updates)];

    const result = await db.query(`
      UPDATE parts_inventory 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating part:', error);
    res.status(500).json({ error: 'Failed to update part' });
  }
});

// Record stock transaction
router.post('/parts/:partId/transactions', authenticateToken, async (req, res) => {
  try {
    const { partId } = req.params;
    const { quantity, transactionType, referenceType, referenceId, notes } = req.body;

    const result = await inventoryService.updateStock(
      partId,
      quantity,
      transactionType,
      { type: referenceType, id: referenceId },
      req.user.id,
      notes
    );

    res.json({
      success: true,
      previousStock: result.previousStock,
      newStock: result.newStock
    });
  } catch (error) {
    console.error('Error recording transaction:', error);
    res.status(500).json({ error: 'Failed to record transaction' });
  }
});

// Get low stock alerts (SMS Admin only)
router.get('/alerts/low-stock', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { status, vesselId, companyId } = req.query;
    const alerts = await inventoryService.getLowStockAlerts({ status, vesselId, companyId });
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Create purchase request (Vessel users)
router.post('/purchase-requests', authenticateToken, async (req, res) => {
  try {
    const { vesselId, items, notes, urgency } = req.body;

    // Create a pending purchase order
    const orderNumber = await inventoryService.generateOrderNumber();
    
    const result = await db.query(`
      INSERT INTO purchase_orders (
        order_number, vessel_id, requested_by, status, notes,
        subtotal, sms_markup_percentage, sms_markup_amount, total_amount
      ) VALUES ($1, $2, $3, 'pending', $4, 0, 20, 0, 0)
      RETURNING *
    `, [orderNumber, vesselId, req.user.id, notes]);

    const purchaseOrder = result.rows[0];

    // Add items
    let subtotal = 0;
    for (const item of items) {
      const partResult = await db.query(
        'SELECT unit_cost FROM parts_inventory WHERE id = $1',
        [item.partInventoryId]
      );
      
      const unitCost = partResult.rows[0].unit_cost;
      const unitPrice = unitCost * 1.2; // 20% markup
      const totalPrice = unitPrice * item.quantity;
      subtotal += unitCost * item.quantity;

      await db.query(`
        INSERT INTO purchase_order_items (
          purchase_order_id, part_inventory_id, quantity, 
          unit_cost, unit_price, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [purchaseOrder.id, item.partInventoryId, item.quantity, unitCost, unitPrice, totalPrice]);
    }

    // Update totals
    const markupAmount = subtotal * 0.2;
    await db.query(`
      UPDATE purchase_orders 
      SET subtotal = $1, sms_markup_amount = $2, total_amount = $3
      WHERE id = $4
    `, [subtotal, markupAmount, subtotal + markupAmount, purchaseOrder.id]);

    // Notify SMS admin
    await db.query(`
      INSERT INTO sms_notifications (
        notification_type, reference_type, reference_id, vessel_id,
        recipient_type, title, message, priority, action_required, action_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      'order_approval', 'purchase_order', purchaseOrder.id, vesselId,
      'sms_admin', `New Purchase Request: ${orderNumber}`,
      `A new purchase request has been submitted for review. Total: $${(subtotal + markupAmount).toFixed(2)}`,
      urgency || 'normal', true, `/admin/orders/${purchaseOrder.id}`
    ]);

    res.json({ 
      success: true, 
      orderNumber: orderNumber,
      message: 'Purchase request submitted for approval' 
    });
  } catch (error) {
    console.error('Error creating purchase request:', error);
    res.status(500).json({ error: 'Failed to create purchase request' });
  }
});

// SMS Admin: Get all purchase orders
router.get('/admin/purchase-orders', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { status, vesselId } = req.query;

    let query = `
      SELECT 
        po.*,
        v.name as vessel_name,
        c.name as company_name,
        u1.first_name || ' ' || u1.last_name as requested_by_name,
        u2.first_name || ' ' || u2.last_name as approved_by_name,
        COUNT(poi.id) as item_count
      FROM purchase_orders po
      JOIN vessels v ON po.vessel_id = v.id
      JOIN companies c ON v.company_id = c.id
      JOIN users u1 ON po.requested_by = u1.id
      LEFT JOIN users u2 ON po.approved_by = u2.id
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (status) {
      params.push(status);
      query += ` AND po.status = $${++paramCount}`;
    }

    if (vesselId) {
      params.push(vesselId);
      query += ` AND po.vessel_id = $${++paramCount}`;
    }

    query += ` GROUP BY po.id, v.name, c.name, u1.first_name, u1.last_name, u2.first_name, u2.last_name
               ORDER BY po.created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// SMS Admin: Approve/Reject purchase order
router.put('/admin/purchase-orders/:orderId/status', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, rejectionReason, supplier, expectedDelivery } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Update purchase order
      const updateQuery = status === 'approved' 
        ? `UPDATE purchase_orders 
           SET status = $1, approved_by = $2, supplier = $3, 
               expected_delivery = $4, order_date = CURRENT_TIMESTAMP
           WHERE id = $5 RETURNING *`
        : `UPDATE purchase_orders 
           SET status = $1, rejection_reason = $2 
           WHERE id = $3 RETURNING *`;

      const updateParams = status === 'approved'
        ? [status, req.user.id, supplier, expectedDelivery, orderId]
        : [status, rejectionReason, orderId];

      const result = await client.query(updateQuery, updateParams);
      const purchaseOrder = result.rows[0];

      // Create invoice if approved
      if (status === 'approved') {
        const invoiceNumber = `INV-${purchaseOrder.order_number.replace('PO-', '')}`;
        
        await client.query(`
          INSERT INTO invoices (
            invoice_number, purchase_order_id, vessel_id, issue_date,
            due_date, subtotal, total_amount, status
          ) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', $4, $5, 'draft')
        `, [
          invoiceNumber, orderId, purchaseOrder.vessel_id,
          purchaseOrder.subtotal + purchaseOrder.sms_markup_amount,
          purchaseOrder.total_amount
        ]);
      }

      // Notify vessel
      const notificationResult = await client.query(`
        SELECT v.name as vessel_name FROM vessels v
        WHERE v.id = $1
      `, [purchaseOrder.vessel_id]);

      const vesselName = notificationResult.rows[0].vessel_name;

      await client.query(`
        INSERT INTO sms_notifications (
          notification_type, reference_type, reference_id, vessel_id,
          recipient_type, recipient_id, title, message, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        'order_status', 'purchase_order', orderId, purchaseOrder.vessel_id,
        'chief_engineer', purchaseOrder.requested_by,
        `Purchase Order ${status === 'approved' ? 'Approved' : 'Rejected'}: ${purchaseOrder.order_number}`,
        status === 'approved' 
          ? `Your purchase order has been approved. Expected delivery: ${expectedDelivery}`
          : `Your purchase order has been rejected. Reason: ${rejectionReason}`,
        'high'
      ]);

      await client.query('COMMIT');
      res.json({ success: true, purchaseOrder });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
});

// Get purchase order details with items
router.get('/purchase-orders/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order details
    const orderResult = await db.query(`
      SELECT 
        po.*,
        v.name as vessel_name,
        c.name as company_name,
        u1.first_name || ' ' || u1.last_name as requested_by_name,
        u2.first_name || ' ' || u2.last_name as approved_by_name
      FROM purchase_orders po
      JOIN vessels v ON po.vessel_id = v.id
      JOIN companies c ON v.company_id = c.id
      JOIN users u1 ON po.requested_by = u1.id
      LEFT JOIN users u2 ON po.approved_by = u2.id
      WHERE po.id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Get order items
    const itemsResult = await db.query(`
      SELECT 
        poi.*,
        pi.part_name,
        pi.part_number,
        pi.description
      FROM purchase_order_items poi
      JOIN parts_inventory pi ON poi.part_inventory_id = pi.id
      WHERE poi.purchase_order_id = $1
    `, [orderId]);

    const purchaseOrder = orderResult.rows[0];
    purchaseOrder.items = itemsResult.rows;

    // Hide markup details from vessel users
    if (req.user.role !== 'admin') {
      delete purchaseOrder.sms_markup_percentage;
      delete purchaseOrder.sms_markup_amount;
      purchaseOrder.items.forEach(item => {
        delete item.markup_percentage;
        delete item.unit_cost;
      });
    }

    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

// Run low stock check (can be called by a cron job)
router.post('/admin/check-low-stock', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
  try {
    const count = await inventoryService.checkLowStock();
    res.json({ 
      success: true, 
      message: `Checked inventory levels. Found ${count} new low stock items.` 
    });
  } catch (error) {
    console.error('Error checking low stock:', error);
    res.status(500).json({ error: 'Failed to check low stock' });
  }
});

module.exports = router;