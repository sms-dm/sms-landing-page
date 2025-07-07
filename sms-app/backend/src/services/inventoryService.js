const db = require('../db');
const notificationService = require('./notificationService');

class InventoryService {
  /**
   * Check all parts inventory for low stock levels
   * This should be run periodically (e.g., every hour)
   */
  async checkLowStock() {
    try {
      // Get all parts that are at or below minimum stock
      const lowStockParts = await db.query(`
        SELECT 
          pi.*,
          v.name as vessel_name,
          v.id as vessel_id,
          c.name as company_name,
          c.id as company_id
        FROM parts_inventory pi
        JOIN vessels v ON pi.vessel_id = v.id
        JOIN companies c ON v.company_id = c.id
        WHERE pi.current_stock <= pi.minimum_stock
        AND NOT EXISTS (
          SELECT 1 FROM low_stock_alerts lsa
          WHERE lsa.part_inventory_id = pi.id
          AND lsa.alert_status = 'active'
        )
      `);

      for (const part of lowStockParts) {
        await this.createLowStockAlert(part);
      }

      return lowStockParts.length;
    } catch (error) {
      console.error('Error checking low stock:', error);
      throw error;
    }
  }

  /**
   * Create a low stock alert and notify SMS first
   */
  async createLowStockAlert(part) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Create low stock alert
      const alertResult = await client.query(`
        INSERT INTO low_stock_alerts (
          part_inventory_id, vessel_id, current_stock, minimum_stock
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [part.id, part.vessel_id, part.current_stock, part.minimum_stock]);

      const alert = alertResult.rows[0];

      // Create SMS notification FIRST (before vessel notification)
      await this.notifySMSAdmin(part, alert.id);

      // Update alert to mark SMS as notified
      await client.query(`
        UPDATE low_stock_alerts 
        SET sms_notified = true, sms_notified_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [alert.id]);

      await client.query('COMMIT');

      // Schedule vessel notification for later (e.g., 30 minutes)
      setTimeout(() => {
        this.notifyVessel(part, alert.id);
      }, 30 * 60 * 1000); // 30 minutes delay

      return alert;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Notify SMS admin about low stock
   */
  async notifySMSAdmin(part, alertId) {
    const notification = {
      notification_type: 'low_stock',
      reference_type: 'low_stock_alert',
      reference_id: alertId,
      vessel_id: part.vessel_id,
      recipient_type: 'sms_admin',
      recipient_id: null, // Will be sent to all SMS admins
      title: `Low Stock Alert: ${part.part_name}`,
      message: `Part ${part.part_number} (${part.part_name}) on vessel ${part.vessel_name} is low on stock. Current: ${part.current_stock}, Minimum: ${part.minimum_stock}. Lead time: ${part.lead_time_days} days.`,
      priority: part.is_critical ? 'urgent' : 'high',
      action_required: true,
      action_url: `/admin/inventory/alerts/${alertId}`
    };

    return await db.query(`
      INSERT INTO sms_notifications 
      (notification_type, reference_type, reference_id, vessel_id, recipient_type, 
       recipient_id, title, message, priority, action_required, action_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, Object.values(notification));
  }

  /**
   * Notify vessel about low stock (called after SMS has had time to prepare)
   */
  async notifyVessel(part, alertId) {
    try {
      // Get chief engineer for the vessel
      const chiefEngineer = await db.query(`
        SELECT u.* FROM users u
        WHERE u.role = 'chief_engineer'
        AND u.default_vessel_id = $1
        AND u.is_active = true
        LIMIT 1
      `, [part.vessel_id]);

      if (chiefEngineer.rows.length > 0) {
        const notification = {
          notification_type: 'low_stock',
          reference_type: 'low_stock_alert',
          reference_id: alertId,
          vessel_id: part.vessel_id,
          recipient_type: 'chief_engineer',
          recipient_id: chiefEngineer.rows[0].id,
          title: `Low Stock Alert: ${part.part_name}`,
          message: `Part ${part.part_number} (${part.part_name}) is running low. Current stock: ${part.current_stock}. Please review and submit a purchase request if needed.`,
          priority: part.is_critical ? 'high' : 'normal',
          action_required: true,
          action_url: `/inventory/parts/${part.id}`
        };

        await db.query(`
          INSERT INTO sms_notifications 
          (notification_type, reference_type, reference_id, vessel_id, recipient_type, 
           recipient_id, title, message, priority, action_required, action_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, Object.values(notification));

        // Update alert to mark vessel as notified
        await db.query(`
          UPDATE low_stock_alerts 
          SET vessel_notified = true, vessel_notified_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [alertId]);
      }
    } catch (error) {
      console.error('Error notifying vessel:', error);
    }
  }

  /**
   * Update inventory stock levels
   */
  async updateStock(partInventoryId, quantity, transactionType, reference, userId, notes = null) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Get current stock
      const currentStockResult = await client.query(
        'SELECT current_stock FROM parts_inventory WHERE id = $1',
        [partInventoryId]
      );

      if (currentStockResult.rows.length === 0) {
        throw new Error('Part not found in inventory');
      }

      const previousStock = currentStockResult.rows[0].current_stock;
      const newStock = previousStock + quantity;

      // Create inventory transaction
      await client.query(`
        INSERT INTO inventory_transactions (
          part_inventory_id, transaction_type, quantity, reference_type, 
          reference_id, performed_by, notes, previous_stock, new_stock
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        partInventoryId, transactionType, quantity, reference.type,
        reference.id, userId, notes, previousStock, newStock
      ]);

      // Stock update and alert checking is handled by trigger

      await client.query('COMMIT');
      return { previousStock, newStock };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get low stock alerts for SMS admin dashboard
   */
  async getLowStockAlerts(filters = {}) {
    let query = `
      SELECT 
        lsa.*,
        pi.part_number,
        pi.part_name,
        pi.description,
        pi.lead_time_days,
        pi.preferred_supplier,
        pi.is_critical,
        v.name as vessel_name,
        c.name as company_name
      FROM low_stock_alerts lsa
      JOIN parts_inventory pi ON lsa.part_inventory_id = pi.id
      JOIN vessels v ON lsa.vessel_id = v.id
      JOIN companies c ON v.company_id = c.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (filters.status) {
      params.push(filters.status);
      query += ` AND lsa.alert_status = $${++paramCount}`;
    }

    if (filters.vesselId) {
      params.push(filters.vesselId);
      query += ` AND lsa.vessel_id = $${++paramCount}`;
    }

    if (filters.companyId) {
      params.push(filters.companyId);
      query += ` AND c.id = $${++paramCount}`;
    }

    query += ' ORDER BY lsa.created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Create purchase order from low stock alert
   */
  async createPurchaseOrderFromAlert(alertId, approvedBy, items) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Get alert details
      const alertResult = await client.query(`
        SELECT lsa.*, pi.* 
        FROM low_stock_alerts lsa
        JOIN parts_inventory pi ON lsa.part_inventory_id = pi.id
        WHERE lsa.id = $1
      `, [alertId]);

      if (alertResult.rows.length === 0) {
        throw new Error('Alert not found');
      }

      const alert = alertResult.rows[0];

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Calculate totals with SMS markup
      let subtotal = 0;
      for (const item of items) {
        subtotal += item.quantity * item.unitCost;
      }

      const markupPercentage = 20; // SMS standard markup
      const markupAmount = subtotal * (markupPercentage / 100);
      const totalAmount = subtotal + markupAmount;

      // Create purchase order
      const orderResult = await client.query(`
        INSERT INTO purchase_orders (
          order_number, vessel_id, requested_by, approved_by, status,
          supplier, subtotal, sms_markup_percentage, sms_markup_amount,
          total_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        orderNumber, alert.vessel_id, approvedBy, approvedBy, 'approved',
        alert.preferred_supplier || 'Default Supplier', subtotal, markupPercentage,
        markupAmount, totalAmount
      ]);

      const purchaseOrder = orderResult.rows[0];

      // Create order items
      for (const item of items) {
        const unitPrice = item.unitCost * (1 + markupPercentage / 100);
        await client.query(`
          INSERT INTO purchase_order_items (
            purchase_order_id, part_inventory_id, quantity, unit_cost,
            markup_percentage, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          purchaseOrder.id, item.partInventoryId, item.quantity,
          item.unitCost, markupPercentage, unitPrice, unitPrice * item.quantity
        ]);
      }

      // Update alert with purchase order reference
      await client.query(`
        UPDATE low_stock_alerts 
        SET purchase_order_id = $1, alert_status = 'resolved', resolved_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [purchaseOrder.id, alertId]);

      await client.query('COMMIT');
      return purchaseOrder;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate unique order number
   */
  async generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Get the last order number for this month
    const result = await db.query(`
      SELECT order_number FROM purchase_orders
      WHERE order_number LIKE $1
      ORDER BY order_number DESC
      LIMIT 1
    `, [`PO-${year}${month}%`]);

    let sequence = 1;
    if (result.rows.length > 0) {
      const lastNumber = result.rows[0].order_number;
      const lastSequence = parseInt(lastNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `PO-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
}

module.exports = new InventoryService();