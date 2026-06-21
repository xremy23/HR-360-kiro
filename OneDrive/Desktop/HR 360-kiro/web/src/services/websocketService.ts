/**
 * WebSocket Service for Real-Time Updates
 * Uses Socket.IO for reliable WebSocket connections with automatic reconnection
 */

import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: 'incident' | 'alert' | 'checkin' | 'sos' | 'notification';
  action: 'created' | 'updated' | 'deleted' | 'acknowledged';
  data: any;
  timestamp: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;

  constructor(url: string = import.meta.env.VITE_WS_URL || 'http://localhost:3000') {
    this.url = url;
  }

  /**
   * Connect to WebSocket server using Socket.IO
   */
  public connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Don't reconnect if already connecting or connected
      if (this.isConnecting || (this.socket && this.socket.connected)) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        this.socket = io(this.url, {
          auth: {
            token: token,
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
          transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.emit('connected', { timestamp: new Date().toISOString() });
          resolve();
        });

        this.socket.on('message', (message: WebSocketMessage) => {
          this.handleMessage(message);
        });

        // Listen for specific event types
        this.socket.on('checkin:updated', (data: any) => {
          this.emit('checkin:updated', data);
        });

        this.socket.on('alert:created', (data: any) => {
          this.emit('alert:created', data);
        });

        this.socket.on('incident:updated', (data: any) => {
          this.emit('incident:updated', data);
        });

        this.socket.on('error', (error: any) => {
          console.error('WebSocket error:', error);
          this.emit('error', { error: error.toString() });
        });

        this.socket.on('disconnect', () => {
          console.log('WebSocket disconnected');
          this.isConnecting = false;
          this.emit('disconnected', { timestamp: new Date().toISOString() });
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('WebSocket connection error:', error);
          this.isConnecting = false;
          reject(error);
        });
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Send message through WebSocket
   */
  public send(type: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(type, data);
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    const eventType = `${message.type}:${message.action}`;
    this.emit(eventType, message.data);
    this.emit(message.type, message.data);
  }

  /**
   * Subscribe to event
   */
  public on(event: string, handler: (data: any) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)?.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  /**
   * Emit event to local handlers
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
