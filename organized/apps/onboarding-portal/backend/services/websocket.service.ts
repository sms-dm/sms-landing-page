import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import { logger } from './logger.service';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  companyId?: string;
  role?: string;
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map();

  initialize(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io!.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, config.auth.jwtSecret) as any;
        socket.userId = decoded.userId;
        socket.companyId = decoded.companyId;
        socket.role = decoded.role;
        
        // Track user connection
        if (!this.userSockets.has(decoded.userId)) {
          this.userSockets.set(decoded.userId, new Set());
        }
        this.userSockets.get(decoded.userId)!.add(socket.id);
        
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io!.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`User ${socket.userId} connected via WebSocket`);

      // Join company room
      if (socket.companyId) {
        socket.join(`company:${socket.companyId}`);
      }

      // Join user-specific room
      socket.join(`user:${socket.userId}`);

      // Handle vessel subscription
      socket.on('subscribe:vessel', (vesselId: string) => {
        socket.join(`vessel:${vesselId}`);
      });

      socket.on('unsubscribe:vessel', (vesselId: string) => {
        socket.leave(`vessel:${vesselId}`);
      });

      // Handle equipment subscription
      socket.on('subscribe:equipment', (equipmentId: string) => {
        socket.join(`equipment:${equipmentId}`);
      });

      socket.on('unsubscribe:equipment', (equipmentId: string) => {
        socket.leave(`equipment:${equipmentId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`User ${socket.userId} disconnected from WebSocket`);
        
        // Remove from user sockets tracking
        const userSocketSet = this.userSockets.get(socket.userId!);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          if (userSocketSet.size === 0) {
            this.userSockets.delete(socket.userId!);
          }
        }
      });
    });
  }

  // Emit events to specific rooms
  emitToCompany(companyId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`company:${companyId}`).emit(event, data);
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  emitToVessel(vesselId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`vessel:${vesselId}`).emit(event, data);
    }
  }

  emitToEquipment(equipmentId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`equipment:${equipmentId}`).emit(event, data);
    }
  }

  // Broadcast events
  broadcast(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Get connected users
  getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  // Check if user is connected
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}

export const websocketService = new WebSocketService();