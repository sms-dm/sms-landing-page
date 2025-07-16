import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { dbGet } from '../config/database.abstraction';

export const channelAccessMiddleware = (requiredRole?: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const channelId = parseInt(req.params.channelId);
      
      if (!channelId) {
        return res.status(400).json({ error: 'Channel ID is required' });
      }

      // Check if user is a member of the channel
      const membership = await dbGet(`
        SELECT cm.*, c.channel_type, c.is_private
        FROM channel_members cm
        JOIN channels c ON cm.channel_id = c.id
        WHERE cm.channel_id = ? AND cm.user_id = ?
      `, [channelId, req.user!.id]);

      if (!membership) {
        // Check if channel is public and user can join
        const channel = await dbGet(`
          SELECT * FROM channels WHERE id = ? AND is_active = true
        `, [channelId]);

        if (!channel) {
          return res.status(404).json({ error: 'Channel not found' });
        }

        if (channel.is_private) {
          return res.status(403).json({ error: 'You do not have access to this private channel' });
        }

        // For public channels, check if user meets criteria
        if (channel.channel_type === 'vessel' && channel.vessel_id) {
          const userVessel = await dbGet(`
            SELECT default_vessel_id FROM users WHERE id = ?
          `, [req.user!.id]);

          if (userVessel.default_vessel_id !== channel.vessel_id) {
            return res.status(403).json({ error: 'This channel is for different vessel members' });
          }
        }

        if (channel.channel_type === 'department' && channel.department) {
          if (req.user!.department !== channel.department) {
            return res.status(403).json({ error: 'This channel is for different department members' });
          }
        }

        // Auto-join public channel if criteria met
        await dbRun(`
          INSERT INTO channel_members (channel_id, user_id, role)
          VALUES (?, ?, 'member')
        `, [channelId, req.user!.id]);

        req.channelMembership = { role: 'member', channel_type: channel.channel_type };
      } else {
        // Check required role if specified
        if (requiredRole) {
          const roleHierarchy: { [key: string]: number } = {
            'member': 1,
            'moderator': 2,
            'admin': 3
          };

          const userRoleLevel = roleHierarchy[membership.role] || 0;
          const requiredRoleLevel = roleHierarchy[requiredRole] || 999;

          if (userRoleLevel < requiredRoleLevel) {
            return res.status(403).json({ 
              error: `This action requires ${requiredRole} role in the channel` 
            });
          }
        }

        req.channelMembership = membership;
      }

      next();
    } catch (error) {
      console.error('Channel access middleware error:', error);
      res.status(500).json({ error: 'Failed to verify channel access' });
    }
  };
};

// Middleware to check if user can create channels
export const canCreateChannelMiddleware = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const { channel_type } = req.body;

    // Anyone can create direct message channels
    if (channel_type === 'direct') {
      return next();
    }

    // Check user role for other channel types
    const allowedRoles = ['admin', 'manager', 'hse_manager'];
    
    if (channel_type === 'hse' && !['hse', 'hse_manager', 'admin'].includes(req.user!.role)) {
      return res.status(403).json({ 
        error: 'Only HSE personnel can create HSE channels' 
      });
    }

    if (channel_type === 'announcement' && !allowedRoles.includes(req.user!.role)) {
      return res.status(403).json({ 
        error: 'Only administrators and managers can create announcement channels' 
      });
    }

    next();
  } catch (error) {
    console.error('Create channel middleware error:', error);
    res.status(500).json({ error: 'Failed to verify channel creation permissions' });
  }
};

// Extend AuthRequest to include channel membership
declare module '../middleware/auth.middleware' {
  interface AuthRequest {
    channelMembership?: {
      role: string;
      channel_type: string;
      [key: string]: any;
    };
  }
}