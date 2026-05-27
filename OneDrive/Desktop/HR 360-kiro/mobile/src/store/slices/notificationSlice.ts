import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: 'alert' | 'incident' | 'sos' | 'checkin' | 'custom';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export interface NotificationSettings {
  alerts: boolean;
  incidents: boolean;
  sos: boolean;
  checkins: boolean;
  sound: boolean;
  vibration: boolean;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  deviceToken: string | null;
  permissionsGranted: boolean;
  isLoadingNotifications: boolean;
  notificationError: string | null;
  notificationSettings: NotificationSettings;
  stats: {
    total: number;
    unread: number;
    delivered: number;
    failed: number;
  };
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  deviceToken: null,
  permissionsGranted: false,
  isLoadingNotifications: false,
  notificationError: null,
  notificationSettings: {
    alerts: true,
    incidents: true,
    sos: true,
    checkins: true,
    sound: true,
    vibration: true,
  },
  stats: {
    total: 0,
    unread: 0,
    delivered: 0,
    failed: 0,
  },
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    /**
     * Set notifications list
     */
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.notificationError = null;
    },

    /**
     * Add notification to list
     */
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.readAt) {
        state.unreadCount += 1;
      }
    },

    /**
     * Update notification
     */
    updateNotification: (state, action: PayloadAction<Notification>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload.id);
      if (index >= 0) {
        const oldNotification = state.notifications[index];
        state.notifications[index] = action.payload;

        // Update unread count
        if (!oldNotification.readAt && action.payload.readAt) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        } else if (oldNotification.readAt && !action.payload.readAt) {
          state.unreadCount += 1;
        }
      }
    },

    /**
     * Remove notification
     */
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.readAt) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },

    /**
     * Mark notification as read
     */
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.readAt) {
        notification.readAt = new Date();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    /**
     * Mark multiple notifications as read
     */
    markMultipleNotificationsAsRead: (state, action: PayloadAction<string[]>) => {
      let count = 0;
      for (const id of action.payload) {
        const notification = state.notifications.find(n => n.id === id);
        if (notification && !notification.readAt) {
          notification.readAt = new Date();
          count += 1;
        }
      }
      state.unreadCount = Math.max(0, state.unreadCount - count);
    },

    /**
     * Set unread count
     */
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },

    /**
     * Set device token
     */
    setDeviceToken: (state, action: PayloadAction<string>) => {
      state.deviceToken = action.payload;
    },

    /**
     * Set permissions granted
     */
    setPermissionsGranted: (state, action: PayloadAction<boolean>) => {
      state.permissionsGranted = action.payload;
    },

    /**
     * Set loading state
     */
    setLoadingNotifications: (state, action: PayloadAction<boolean>) => {
      state.isLoadingNotifications = action.payload;
    },

    /**
     * Set notification error
     */
    setNotificationError: (state, action: PayloadAction<string | null>) => {
      state.notificationError = action.payload;
    },

    /**
     * Update notification settings
     */
    updateNotificationSettings: (
      state,
      action: PayloadAction<Partial<NotificationSettings>>
    ) => {
      state.notificationSettings = { ...state.notificationSettings, ...action.payload };
    },

    /**
     * Set notification statistics
     */
    setNotificationStats: (
      state,
      action: PayloadAction<{
        total: number;
        unread: number;
        delivered: number;
        failed: number;
      }>
    ) => {
      state.stats = action.payload;
    },

    /**
     * Clear all notifications
     */
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },

    /**
     * Reset notification state
     */
    resetNotificationState: () => initialState,
  },
});

export const {
  setNotifications,
  addNotification,
  updateNotification,
  removeNotification,
  markNotificationAsRead,
  markMultipleNotificationsAsRead,
  setUnreadCount,
  setDeviceToken,
  setPermissionsGranted,
  setLoadingNotifications,
  setNotificationError,
  updateNotificationSettings,
  setNotificationStats,
  clearNotifications,
  resetNotificationState,
} = notificationSlice.actions;

export default notificationSlice.reducer;
