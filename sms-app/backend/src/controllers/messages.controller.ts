import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { dbGet, dbAll, dbRun } from '../config/database.abstraction';
import { MessageService } from '../services/message.service';
import { NotificationService } from '../services/notification.service';

export class MessagesController {
  // Send a message
  static async sendMessage(req: AuthRequest, res: Response) {
    try {
      const { channel_id, content, message_type = 'text', attachments, reply_to_id } = req.body;
      
      if (!channel_id || !content) {
        return res.status(400).json({ error: 'Channel ID and content are required' });
      }

      // Verify user has access to channel
      const membership = await dbGet(`
        SELECT * FROM channel_members 
        WHERE channel_id = ? AND user_id = ?
      `, [channel_id, req.user!.id]);

      if (!membership) {
        return res.status(403).json({ error: 'You do not have access to this channel' });
      }

      // Check if replying to a valid message
      if (reply_to_id) {
        const parentMessage = await dbGet(`
          SELECT * FROM messages 
          WHERE id = ? AND channel_id = ? AND is_deleted = false
        `, [reply_to_id, channel_id]);

        if (!parentMessage) {
          return res.status(404).json({ error: 'Parent message not found' });
        }
      }

      // Create message
      const result = await dbRun(`
        INSERT INTO messages (
          channel_id, sender_id, content, message_type, 
          reply_to_id, is_edited, is_deleted, is_system
        )
        VALUES (?, ?, ?, ?, ?, false, false, false)
      `, [channel_id, req.user!.id, content, message_type, reply_to_id || null]);

      const messageId = result.lastID;

      // Handle attachments if present
      if (attachments && Array.isArray(attachments)) {
        for (const attachment of attachments) {
          await dbRun(`
            INSERT INTO message_attachments (
              message_id, file_name, file_url, file_type, file_size
            )
            VALUES (?, ?, ?, ?, ?)
          `, [messageId, attachment.name, attachment.url, attachment.type, attachment.size]);
        }
      }

      // Detect and store mentions
      const mentions = MessageService.detectMentions(content);
      if (mentions.length > 0) {
        await MessageService.storeMentions(messageId, mentions);
        
        // Send notifications for mentions
        const channel = await dbGet(`SELECT * FROM channels WHERE id = ?`, [channel_id]);
        await NotificationService.sendMentionNotifications(
          messageId, 
          mentions, 
          req.user!, 
          channel
        );
      }

      // Update channel's last activity
      await dbRun(`
        UPDATE channels 
        SET last_activity_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [channel_id]);

      // Get the complete message with sender info
      const message = await dbGet(`
        SELECT m.*, 
          u.name as sender_name, 
          u.email as sender_email, 
          u.role as sender_role,
          u.department as sender_department
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `, [messageId]);

      // Get attachments
      const messageAttachments = await dbAll(`
        SELECT * FROM message_attachments WHERE message_id = ?
      `, [messageId]);

      res.status(201).json({ 
        message: {
          ...message,
          attachments: messageAttachments,
          mentions
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  // Get messages for a channel
  static async getChannelMessages(req: AuthRequest, res: Response) {
    try {
      const channelId = parseInt(req.params.channelId);
      const limit = parseInt(req.query.limit as string) || 50;
      const before = req.query.before ? parseInt(req.query.before as string) : null;
      const after = req.query.after ? parseInt(req.query.after as string) : null;
      const search = req.query.search as string;
      
      // Build query
      let query = `
        SELECT m.*, 
          u.name as sender_name, 
          u.email as sender_email, 
          u.role as sender_role,
          u.department as sender_department,
          CASE WHEN mr.id IS NOT NULL THEN true ELSE false END as is_read,
          parent.content as reply_to_content,
          parent_user.name as reply_to_sender
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
        LEFT JOIN messages parent ON m.reply_to_id = parent.id
        LEFT JOIN users parent_user ON parent.sender_id = parent_user.id
        WHERE m.channel_id = ? AND m.is_deleted = false
      `;
      
      const params: any[] = [req.user!.id, channelId];
      
      if (before) {
        query += ` AND m.id < ?`;
        params.push(before);
      }
      
      if (after) {
        query += ` AND m.id > ?`;
        params.push(after);
      }
      
      if (search) {
        query += ` AND m.content LIKE ?`;
        params.push(`%${search}%`);
      }
      
      query += ` ORDER BY m.created_at DESC LIMIT ?`;
      params.push(limit);
      
      const messages = await dbAll(query, params);
      
      // Get attachments and reactions for each message
      const messagesWithDetails = await Promise.all(
        messages.map(async (message) => {
          const attachments = await dbAll(`
            SELECT * FROM message_attachments WHERE message_id = ?
          `, [message.id]);
          
          const reactions = await dbAll(`
            SELECT emoji, COUNT(*) as count,
              GROUP_CONCAT(u.name) as users
            FROM message_reactions mr
            JOIN users u ON mr.user_id = u.id
            WHERE mr.message_id = ?
            GROUP BY emoji
          `, [message.id]);
          
          return {
            ...message,
            attachments,
            reactions
          };
        })
      );
      
      // Mark messages as read
      for (const message of messages) {
        if (!message.is_read && message.sender_id !== req.user!.id) {
          await dbRun(`
            INSERT INTO message_reads (message_id, user_id)
            VALUES (?, ?)
            ON CONFLICT (message_id, user_id) DO NOTHING
          `, [message.id, req.user!.id]);
        }
      }
      
      // Update last read timestamp
      await dbRun(`
        UPDATE channel_members 
        SET last_read_at = CURRENT_TIMESTAMP
        WHERE channel_id = ? AND user_id = ?
      `, [channelId, req.user!.id]);
      
      res.json({ 
        messages: messagesWithDetails.reverse(), // Return in chronological order
        hasMore: messages.length === limit
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  // Edit a message
  static async editMessage(req: AuthRequest, res: Response) {
    try {
      const messageId = parseInt(req.params.messageId);
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      // Get the message
      const message = await dbGet(`
        SELECT * FROM messages WHERE id = ? AND sender_id = ?
      `, [messageId, req.user!.id]);

      if (!message) {
        return res.status(404).json({ error: 'Message not found or you are not the sender' });
      }

      if (message.is_deleted) {
        return res.status(400).json({ error: 'Cannot edit deleted message' });
      }

      // Update message
      await dbRun(`
        UPDATE messages 
        SET content = ?, is_edited = true, edited_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [content, messageId]);

      // Update mentions
      await dbRun(`DELETE FROM message_mentions WHERE message_id = ?`, [messageId]);
      const mentions = MessageService.detectMentions(content);
      if (mentions.length > 0) {
        await MessageService.storeMentions(messageId, mentions);
      }

      res.json({ message: 'Message updated successfully' });
    } catch (error) {
      console.error('Error editing message:', error);
      res.status(500).json({ error: 'Failed to edit message' });
    }
  }

  // Delete a message
  static async deleteMessage(req: AuthRequest, res: Response) {
    try {
      const messageId = parseInt(req.params.messageId);
      
      // Get the message and check permissions
      const message = await dbGet(`
        SELECT m.*, cm.role as member_role
        FROM messages m
        JOIN channel_members cm ON m.channel_id = cm.channel_id AND cm.user_id = ?
        WHERE m.id = ?
      `, [req.user!.id, messageId]);

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check if user can delete (own message or channel admin/moderator)
      const canDelete = message.sender_id === req.user!.id || 
                       ['admin', 'moderator'].includes(message.member_role);

      if (!canDelete) {
        return res.status(403).json({ error: 'You do not have permission to delete this message' });
      }

      // Soft delete
      await dbRun(`
        UPDATE messages 
        SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, deleted_by = ?
        WHERE id = ?
      `, [req.user!.id, messageId]);

      res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  }

  // Pin/Unpin message
  static async togglePinMessage(req: AuthRequest, res: Response) {
    try {
      const messageId = parseInt(req.params.messageId);
      
      // Get message and check if user is channel admin/moderator
      const message = await dbGet(`
        SELECT m.*, cm.role as member_role
        FROM messages m
        JOIN channel_members cm ON m.channel_id = cm.channel_id AND cm.user_id = ?
        WHERE m.id = ? AND m.is_deleted = false
      `, [req.user!.id, messageId]);

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      if (!['admin', 'moderator'].includes(message.member_role)) {
        return res.status(403).json({ error: 'Only channel admins and moderators can pin messages' });
      }

      // Toggle pin status
      const isPinned = !message.is_pinned;
      await dbRun(`
        UPDATE messages 
        SET is_pinned = ?, 
            pinned_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END,
            pinned_by = CASE WHEN ? THEN ? ELSE NULL END
        WHERE id = ?
      `, [isPinned, isPinned, isPinned, req.user!.id, messageId]);

      res.json({ 
        message: isPinned ? 'Message pinned successfully' : 'Message unpinned successfully',
        isPinned 
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      res.status(500).json({ error: 'Failed to toggle pin status' });
    }
  }

  // Add reaction to message
  static async addReaction(req: AuthRequest, res: Response) {
    try {
      const messageId = parseInt(req.params.messageId);
      const { emoji } = req.body;
      
      if (!emoji) {
        return res.status(400).json({ error: 'Emoji is required' });
      }

      // Check if message exists
      const message = await dbGet(`
        SELECT * FROM messages WHERE id = ? AND is_deleted = false
      `, [messageId]);

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Add or update reaction
      await dbRun(`
        INSERT INTO message_reactions (message_id, user_id, emoji)
        VALUES (?, ?, ?)
        ON CONFLICT (message_id, user_id, emoji) DO NOTHING
      `, [messageId, req.user!.id, emoji]);

      res.json({ message: 'Reaction added successfully' });
    } catch (error) {
      console.error('Error adding reaction:', error);
      res.status(500).json({ error: 'Failed to add reaction' });
    }
  }

  // Remove reaction from message
  static async removeReaction(req: AuthRequest, res: Response) {
    try {
      const messageId = parseInt(req.params.messageId);
      const { emoji } = req.body;
      
      if (!emoji) {
        return res.status(400).json({ error: 'Emoji is required' });
      }

      await dbRun(`
        DELETE FROM message_reactions 
        WHERE message_id = ? AND user_id = ? AND emoji = ?
      `, [messageId, req.user!.id, emoji]);

      res.json({ message: 'Reaction removed successfully' });
    } catch (error) {
      console.error('Error removing reaction:', error);
      res.status(500).json({ error: 'Failed to remove reaction' });
    }
  }

  // Search messages
  static async searchMessages(req: AuthRequest, res: Response) {
    try {
      const { query, channel_id, sender_id, has_attachments, date_from, date_to } = req.query;
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      let searchQuery = `
        SELECT DISTINCT m.*, 
          c.name as channel_name,
          u.name as sender_name,
          u.email as sender_email
        FROM messages m
        JOIN channels c ON m.channel_id = c.id
        JOIN channel_members cm ON c.id = cm.channel_id AND cm.user_id = ?
        JOIN users u ON m.sender_id = u.id
        WHERE m.is_deleted = false AND m.content LIKE ?
      `;
      
      const params: any[] = [req.user!.id, `%${query}%`];
      
      if (channel_id) {
        searchQuery += ` AND m.channel_id = ?`;
        params.push(channel_id);
      }
      
      if (sender_id) {
        searchQuery += ` AND m.sender_id = ?`;
        params.push(sender_id);
      }
      
      if (has_attachments === 'true') {
        searchQuery += ` AND EXISTS (
          SELECT 1 FROM message_attachments ma WHERE ma.message_id = m.id
        )`;
      }
      
      if (date_from) {
        searchQuery += ` AND m.created_at >= ?`;
        params.push(date_from);
      }
      
      if (date_to) {
        searchQuery += ` AND m.created_at <= ?`;
        params.push(date_to);
      }
      
      searchQuery += ` ORDER BY m.created_at DESC LIMIT ?`;
      params.push(limit);
      
      const messages = await dbAll(searchQuery, params);
      
      res.json({ messages });
    } catch (error) {
      console.error('Error searching messages:', error);
      res.status(500).json({ error: 'Failed to search messages' });
    }
  }

  // Get thread messages
  static async getThreadMessages(req: AuthRequest, res: Response) {
    try {
      const messageId = parseInt(req.params.messageId);
      
      // Get the parent message
      const parentMessage = await dbGet(`
        SELECT m.*, u.name as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ? AND m.is_deleted = false
      `, [messageId]);

      if (!parentMessage) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Get all replies
      const replies = await dbAll(`
        SELECT m.*, u.name as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.reply_to_id = ? AND m.is_deleted = false
        ORDER BY m.created_at ASC
      `, [messageId]);

      res.json({
        parentMessage,
        replies,
        replyCount: replies.length
      });
    } catch (error) {
      console.error('Error fetching thread:', error);
      res.status(500).json({ error: 'Failed to fetch thread messages' });
    }
  }
}