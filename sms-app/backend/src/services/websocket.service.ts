import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { AuthService } from './auth.service';
import { dbGet, dbRun, dbAll } from '../config/database.abstraction';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userEmail?: string;
  userRole?: string;
  companyId?: number;
  vesselId?: number;
  department?: string;
}

interface MessageData {
  channelId: number;
  content: string;
  messageType?: 'text' | 'file' | 'image' | 'system' | 'hse_update';
  metadata?: any;
}

interface TypingData {
  channelId: number;
  isTyping: boolean;
}

interface HSEAlertData {
  updateId: number;
  title: string;
  content: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  scope: 'fleet' | 'vessel' | 'department';
  vesselId?: number;
  department?: string;
}

export class WebSocketService {
  private io: SocketServer;
  private userSockets: Map<number, Set<string>> = new Map(); // userId -> socketIds
  private presenceIntervals: Map<string, NodeJS.Timer> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const decoded = AuthService.verifyAccessToken(token);
        
        // Get user details from database
        const user = await dbGet(`
          SELECT u.id, u.email, u.role, u.company_id, u.department, u.default_vessel_id,
                 v.name as vessel_name
          FROM users u
          LEFT JOIN vessels v ON u.default_vessel_id = v.id
          WHERE u.id = ? AND u.is_active = true
        `, [decoded.id]);

        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        // Attach user info to socket
        socket.userId = user.id;
        socket.userEmail = user.email;
        socket.userRole = user.role;
        socket.companyId = user.company_id;
        socket.vesselId = user.default_vessel_id;
        socket.department = user.department;

        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userEmail} connected (Socket: ${socket.id})`);
      
      // Track user socket
      this.addUserSocket(socket.userId!, socket.id);
      
      // Join user to their channels
      await this.joinUserChannels(socket);
      
      // Emit online presence
      await this.updateUserPresence(socket.userId!, true);
      
      // Start presence heartbeat
      this.startPresenceHeartbeat(socket);

      // Message handlers
      socket.on('message:send', async (data: MessageData) => {
        await this.handleMessageSend(socket, data);
      });

      socket.on('message:edit', async (data: { messageId: number; content: string }) => {
        await this.handleMessageEdit(socket, data);
      });

      socket.on('message:delete', async (data: { messageId: number }) => {
        await this.handleMessageDelete(socket, data);
      });

      // Typing indicators
      socket.on('typing:start', async (data: TypingData) => {
        await this.handleTypingStart(socket, data);
      });

      socket.on('typing:stop', async (data: TypingData) => {
        await this.handleTypingStop(socket, data);
      });

      // HSE alerts
      socket.on('hse:alert', async (data: HSEAlertData) => {
        await this.handleHSEAlert(socket, data);
      });

      socket.on('hse:acknowledge', async (data: { updateId: number; comments?: string }) => {
        await this.handleHSEAcknowledge(socket, data);
      });

      // Channel management
      socket.on('channel:join', async (channelId: number) => {
        await this.handleChannelJoin(socket, channelId);
      });

      socket.on('channel:leave', async (channelId: number) => {
        await this.handleChannelLeave(socket, channelId);
      });

      // Mark messages as read
      socket.on('messages:markRead', async (data: { channelId: number; messageIds: number[] }) => {
        await this.handleMarkMessagesRead(socket, data);
      });

      // Disconnection
      socket.on('disconnect', async () => {
        console.log(`User ${socket.userEmail} disconnected (Socket: ${socket.id})`);
        
        // Clear presence heartbeat
        const interval = this.presenceIntervals.get(socket.id);
        if (interval) {
          clearInterval(interval);
          this.presenceIntervals.delete(socket.id);
        }
        
        // Remove user socket
        this.removeUserSocket(socket.userId!, socket.id);
        
        // Update presence if user has no more active sockets
        const userSockets = this.userSockets.get(socket.userId!);
        if (!userSockets || userSockets.size === 0) {
          await this.updateUserPresence(socket.userId!, false);
        }
      });
    });
  }

  private async joinUserChannels(socket: AuthenticatedSocket) {
    try {
      // Get all channels the user is a member of
      const channels = await dbAll(`
        SELECT c.id, c.name, c.channel_type
        FROM channels c
        JOIN channel_members cm ON c.id = cm.channel_id
        WHERE cm.user_id = ? AND c.is_active = true
      `, [socket.userId]);

      // Join socket to each channel room
      for (const channel of channels) {
        socket.join(`channel:${channel.id}`);
        console.log(`User ${socket.userEmail} joined channel: ${channel.name}`);
      }

      // Join vessel-wide room if user has a vessel
      if (socket.vesselId) {
        socket.join(`vessel:${socket.vesselId}`);
      }

      // Join department room if user has a department
      if (socket.department) {
        socket.join(`department:${socket.department}`);
      }

      // Join company-wide room
      socket.join(`company:${socket.companyId}`);

    } catch (error) {
      console.error('Error joining user channels:', error);
    }
  }

  private async handleMessageSend(socket: AuthenticatedSocket, data: MessageData) {
    try {
      // Verify user has access to the channel
      const membership = await dbGet(`
        SELECT role FROM channel_members 
        WHERE channel_id = ? AND user_id = ?
      `, [data.channelId, socket.userId]);

      if (!membership) {
        socket.emit('error', { message: 'You do not have access to this channel' });
        return;
      }

      // Insert message into database
      const result = await dbRun(`
        INSERT INTO messages (channel_id, sender_id, content, message_type, metadata)
        VALUES (?, ?, ?, ?, ?)
      `, [
        data.channelId,
        socket.userId,
        data.content,
        data.messageType || 'text',
        JSON.stringify(data.metadata || {})
      ]);

      // Get the inserted message with sender info
      const message = await dbGet(`
        SELECT m.*, u.name as sender_name, u.email as sender_email, u.role as sender_role
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `, [result.lastID]);

      // Emit to all channel members
      this.io.to(`channel:${data.channelId}`).emit('message:new', message);

      // Update last_read_at for the sender
      await dbRun(`
        UPDATE channel_members 
        SET last_read_at = CURRENT_TIMESTAMP
        WHERE channel_id = ? AND user_id = ?
      `, [data.channelId, socket.userId]);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private async handleMessageEdit(socket: AuthenticatedSocket, data: { messageId: number; content: string }) {
    try {
      // Verify user owns the message
      const message = await dbGet(`
        SELECT * FROM messages WHERE id = ? AND sender_id = ?
      `, [data.messageId, socket.userId]);

      if (!message) {
        socket.emit('error', { message: 'You can only edit your own messages' });
        return;
      }

      // Update message
      await dbRun(`
        UPDATE messages 
        SET content = ?, is_edited = true, edited_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [data.content, data.messageId]);

      // Emit update to channel members
      this.io.to(`channel:${message.channel_id}`).emit('message:edited', {
        messageId: data.messageId,
        content: data.content,
        editedAt: new Date()
      });

    } catch (error) {
      console.error('Error editing message:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  }

  private async handleMessageDelete(socket: AuthenticatedSocket, data: { messageId: number }) {
    try {
      // Get message details
      const message = await dbGet(`
        SELECT * FROM messages WHERE id = ?
      `, [data.messageId]);

      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Check if user can delete (owner or admin/moderator)
      const canDelete = message.sender_id === socket.userId || 
                       socket.userRole === 'admin' ||
                       socket.userRole === 'manager';

      if (!canDelete) {
        socket.emit('error', { message: 'You do not have permission to delete this message' });
        return;
      }

      // Soft delete message
      await dbRun(`
        UPDATE messages 
        SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [data.messageId]);

      // Emit deletion to channel members
      this.io.to(`channel:${message.channel_id}`).emit('message:deleted', {
        messageId: data.messageId
      });

    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  }

  private async handleTypingStart(socket: AuthenticatedSocket, data: TypingData) {
    try {
      // Emit to other channel members
      socket.to(`channel:${data.channelId}`).emit('typing:user', {
        channelId: data.channelId,
        userId: socket.userId,
        userName: socket.userEmail,
        isTyping: true
      });
    } catch (error) {
      console.error('Error handling typing start:', error);
    }
  }

  private async handleTypingStop(socket: AuthenticatedSocket, data: TypingData) {
    try {
      // Emit to other channel members
      socket.to(`channel:${data.channelId}`).emit('typing:user', {
        channelId: data.channelId,
        userId: socket.userId,
        userName: socket.userEmail,
        isTyping: false
      });
    } catch (error) {
      console.error('Error handling typing stop:', error);
    }
  }

  private async handleHSEAlert(socket: AuthenticatedSocket, data: HSEAlertData) {
    try {
      // Verify user has HSE role
      if (!['hse', 'hse_manager', 'admin', 'manager'].includes(socket.userRole!)) {
        socket.emit('error', { message: 'You do not have permission to create HSE alerts' });
        return;
      }

      // Insert HSE update
      const result = await dbRun(`
        INSERT INTO hse_updates (
          title, content, update_type, severity, scope, 
          vessel_id, department, requires_acknowledgment, created_by
        )
        VALUES (?, ?, 'safety_alert', ?, ?, ?, ?, true, ?)
      `, [
        data.title,
        data.content,
        data.severity,
        data.scope,
        data.vesselId || null,
        data.department || null,
        socket.userId
      ]);

      // Get the inserted update
      const hseUpdate = await dbGet(`
        SELECT h.*, u.name as creator_name, u.email as creator_email
        FROM hse_updates h
        JOIN users u ON h.created_by = u.id
        WHERE h.id = ?
      `, [result.lastID]);

      // Determine target room based on scope
      let targetRoom = '';
      if (data.scope === 'fleet') {
        targetRoom = `company:${socket.companyId}`;
      } else if (data.scope === 'vessel' && data.vesselId) {
        targetRoom = `vessel:${data.vesselId}`;
      } else if (data.scope === 'department' && data.department) {
        targetRoom = `department:${data.department}`;
      }

      // Emit alert to target audience
      if (targetRoom) {
        this.io.to(targetRoom).emit('hse:newAlert', hseUpdate);
      }

      // Create system message in HSE channel
      const hseChannel = await dbGet(`
        SELECT id FROM channels 
        WHERE channel_type = 'hse' AND vessel_id IS NULL
        LIMIT 1
      `);

      if (hseChannel) {
        await dbRun(`
          INSERT INTO messages (channel_id, sender_id, content, message_type, metadata)
          VALUES (?, ?, ?, 'hse_update', ?)
        `, [
          hseChannel.id,
          socket.userId,
          `New HSE Alert: ${data.title}`,
          JSON.stringify({ hseUpdateId: result.lastID })
        ]);
      }

    } catch (error) {
      console.error('Error creating HSE alert:', error);
      socket.emit('error', { message: 'Failed to create HSE alert' });
    }
  }

  private async handleHSEAcknowledge(socket: AuthenticatedSocket, data: { updateId: number; comments?: string }) {
    try {
      // Insert acknowledgment
      await dbRun(`
        INSERT INTO hse_acknowledgments (hse_update_id, user_id, comments, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?)
      `, [
        data.updateId,
        socket.userId,
        data.comments || null,
        socket.handshake.address,
        socket.handshake.headers['user-agent'] || null
      ]);

      // Emit acknowledgment confirmation
      socket.emit('hse:acknowledged', { updateId: data.updateId });

      // Notify HSE managers about the acknowledgment
      const hseManagers = await dbAll(`
        SELECT id FROM users 
        WHERE role IN ('hse_manager', 'admin') AND company_id = ?
      `, [socket.companyId]);

      for (const manager of hseManagers) {
        const managerSockets = this.userSockets.get(manager.id);
        if (managerSockets) {
          managerSockets.forEach(socketId => {
            this.io.to(socketId).emit('hse:userAcknowledged', {
              updateId: data.updateId,
              userId: socket.userId,
              userName: socket.userEmail,
              acknowledgedAt: new Date()
            });
          });
        }
      }

    } catch (error) {
      console.error('Error acknowledging HSE update:', error);
      socket.emit('error', { message: 'Failed to acknowledge HSE update' });
    }
  }

  private async handleChannelJoin(socket: AuthenticatedSocket, channelId: number) {
    try {
      // Verify channel exists and user has permission
      const channel = await dbGet(`
        SELECT * FROM channels WHERE id = ? AND is_active = true
      `, [channelId]);

      if (!channel) {
        socket.emit('error', { message: 'Channel not found' });
        return;
      }

      // Check if user is already a member
      const membership = await dbGet(`
        SELECT * FROM channel_members WHERE channel_id = ? AND user_id = ?
      `, [channelId, socket.userId]);

      if (!membership && !channel.is_private) {
        // Add user to channel
        await dbRun(`
          INSERT INTO channel_members (channel_id, user_id, role)
          VALUES (?, ?, 'member')
        `, [channelId, socket.userId]);
      } else if (!membership && channel.is_private) {
        socket.emit('error', { message: 'This is a private channel' });
        return;
      }

      // Join socket room
      socket.join(`channel:${channelId}`);
      socket.emit('channel:joined', { channelId });

    } catch (error) {
      console.error('Error joining channel:', error);
      socket.emit('error', { message: 'Failed to join channel' });
    }
  }

  private async handleChannelLeave(socket: AuthenticatedSocket, channelId: number) {
    try {
      // Remove user from channel members
      await dbRun(`
        DELETE FROM channel_members WHERE channel_id = ? AND user_id = ?
      `, [channelId, socket.userId]);

      // Leave socket room
      socket.leave(`channel:${channelId}`);
      socket.emit('channel:left', { channelId });

    } catch (error) {
      console.error('Error leaving channel:', error);
      socket.emit('error', { message: 'Failed to leave channel' });
    }
  }

  private async handleMarkMessagesRead(socket: AuthenticatedSocket, data: { channelId: number; messageIds: number[] }) {
    try {
      // Insert read receipts
      for (const messageId of data.messageIds) {
        await dbRun(`
          INSERT INTO message_reads (message_id, user_id)
          VALUES (?, ?)
          ON CONFLICT (message_id, user_id) DO NOTHING
        `, [messageId, socket.userId]);
      }

      // Update last read timestamp
      await dbRun(`
        UPDATE channel_members 
        SET last_read_at = CURRENT_TIMESTAMP
        WHERE channel_id = ? AND user_id = ?
      `, [data.channelId, socket.userId]);

      // Emit confirmation
      socket.emit('messages:markedRead', { channelId: data.channelId, messageIds: data.messageIds });

    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  private async updateUserPresence(userId: number, isOnline: boolean) {
    try {
      // Update user's online status
      await dbRun(`
        UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?
      `, [userId]);

      // Get user details
      const user = await dbGet(`
        SELECT id, email, name, role, department, default_vessel_id
        FROM users WHERE id = ?
      `, [userId]);

      // Emit presence update to relevant rooms
      const presenceData = {
        userId,
        userEmail: user.email,
        userName: user.name,
        isOnline,
        lastSeen: new Date()
      };

      // Emit to user's channels
      const channels = await dbAll(`
        SELECT channel_id FROM channel_members WHERE user_id = ?
      `, [userId]);

      for (const channel of channels) {
        this.io.to(`channel:${channel.channel_id}`).emit('presence:update', presenceData);
      }

    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  }

  private startPresenceHeartbeat(socket: AuthenticatedSocket) {
    const interval = setInterval(async () => {
      await this.updateUserPresence(socket.userId!, true);
    }, 30000); // Update every 30 seconds

    this.presenceIntervals.set(socket.id, interval as any);
  }

  private addUserSocket(userId: number, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private removeUserSocket(userId: number, socketId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  // Public method to send messages programmatically
  public async sendSystemMessage(channelId: number, content: string, metadata?: any) {
    try {
      const result = await dbRun(`
        INSERT INTO messages (channel_id, sender_id, content, message_type, metadata)
        VALUES (?, 1, ?, 'system', ?)
      `, [channelId, content, JSON.stringify(metadata || {})]);

      const message = await dbGet(`
        SELECT m.*, u.name as sender_name, u.email as sender_email, u.role as sender_role
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `, [result.lastID]);

      this.io.to(`channel:${channelId}`).emit('message:new', message);
    } catch (error) {
      console.error('Error sending system message:', error);
    }
  }

  // Public method to broadcast HSE alerts
  public async broadcastHSEAlert(alert: HSEAlertData, creatorId: number) {
    try {
      const result = await dbRun(`
        INSERT INTO hse_updates (
          title, content, update_type, severity, scope, 
          vessel_id, department, requires_acknowledgment, created_by
        )
        VALUES (?, ?, 'safety_alert', ?, ?, ?, ?, true, ?)
      `, [
        alert.title,
        alert.content,
        alert.severity,
        alert.scope,
        alert.vesselId || null,
        alert.department || null,
        creatorId
      ]);

      const hseUpdate = await dbGet(`
        SELECT h.*, u.name as creator_name, u.email as creator_email
        FROM hse_updates h
        JOIN users u ON h.created_by = u.id
        WHERE h.id = ?
      `, [result.lastID]);

      // Broadcast based on scope
      if (alert.scope === 'fleet') {
        this.io.emit('hse:newAlert', hseUpdate);
      } else if (alert.scope === 'vessel' && alert.vesselId) {
        this.io.to(`vessel:${alert.vesselId}`).emit('hse:newAlert', hseUpdate);
      } else if (alert.scope === 'department' && alert.department) {
        this.io.to(`department:${alert.department}`).emit('hse:newAlert', hseUpdate);
      }
    } catch (error) {
      console.error('Error broadcasting HSE alert:', error);
    }
  }
}

export default WebSocketService;