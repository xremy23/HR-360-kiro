/**
 * WebSocket Service - Real-time data and event management
 * Handles WebSocket connection, event listeners, and automatic reconnection
 */

import io, { Socket } from 'socket.io-client';
import store, { RootState } from '../store/store';
import {
  setConnected,
  setReconnecting,
  setError,
  addAlert,
  updateAlert,
  addIncident,
  updateIncident,
  addCheckIn,
  setConnectionStatus,
} from '../store/slices/websocketSlice';
import { setItems as setAlertItems } from '../store/slices/alertsSlice';
import { setItems as setCheckInItems } from '../store/slices/checkinSlice';

// WebSocket server URL
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3000';

export interface RealtimeAlert {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface RealtimeIncident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  createdAt: string;
}

export interface RealtimeCheckIn {
  id: string;
  userId: string;
  status: 'safe' | 'need_help' | 'sos';
  timestamp: string;
  userInfo?: {
    firstName: string;
    lastName: string;
  };
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize WebSocket connection
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    try {
      console.log('[WebSocket] Connecting to', WS_URL);

      // Get auth token
      const state = store.getState();
      const token = state.auth?.token;

      if (!token) {
        console.warn('[WebSocket] No auth token available, cannot connect');
        store.dispatch(setError('Authentication required for real-time updates'));
        return;
      }

      // Create WebSocket connection
      this.socket = io(WS_URL, {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
        transports: ['websocket', 'polling'],
      });

      // Setup event listeners
      this.setupEventListeners();

      console.log('[WebSocket] Connection initialized');
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      store.dispatch(setError((error as Error).message));
    }
  }

  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      store.dispatch(setConnected(true));
      store.dispatch(setReconnecting(false));
      store.dispatch(setError(null));
      this.startHeartbeat();
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      store.dispatch(setConnected(false));
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      store.dispatch(setError(`Connection error: ${error.message}`));
    });

    this.socket.on('reconnect_attempt', () => {
      console.log('[WebSocket] Reconnection attempt', this.reconnectAttempts + 1);
      this.reconnectAttempts++;
      store.dispatch(setReconnecting(true));

      // Exponential backoff
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('[WebSocket] Reconnect error:', error);
    });

    // Real-time event listeners
    this.listenForAlerts();
    this.listenForIncidents();
    this.listenForCheckIns();
    this.listenForNotifications();
    this.listenForConnectionStatus();
  }

  /**
   * Listen for new and updated alerts
   */
  private listenForAlerts(): void {
    if (!this.socket) return;

    // New alert received
    this.socket.on('alert:new', (alert: RealtimeAlert) => {
      console.log('[WebSocket] New alert received:', alert);
      store.dispatch(addAlert(alert));

      // Show in alerts slice as well
      const state = store.getState();
      const existingAlerts = state.alerts.items || [];
      store.dispatch(setAlertItems([alert, ...existingAlerts]));
    });

    // Alert updated
    this.socket.on('alert:updated', (alert: RealtimeAlert) => {
      console.log('[WebSocket] Alert updated:', alert);
      store.dispatch(updateAlert(alert));

      // Update in alerts slice
      const state = store.getState();
      const alerts = state.alerts.items.map((a) =>
        a.id === alert.id ? { ...a, ...alert } : a
      );
      store.dispatch(setAlertItems(alerts));
    });

    // Alert dismissed
    this.socket.on('alert:dismissed', (alertId: string) => {
      console.log('[WebSocket] Alert dismissed:', alertId);
      const state = store.getState();
      const alerts = state.alerts.items.filter((a) => a.id !== alertId);
      store.dispatch(setAlertItems(alerts));
    });
  }

  /**
   * Listen for incidents
   */
  private listenForIncidents(): void {
    if (!this.socket) return;

    // New incident
    this.socket.on('incident:created', (incident: RealtimeIncident) => {
      console.log('[WebSocket] New incident created:', incident);
      store.dispatch(addIncident(incident));
    });

    // Incident updated
    this.socket.on('incident:updated', (incident: RealtimeIncident) => {
      console.log('[WebSocket] Incident updated:', incident);
      store.dispatch(updateIncident(incident));
    });
  }

  /**
   * Listen for check-ins
   */
  private listenForCheckIns(): void {
    if (!this.socket) return;

    // New check-in from team member
    this.socket.on('checkin:received', (checkIn: RealtimeCheckIn) => {
      console.log('[WebSocket] Check-in received:', checkIn);
      store.dispatch(addCheckIn(checkIn));

      // Also update check-in slice
      const state = store.getState();
      const existingCheckIns = state.checkin.items || [];
      store.dispatch(setCheckInItems([checkIn, ...existingCheckIns]));
    });
  }

  /**
   * Listen for general notifications
   */
  private listenForNotifications(): void {
    if (!this.socket) return;

    this.socket.on('notification:received', (notification: any) => {
      console.log('[WebSocket] Notification received:', notification);
      // Can be handled by notification system (Phase 2C)
    });
  }

  /**
   * Listen for connection status updates
   */
  private listenForConnectionStatus(): void {
    if (!this.socket) return;

    this.socket.on('connection:status', (status: any) => {
      console.log('[WebSocket] Connection status update:', status);
      store.dispatch(setConnectionStatus(status));
    });
  }

  /**
   * Emit event to server
   */
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Socket not connected, cannot emit:', event);
      return;
    }

    console.log('[WebSocket] Emitting event:', event, data);
    this.socket.emit(event, data);
  }

  /**
   * Subscribe to real-time alerts
   */
  subscribeToAlerts(): void {
    this.emit('subscribe:alerts');
  }

  /**
   * Subscribe to real-time incidents
   */
  subscribeToIncidents(): void {
    this.emit('subscribe:incidents');
  }

  /**
   * Subscribe to team check-ins
   */
  subscribeToCheckIns(): void {
    this.emit('subscribe:checkins');
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // Every 30 seconds

    console.log('[WebSocket] Heartbeat started');
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('[WebSocket] Heartbeat stopped');
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
      console.log('[WebSocket] Disconnected');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    reconnecting: boolean;
    attempts: number;
  } {
    return {
      connected: this.socket?.connected || false,
      reconnecting: this.reconnectAttempts > 0 && !this.socket?.connected,
      attempts: this.reconnectAttempts,
    };
  }
}

export default new WebSocketService();
