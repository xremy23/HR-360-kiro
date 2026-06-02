/**
 * WebSocket Redux Slice - Manages real-time connection and event state
 * Tracks WebSocket connection status and real-time data updates
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

export interface WebSocketState {
  // Connection status
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
  connectionAttempts: number;
  
  // Real-time data
  recentAlerts: RealtimeAlert[];
  recentIncidents: RealtimeIncident[];
  recentCheckIns: RealtimeCheckIn[];
  
  // Subscriptions
  subscribedToAlerts: boolean;
  subscribedToIncidents: boolean;
  subscribedToCheckIns: boolean;
  
  // Connection info
  connectionStatus: Record<string, any> | null;
  lastMessageTime: number | null;
}

const initialState: WebSocketState = {
  isConnected: false,
  isReconnecting: false,
  error: null,
  connectionAttempts: 0,
  recentAlerts: [],
  recentIncidents: [],
  recentCheckIns: [],
  subscribedToAlerts: false,
  subscribedToIncidents: false,
  subscribedToCheckIns: false,
  connectionStatus: null,
  lastMessageTime: null,
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    /**
     * Set connection status
     */
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (action.payload) {
        state.connectionAttempts = 0;
        state.error = null;
      }
    },

    /**
     * Set reconnecting status
     */
    setReconnecting: (state, action: PayloadAction<boolean>) => {
      state.isReconnecting = action.payload;
    },

    /**
     * Set connection error
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Increment connection attempts
     */
    incrementConnectionAttempts: (state) => {
      state.connectionAttempts++;
    },

    /**
     * Add new alert
     */
    addAlert: (state, action: PayloadAction<RealtimeAlert>) => {
      state.recentAlerts = [action.payload, ...state.recentAlerts].slice(0, 50);
      state.lastMessageTime = Date.now();
    },

    /**
     * Update existing alert
     */
    updateAlert: (state, action: PayloadAction<RealtimeAlert>) => {
      state.recentAlerts = state.recentAlerts.map((alert) =>
        alert.id === action.payload.id ? action.payload : alert
      );
      state.lastMessageTime = Date.now();
    },

    /**
     * Remove alert
     */
    removeAlert: (state, action: PayloadAction<string>) => {
      state.recentAlerts = state.recentAlerts.filter(
        (alert) => alert.id !== action.payload
      );
    },

    /**
     * Add new incident
     */
    addIncident: (state, action: PayloadAction<RealtimeIncident>) => {
      state.recentIncidents = [action.payload, ...state.recentIncidents].slice(0, 50);
      state.lastMessageTime = Date.now();
    },

    /**
     * Update existing incident
     */
    updateIncident: (state, action: PayloadAction<RealtimeIncident>) => {
      state.recentIncidents = state.recentIncidents.map((incident) =>
        incident.id === action.payload.id ? action.payload : incident
      );
      state.lastMessageTime = Date.now();
    },

    /**
     * Remove incident
     */
    removeIncident: (state, action: PayloadAction<string>) => {
      state.recentIncidents = state.recentIncidents.filter(
        (incident) => incident.id !== action.payload
      );
    },

    /**
     * Add new check-in
     */
    addCheckIn: (state, action: PayloadAction<RealtimeCheckIn>) => {
      state.recentCheckIns = [action.payload, ...state.recentCheckIns].slice(0, 50);
      state.lastMessageTime = Date.now();
    },

    /**
     * Clear all real-time data
     */
    clearRealtimeData: (state) => {
      state.recentAlerts = [];
      state.recentIncidents = [];
      state.recentCheckIns = [];
    },

    /**
     * Set subscription status
     */
    setSubscribedToAlerts: (state, action: PayloadAction<boolean>) => {
      state.subscribedToAlerts = action.payload;
    },

    setSubscribedToIncidents: (state, action: PayloadAction<boolean>) => {
      state.subscribedToIncidents = action.payload;
    },

    setSubscribedToCheckIns: (state, action: PayloadAction<boolean>) => {
      state.subscribedToCheckIns = action.payload;
    },

    /**
     * Set connection status details
     */
    setConnectionStatus: (state, action: PayloadAction<Record<string, any> | null>) => {
      state.connectionStatus = action.payload;
    },

    /**
     * Reset to initial state
     */
    reset: () => initialState,
  },
});

export const {
  setConnected,
  setReconnecting,
  setError,
  incrementConnectionAttempts,
  addAlert,
  updateAlert,
  removeAlert,
  addIncident,
  updateIncident,
  removeIncident,
  addCheckIn,
  clearRealtimeData,
  setSubscribedToAlerts,
  setSubscribedToIncidents,
  setSubscribedToCheckIns,
  setConnectionStatus,
  reset,
} = websocketSlice.actions;

export default websocketSlice.reducer;
