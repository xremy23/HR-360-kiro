/**
 * Location Service
 * Handles location tracking and geolocation services
 */

import { apiService } from './apiService';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  source?: 'gps' | 'wifi' | 'cell' | 'approximate';
}

export interface LocationHistory {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  source?: string;
  status?: 'safe' | 'need_help' | 'sos';
}

export interface LocationPreferences {
  trackingEnabled: boolean;
  shareWithAdmins: boolean;
  shareWithTeam: boolean;
  trackingInterval?: number; // in seconds
}

/**
 * Get current geolocation
 */
export const getCurrentLocation = async (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
          source: 'gps',
        });
      },
      (error) => {
        console.error('Error getting current location:', error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Start continuous location tracking
 */
export const startTracking = async (
  callback: (location: LocationData) => void,
  interval: number = 30000 // 30 seconds default
): Promise<number> => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser');
  }

  // Get initial position
  try {
    const initialLocation = await getCurrentLocation();
    callback(initialLocation);
  } catch (error) {
    console.error('Error getting initial location:', error);
  }

  // Start continuous tracking
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
        source: 'gps',
      });
    },
    (error) => {
      console.error('Error tracking location:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    }
  );

  return watchId;
};

/**
 * Stop location tracking
 */
export const stopTracking = (watchId: number): void => {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Track location on backend
 */
export const trackLocation = async (location: LocationData): Promise<void> => {
  try {
    const response = await apiService.post('/location/track', {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      source: location.source || 'gps',
      timestamp: location.timestamp,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to track location');
    }
  } catch (error) {
    console.error('Error tracking location on backend:', error);
    throw error;
  }
};

/**
 * Get location history
 */
export const getLocationHistory = async (params?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}): Promise<LocationHistory[]> => {
  try {
    const response = await apiService.get('/location/history', params);

    if (!response.success || !response.data) {
      throw new Error('Failed to get location history');
    }

    return Array.isArray(response.data) ? response.data : response.data.locations || [];
  } catch (error) {
    console.error('Error getting location history:', error);
    throw error;
  }
};

/**
 * Get location preferences
 */
export const getLocationPreferences = async (): Promise<LocationPreferences> => {
  try {
    const response = await apiService.get('/location/preferences');

    if (!response.success || !response.data) {
      throw new Error('Failed to get location preferences');
    }

    return response.data;
  } catch (error) {
    console.error('Error getting location preferences:', error);
    throw error;
  }
};

/**
 * Update location preferences
 */
export const updateLocationPreferences = async (
  preferences: Partial<LocationPreferences>
): Promise<LocationPreferences> => {
  try {
    const response = await apiService.post('/location/preferences', preferences);

    if (!response.success || !response.data) {
      throw new Error('Failed to update location preferences');
    }

    return response.data;
  } catch (error) {
    console.error('Error updating location preferences:', error);
    throw error;
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get nearby team members (within radius)
 */
export const getNearbyTeamMembers = async (params?: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}): Promise<any[]> => {
  try {
    const response = await apiService.get('/location/nearby', params);

    if (!response.success || !response.data) {
      throw new Error('Failed to get nearby team members');
    }

    return Array.isArray(response.data) ? response.data : response.data.members || [];
  } catch (error) {
    console.error('Error getting nearby team members:', error);
    throw error;
  }
};

/**
 * Request location permission
 */
export const requestLocationPermission = async (): Promise<'granted' | 'denied' | 'prompt'> => {
  try {
    if (!navigator.geolocation) {
      return 'denied';
    }

    // Try to get current location to trigger permission prompt
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve('granted'),
        () => resolve('denied'),
        { timeout: 5000, maximumAge: 0 }
      );
    });
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return 'prompt';
  }
};

export const locationService = {
  getCurrentLocation,
  startTracking,
  stopTracking,
  trackLocation,
  getLocationHistory,
  getLocationPreferences,
  updateLocationPreferences,
  calculateDistance,
  getNearbyTeamMembers,
  requestLocationPermission,
};

export default locationService;
