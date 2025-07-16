import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { dbGet, dbRun } from '../config/database.abstraction';

/**
 * Comprehensive permission middleware for team communication
 * Enforces strict role-based access control
 */

// Permission check for posting in channels
export const canPostInChannelMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const channelId = parseInt(req.params.channelId || req.body.channelId);
    const user = req.user!;

    // Get channel details
    const channel = await dbGet(`
      SELECT * FROM channels WHERE id = ? AND is_active = true
    `, [channelId]);

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Direct messages - everyone can post
    if (channel.channel_type === 'direct') {
      // Verify user is member of the DM
      const isMember = await dbGet(`
        SELECT * FROM channel_members WHERE channel_id = ? AND user_id = ?
      `, [channelId, user.id]);
      
      if (!isMember) {
        return res.status(403).json({ error: 'You are not a member of this direct message' });
      }
      return next();
    }

    // Admin can post anywhere
    if (user.role === 'admin') {
      return next();
    }

    // Role-based channel posting permissions
    let canPost = false;

    switch (user.role) {
      case 'electrical_manager':
      case 'mechanical_manager':
        // Managers can post in their department channels
        if (channel.channel_type === 'department' && 
            channel.department === user.department) {
          canPost = true;
        }
        // Managers can post in management channels
        else if (channel.channel_type === 'management') {
          canPost = true;
        }
        // Managers can post in vessel-wide channels
        else if (channel.channel_type === 'vessel' && 
                 channel.vessel_id === user.default_vessel_id) {
          canPost = true;
        }
        break;

      case 'technician':
        // Technicians can ONLY post in their department channel
        canPost = channel.channel_type === 'department' && 
                  channel.department === user.department;
        break;

      case 'hse_manager':
        // HSE managers can post in any HSE channel
        canPost = channel.channel_type === 'hse';
        break;

      case 'hse':
        // HSE officers can post in vessel HSE channels
        canPost = channel.channel_type === 'hse' && 
                  channel.vessel_id === user.default_vessel_id;
        break;

      case 'manager':
        // General managers can post in management and vessel channels
        canPost = channel.channel_type === 'management' ||
                  (channel.channel_type === 'vessel' && 
                   channel.vessel_id === user.default_vessel_id);
        break;
    }

    if (!canPost) {
      return res.status(403).json({ 
        error: `Your role (${user.role}) does not have permission to post in this ${channel.channel_type} channel`
      });
    }

    // Store channel info for downstream use
    req.channel = channel;
    next();
  } catch (error) {
    console.error('Post permission middleware error:', error);
    res.status(500).json({ error: 'Failed to verify posting permissions' });
  }
};

// Enhanced HSE creation permission check
export const canCreateHSEUpdateMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { scope, vessel_id } = req.body;
    const user = req.user!;

    // Admin can create any HSE update
    if (user.role === 'admin') {
      return next();
    }

    // HSE Manager can create any scope
    if (user.role === 'hse_manager') {
      return next();
    }

    // HSE Officer can only create vessel-specific updates
    if (user.role === 'hse') {
      if (scope !== 'vessel') {
        return res.status(403).json({ 
          error: 'HSE Officers can only create vessel-specific updates' 
        });
      }

      // Verify they're creating for their own vessel
      if (vessel_id !== user.default_vessel_id) {
        return res.status(403).json({ 
          error: 'You can only create HSE updates for your assigned vessel' 
        });
      }

      return next();
    }

    // No other roles can create HSE updates
    return res.status(403).json({ 
      error: 'Your role does not have permission to create HSE updates' 
    });
  } catch (error) {
    console.error('HSE creation permission middleware error:', error);
    res.status(500).json({ error: 'Failed to verify HSE creation permissions' });
  }
};

// Check if user can read a channel
export const canReadChannelMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const channelId = parseInt(req.params.channelId);
    const user = req.user!;

    // Get channel details
    const channel = await dbGet(`
      SELECT * FROM channels WHERE id = ? AND is_active = true
    `, [channelId]);

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Direct messages - check membership
    if (channel.channel_type === 'direct') {
      const isMember = await dbGet(`
        SELECT * FROM channel_members WHERE channel_id = ? AND user_id = ?
      `, [channelId, user.id]);
      
      if (!isMember) {
        return res.status(403).json({ error: 'You are not a member of this direct message' });
      }
      return next();
    }

    // Announcements - everyone can read
    if (channel.channel_type === 'announcement') {
      return next();
    }

    // Admin and managers can read all channels
    if (['admin', 'manager', 'electrical_manager', 'mechanical_manager', 'hse_manager'].includes(user.role)) {
      return next();
    }

    let canRead = false;

    switch (channel.channel_type) {
      case 'department':
        // Users can read their own department channels
        canRead = channel.department === user.department;
        break;

      case 'vessel':
        // Users can read channels for their vessel
        canRead = channel.vessel_id === user.default_vessel_id;
        break;

      case 'hse':
        // Everyone can read HSE channels
        canRead = true;
        break;

      case 'management':
        // Only managers can read management channels
        canRead = false;
        break;
    }

    if (!canRead) {
      return res.status(403).json({ 
        error: `You do not have permission to read this ${channel.channel_type} channel`
      });
    }

    req.channel = channel;
    next();
  } catch (error) {
    console.error('Read permission middleware error:', error);
    res.status(500).json({ error: 'Failed to verify read permissions' });
  }
};

// Check if user can moderate a channel
export const canModerateChannelMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const channelId = parseInt(req.params.channelId);
    const user = req.user!;

    // Get channel details
    const channel = await dbGet(`
      SELECT * FROM channels WHERE id = ?
    `, [channelId]);

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Admin can moderate any channel
    if (user.role === 'admin') {
      return next();
    }

    let canModerate = false;

    // Department managers can moderate their department channels
    if ((user.role === 'electrical_manager' || user.role === 'mechanical_manager') &&
        channel.channel_type === 'department' &&
        channel.department === user.department) {
      canModerate = true;
    }

    // HSE managers can moderate HSE channels
    if (user.role === 'hse_manager' && channel.channel_type === 'hse') {
      canModerate = true;
    }

    if (!canModerate) {
      return res.status(403).json({ 
        error: 'You do not have moderation permissions for this channel' 
      });
    }

    req.channel = channel;
    next();
  } catch (error) {
    console.error('Moderation permission middleware error:', error);
    res.status(500).json({ error: 'Failed to verify moderation permissions' });
  }
};

// Check if user can edit/delete a message
export const canEditMessageMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const user = req.user!;

    // Get message details
    const message = await dbGet(`
      SELECT * FROM messages WHERE id = ?
    `, [messageId]);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Users can edit their own messages
    if (message.sender_id === user.id) {
      return next();
    }

    // Admins can edit any message
    if (user.role === 'admin') {
      return next();
    }

    // Channel moderators can delete messages
    if (req.method === 'DELETE') {
      const channel = await dbGet(`
        SELECT * FROM channels WHERE id = ?
      `, [message.channel_id]);

      // Check moderation permissions
      let canModerate = false;

      if ((user.role === 'electrical_manager' || user.role === 'mechanical_manager') &&
          channel.channel_type === 'department' &&
          channel.department === user.department) {
        canModerate = true;
      }

      if (user.role === 'hse_manager' && channel.channel_type === 'hse') {
        canModerate = true;
      }

      if (canModerate) {
        return next();
      }
    }

    return res.status(403).json({ 
      error: 'You do not have permission to modify this message' 
    });
  } catch (error) {
    console.error('Edit message permission middleware error:', error);
    res.status(500).json({ error: 'Failed to verify message edit permissions' });
  }
};

// Extend AuthRequest to include channel data
declare module '../middleware/auth.middleware' {
  interface AuthRequest {
    channel?: {
      id: number;
      channel_type: string;
      department?: string;
      vessel_id?: number;
      [key: string]: any;
    };
  }
}