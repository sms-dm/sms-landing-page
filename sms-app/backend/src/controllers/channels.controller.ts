import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { dbGet, dbAll, dbRun } from '../config/database.abstraction';
import { channelAccessMiddleware } from '../middleware/channelAccess.middleware';

export class ChannelsController {
  // Get all channels for authenticated user
  static async getChannels(req: AuthRequest, res: Response) {
    try {
      const { type, vessel_id, department } = req.query;
      
      let query = `
        SELECT DISTINCT c.*, 
          cm.role as user_role,
          cm.last_read_at,
          cm.notifications_enabled,
          v.name as vessel_name,
          (
            SELECT COUNT(*) 
            FROM messages m 
            WHERE m.channel_id = c.id 
              AND m.created_at > COALESCE(cm.last_read_at, '1970-01-01')
              AND m.is_deleted = false
              AND m.sender_id != ?
          ) as unread_count,
          (
            SELECT m.content 
            FROM messages m 
            WHERE m.channel_id = c.id 
              AND m.is_deleted = false
            ORDER BY m.created_at DESC 
            LIMIT 1
          ) as last_message
        FROM channels c
        JOIN channel_members cm ON c.id = cm.channel_id
        LEFT JOIN vessels v ON c.vessel_id = v.id
        WHERE cm.user_id = ? AND c.is_active = true
      `;
      
      const params = [req.user!.id, req.user!.id];
      
      if (type) {
        query += ` AND c.channel_type = ?`;
        params.push(type as string);
      }
      
      if (vessel_id) {
        query += ` AND c.vessel_id = ?`;
        params.push(vessel_id as string);
      }
      
      if (department) {
        query += ` AND c.department = ?`;
        params.push(department as string);
      }
      
      query += ` ORDER BY c.channel_type, c.name`;
      
      const channels = await dbAll(query, params);
      
      res.json({ channels });
    } catch (error) {
      console.error('Error fetching channels:', error);
      res.status(500).json({ error: 'Failed to fetch channels' });
    }
  }

  // Get channel details
  static async getChannelById(req: AuthRequest, res: Response) {
    try {
      const channelId = parseInt(req.params.channelId);
      
      const channel = await dbGet(`
        SELECT c.*, v.name as vessel_name
        FROM channels c
        LEFT JOIN vessels v ON c.vessel_id = v.id
        WHERE c.id = ?
      `, [channelId]);

      if (!channel) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      // Get channel members with online status
      const members = await dbAll(`
        SELECT u.id, u.name, u.email, u.role, u.department, 
               cm.role as channel_role, cm.joined_at,
               cm.notifications_enabled,
               CASE WHEN u.last_seen > datetime('now', '-5 minutes') THEN true ELSE false END as is_online
        FROM channel_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.channel_id = ?
        ORDER BY u.name
      `, [channelId]);

      // Get pinned messages
      const pinnedMessages = await dbAll(`
        SELECT m.*, u.name as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.channel_id = ? AND m.is_pinned = true AND m.is_deleted = false
        ORDER BY m.pinned_at DESC
      `, [channelId]);

      res.json({ 
        channel: {
          ...channel,
          members,
          memberCount: members.length,
          pinnedMessages
        }
      });
    } catch (error) {
      console.error('Error fetching channel details:', error);
      res.status(500).json({ error: 'Failed to fetch channel details' });
    }
  }

  // Create new channel
  static async createChannel(req: AuthRequest, res: Response) {
    try {
      const { 
        name, 
        channel_type, 
        vessel_id, 
        department, 
        description, 
        is_private, 
        member_ids,
        auto_add_vessel_members 
      } = req.body;
      
      // Validate required fields
      if (!name || !channel_type) {
        return res.status(400).json({ error: 'Name and channel type are required' });
      }

      // Validate channel type
      const validTypes = ['team', 'vessel', 'direct', 'hse', 'announcement', 'department'];
      if (!validTypes.includes(channel_type)) {
        return res.status(400).json({ error: 'Invalid channel type' });
      }

      // Additional validations
      if (channel_type === 'vessel' && !vessel_id) {
        return res.status(400).json({ error: 'Vessel ID is required for vessel channels' });
      }

      if (channel_type === 'department' && !department) {
        return res.status(400).json({ error: 'Department is required for department channels' });
      }

      // Check for duplicate direct message channel
      if (channel_type === 'direct' && member_ids && member_ids.length === 1) {
        const existingDM = await dbGet(`
          SELECT c.* FROM channels c
          JOIN channel_members cm1 ON c.id = cm1.channel_id
          JOIN channel_members cm2 ON c.id = cm2.channel_id
          WHERE c.channel_type = 'direct'
            AND cm1.user_id = ? AND cm2.user_id = ?
            AND c.is_active = true
        `, [req.user!.id, member_ids[0]]);

        if (existingDM) {
          return res.status(409).json({ 
            error: 'Direct message channel already exists',
            channel: existingDM 
          });
        }
      }

      // Create channel
      const result = await dbRun(`
        INSERT INTO channels (
          name, channel_type, vessel_id, department, description, 
          is_active, is_private, created_by
        )
        VALUES (?, ?, ?, ?, ?, true, ?, ?)
      `, [
        name, 
        channel_type, 
        vessel_id || null, 
        department || null, 
        description || null, 
        is_private || false, 
        req.user!.id
      ]);

      const channelId = result.lastID;

      // Add creator as admin
      await dbRun(`
        INSERT INTO channel_members (channel_id, user_id, role)
        VALUES (?, ?, 'admin')
      `, [channelId, req.user!.id]);

      // Add specified members
      if (member_ids && Array.isArray(member_ids)) {
        for (const userId of member_ids) {
          if (userId !== req.user!.id) {
            await dbRun(`
              INSERT INTO channel_members (channel_id, user_id, role)
              VALUES (?, ?, 'member')
              ON CONFLICT (channel_id, user_id) DO NOTHING
            `, [channelId, userId]);
          }
        }
      }

      // Auto-add vessel members if requested
      if (auto_add_vessel_members && vessel_id) {
        const vesselUsers = await dbAll(`
          SELECT id FROM users 
          WHERE default_vessel_id = ? AND is_active = true
        `, [vessel_id]);

        for (const user of vesselUsers) {
          if (user.id !== req.user!.id) {
            await dbRun(`
              INSERT INTO channel_members (channel_id, user_id, role)
              VALUES (?, ?, 'member')
              ON CONFLICT (channel_id, user_id) DO NOTHING
            `, [channelId, user.id]);
          }
        }
      }

      // Get the created channel
      const channel = await dbGet(`
        SELECT c.*, v.name as vessel_name
        FROM channels c
        LEFT JOIN vessels v ON c.vessel_id = v.id
        WHERE c.id = ?
      `, [channelId]);

      // Send system message
      await dbRun(`
        INSERT INTO messages (
          channel_id, sender_id, content, message_type, is_system
        )
        VALUES (?, ?, ?, 'system', true)
      `, [
        channelId, 
        req.user!.id, 
        `${req.user!.name} created the channel "${name}"`
      ]);

      res.status(201).json({ channel });
    } catch (error) {
      console.error('Error creating channel:', error);
      res.status(500).json({ error: 'Failed to create channel' });
    }
  }

  // Update channel settings
  static async updateChannel(req: AuthRequest, res: Response) {
    try {
      const channelId = parseInt(req.params.channelId);
      const { name, description, is_private, notification_settings } = req.body;
      
      // Update channel
      await dbRun(`
        UPDATE channels 
        SET name = COALESCE(?, name), 
            description = COALESCE(?, description), 
            is_private = COALESCE(?, is_private), 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [name, description, is_private, channelId]);

      // Update notification settings if provided
      if (notification_settings) {
        await dbRun(`
          UPDATE channel_members 
          SET notifications_enabled = ?
          WHERE channel_id = ? AND user_id = ?
        `, [notification_settings.enabled, channelId, req.user!.id]);
      }

      const channel = await dbGet(`
        SELECT c.*, v.name as vessel_name
        FROM channels c
        LEFT JOIN vessels v ON c.vessel_id = v.id
        WHERE c.id = ?
      `, [channelId]);

      res.json({ channel });
    } catch (error) {
      console.error('Error updating channel:', error);
      res.status(500).json({ error: 'Failed to update channel' });
    }
  }

  // Archive/Delete channel
  static async archiveChannel(req: AuthRequest, res: Response) {
    try {
      const channelId = parseInt(req.params.channelId);
      
      await dbRun(`
        UPDATE channels 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [channelId]);

      res.json({ message: 'Channel archived successfully' });
    } catch (error) {
      console.error('Error archiving channel:', error);
      res.status(500).json({ error: 'Failed to archive channel' });
    }
  }

  // Add members to channel
  static async addMembers(req: AuthRequest, res: Response) {
    try {
      const channelId = parseInt(req.params.channelId);
      const { user_ids, role = 'member' } = req.body;
      
      if (!user_ids || !Array.isArray(user_ids)) {
        return res.status(400).json({ error: 'user_ids array is required' });
      }

      const addedMembers = [];
      const alreadyMembers = [];

      for (const userId of user_ids) {
        try {
          await dbRun(`
            INSERT INTO channel_members (channel_id, user_id, role)
            VALUES (?, ?, ?)
          `, [channelId, userId, role]);
          addedMembers.push(userId);

          // Get user details for system message
          const user = await dbGet(`SELECT name FROM users WHERE id = ?`, [userId]);
          if (user) {
            // Send system message
            await dbRun(`
              INSERT INTO messages (
                channel_id, sender_id, content, message_type, is_system
              )
              VALUES (?, ?, ?, 'system', true)
            `, [
              channelId, 
              req.user!.id, 
              `${req.user!.name} added ${user.name} to the channel`
            ]);
          }
        } catch (err) {
          // User might already be a member
          alreadyMembers.push(userId);
        }
      }

      res.json({ 
        message: `Added ${addedMembers.length} members to the channel`,
        addedMembers,
        alreadyMembers 
      });
    } catch (error) {
      console.error('Error adding members:', error);
      res.status(500).json({ error: 'Failed to add members' });
    }
  }

  // Remove member from channel
  static async removeMember(req: AuthRequest, res: Response) {
    try {
      const channelId = parseInt(req.params.channelId);
      const userId = parseInt(req.params.userId);
      
      // Get user details for system message
      const user = await dbGet(`SELECT name FROM users WHERE id = ?`, [userId]);
      
      // Remove member
      await dbRun(`
        DELETE FROM channel_members 
        WHERE channel_id = ? AND user_id = ?
      `, [channelId, userId]);

      if (user) {
        // Send system message
        const actionUser = userId === req.user!.id ? 'left' : `removed ${user.name} from`;
        await dbRun(`
          INSERT INTO messages (
            channel_id, sender_id, content, message_type, is_system
          )
          VALUES (?, ?, ?, 'system', true)
        `, [
          channelId, 
          req.user!.id, 
          `${req.user!.name} ${actionUser} the channel`
        ]);
      }

      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({ error: 'Failed to remove member' });
    }
  }

  // Update member role
  static async updateMemberRole(req: AuthRequest, res: Response) {
    try {
      const channelId = parseInt(req.params.channelId);
      const userId = parseInt(req.params.userId);
      const { role } = req.body;
      
      if (!['admin', 'moderator', 'member'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      await dbRun(`
        UPDATE channel_members 
        SET role = ?
        WHERE channel_id = ? AND user_id = ?
      `, [role, channelId, userId]);

      res.json({ message: 'Member role updated successfully' });
    } catch (error) {
      console.error('Error updating member role:', error);
      res.status(500).json({ error: 'Failed to update member role' });
    }
  }

  // Search channels
  static async searchChannels(req: AuthRequest, res: Response) {
    try {
      const { query, type, include_private } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      let searchQuery = `
        SELECT DISTINCT c.*, v.name as vessel_name,
          CASE WHEN cm.id IS NOT NULL THEN true ELSE false END as is_member
        FROM channels c
        LEFT JOIN vessels v ON c.vessel_id = v.id
        LEFT JOIN channel_members cm ON c.id = cm.channel_id AND cm.user_id = ?
        WHERE c.is_active = true
          AND (c.name LIKE ? OR c.description LIKE ?)
      `;
      
      const params = [req.user!.id, `%${query}%`, `%${query}%`];
      
      if (!include_private || include_private === 'false') {
        searchQuery += ` AND (c.is_private = false OR cm.id IS NOT NULL)`;
      }
      
      if (type) {
        searchQuery += ` AND c.channel_type = ?`;
        params.push(type as string);
      }
      
      searchQuery += ` ORDER BY c.name LIMIT 20`;
      
      const channels = await dbAll(searchQuery, params);
      
      res.json({ channels });
    } catch (error) {
      console.error('Error searching channels:', error);
      res.status(500).json({ error: 'Failed to search channels' });
    }
  }
}