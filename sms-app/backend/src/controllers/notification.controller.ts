import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { dbRun } from '../config/database.abstraction';

export class NotificationController {
  // Get user notifications
  static async getUserNotifications(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0, unreadOnly = false } = req.query;

      const notifications = await NotificationService.getUserNotifications(userId, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        unreadOnly: unreadOnly === 'true'
      });

      const unreadCount = await NotificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
          hasMore: notifications.length === parseInt(limit as string)
        }
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  }

  // Mark notifications as read
  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { notificationIds } = req.body;

      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({ error: 'Invalid notification IDs' });
      }

      await NotificationService.markAsRead(notificationIds, userId);

      res.json({
        success: true,
        message: 'Notifications marked as read'
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
  }

  // Mark single notification as read
  static async markSingleAsRead(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      await NotificationService.markAsRead([parseInt(notificationId)], userId);

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user.id;

      await dbRun(`
        UPDATE notifications 
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND is_read = false
      `, [userId]);

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  }

  // Delete notification
  static async deleteNotification(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      await dbRun(`
        DELETE FROM notifications 
        WHERE id = ? AND user_id = ?
      `, [notificationId, userId]);

      res.json({
        success: true,
        message: 'Notification deleted'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  // Get notification preferences
  static async getPreferences(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const preferences = await NotificationService.getNotificationPreferences(userId);

      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      res.status(500).json({ error: 'Failed to get notification preferences' });
    }
  }

  // Update notification preferences
  static async updatePreferences(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const preferences = req.body;

      await NotificationService.updateNotificationPreferences(userId, preferences);

      res.json({
        success: true,
        message: 'Notification preferences updated'
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({ error: 'Failed to update notification preferences' });
    }
  }

  // Send test notification
  static async sendTestNotification(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { type = 'test', channels = ['in_app'] } = req.body;

      await NotificationService.sendNotification({
        userId,
        type,
        title: 'Test Notification',
        message: 'This is a test notification to verify your notification settings are working correctly.',
        data: {
          test: true,
          timestamp: new Date().toISOString()
        },
        priority: 'normal',
        channels
      });

      res.json({
        success: true,
        message: 'Test notification sent'
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({ error: 'Failed to send test notification' });
    }
  }

  // Get notification statistics
  static async getStatistics(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { period = '7' } = req.query;

      const stats = await dbRun(`
        SELECT 
          type,
          COUNT(*) as count,
          COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
          MAX(created_at) as latest
        FROM notifications
        WHERE user_id = ?
          AND created_at > datetime('now', '-${parseInt(period as string)} days')
        GROUP BY type
        ORDER BY count DESC
      `, [userId]);

      res.json({
        success: true,
        data: {
          byType: stats,
          period: parseInt(period as string)
        }
      });
    } catch (error) {
      console.error('Error getting notification statistics:', error);
      res.status(500).json({ error: 'Failed to get notification statistics' });
    }
  }

  // Subscribe to push notifications
  static async subscribePush(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { subscription } = req.body;

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid subscription data' });
      }

      // Store push subscription
      await dbRun(`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, endpoint) DO UPDATE SET
          p256dh = excluded.p256dh,
          auth = excluded.auth,
          updated_at = CURRENT_TIMESTAMP
      `, [
        userId,
        subscription.endpoint,
        subscription.keys?.p256dh,
        subscription.keys?.auth
      ]);

      res.json({
        success: true,
        message: 'Push notifications enabled'
      });
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      res.status(500).json({ error: 'Failed to subscribe to push notifications' });
    }
  }

  // Unsubscribe from push notifications
  static async unsubscribePush(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { endpoint } = req.body;

      if (!endpoint) {
        // Remove all subscriptions for user
        await dbRun(`
          DELETE FROM push_subscriptions WHERE user_id = ?
        `, [userId]);
      } else {
        // Remove specific subscription
        await dbRun(`
          DELETE FROM push_subscriptions 
          WHERE user_id = ? AND endpoint = ?
        `, [userId, endpoint]);
      }

      res.json({
        success: true,
        message: 'Push notifications disabled'
      });
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      res.status(500).json({ error: 'Failed to unsubscribe from push notifications' });
    }
  }
}