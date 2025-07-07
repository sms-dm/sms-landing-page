import { dbRun, dbAll, dbGet } from '../config/database.abstraction';
import { EmailService } from './email.service';
// WebSocket service will be injected when needed

interface NotificationOptions {
  userId: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  channels?: ('email' | 'push' | 'in_app')[];
}

export class NotificationService {
  // Send notification through multiple channels
  static async sendNotification(options: NotificationOptions): Promise<void> {
    const channels = options.channels || ['in_app'];
    
    // Store in-app notification
    if (channels.includes('in_app')) {
      await this.createInAppNotification(options);
    }
    
    // Send email notification
    if (channels.includes('email')) {
      await this.sendEmailNotification(options);
    }
    
    // Send push notification via WebSocket
    if (channels.includes('push') || options.priority === 'urgent') {
      await this.sendPushNotification(options);
    }
  }

  // Create in-app notification
  private static async createInAppNotification(options: NotificationOptions): Promise<void> {
    await dbRun(`
      INSERT INTO notifications (
        user_id, type, title, message, data, priority, is_read
      )
      VALUES (?, ?, ?, ?, ?, ?, false)
    `, [
      options.userId,
      options.type,
      options.title,
      options.message,
      JSON.stringify(options.data || {}),
      options.priority || 'normal'
    ]);
  }

  // Send email notification
  private static async sendEmailNotification(options: NotificationOptions): Promise<void> {
    const user = await dbGet(`
      SELECT u.*, v.name as vessel_name, c.name as company_name 
      FROM users u
      LEFT JOIN vessels v ON u.default_vessel_id = v.id
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.id = ?
    `, [options.userId]);
    if (!user) return;
    
    // Check user's email preferences
    const preferences = await dbGet(`
      SELECT email_notifications FROM user_preferences WHERE user_id = ?
    `, [options.userId]);
    
    if (preferences && !preferences.email_notifications) return;
    
    // Map notification types to email templates
    const templateMap: Record<string, string> = {
      'maintenance_reminder': 'maintenance-reminder',
      'certificate_warning': 'certificate-warning',
      'certificate_expired': 'certificate-warning',
      'low_stock': 'low-stock',
      'fault_assignment': 'fault-assignment',
      'fault_status_change': 'fault-status-change',
      'system_announcement': 'system-announcement'
    };
    
    const templateType = templateMap[options.type];
    
    if (templateType) {
      // Use templated email
      await EmailService.sendTemplatedEmail(
        templateType as any,
        user.email,
        {
          ...options.data,
          userName: `${user.first_name} ${user.last_name}`,
          userEmail: user.email,
          vesselName: user.vessel_name,
          companyName: user.company_name,
          title: options.title,
          message: options.message,
          priority: options.priority,
          portalUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
        }
      );
    } else {
      // Fallback to simple email
      await EmailService.sendEmail({
        to: user.email,
        subject: options.title,
        html: `
          <h2>${options.title}</h2>
          <p>${options.message}</p>
          ${options.data?.link ? `<p><a href="${options.data.link}">View Details</a></p>` : ''}
        `
      });
    }
  }

  // Send push notification via WebSocket
  private static async sendPushNotification(options: NotificationOptions): Promise<void> {
    // WebSocket notification would be sent here when WebSocket service is available
    // This could be injected or imported dynamically to avoid circular dependencies
    try {
      const { webSocketService } = await import('../index');
      if (webSocketService) {
        webSocketService.sendToUser(options.userId, 'notification', {
          type: options.type,
          title: options.title,
          message: options.message,
          data: options.data,
          priority: options.priority,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.log('WebSocket service not available for push notification');
    }
  }

  // Send mention notifications
  static async sendMentionNotifications(
    messageId: number, 
    mentions: string[], 
    sender: any, 
    channel: any
  ): Promise<void> {
    const message = await dbGet(`
      SELECT * FROM messages WHERE id = ?
    `, [messageId]);
    
    if (!message) return;
    
    // Get mentioned users
    const mentionedUsers = await this.getMentionedUsersFromList(mentions, channel.id);
    
    for (const user of mentionedUsers) {
      if (user.id === sender.id) continue; // Don't notify sender
      
      await this.sendNotification({
        userId: user.id,
        type: 'mention',
        title: `${sender.name} mentioned you in #${channel.name}`,
        message: this.truncateMessage(message.content, 100),
        data: {
          channelId: channel.id,
          messageId: messageId,
          link: `/channels/${channel.id}?message=${messageId}`
        },
        priority: 'normal',
        channels: ['in_app', 'push']
      });
    }
  }

  // Send HSE notifications
  static async sendHseNotifications(hseUpdate: any, creator: any): Promise<void> {
    // Determine target users based on scope
    let targetUsers = [];
    
    if (hseUpdate.scope === 'fleet') {
      targetUsers = await dbAll(`
        SELECT id, name, email FROM users WHERE is_active = true
      `);
    } else if (hseUpdate.scope === 'vessel' && hseUpdate.vessel_id) {
      targetUsers = await dbAll(`
        SELECT id, name, email FROM users 
        WHERE is_active = true AND default_vessel_id = ?
      `, [hseUpdate.vessel_id]);
    } else if (hseUpdate.scope === 'department' && hseUpdate.department) {
      targetUsers = await dbAll(`
        SELECT id, name, email FROM users 
        WHERE is_active = true AND department = ?
      `, [hseUpdate.department]);
    }
    
    const priority = hseUpdate.severity === 'critical' ? 'urgent' : 
                    hseUpdate.severity === 'high' ? 'high' : 'normal';
    
    for (const user of targetUsers) {
      if (user.id === creator.id) continue;
      
      const channels = ['in_app'];
      if (hseUpdate.severity === 'critical' || hseUpdate.severity === 'high') {
        channels.push('email', 'push');
      }
      
      await this.sendNotification({
        userId: user.id,
        type: 'hse_update',
        title: `New HSE ${hseUpdate.update_type.replace('_', ' ')}: ${hseUpdate.title}`,
        message: `Severity: ${hseUpdate.severity.toUpperCase()}. ${hseUpdate.requires_acknowledgment ? 'Acknowledgment required.' : ''}`,
        data: {
          hseUpdateId: hseUpdate.id,
          severity: hseUpdate.severity,
          requiresAcknowledgment: hseUpdate.requires_acknowledgment,
          link: `/hse/${hseUpdate.id}`
        },
        priority,
        channels
      });
    }
  }

  // Send HSE acknowledgment reminders
  static async sendHseAcknowledgmentReminders(
    hseUpdate: any, 
    userIds: number[], 
    customMessage: string | null,
    sender: any
  ): Promise<any> {
    const results = {
      successful: [],
      failed: []
    };
    
    for (const userId of userIds) {
      try {
        const user = await dbGet(`
          SELECT id, name, email FROM users WHERE id = ?
        `, [userId]);
        
        if (!user) {
          results.failed.push(userId);
          continue;
        }
        
        const message = customMessage || 
          `This HSE update requires your acknowledgment. ${
            hseUpdate.acknowledgment_deadline 
              ? `Deadline: ${new Date(hseUpdate.acknowledgment_deadline).toLocaleDateString()}.` 
              : ''
          }`;
        
        await this.sendNotification({
          userId: user.id,
          type: 'hse_reminder',
          title: `Reminder: HSE Acknowledgment Required - ${hseUpdate.title}`,
          message,
          data: {
            hseUpdateId: hseUpdate.id,
            link: `/hse/${hseUpdate.id}`
          },
          priority: 'high',
          channels: ['in_app', 'email', 'push']
        });
        
        results.successful.push(userId);
      } catch (error) {
        console.error(`Failed to send reminder to user ${userId}:`, error);
        results.failed.push(userId);
      }
    }
    
    return results;
  }

  // Send channel invitation
  static async sendChannelInvitation(
    channel: any, 
    invitedUsers: number[], 
    inviter: any
  ): Promise<void> {
    for (const userId of invitedUsers) {
      await this.sendNotification({
        userId,
        type: 'channel_invitation',
        title: `${inviter.name} added you to #${channel.name}`,
        message: channel.description || 'You have been added to a new channel',
        data: {
          channelId: channel.id,
          channelType: channel.channel_type,
          link: `/channels/${channel.id}`
        },
        priority: 'normal',
        channels: ['in_app', 'push']
      });
    }
  }

  // Send message reaction notification
  static async sendReactionNotification(
    message: any, 
    reactor: any, 
    emoji: string
  ): Promise<void> {
    if (message.sender_id === reactor.id) return;
    
    const channel = await dbGet(`
      SELECT name FROM channels WHERE id = ?
    `, [message.channel_id]);
    
    await this.sendNotification({
      userId: message.sender_id,
      type: 'reaction',
      title: `${reactor.name} reacted to your message`,
      message: `${emoji} in #${channel.name}`,
      data: {
        channelId: message.channel_id,
        messageId: message.id,
        emoji,
        link: `/channels/${message.channel_id}?message=${message.id}`
      },
      priority: 'low',
      channels: ['in_app']
    });
  }

  // Get unread notifications count
  static async getUnreadCount(userId: number): Promise<number> {
    const result = await dbGet(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = false
    `, [userId]);
    
    return result.count;
  }

  // Mark notifications as read
  static async markAsRead(notificationIds: number[], userId: number): Promise<void> {
    const placeholders = notificationIds.map(() => '?').join(',');
    await dbRun(`
      UPDATE notifications 
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders}) AND user_id = ?
    `, [...notificationIds, userId]);
  }

  // Get user notifications
  static async getUserNotifications(
    userId: number, 
    options: { limit?: number; offset?: number; unreadOnly?: boolean }
  ): Promise<any> {
    let query = `
      SELECT * FROM notifications 
      WHERE user_id = ?
    `;
    
    const params: any[] = [userId];
    
    if (options.unreadOnly) {
      query += ` AND is_read = false`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    if (options.limit) {
      query += ` LIMIT ?`;
      params.push(options.limit);
      
      if (options.offset) {
        query += ` OFFSET ?`;
        params.push(options.offset);
      }
    }
    
    const notifications = await dbAll(query, params);
    
    // Parse JSON data field
    return notifications.map(n => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : null
    }));
  }

  // Helper methods
  private static async getMentionedUsersFromList(
    mentions: string[], 
    channelId: number
  ): Promise<any[]> {
    const users: any[] = [];
    
    for (const mention of mentions) {
      if (mention === 'all' || mention === 'channel') {
        const channelUsers = await dbAll(`
          SELECT u.* FROM users u
          JOIN channel_members cm ON u.id = cm.user_id
          WHERE cm.channel_id = ?
        `, [channelId]);
        users.push(...channelUsers);
      } else if (mention === 'here') {
        const onlineUsers = await dbAll(`
          SELECT u.* FROM users u
          JOIN channel_members cm ON u.id = cm.user_id
          WHERE cm.channel_id = ? 
            AND u.last_seen > datetime('now', '-5 minutes')
        `, [channelId]);
        users.push(...onlineUsers);
      } else {
        const user = await dbGet(`
          SELECT u.* FROM users u
          JOIN channel_members cm ON u.id = cm.user_id
          WHERE cm.channel_id = ?
            AND (LOWER(u.name) = LOWER(?) OR LOWER(u.email) LIKE LOWER(?))
        `, [channelId, mention, `${mention}%`]);
        
        if (user) users.push(user);
      }
    }
    
    // Remove duplicates
    return users.filter((user, index, self) =>
      index === self.findIndex((u) => u.id === user.id)
    );
  }
  
  private static truncateMessage(message: string, maxLength: number): string {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength - 3) + '...';
  }

  // Send equipment transfer notification
  static async sendTransferNotification(
    transfer: any,
    fromVessel: string,
    toVessel: string,
    equipment: string
  ): Promise<void> {
    // Notify relevant vessel managers
    const managers = await dbAll(`
      SELECT DISTINCT u.id, u.name, u.email
      FROM users u
      WHERE u.is_active = true
        AND u.role IN ('admin', 'manager', 'vessel_manager')
        AND (
          u.default_vessel_id IN (
            SELECT id FROM vessels WHERE name IN (?, ?)
          )
          OR u.role = 'admin'
        )
    `, [fromVessel, toVessel]);
    
    for (const manager of managers) {
      await this.sendNotification({
        userId: manager.id,
        type: 'equipment_transfer',
        title: 'Equipment Transfer Request',
        message: `Transfer of ${equipment} from ${fromVessel} to ${toVessel}`,
        data: {
          transferId: transfer.id,
          status: transfer.status,
          link: `/transfers/${transfer.id}`
        },
        priority: 'normal',
        channels: ['in_app', 'email']
      });
    }
  }

  // Send maintenance reminder notification
  static async sendMaintenanceReminder(
    equipment: any,
    daysUntilDue: number
  ): Promise<void> {
    const users = await dbAll(`
      SELECT u.id, u.name, u.email
      FROM users u
      WHERE u.is_active = true
        AND u.default_vessel_id = ?
        AND (u.role IN ('engineer', 'technician', 'manager') OR u.department = 'engineering')
    `, [equipment.vessel_id]);
    
    const priority = daysUntilDue <= 7 ? 'high' : 'normal';
    const channels = daysUntilDue <= 7 ? ['in_app', 'email', 'push'] : ['in_app'];
    
    for (const user of users) {
      await this.sendNotification({
        userId: user.id,
        type: 'maintenance_reminder',
        title: `Maintenance Due: ${equipment.name}`,
        message: `Maintenance is due in ${daysUntilDue} days`,
        data: {
          equipmentId: equipment.id,
          dueDate: equipment.next_maintenance_date,
          link: `/equipment/${equipment.id}`
        },
        priority,
        channels
      });
    }
  }

  // Send fault assignment notification
  static async sendFaultAssignmentNotification(
    fault: any,
    assignedUser: any,
    assignedBy: any
  ): Promise<void> {
    await this.sendNotification({
      userId: assignedUser.id,
      type: 'fault_assignment',
      title: `New Fault Assigned: ${fault.title}`,
      message: `You have been assigned a ${fault.severity} severity fault on ${fault.equipment_name} by ${assignedBy.name}`,
      data: {
        faultId: fault.id,
        equipmentId: fault.equipment_id,
        severity: fault.severity,
        assignedBy: assignedBy.name,
        link: `/faults/${fault.id}`
      },
      priority: fault.severity === 'critical' ? 'urgent' : fault.severity === 'high' ? 'high' : 'normal',
      channels: fault.severity === 'critical' ? ['in_app', 'email', 'push'] : ['in_app', 'email']
    });
  }

  // Send fault status change notification
  static async sendFaultStatusChangeNotification(
    fault: any,
    oldStatus: string,
    newStatus: string,
    changedBy: any,
    interestedUsers: any[]
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      'in_progress': 'is now being worked on',
      'pending_parts': 'is waiting for parts',
      'resolved': 'has been resolved',
      'closed': 'has been closed'
    };

    const message = statusMessages[newStatus] || `status changed from ${oldStatus} to ${newStatus}`;

    for (const user of interestedUsers) {
      if (user.id === changedBy.id) continue; // Don't notify the person who made the change

      await this.sendNotification({
        userId: user.id,
        type: 'fault_status_change',
        title: `Fault Update: ${fault.title}`,
        message: `Fault #${fault.id} ${message} by ${changedBy.name}`,
        data: {
          faultId: fault.id,
          equipmentId: fault.equipment_id,
          oldStatus,
          newStatus,
          changedBy: changedBy.name,
          link: `/faults/${fault.id}`
        },
        priority: newStatus === 'resolved' ? 'normal' : 'low',
        channels: ['in_app', newStatus === 'resolved' ? 'email' : null].filter(Boolean) as string[]
      });
    }
  }

  // Send low stock notification
  static async sendLowStockNotification(
    part: any,
    vessel: any
  ): Promise<void> {
    // Get procurement managers and chief engineers
    const users = await dbAll(`
      SELECT u.id, u.name, u.email
      FROM users u
      WHERE u.is_active = true
        AND (
          (u.default_vessel_id = ? AND u.role IN ('chief_engineer', 'second_engineer'))
          OR (u.company_id = ? AND u.role IN ('manager', 'admin'))
        )
    `, [vessel.id, vessel.company_id]);

    const stockPercentage = (part.current_stock / part.minimum_stock) * 100;
    const priority = part.current_stock === 0 ? 'urgent' : stockPercentage < 50 ? 'high' : 'normal';

    for (const user of users) {
      await this.sendNotification({
        userId: user.id,
        type: 'low_stock',
        title: `Low Stock Alert: ${part.part_name}`,
        message: `${part.part_name} on ${vessel.name} is ${part.current_stock === 0 ? 'OUT OF STOCK' : `at ${Math.round(stockPercentage)}% of minimum stock`}. Current: ${part.current_stock}, Minimum: ${part.minimum_stock}`,
        data: {
          partId: part.id,
          vesselId: vessel.id,
          partName: part.part_name,
          currentStock: part.current_stock,
          minimumStock: part.minimum_stock,
          link: `/inventory/parts/${part.id}`
        },
        priority,
        channels: priority === 'urgent' ? ['in_app', 'email', 'push'] : ['in_app', 'email']
      });
    }
  }

  // Send performance milestone notification
  static async sendPerformanceMilestoneNotification(
    milestone: {
      type: string;
      title: string;
      description: string;
      value: number;
      target: number;
      userId?: number;
      vesselId?: number;
      companyId?: number;
    }
  ): Promise<void> {
    const recipients = [];

    if (milestone.userId) {
      // Individual achievement
      recipients.push(milestone.userId);
      
      // Also notify their manager
      const manager = await dbGet(`
        SELECT manager_id FROM users WHERE id = ?
      `, [milestone.userId]);
      
      if (manager?.manager_id) {
        recipients.push(manager.manager_id);
      }
    } else if (milestone.vesselId) {
      // Vessel-wide achievement - notify vessel managers
      const vesselManagers = await dbAll(`
        SELECT id FROM users 
        WHERE default_vessel_id = ? 
        AND role IN ('manager', 'chief_engineer')
        AND is_active = true
      `, [milestone.vesselId]);
      
      recipients.push(...vesselManagers.map(u => u.id));
    } else if (milestone.companyId) {
      // Company-wide achievement - notify admins
      const admins = await dbAll(`
        SELECT id FROM users 
        WHERE company_id = ? 
        AND role IN ('admin', 'manager')
        AND is_active = true
      `, [milestone.companyId]);
      
      recipients.push(...admins.map(u => u.id));
    }

    for (const userId of recipients) {
      await this.sendNotification({
        userId,
        type: 'performance_milestone',
        title: `Achievement Unlocked: ${milestone.title}`,
        message: milestone.description,
        data: {
          milestoneType: milestone.type,
          value: milestone.value,
          target: milestone.target,
          link: '/achievements'
        },
        priority: 'low',
        channels: ['in_app']
      });
    }
  }

  // Send task completion notification
  static async sendTaskCompletionNotification(
    task: any,
    completedBy: any,
    supervisor: any
  ): Promise<void> {
    if (supervisor && supervisor.id !== completedBy.id) {
      await this.sendNotification({
        userId: supervisor.id,
        type: 'task_completion',
        title: `Task Completed: ${task.title}`,
        message: `${completedBy.name} has completed the task "${task.title}" on ${task.equipment_name}`,
        data: {
          taskId: task.id,
          equipmentId: task.equipment_id,
          completedBy: completedBy.name,
          completionDate: new Date().toISOString(),
          link: `/tasks/${task.id}`
        },
        priority: 'low',
        channels: ['in_app']
      });
    }
  }

  // Send system announcement
  static async sendSystemAnnouncement(
    announcement: {
      title: string;
      message: string;
      priority: 'low' | 'normal' | 'high' | 'urgent';
      targetAudience: 'all' | 'vessel' | 'company' | 'role';
      targetId?: number;
      targetRole?: string;
      expiresAt?: Date;
    }
  ): Promise<void> {
    let users = [];

    switch (announcement.targetAudience) {
      case 'all':
        users = await dbAll(`SELECT id FROM users WHERE is_active = true`);
        break;
      case 'vessel':
        users = await dbAll(`
          SELECT id FROM users 
          WHERE default_vessel_id = ? AND is_active = true
        `, [announcement.targetId]);
        break;
      case 'company':
        users = await dbAll(`
          SELECT id FROM users 
          WHERE company_id = ? AND is_active = true
        `, [announcement.targetId]);
        break;
      case 'role':
        users = await dbAll(`
          SELECT id FROM users 
          WHERE role = ? AND is_active = true
        `, [announcement.targetRole]);
        break;
    }

    for (const user of users) {
      await this.sendNotification({
        userId: user.id,
        type: 'system_announcement',
        title: announcement.title,
        message: announcement.message,
        data: {
          expiresAt: announcement.expiresAt,
          targetAudience: announcement.targetAudience
        },
        priority: announcement.priority,
        channels: announcement.priority === 'urgent' ? ['in_app', 'email', 'push'] : ['in_app']
      });
    }
  }

  // Get notification preferences for a user
  static async getNotificationPreferences(userId: number): Promise<any> {
    const user = await dbGet(`
      SELECT 
        notify_critical_faults,
        notify_maintenance_reminders,
        notify_fault_resolutions,
        notification_sound,
        desktop_notifications,
        sms_notifications
      FROM users WHERE id = ?
    `, [userId]);

    const preferences = await dbGet(`
      SELECT * FROM user_preferences WHERE user_id = ?
    `, [userId]);

    return {
      ...user,
      ...preferences
    };
  }

  // Update notification preferences
  static async updateNotificationPreferences(
    userId: number, 
    preferences: any
  ): Promise<void> {
    const userFields = [
      'notify_critical_faults',
      'notify_maintenance_reminders', 
      'notify_fault_resolutions',
      'notification_sound',
      'desktop_notifications',
      'sms_notifications'
    ];

    const userUpdates = Object.keys(preferences)
      .filter(key => userFields.includes(key))
      .map(key => `${key} = ?`);

    if (userUpdates.length > 0) {
      const userValues = userUpdates.map(update => {
        const field = update.split(' = ')[0];
        return preferences[field];
      });

      await dbRun(`
        UPDATE users 
        SET ${userUpdates.join(', ')}
        WHERE id = ?
      `, [...userValues, userId]);
    }

    // Update other preferences in user_preferences table
    const otherPreferences = Object.keys(preferences)
      .filter(key => !userFields.includes(key))
      .reduce((acc, key) => ({ ...acc, [key]: preferences[key] }), {});

    if (Object.keys(otherPreferences).length > 0) {
      await dbRun(`
        INSERT INTO user_preferences (user_id, ${Object.keys(otherPreferences).join(', ')})
        VALUES (?, ${Object.keys(otherPreferences).map(() => '?').join(', ')})
        ON CONFLICT(user_id) DO UPDATE SET
        ${Object.keys(otherPreferences).map(key => `${key} = excluded.${key}`).join(', ')}
      `, [userId, ...Object.values(otherPreferences)]);
    }
  }
}