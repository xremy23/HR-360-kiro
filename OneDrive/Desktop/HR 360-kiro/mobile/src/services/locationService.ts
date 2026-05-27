import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { authService } from './authService';

const LOCATION_TASK_NAME = 'background-location-task';

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

class LocationService {
  private currentLocation: LocationData | null = null;
  private isTracking = false;
  private onLocationChange: ((location: LocationData) => void) | null = null;

  /**
   * Initialize location service
   */
  async initialize(): Promise<void> {
    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied');
        return;
      }

      // Get current location
      const location = await this.getCurrentLocation();
      if (location) {
        this.currentLocation = location;
      }

      // Register background task
      this.registerBackgroundTask();
    } catch (error) {
      console.error('Location service initialization error:', error);
    }
  }

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied');
        return false;
      }

      // Also request background permissions
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      return backgroundStatus.status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: new Date(location.timestamp),
      };

      this.currentLocation = locationData;
      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Start background location tracking
   */
  async startBackgroundTracking(): Promise<void> {
    try {
      if (this.isTracking) return;

      // Request background permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Background location permission denied');
        return;
      }

      // Start background fetch
      await BackgroundFetch.setMinimumIntervalAsync(60); // 60 seconds
      await BackgroundFetch.registerTaskAsync(LOCATION_TASK_NAME, {
        minimumInterval: 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });

      this.isTracking = true;
      console.log('Background location tracking started');
    } catch (error) {
      console.error('Error starting background tracking:', error);
    }
  }

  /**
   * Stop background location tracking
   */
  async stopBackgroundTracking(): Promise<void> {
    try {
      if (!this.isTracking) return;

      await BackgroundFetch.unregisterTaskAsync(LOCATION_TASK_NAME);
      this.isTracking = false;
      console.log('Background location tracking stopped');
    } catch (error) {
      console.error('Error stopping background tracking:', error);
    }
  }

  /**
   * Register background task
   */
  private registerBackgroundTask(): void {
    TaskManager.defineTask(LOCATION_TASK_NAME, async () => {
      try {
        const location = await this.getCurrentLocation();
        if (location && authService.isAuthenticated()) {
          // Send location to server
          await this.trackLocationOnServer(location, 'background');
        }
        return BackgroundFetch.Result.NewData;
      } catch (error) {
        console.error('Background location task error:', error);
        return BackgroundFetch.Result.Failed;
      }
    });
  }

  /**
   * Track location on server
   */
  async trackLocationOnServer(location: LocationData, source: 'checkin' | 'background' | 'manual'): Promise<void> {
    try {
      const api = authService.getApi();
      await api.post('/location/track', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        altitude: location.altitude,
        heading: location.heading,
        speed: location.speed,
        source,
      });
    } catch (error) {
      console.error('Error tracking location on server:', error);
    }
  }

  /**
   * Get location history
   */
  async getLocationHistory(limit: number = 100, offset: number = 0): Promise<LocationData[]> {
    try {
      const api = authService.getApi();
      const response = await api.get(`/location/history?limit=${limit}&offset=${offset}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error getting location history:', error);
      return [];
    }
  }

  /**
   * Get nearby contacts
   */
  async getNearbyContacts(radiusKm: number = 5): Promise<NearbyContact[]> {
    try {
      if (!this.currentLocation) {
        const location = await this.getCurrentLocation();
        if (!location) return [];
      }

      const api = authService.getApi();
      const response = await api.get(
        `/location/nearby/contacts?latitude=${this.currentLocation!.latitude}&longitude=${this.currentLocation!.longitude}&radius=${radiusKm}`
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error getting nearby contacts:', error);
      return [];
    }
  }

  /**
   * Get nearby services
   */
  async getNearbyServices(
    serviceType?: string,
    radiusKm: number = 5
  ): Promise<NearbyService[]> {
    try {
      if (!this.currentLocation) {
        const location = await this.getCurrentLocation();
        if (!location) return [];
      }

      const api = authService.getApi();
      let url = `/location/nearby/services?latitude=${this.currentLocation!.latitude}&longitude=${this.currentLocation!.longitude}&radius=${radiusKm}`;
      if (serviceType) {
        url += `&type=${serviceType}`;
      }

      const response = await api.get(url);
      return response.data.data || [];
    } catch (error) {
      console.error('Error getting nearby services:', error);
      return [];
    }
  }

  /**
   * Create geofence
   */
  async createGeofence(
    name: string,
    latitude: number,
    longitude: number,
    radiusKm: number,
    alertType: 'entry' | 'exit' | 'both' = 'both'
  ): Promise<any> {
    try {
      const api = authService.getApi();
      const response = await api.post('/location/geofence', {
        name,
        latitude,
        longitude,
        radiusKm,
        alertType,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating geofence:', error);
      throw error;
    }
  }

  /**
   * Get geofences
   */
  async getGeofences(): Promise<any[]> {
    try {
      const api = authService.getApi();
      const response = await api.get('/location/geofence');
      return response.data.data || [];
    } catch (error) {
      console.error('Error getting geofences:', error);
      return [];
    }
  }

  /**
   * Update geofence
   */
  async updateGeofence(geofenceId: string, updates: any): Promise<any> {
    try {
      const api = authService.getApi();
      const response = await api.put(`/location/geofence/${geofenceId}`, updates);
      return response.data.data;
    } catch (error) {
      console.error('Error updating geofence:', error);
      throw error;
    }
  }

  /**
   * Delete geofence
   */
  async deleteGeofence(geofenceId: string): Promise<void> {
    try {
      const api = authService.getApi();
      await api.delete(`/location/geofence/${geofenceId}`);
    } catch (error) {
      console.error('Error deleting geofence:', error);
      throw error;
    }
  }

  /**
   * Check if current location is within geofence
   */
  async checkGeofence(): Promise<any[]> {
    try {
      if (!this.currentLocation) {
        const location = await this.getCurrentLocation();
        if (!location) return [];
      }

      const api = authService.getApi();
      const response = await api.post('/location/geofence/check', {
        latitude: this.currentLocation!.latitude,
        longitude: this.currentLocation!.longitude,
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error checking geofence:', error);
      return [];
    }
  }

  /**
   * Set location change callback
   */
  onLocationChanged(callback: (location: LocationData) => void): void {
    this.onLocationChange = callback;
  }

  /**
   * Get current location data
   */
  getLocation(): LocationData | null {
    return this.currentLocation;
  }

  /**
   * Check if tracking
   */
  isBackgroundTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    await this.stopBackgroundTracking();
  }
}

export const locationService = new LocationService();
