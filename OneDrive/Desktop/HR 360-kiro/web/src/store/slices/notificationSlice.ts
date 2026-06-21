/**
 * Notification Slice - Redux state for push notifications
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationPermission {
  permission: 'granted' | 'denied' | 'default';
  timestamp: string;
}

export interface NotificationPreferences {
  alertsEnabled: boolean;
  incidentsEnabled: boolean;
  checkinEnabled: boolean;
  sosEnabled: boolean;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  type: 'alert' | 'incident' | 'sos' | 'checkin' | 'custom';
  timestamp: string;
  isRead: boolean;
  data?: Record<string, any>;
}

export interface NotificationState {
  permission: NotificationPermission | null;
  preferences: NotificationPreferences;
  notifications: PushNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  showCenter: boolean;
  showPreferences: boolean;
  deviceTokenRegistered: boolean;
}

// Load notification permission from localStorage
const getInitialPermission = (): NotificationPermission | null => {
  try {
    const stored = localStorage.getItem('notificationPermission');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load notification permission from cache:', error);
  }
  return null;
};

const initialState: NotificationState = {
  permission: getInitialPermission(),
  preferences: {
    alertsEnabled: true,
    incidentsEnabled: true,
    checkinEnabled: true,
    sosEnabled: true,
  },
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  showCenter: false,
  showPreferences: false,
  deviceTokenRegistered: false,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // Permission management
    setPermission: (state, action: PayloadAction<NotificationPermission>) => {
      state.permission = action.payload;
      // Persist permission to localStorage
      try {
        localStorage.setItem('notificationPermission', JSON.stringify(action.payload));
      } catch (error) {
        console.error('Failed to save notification permission to cache:', error);
      }
    },

    // Preferences management
    setPreferences: (state, action: PayloadAction<Partial<NotificationPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },

    // Notifications
    setNotifications: (state, action: PayloadAction<PushNotification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
    },

    addNotification: (state, action: PayloadAction<PushNotification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },

    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllAsRead: (state) => {
      state.notifications.forEach(n => (n.isRead = true));
      state.unreadCount = 0;
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index > -1) {
        const notification = state.notifications[index];
        if (!notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },

    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },

    // UI state
    setShowCenter: (state, action: PayloadAction<boolean>) => {
      state.showCenter = action.payload;
    },

    setShowPreferences: (state, action: PayloadAction<boolean>) => {
      state.showPreferences = action.payload;
    },

    // Device token
    setDeviceTokenRegistered: (state, action: PayloadAction<boolean>) => {
      state.deviceTokenRegistered = action.payload;
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setPermission,
  setPreferences,
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearNotifications,
  setShowCenter,
  setShowPreferences,
  setDeviceTokenRegistered,
  setLoading,
  setError,
} = notificationSlice.actions;

export default notificationSlice.reducer;
