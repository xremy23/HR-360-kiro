/**
 * WebSocket Server Implementation
 * Handles real-time communication with connected clients
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    orgId: string;
    role: string;
  };
}

export class WebSocketServer {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private userOrganizations: Map<string, string> = new Map(); // userId -> orgId

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        
        socket.data.userId = decoded.id;
        socket.data.orgId = decoded.orgId;
        socket.data.role = decoded.role;

        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  /**
   * Setup connection and event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`[${new Date().toISOString()}] User connected: ${socket.data.userId}`);
      
      this.connectedUsers.set(socket.data.userId, socket.id);
      this.userOrganizations.set(socket.data.userId, socket.data.orgId);

      // Broadcast user online status
      this.io.emit('user:online', {
        userId: socket.data.userId,
        timestamp: new Date().toISOString(),
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`[${new Date().toISOString()}] User disconnected: ${socket.data.userId}`);
        this.connectedUsers.delete(socket.data.userId);
        this.userOrganizations.delete(socket.data.userId);
        
        this.io.emit('user:offline', {
          userId: socket.data.userId,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`[${new Date().toISOString()}] Socket error for ${socket.data.userId}:`, error);
      });

      // Handle heartbeat
      socket.on('heartbeat', () => {
        socket.emit('heartbeat:ack', { timestamp: new Date().toISOString() });
      });

      // Handle notification acknowledgment
      socket.on('notification:delivered', (data) => {
        console.log(`[${new Date().toISOString()}] Notification delivered: ${data.notificationId}`);
        this.io.emit('notification:delivered', {
          notificationId: data.notificationId,
          userId: socket.data.userId,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle notification read
      socket.on('notification:read', (data) => {
        console.log(`[${new Date().toISOString()}] Notification read: ${data.notificationId}`);
        this.io.emit('notification:read', {
          notificationId: data.notificationId,
          userId: socket.data.userId,
          timestamp: new Date().toISOString(),
        });
      });
    });
  }

  /**
   * Broadcast incident created event
   */
  public broadcastIncidentCreated(incident: any): void {
    this.io.emit('incident:created', {
      type: 'incident',
      action: 'created',
      data: incident,
      timestamp: new Date().toISOString(),
    });
    console.log(`[${new Date().toISOString()}] Broadcast: incident:created`);
  }

  /**
   * Broadcast incident updated event
   */
  public broadcastIncidentUpdated(incident: any): void {
    this.io.emit('incident:updated', {
      type: 'incident',
      action: 'updated',
      data: incident,
      timestamp: new Date().toISOString(),
    });
    console.log(`[${new Date().toISOString()}] Broadcast: incident:updated`);
  }

  /**
   * Broadcast alert created event
   */
  public broadcastAlertCreated(alert: any): void {
    this.io.emit('alert:created', {
      type: 'alert',
      action: 'created',
      data: alert,
      timestamp: new Date().toISOString(),
    });
    console.log(`[${new Date().toISOString()}] Broadcast: alert:created`);
  }

  /**
   * Broadcast check-in created event
   */
  public broadcastCheckInCreated(checkIn: any): void {
    this.io.emit('checkin:created', {
      type: 'checkin',
      action: 'created',
      data: checkIn,
      timestamp: new Date().toISOString(),
    });
    console.log(`[${new Date().toISOString()}] Broadcast: checkin:created`);
  }

  /**
   * Broadcast SOS created event
   */
  public broadcastSOSCreated(sos: any): void {
    this.io.emit('sos:created', {
      type: 'sos',
      action: 'created',
      data: sos,
      timestamp: new Date().toISOString(),
    });
    console.log(`[${new Date().toISOString()}] Broadcast: sos:created`);
  }

  /**
   * Broadcast notification to user
   */
  public broadcastNotificationToUser(userId: string, notification: any): void {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification:received', {
        type: 'notification',
        action: 'received',
        data: notification,
        timestamp: new Date().toISOString(),
      });
      console.log(`[${new Date().toISOString()}] Notification sent to user ${userId}`);
    } else {
      console.log(`[${new Date().toISOString()}] User ${userId} not connected, notification queued`);
    }
  }

  /**
   * Broadcast notification to multiple users
   */
  public broadcastNotificationToUsers(userIds: string[], notification: any): void {
    userIds.forEach((userId) => {
      this.broadcastNotificationToUser(userId, notification);
    });
  }

  /**
   * Broadcast notification to organization
   */
  public broadcastNotificationToOrganization(orgId: string, notification: any): void {
    const userIds = Array.from(this.userOrganizations.entries())
      .filter(([, org]) => org === orgId)
      .map(([userId]) => userId);

    this.broadcastNotificationToUsers(userIds, notification);
    console.log(`[${new Date().toISOString()}] Notification sent to org ${orgId}`);
  }

  /**
   * Broadcast location update
   */
  public broadcastLocationUpdate(userId: string, location: any): void {
    this.io.emit('location:updated', {
      type: 'location',
      action: 'updated',
      userId,
      data: location,
      timestamp: new Date().toISOString(),
    });
    console.log(`[${new Date().toISOString()}] Location update: ${userId}`);
  }

  /**
   * Broadcast geofence triggered
   */
  public broadcastGeofenceTriggered(userId: string, geofence: any, triggerType: 'entry' | 'exit'): void {
    this.io.emit('geofence:triggered', {
      type: 'geofence',
      action: 'triggered',
      userId,
      triggerType,
      data: geofence,
      timestamp: new Date().toISOString(),
    });
    console.log(`[${new Date().toISOString()}] Geofence ${triggerType}: ${userId}`);
  }

  /**
   * Broadcast sync completion
   */
  public broadcastSyncCompleted(userId: string, syncData: any): void {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('sync:completed', {
        type: 'sync',
        action: 'completed',
        data: syncData,
        timestamp: new Date().toISOString(),
      });
      console.log(`[${new Date().toISOString()}] Sync completed for user ${userId}`);
    }
  }

  /**
   * Broadcast to specific organization
   */
  public broadcastToOrganization(orgId: string, event: string, data: any): void {
    const userIds = Array.from(this.userOrganizations.entries())
      .filter(([, org]) => org === orgId)
      .map(([userId]) => userId);

    userIds.forEach((userId) => {
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        this.io.to(socketId).emit(event, {
          type: event.split(':')[0],
          action: event.split(':')[1],
          data,
          timestamp: new Date().toISOString(),
        });
      }
    });

    console.log(`[${new Date().toISOString()}] Broadcast to org ${orgId}: ${event}`);
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get user connection status
   */
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get Socket.io instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Singleton instance
let wsServer: WebSocketServer;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HTTPServer): WebSocketServer {
  wsServer = new WebSocketServer(httpServer);
  return wsServer;
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): WebSocketServer {
  if (!wsServer) {
    throw new Error('WebSocket server not initialized');
  }
  return wsServer;
}
