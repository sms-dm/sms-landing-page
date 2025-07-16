import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { dbGet, dbAll, dbRun } from '../config/database.abstraction';

export class TeamController {
  // Get team structure
  static async getTeamStructure(req: AuthRequest, res: Response) {
    try {
      const { vessel_id, department, include_inactive } = req.query;
      
      let query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u.department,
          u.position,
          u.phone,
          u.avatar_url,
          u.is_active,
          u.created_at,
          CASE WHEN u.last_seen > datetime('now', '-5 minutes') THEN true ELSE false END as is_online,
          v.id as vessel_id,
          v.name as vessel_name,
          v.imo_number as vessel_imo
        FROM users u
        LEFT JOIN vessels v ON u.default_vessel_id = v.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      
      if (!include_inactive || include_inactive === 'false') {
        query += ` AND u.is_active = true`;
      }
      
      if (vessel_id) {
        query += ` AND u.default_vessel_id = ?`;
        params.push(vessel_id);
      }
      
      if (department) {
        query += ` AND u.department = ?`;
        params.push(department);
      }
      
      query += ` ORDER BY u.department, u.role, u.name`;
      
      const users = await dbAll(query, params);
      
      // Group by department
      const teamStructure = users.reduce((acc: any, user: any) => {
        const dept = user.department || 'Other';
        if (!acc[dept]) {
          acc[dept] = {
            department: dept,
            members: [],
            count: 0,
            onlineCount: 0
          };
        }
        
        acc[dept].members.push(user);
        acc[dept].count++;
        if (user.is_online) {
          acc[dept].onlineCount++;
        }
        
        return acc;
      }, {});
      
      // Get department statistics
      const departmentStats = await dbAll(`
        SELECT 
          department,
          COUNT(*) as total_members,
          SUM(CASE WHEN last_seen > datetime('now', '-5 minutes') THEN 1 ELSE 0 END) as online_members,
          COUNT(DISTINCT default_vessel_id) as vessel_count
        FROM users
        WHERE is_active = true
        GROUP BY department
      `);
      
      res.json({
        teamStructure: Object.values(teamStructure),
        departmentStats,
        totalMembers: users.length,
        activeMembers: users.filter((u: any) => u.is_active).length,
        onlineMembers: users.filter((u: any) => u.is_online).length
      });
    } catch (error) {
      console.error('Error fetching team structure:', error);
      res.status(500).json({ error: 'Failed to fetch team structure' });
    }
  }

  // Get user profile
  static async getUserProfile(req: AuthRequest, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      
      const user = await dbGet(`
        SELECT 
          u.*,
          v.name as vessel_name,
          v.imo_number as vessel_imo,
          CASE WHEN u.last_seen > datetime('now', '-5 minutes') THEN true ELSE false END as is_online,
          (
            SELECT COUNT(*) FROM channel_members cm
            JOIN channels c ON cm.channel_id = c.id
            WHERE cm.user_id = u.id AND c.is_active = true
          ) as channel_count,
          (
            SELECT COUNT(*) FROM messages m
            WHERE m.sender_id = u.id AND m.is_deleted = false
          ) as message_count
        FROM users u
        LEFT JOIN vessels v ON u.default_vessel_id = v.id
        WHERE u.id = ?
      `, [userId]);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove sensitive information
      delete user.password;
      delete user.refresh_token;
      
      // Get shared channels if viewing another user
      let sharedChannels = [];
      if (userId !== req.user!.id) {
        sharedChannels = await dbAll(`
          SELECT DISTINCT c.id, c.name, c.channel_type
          FROM channels c
          JOIN channel_members cm1 ON c.id = cm1.channel_id
          JOIN channel_members cm2 ON c.id = cm2.channel_id
          WHERE cm1.user_id = ? AND cm2.user_id = ?
            AND c.is_active = true
          ORDER BY c.name
        `, [req.user!.id, userId]);
      }
      
      // Get user's recent activity
      const recentActivity = await dbAll(`
        SELECT 
          'message' as activity_type,
          m.created_at as timestamp,
          c.name as channel_name,
          m.content as preview
        FROM messages m
        JOIN channels c ON m.channel_id = c.id
        WHERE m.sender_id = ? AND m.is_deleted = false
        ORDER BY m.created_at DESC
        LIMIT 5
      `, [userId]);
      
      res.json({
        user,
        sharedChannels,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  }

  // Update user status
  static async updateUserStatus(req: AuthRequest, res: Response) {
    try {
      const { status, status_message, available_until } = req.body;
      
      await dbRun(`
        UPDATE users 
        SET status = ?, 
            status_message = ?, 
            status_updated_at = CURRENT_TIMESTAMP,
            available_until = ?
        WHERE id = ?
      `, [
        status || 'available',
        status_message || null,
        available_until || null,
        req.user!.id
      ]);
      
      res.json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  }

  // Search team members
  static async searchTeamMembers(req: AuthRequest, res: Response) {
    try {
      const { query, department, vessel_id, role, limit = 20 } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      let searchQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u.department,
          u.position,
          u.avatar_url,
          v.name as vessel_name,
          CASE WHEN u.last_seen > datetime('now', '-5 minutes') THEN true ELSE false END as is_online
        FROM users u
        LEFT JOIN vessels v ON u.default_vessel_id = v.id
        WHERE u.is_active = true
          AND (u.name LIKE ? OR u.email LIKE ? OR u.position LIKE ?)
      `;
      
      const params: any[] = [`%${query}%`, `%${query}%`, `%${query}%`];
      
      if (department) {
        searchQuery += ` AND u.department = ?`;
        params.push(department);
      }
      
      if (vessel_id) {
        searchQuery += ` AND u.default_vessel_id = ?`;
        params.push(vessel_id);
      }
      
      if (role) {
        searchQuery += ` AND u.role = ?`;
        params.push(role);
      }
      
      searchQuery += ` ORDER BY u.name LIMIT ?`;
      params.push(limit);
      
      const users = await dbAll(searchQuery, params);
      
      res.json({ users });
    } catch (error) {
      console.error('Error searching team members:', error);
      res.status(500).json({ error: 'Failed to search team members' });
    }
  }

  // Get departments
  static async getDepartments(req: AuthRequest, res: Response) {
    try {
      const departments = await dbAll(`
        SELECT DISTINCT 
          department,
          COUNT(*) as member_count,
          SUM(CASE WHEN last_seen > datetime('now', '-5 minutes') THEN 1 ELSE 0 END) as online_count
        FROM users
        WHERE is_active = true AND department IS NOT NULL
        GROUP BY department
        ORDER BY department
      `);
      
      res.json({ departments });
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ error: 'Failed to fetch departments' });
    }
  }

  // Get team statistics
  static async getTeamStatistics(req: AuthRequest, res: Response) {
    try {
      const { vessel_id, department, period = '7' } = req.query;
      
      const periodDays = parseInt(period as string);
      const dateFilter = `datetime('now', '-${periodDays} days')`;
      
      // Base stats query
      let statsQuery = `
        SELECT 
          COUNT(DISTINCT u.id) as total_members,
          SUM(CASE WHEN u.last_seen > datetime('now', '-5 minutes') THEN 1 ELSE 0 END) as online_members,
          COUNT(DISTINCT u.department) as department_count,
          COUNT(DISTINCT u.default_vessel_id) as vessel_count
        FROM users u
        WHERE u.is_active = true
      `;
      
      const params: any[] = [];
      
      if (vessel_id) {
        statsQuery += ` AND u.default_vessel_id = ?`;
        params.push(vessel_id);
      }
      
      if (department) {
        statsQuery += ` AND u.department = ?`;
        params.push(department);
      }
      
      const generalStats = await dbGet(statsQuery, params);
      
      // Activity stats
      const activityStats = await dbGet(`
        SELECT 
          COUNT(DISTINCT m.sender_id) as active_users,
          COUNT(m.id) as total_messages,
          COUNT(DISTINCT m.channel_id) as active_channels
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.created_at > ${dateFilter}
          AND m.is_deleted = false
          ${vessel_id ? 'AND u.default_vessel_id = ?' : ''}
          ${department ? 'AND u.department = ?' : ''}
      `, params);
      
      // Role distribution
      const roleDistribution = await dbAll(`
        SELECT 
          role,
          COUNT(*) as count
        FROM users
        WHERE is_active = true
          ${vessel_id ? 'AND default_vessel_id = ?' : ''}
          ${department ? 'AND department = ?' : ''}
        GROUP BY role
        ORDER BY count DESC
      `, params);
      
      // Department activity
      const departmentActivity = await dbAll(`
        SELECT 
          u.department,
          COUNT(DISTINCT m.sender_id) as active_members,
          COUNT(m.id) as message_count
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.created_at > ${dateFilter}
          AND m.is_deleted = false
          AND u.department IS NOT NULL
          ${vessel_id ? 'AND u.default_vessel_id = ?' : ''}
        GROUP BY u.department
        ORDER BY message_count DESC
      `, vessel_id ? [vessel_id] : []);
      
      res.json({
        general: generalStats,
        activity: activityStats,
        roleDistribution,
        departmentActivity,
        period: periodDays
      });
    } catch (error) {
      console.error('Error fetching team statistics:', error);
      res.status(500).json({ error: 'Failed to fetch team statistics' });
    }
  }

  // Create team announcement
  static async createTeamAnnouncement(req: AuthRequest, res: Response) {
    try {
      const { title, content, target_department, target_vessel_id, expires_at } = req.body;
      
      // Check permissions
      if (!['admin', 'manager', 'hse_manager'].includes(req.user!.role)) {
        return res.status(403).json({ 
          error: 'You do not have permission to create team announcements' 
        });
      }
      
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }
      
      // Create announcement in the appropriate channel
      let channelId;
      
      if (target_department) {
        // Find or create department announcement channel
        const channel = await dbGet(`
          SELECT id FROM channels 
          WHERE channel_type = 'announcement' AND department = ?
        `, [target_department]);
        
        channelId = channel?.id;
      } else if (target_vessel_id) {
        // Find or create vessel announcement channel
        const channel = await dbGet(`
          SELECT id FROM channels 
          WHERE channel_type = 'announcement' AND vessel_id = ?
        `, [target_vessel_id]);
        
        channelId = channel?.id;
      } else {
        // Use general announcement channel
        const channel = await dbGet(`
          SELECT id FROM channels 
          WHERE channel_type = 'announcement' AND department IS NULL AND vessel_id IS NULL
        `);
        
        channelId = channel?.id;
      }
      
      if (!channelId) {
        return res.status(400).json({ 
          error: 'No announcement channel found for the specified target' 
        });
      }
      
      // Create announcement message
      const result = await dbRun(`
        INSERT INTO messages (
          channel_id, sender_id, content, message_type, is_pinned, pinned_by
        )
        VALUES (?, ?, ?, 'announcement', true, ?)
      `, [
        channelId,
        req.user!.id,
        `**${title}**\n\n${content}`,
        req.user!.id
      ]);
      
      // Set expiration if provided
      if (expires_at) {
        await dbRun(`
          UPDATE messages 
          SET metadata = json_object('expires_at', ?)
          WHERE id = ?
        `, [expires_at, result.lastID]);
      }
      
      res.status(201).json({ 
        message: 'Announcement created successfully',
        announcementId: result.lastID
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  }

  // Get online team members
  static async getOnlineMembers(req: AuthRequest, res: Response) {
    try {
      const { vessel_id, department } = req.query;
      
      let query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u.department,
          u.position,
          u.avatar_url,
          u.status,
          u.status_message,
          u.last_seen,
          v.name as vessel_name
        FROM users u
        LEFT JOIN vessels v ON u.default_vessel_id = v.id
        WHERE u.is_active = true
          AND u.last_seen > datetime('now', '-5 minutes')
      `;
      
      const params: any[] = [];
      
      if (vessel_id) {
        query += ` AND u.default_vessel_id = ?`;
        params.push(vessel_id);
      }
      
      if (department) {
        query += ` AND u.department = ?`;
        params.push(department);
      }
      
      query += ` ORDER BY u.department, u.name`;
      
      const onlineMembers = await dbAll(query, params);
      
      res.json({ 
        onlineMembers,
        count: onlineMembers.length 
      });
    } catch (error) {
      console.error('Error fetching online members:', error);
      res.status(500).json({ error: 'Failed to fetch online members' });
    }
  }
}