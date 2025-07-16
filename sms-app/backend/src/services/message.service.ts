import { dbRun, dbAll, dbGet } from '../config/database.abstraction';

export class MessageService {
  // Detect mentions in message content
  static detectMentions(content: string): string[] {
    const mentionPattern = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionPattern.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    
    // Also detect @all, @channel, @here
    if (content.includes('@all') || content.includes('@channel')) {
      mentions.push('all');
    }
    if (content.includes('@here')) {
      mentions.push('here');
    }
    
    return [...new Set(mentions)]; // Remove duplicates
  }

  // Store mentions in database
  static async storeMentions(messageId: number, mentions: string[]): Promise<void> {
    for (const mention of mentions) {
      if (mention === 'all' || mention === 'channel' || mention === 'here') {
        // Store special mentions
        await dbRun(`
          INSERT INTO message_mentions (message_id, mention_type, mention_value)
          VALUES (?, 'special', ?)
        `, [messageId, mention]);
      } else {
        // Try to find user by username
        const user = await dbGet(`
          SELECT id FROM users 
          WHERE LOWER(name) = LOWER(?) OR LOWER(email) LIKE LOWER(?)
        `, [mention, `${mention}%`]);
        
        if (user) {
          await dbRun(`
            INSERT INTO message_mentions (message_id, mention_type, user_id)
            VALUES (?, 'user', ?)
          `, [messageId, user.id]);
        } else {
          // Store as text mention if user not found
          await dbRun(`
            INSERT INTO message_mentions (message_id, mention_type, mention_value)
            VALUES (?, 'text', ?)
          `, [messageId, mention]);
        }
      }
    }
  }

  // Get mentioned users for a message
  static async getMentionedUsers(messageId: number, channelId: number): Promise<any[]> {
    const mentions = await dbAll(`
      SELECT * FROM message_mentions WHERE message_id = ?
    `, [messageId]);
    
    const users: any[] = [];
    
    for (const mention of mentions) {
      if (mention.mention_type === 'user' && mention.user_id) {
        const user = await dbGet(`
          SELECT u.* FROM users u
          JOIN channel_members cm ON u.id = cm.user_id
          WHERE u.id = ? AND cm.channel_id = ?
        `, [mention.user_id, channelId]);
        
        if (user) {
          users.push(user);
        }
      } else if (mention.mention_type === 'special') {
        if (mention.mention_value === 'all' || mention.mention_value === 'channel') {
          // Get all channel members
          const channelUsers = await dbAll(`
            SELECT u.* FROM users u
            JOIN channel_members cm ON u.id = cm.user_id
            WHERE cm.channel_id = ?
          `, [channelId]);
          
          users.push(...channelUsers);
        } else if (mention.mention_value === 'here') {
          // Get online channel members
          const onlineUsers = await dbAll(`
            SELECT u.* FROM users u
            JOIN channel_members cm ON u.id = cm.user_id
            WHERE cm.channel_id = ? 
              AND u.last_seen > datetime('now', '-5 minutes')
          `, [channelId]);
          
          users.push(...onlineUsers);
        }
      }
    }
    
    // Remove duplicates
    const uniqueUsers = users.filter((user, index, self) =>
      index === self.findIndex((u) => u.id === user.id)
    );
    
    return uniqueUsers;
  }

  // Format message for display
  static formatMessage(message: any): any {
    return {
      ...message,
      formattedTime: new Date(message.created_at).toLocaleString(),
      isEdited: message.is_edited,
      editedTime: message.edited_at ? new Date(message.edited_at).toLocaleString() : null
    };
  }

  // Check if user can edit message
  static canEditMessage(message: any, userId: number): boolean {
    // User can edit their own messages within 24 hours
    const messageDate = new Date(message.created_at);
    const now = new Date();
    const hoursSinceCreated = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    return message.sender_id === userId && hoursSinceCreated < 24 && !message.is_deleted;
  }

  // Check if user can delete message
  static canDeleteMessage(message: any, userId: number, userRole: string): boolean {
    // User can delete their own messages or admins/moderators can delete any
    return message.sender_id === userId || ['admin', 'moderator'].includes(userRole);
  }

  // Get message statistics for a channel
  static async getChannelMessageStats(channelId: number, period: number = 7): Promise<any> {
    const dateFilter = `datetime('now', '-${period} days')`;
    
    const stats = await dbGet(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(DISTINCT sender_id) as unique_senders,
        COUNT(DISTINCT DATE(created_at)) as active_days,
        AVG(LENGTH(content)) as avg_message_length
      FROM messages
      WHERE channel_id = ? 
        AND created_at > ${dateFilter}
        AND is_deleted = false
    `, [channelId]);
    
    const messagesByType = await dbAll(`
      SELECT 
        message_type,
        COUNT(*) as count
      FROM messages
      WHERE channel_id = ? 
        AND created_at > ${dateFilter}
        AND is_deleted = false
      GROUP BY message_type
    `, [channelId]);
    
    const topSenders = await dbAll(`
      SELECT 
        u.id,
        u.name,
        COUNT(m.id) as message_count
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.channel_id = ? 
        AND m.created_at > ${dateFilter}
        AND m.is_deleted = false
      GROUP BY u.id
      ORDER BY message_count DESC
      LIMIT 5
    `, [channelId]);
    
    const activityByHour = await dbAll(`
      SELECT 
        strftime('%H', created_at) as hour,
        COUNT(*) as message_count
      FROM messages
      WHERE channel_id = ? 
        AND created_at > ${dateFilter}
        AND is_deleted = false
      GROUP BY hour
      ORDER BY hour
    `, [channelId]);
    
    return {
      ...stats,
      messagesByType,
      topSenders,
      activityByHour,
      period
    };
  }

  // Search messages with advanced filters
  static async searchMessages(filters: {
    query?: string;
    channelId?: number;
    senderId?: number;
    startDate?: string;
    endDate?: string;
    messageType?: string;
    hasAttachments?: boolean;
    hasMentions?: boolean;
    userId: number;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    let query = `
      SELECT DISTINCT m.*, 
        c.name as channel_name,
        u.name as sender_name
      FROM messages m
      JOIN channels c ON m.channel_id = c.id
      JOIN channel_members cm ON c.id = cm.channel_id AND cm.user_id = ?
      JOIN users u ON m.sender_id = u.id
      WHERE m.is_deleted = false
    `;
    
    const params: any[] = [filters.userId];
    
    if (filters.query) {
      query += ` AND m.content LIKE ?`;
      params.push(`%${filters.query}%`);
    }
    
    if (filters.channelId) {
      query += ` AND m.channel_id = ?`;
      params.push(filters.channelId);
    }
    
    if (filters.senderId) {
      query += ` AND m.sender_id = ?`;
      params.push(filters.senderId);
    }
    
    if (filters.startDate) {
      query += ` AND m.created_at >= ?`;
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      query += ` AND m.created_at <= ?`;
      params.push(filters.endDate);
    }
    
    if (filters.messageType) {
      query += ` AND m.message_type = ?`;
      params.push(filters.messageType);
    }
    
    if (filters.hasAttachments) {
      query += ` AND EXISTS (
        SELECT 1 FROM message_attachments ma WHERE ma.message_id = m.id
      )`;
    }
    
    if (filters.hasMentions) {
      query += ` AND EXISTS (
        SELECT 1 FROM message_mentions mm WHERE mm.message_id = m.id
      )`;
    }
    
    // Get total count
    const countQuery = query.replace(
      'SELECT DISTINCT m.*, c.name as channel_name, u.name as sender_name',
      'SELECT COUNT(DISTINCT m.id) as total'
    );
    const totalResult = await dbGet(countQuery, params);
    
    // Add pagination
    query += ` ORDER BY m.created_at DESC`;
    
    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
      
      if (filters.offset) {
        query += ` OFFSET ?`;
        params.push(filters.offset);
      }
    }
    
    const messages = await dbAll(query, params);
    
    return {
      messages,
      total: totalResult.total,
      limit: filters.limit || messages.length,
      offset: filters.offset || 0
    };
  }

  // Get unread message count for user
  static async getUnreadCount(userId: number): Promise<any> {
    const channels = await dbAll(`
      SELECT 
        c.id,
        c.name,
        COUNT(m.id) as unread_count
      FROM channels c
      JOIN channel_members cm ON c.id = cm.channel_id
      LEFT JOIN messages m ON c.id = m.channel_id 
        AND m.created_at > COALESCE(cm.last_read_at, '1970-01-01')
        AND m.is_deleted = false
        AND m.sender_id != cm.user_id
      WHERE cm.user_id = ? AND c.is_active = true
      GROUP BY c.id
      HAVING unread_count > 0
    `, [userId]);
    
    const totalUnread = channels.reduce((sum, channel) => sum + channel.unread_count, 0);
    
    return {
      totalUnread,
      channels
    };
  }

  // Mark channel as read
  static async markChannelAsRead(channelId: number, userId: number): Promise<void> {
    await dbRun(`
      UPDATE channel_members 
      SET last_read_at = CURRENT_TIMESTAMP
      WHERE channel_id = ? AND user_id = ?
    `, [channelId, userId]);
    
    // Mark individual messages as read
    await dbRun(`
      INSERT INTO message_reads (message_id, user_id)
      SELECT m.id, ?
      FROM messages m
      LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
      WHERE m.channel_id = ? 
        AND m.is_deleted = false 
        AND mr.id IS NULL
    `, [userId, userId, channelId]);
  }
}