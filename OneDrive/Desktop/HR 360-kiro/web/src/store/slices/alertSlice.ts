import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'weather' | 'incident' | 'drill' | 'system';
  location?: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  createdAt: string;
}

interface AlertState {
  items: Alert[];
  alerts: Alert[];
  activeAlerts: Alert[];
  loading: boolean;
  error: string | null;
}

const initialState: AlertState = {
  items: [],
  alerts: [],
  activeAlerts: [],
  loading: false,
  error: null,
};

const alertSlice = createSlice({
  name: 'alert',
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
      state.activeAlerts = action.payload.filter((a) => a.isActive);
      state.loading = false;
      state.error = null;
    },
    setAlerts: (state, action: PayloadAction<Alert[]>) => {
      state.alerts = action.payload;
      state.items = action.payload;
      state.activeAlerts = action.payload.filter((a) => a.isActive);
    },
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.push(action.payload);
      state.items.push(action.payload);
      if (action.payload.isActive) {
        state.activeAlerts.push(action.payload);
      }
    },
    updateAlert: (state, action: PayloadAction<Alert>) => {
      const index = state.alerts.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.alerts[index] = action.payload;
        state.items[index] = action.payload;
        // Update active alerts
        state.activeAlerts = state.alerts.filter((a) => a.isActive);
      }
    },
    deleteAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter((a) => a.id !== action.payload);
      state.items = state.items.filter((a) => a.id !== action.payload);
      state.activeAlerts = state.activeAlerts.filter((a) => a.id !== action.payload);
    },
  },
});

export const {
  setLoading,
  setError,
  setItems,
  setAlerts,
  addAlert,
  updateAlert,
  deleteAlert,
} = alertSlice.actions;
export default alertSlice.reducer;
