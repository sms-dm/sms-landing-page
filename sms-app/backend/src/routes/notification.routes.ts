import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get user notifications
router.get('/notifications', NotificationController.getUserNotifications);

// Get notification preferences
router.get('/notifications/preferences', NotificationController.getPreferences);

// Update notification preferences
router.put('/notifications/preferences', NotificationController.updatePreferences);

// Get notification statistics
router.get('/notifications/statistics', NotificationController.getStatistics);

// Mark notifications as read (bulk)
router.put('/notifications/read', NotificationController.markAsRead);

// Mark all notifications as read
router.put('/notifications/read-all', NotificationController.markAllAsRead);

// Mark single notification as read
router.put('/notifications/:notificationId/read', NotificationController.markSingleAsRead);

// Delete notification
router.delete('/notifications/:notificationId', NotificationController.deleteNotification);

// Send test notification
router.post('/notifications/test', NotificationController.sendTestNotification);

// Push notification subscription
router.post('/notifications/push/subscribe', NotificationController.subscribePush);

// Push notification unsubscription
router.post('/notifications/push/unsubscribe', NotificationController.unsubscribePush);

export default router;