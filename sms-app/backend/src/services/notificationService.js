// Simple notification service wrapper for inventory system
// This wraps the TypeScript notification service for use in JavaScript modules

const { NotificationService } = require('./notification.service');

module.exports = {
  // Wrapper methods that inventory system can use
  async sendNotification(options) {
    return NotificationService.sendNotification(options);
  },

  async notifyUser(userId, title, message, priority = 'normal') {
    return NotificationService.sendNotification({
      userId,
      type: 'inventory',
      title,
      message,
      priority,
      channels: ['in_app', 'email']
    });
  },

  async notifyAdmins(title, message, data = {}) {
    // Get all admin users
    const db = require('../db');
    const admins = await db.query(`
      SELECT id FROM users 
      WHERE role = 'admin' AND is_active = true
    `);

    const notifications = admins.rows.map(admin => 
      NotificationService.sendNotification({
        userId: admin.id,
        type: 'admin_alert',
        title,
        message,
        data,
        priority: 'high',
        channels: ['in_app', 'email', 'push']
      })
    );

    return Promise.all(notifications);
  }
};