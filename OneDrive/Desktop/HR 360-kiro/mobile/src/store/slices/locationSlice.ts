import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface NearbyContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  distance: number;
  latitude: number;
  longitude: number;
}

export interface NearbyService {
  id: string;
  name: string;
  type: string;
  distance: number;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
}

export interface Geofence {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  alertType: 'entry' | 'exit' | 'both';
  isActive: boolean;
  createdAt: Date;
}

export interface LocationSettings {
  trackingEnabled: boolean;
  backgroundTracking: boolean;
  shareLocation: boolean;
  privacyLevel: 'public' | 'contacts' | 'private';
  updateInterval: number; // in seconds
}

export interface LocationState {
  currentLocation: LocationData | null;
  locationHistory: LocationData[];
  nearbyContacts: NearbyContact[];
  nearbyServices: NearbyService[];
  geofences: Geofence[];
  permissionsGranted: boolean;
  isTracking: boolean;
  isLoadingLocation: boolean;
  locationError: string | null;
  locationSettings: LocationSettings;
}

const initialState: LocationState = {
  currentLocation: null,
  locationHistory: [],
  nearbyContacts: [],
  nearbyServices: [],
  geofences: [],
  permissionsGranted: false,
  isTracking: false,
  isLoadingLocation: false,
  locationError: null,
  locationSettings: {
    trackingEnabled: true,
    backgroundTracking: false,
    shareLocation: false,
    privacyLevel: 'private',
    updateInterval: 60,
  },
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    /**
     * Set current location
     */
    setCurrentLocation: (state, action: PayloadAction<LocationData>) => {
      state.currentLocation = action.payload;
      state.locationError = null;
    },

    /**
     * Set location history
     */
    setLocationHistory: (state, action: PayloadAction<LocationData[]>) => {
      state.locationHistory = action.payload;
    },

    /**
     * Add location to history
     */
    addLocationToHistory: (state, action: PayloadAction<LocationData>) => {
      state.locationHistory.unshift(action.payload);
      // Keep only last 100 locations
      if (state.locationHistory.length > 100) {
        state.locationHistory = state.locationHistory.slice(0, 100);
      }
    },

    /**
     * Set nearby contacts
     */
    setNearbyContacts: (state, action: PayloadAction<NearbyContact[]>) => {
      state.nearbyContacts = action.payload;
    },

    /**
     * Set nearby services
     */
    setNearbyServices: (state, action: PayloadAction<NearbyService[]>) => {
      state.nearbyServices = action.payload;
    },

    /**
     * Set geofences
     */
    setGeofences: (state, action: PayloadAction<Geofence[]>) => {
      state.geofences = action.payload;
    },

    /**
     * Add geofence
     */
    addGeofence: (state, action: PayloadAction<Geofence>) => {
      state.geofences.push(action.payload);
    },

    /**
     * Update geofence
     */
    updateGeofence: (state, action: PayloadAction<Geofence>) => {
      const index = state.geofences.findIndex(g => g.id === action.payload.id);
      if (index >= 0) {
        state.geofences[index] = action.payload;
      }
    },

    /**
     * Remove geofence
     */
    removeGeofence: (state, action: PayloadAction<string>) => {
      state.geofences = state.geofences.filter(g => g.id !== action.payload);
    },

    /**
     * Set permissions granted
     */
    setPermissionsGranted: (state, action: PayloadAction<boolean>) => {
      state.permissionsGranted = action.payload;
    },

    /**
     * Set tracking status
     */
    setTracking: (state, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload;
    },

    /**
     * Set loading location
     */
    setLoadingLocation: (state, action: PayloadAction<boolean>) => {
      state.isLoadingLocation = action.payload;
    },

    /**
     * Set location error
     */
    setLocationError: (state, action: PayloadAction<string | null>) => {
      state.locationError = action.payload;
    },

    /**
     * Update location settings
     */
    updateLocationSettings: (
      state,
      action: PayloadAction<Partial<LocationSettings>>
    ) => {
      state.locationSettings = { ...state.locationSettings, ...action.payload };
    },

    /**
     * Clear location data
     */
    clearLocationData: (state) => {
      state.currentLocation = null;
      state.locationHistory = [];
      state.nearbyContacts = [];
      state.nearbyServices = [];
      state.locationError = null;
    },

    /**
     * Reset location state
     */
    resetLocationState: () => initialState,
  },
});

export const {
  setCurrentLocation,
  setLocationHistory,
  addLocationToHistory,
  setNearbyContacts,
  setNearbyServices,
  setGeofences,
  addGeofence,
  updateGeofence,
  removeGeofence,
  setPermissionsGranted,
  setTracking,
  setLoadingLocation,
  setLocationError,
  updateLocationSettings,
  clearLocationData,
  resetLocationState,
} = locationSlice.actions;

export default locationSlice.reducer;
