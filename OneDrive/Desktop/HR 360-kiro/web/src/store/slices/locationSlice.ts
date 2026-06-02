/**
 * Location Slice - Redux state for location services
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  source?: 'gps' | 'wifi' | 'cell' | 'approximate';
}

export interface LocationPreferences {
  trackingEnabled: boolean;
  shareWithAdmins: boolean;
  shareWithTeam: boolean;
}

export interface LocationState {
  currentLocation: Location | null;
  locationHistory: Location[];
  preferences: LocationPreferences;
  isTracking: boolean;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  loading: boolean;
  error: string | null;
  showMap: boolean;
  mapCenter?: { lat: number; lng: number };
  zoomLevel: number;
}

const initialState: LocationState = {
  currentLocation: null,
  locationHistory: [],
  preferences: {
    trackingEnabled: false,
    shareWithAdmins: true,
    shareWithTeam: false,
  },
  isTracking: false,
  permissionStatus: 'unknown',
  loading: false,
  error: null,
  showMap: false,
  zoomLevel: 12,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    // Location data
    setCurrentLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
      state.mapCenter = { lat: action.payload.latitude, lng: action.payload.longitude };
    },

    setLocationHistory: (state, action: PayloadAction<Location[]>) => {
      state.locationHistory = action.payload;
    },

    addToHistory: (state, action: PayloadAction<Location>) => {
      state.locationHistory.unshift(action.payload);
      // Keep only last 100 locations
      if (state.locationHistory.length > 100) {
        state.locationHistory = state.locationHistory.slice(0, 100);
      }
    },

    clearHistory: (state) => {
      state.locationHistory = [];
    },

    // Preferences
    setPreferences: (state, action: PayloadAction<Partial<LocationPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },

    // Tracking control
    startTracking: (state) => {
      state.isTracking = true;
      state.error = null;
    },

    stopTracking: (state) => {
      state.isTracking = false;
    },

    // Permission status
    setPermissionStatus: (state, action: PayloadAction<'granted' | 'denied' | 'prompt' | 'unknown'>) => {
      state.permissionStatus = action.payload;
    },

    // UI state
    setShowMap: (state, action: PayloadAction<boolean>) => {
      state.showMap = action.payload;
    },

    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = Math.max(1, Math.min(20, action.payload));
    },

    setMapCenter: (state, action: PayloadAction<{ lat: number; lng: number }>) => {
      state.mapCenter = action.payload;
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setCurrentLocation,
  setLocationHistory,
  addToHistory,
  clearHistory,
  setPreferences,
  startTracking,
  stopTracking,
  setPermissionStatus,
  setShowMap,
  setZoomLevel,
  setMapCenter,
  setLoading,
  setError,
  clearError,
} = locationSlice.actions;

export default locationSlice.reducer;
