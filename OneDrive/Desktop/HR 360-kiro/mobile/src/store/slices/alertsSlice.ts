import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Alert, AlertNotification } from '@types/index';

interface AlertsState {
  items: Alert[];
  alerts: Alert[];
  notifications: AlertNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  selectedAlert: Alert | null;
}

const initialState: AlertsState = {
  items: [],
  alerts: [],
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  selectedAlert: null
};

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setItems: (state, action: PayloadAction<Alert[]>) => {
      state.items = action.payload;
      state.alerts = action.payload;
      state.error = null;
      state.loading = false;
    },
    setAlerts: (state, action: PayloadAction<Alert[]>) => {
      state.alerts = action.payload;
      state.items = action.payload;
    },
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.unshift(action.payload);
      state.items.unshift(action.payload);
    },
    setNotifications: (state, action: PayloadAction<AlertNotification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.read).length;
    },
    addNotification: (state, action: PayloadAction<AlertNotification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
        state.unreadCount -= 1;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(n => {
        if (!n.read) {
          n.read = true;
          n.readAt = new Date().toISOString();
        }
      });
      state.unreadCount = 0;
    },
    setSelectedAlert: (state, action: PayloadAction<Alert | null>) => {
      state.selectedAlert = action.payload;
    },
    clearAlerts: (state) => {
      state.items = [];
      state.alerts = [];
      state.notifications = [];
      state.unreadCount = 0;
      state.selectedAlert = null;
    }
  }
});

export const {
  setLoading,
  setError,
  setItems,
  setAlerts,
  addAlert,
  setNotifications,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  setSelectedAlert,
  clearAlerts
} = alertsSlice.actions;

export default alertsSlice.reducer;
