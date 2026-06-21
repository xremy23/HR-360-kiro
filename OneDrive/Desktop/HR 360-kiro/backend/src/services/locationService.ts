/**
 * Location Service
 * Handles location tracking, geofencing, and nearby services/contacts discovery
 */

import { query } from '../config/database';
import { logger } from './monitoringService';

interface LocationRecord {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  source: 'checkin' | 'background' | 'manual';
  createdAt: Date;
}

interface Geofence {
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

interface NearbyContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  distance: number;
  latitude: number;
  longitude: number;
  category: string;
}

interface NearbyService {
  id: string;
  name: string;
  type: 'hospital' | 'fire' | 'police' | 'veterinary' | 'government' | 'other';
  address: string;
  phone: string;
  distance: number;
  latitude: number;
  longitude: number;
}

class LocationService {
  /**
   * Track user location
   */
  async trackLocation(
    userId: string,
    latitude: number,
    longitude: number,
    accuracy: number,
    source: 'checkin' | 'background' | 'manual',
    altitude?: number,
    heading?: number,
    speed?: number
  ): Promise<LocationRecord> {
    try {
      const result = await query(
        `INSERT INTO location_history 
         (user_id, latitude, longitude, accuracy, altitude, heading, speed, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, user_id as "userId", latitude, longitude, accuracy, altitude, heading, speed, source, created_at as "createdAt"`,
        [userId, latitude, longitude, accuracy, altitude || null, heading || null, speed || null, source]
      );

      logger.info('Location tracked', { userId, latitude, longitude, source });
      return result.rows[0];
    } catch (error) {
      logger.error('Error tracking location:', { error, userId });
      throw error;
    }
  }

  /**
   * Get location history for user
   */
  async getLocationHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<LocationRecord[]> {
    try {
      const result = await query(
        `SELECT id, user_id as "userId", latitude, longitude, accuracy, altitude, heading, speed, source, created_at as "createdAt"
         FROM location_history
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting location history:', { error, userId });
      return [];
    }
  }

  /**
   * Get most recent location for user
   */
  async getCurrentLocation(userId: string): Promise<LocationRecord | null> {
    try {
      const result = await query(
        `SELECT id, user_id as "userId", latitude, longitude, accuracy, altitude, heading, speed, source, created_at as "createdAt"
         FROM location_history
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting current location:', { error, userId });
      return null;
    }
  }

  /**
   * Get nearby emergency contacts based on location
   * Uses hardcoded Philippines emergency services with distance calculation
   */
  async getNearbyContacts(latitude: number, longitude: number, radiusKm: number = 10): Promise<NearbyContact[]> {
    try {
      // Hardcoded emergency contacts with coordinates
      const allContacts: NearbyContact[] = [
        // EMERGENCY RESPONDERS - National Level
        {
          id: 'e1',
          name: 'National Emergency Hotline',
          email: 'emergency@pnp.gov.ph',
          phone: '911',
          role: 'Emergency',
          distance: 0,
          latitude: 14.5995,
          longitude: 121.0274,
          category: 'emergency',
        },
        {
          id: 'e1a',
          name: 'Philippine National Police',
          email: 'information@pnp.gov.ph',
          phone: '117',
          role: 'Emergency - Police',
          distance: 0,
          latitude: 14.5995,
          longitude: 121.0274,
          category: 'emergency',
        },
        {
          id: 'e1b',
          name: 'Bureau of Fire Protection',
          email: 'bfp.operations@fire.gov.ph',
          phone: '160',
          role: 'Emergency - Fire',
          distance: 0,
          latitude: 14.5995,
          longitude: 121.0274,
          category: 'emergency',
        },
        {
          id: 'e2',
          name: 'NDRRMC - Disaster Risk Reduction',
          email: 'operations@ndrrmc.gov.ph',
          phone: '+63 2 911-5061',
          role: 'Emergency',
          distance: 0,
          latitude: 14.5950,
          longitude: 121.0100,
          category: 'emergency',
        },

        // MEDICAL FACILITIES - Metro Manila
        {
          id: 'm1',
          name: 'Pasig City General Hospital',
          email: 'admissions@pcgh.gov.ph',
          phone: '+63 2 645-4567',
          role: 'Hospital',
          distance: 0,
          latitude: 14.5761,
          longitude: 121.0437,
          category: 'medical',
        },
        {
          id: 'm2',
          name: 'Makati Medical Center',
          email: 'er@makatimedical.com',
          phone: '+63 2 888-8888',
          role: 'Private Hospital',
          distance: 0,
          latitude: 14.5546,
          longitude: 121.0225,
          category: 'medical',
        },
        {
          id: 'm3',
          name: 'San Lazaro Hospital',
          email: 'emergency@sanlazaro.gov.ph',
          phone: '+63 2 711-9911',
          role: 'Government Hospital',
          distance: 0,
          latitude: 14.6091,
          longitude: 121.0091,
          category: 'medical',
        },

        // GOVERNMENT SERVICES - Pasig
        {
          id: 'g1',
          name: 'Pasig City Hall',
          email: 'info@pasigcity.gov.ph',
          phone: '+63 2 645-7896',
          role: 'City Government',
          distance: 0,
          latitude: 14.5761,
          longitude: 121.0437,
          category: 'government',
        },
        {
          id: 'g2',
          name: 'Barangay Ugong',
          email: 'brgy.ugong@pasig.gov.ph',
          phone: '+63 2 645-8234',
          role: 'Barangay Hall',
          distance: 0,
          latitude: 14.5765,
          longitude: 121.0440,
          category: 'government',
        },
      ];

      // Calculate distance for each contact and filter by radius
      const nearbyContacts = allContacts
        .map((contact) => ({
          ...contact,
          distance: this.calculateDistance(
            latitude,
            longitude,
            contact.latitude,
            contact.longitude
          ),
        }))
        .filter((contact) => contact.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      logger.info('Found nearby contacts', {
        userLocation: { latitude, longitude },
        count: nearbyContacts.length,
        radius: radiusKm,
      });

      return nearbyContacts;
    } catch (error) {
      logger.error('Error getting nearby contacts:', { error });
      return [];
    }
  }

  /**
   * Get nearby emergency services based on location
   */
  async getNearbyServices(latitude: number, longitude: number, radiusKm: number = 10): Promise<NearbyService[]> {
    try {
      // Hardcoded services with coordinates
      const allServices: NearbyService[] = [
        {
          id: 's1',
          name: 'Pasig City General Hospital',
          type: 'hospital',
          address: 'Rizal Avenue, Pasig City',
          phone: '+63 2 645-4567',
          distance: 0,
          latitude: 14.5761,
          longitude: 121.0437,
        },
        {
          id: 's2',
          name: 'Makati Fire Station',
          type: 'fire',
          address: 'Makati Avenue, Makati',
          phone: '+63 2 726-0219',
          distance: 0,
          latitude: 14.5546,
          longitude: 121.0225,
        },
        {
          id: 's3',
          name: 'Pasig Police District',
          type: 'police',
          address: 'Rizal Avenue, Pasig City',
          phone: '+63 2 645-3456',
          distance: 0,
          latitude: 14.5760,
          longitude: 121.0435,
        },
      ];

      // Calculate distances and filter
      const nearbyServices = allServices
        .map((service) => ({
          ...service,
          distance: this.calculateDistance(latitude, longitude, service.latitude, service.longitude),
        }))
        .filter((service) => service.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      return nearbyServices;
    } catch (error) {
      logger.error('Error getting nearby services:', { error });
      return [];
    }
  }

  /**
   * Create geofence for user
   */
  async createGeofence(
    userId: string,
    name: string,
    latitude: number,
    longitude: number,
    radiusKm: number,
    alertType: 'entry' | 'exit' | 'both'
  ): Promise<Geofence> {
    try {
      const result = await query(
        `INSERT INTO geofences (user_id, name, latitude, longitude, radius_km, alert_type, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id, user_id as "userId", name, latitude, longitude, radius_km as "radiusKm", alert_type as "alertType", is_active as "isActive", created_at as "createdAt"`,
        [userId, name, latitude, longitude, radiusKm, alertType]
      );

      logger.info('Geofence created', { userId, name });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating geofence:', { error, userId });
      throw error;
    }
  }

  /**
   * Get geofences for user
   */
  async getGeofences(userId: string): Promise<Geofence[]> {
    try {
      const result = await query(
        `SELECT id, user_id as "userId", name, latitude, longitude, radius_km as "radiusKm", alert_type as "alertType", is_active as "isActive", created_at as "createdAt"
         FROM geofences
         WHERE user_id = $1 AND is_active = true
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting geofences:', { error, userId });
      return [];
    }
  }

  /**
   * Check if location is within any geofence
   */
  async checkGeofence(userId: string, latitude: number, longitude: number): Promise<Geofence[]> {
    try {
      const geofences = await this.getGeofences(userId);

      return geofences.filter((geofence) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          geofence.latitude,
          geofence.longitude
        );
        return distance <= geofence.radiusKm;
      });
    } catch (error) {
      logger.error('Error checking geofence:', { error, userId });
      return [];
    }
  }

  /**
   * Delete geofence
   */
  async deleteGeofence(geofenceId: string): Promise<void> {
    try {
      await query('DELETE FROM geofences WHERE id = $1', [geofenceId]);
      logger.info('Geofence deleted', { geofenceId });
    } catch (error) {
      logger.error('Error deleting geofence:', { error, geofenceId });
      throw error;
    }
  }

  /**
   * Update geofence
   */
  async updateGeofence(
    geofenceId: string,
    updates: Partial<{
      name: string;
      latitude: number;
      longitude: number;
      radiusKm: number;
      alertType: string;
      isActive: boolean;
    }>
  ): Promise<Geofence> {
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        setClauses.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.latitude !== undefined) {
        setClauses.push(`latitude = $${paramIndex++}`);
        values.push(updates.latitude);
      }
      if (updates.longitude !== undefined) {
        setClauses.push(`longitude = $${paramIndex++}`);
        values.push(updates.longitude);
      }
      if (updates.radiusKm !== undefined) {
        setClauses.push(`radius_km = $${paramIndex++}`);
        values.push(updates.radiusKm);
      }
      if (updates.alertType !== undefined) {
        setClauses.push(`alert_type = $${paramIndex++}`);
        values.push(updates.alertType);
      }
      if (updates.isActive !== undefined) {
        setClauses.push(`is_active = $${paramIndex++}`);
        values.push(updates.isActive);
      }

      values.push(geofenceId);

      const result = await query(
        `UPDATE geofences SET ${setClauses.join(', ')} WHERE id = $${paramIndex}
         RETURNING id, user_id as "userId", name, latitude, longitude, radius_km as "radiusKm", alert_type as "alertType", is_active as "isActive", created_at as "createdAt"`,
        values
      );

      logger.info('Geofence updated', { geofenceId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating geofence:', { error, geofenceId });
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers
   * Uses Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
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
  }
}

export default new LocationService();
